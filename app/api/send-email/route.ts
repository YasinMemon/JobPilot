import clientPromise from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import { parseEmailWithAI } from "@/services/parser.service";
import { ApplicationStatus } from "@/types/applications/type";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import {
  buildSubject,
  composeRawEmail,
  type EmailAttachment,
} from "@/lib/email/mime";

// ─── Route Segment Config ─────────────────────────────────────────────────────
// Allow up to 30 MB body to accommodate 25 MB attachments + form field overhead.
export const maxDuration = 30;


// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id ?? req.cookies.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { message: "User not authenticated", success: false },
        { status: 401 },
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // ── Lookup Google account ─────────────────────────────────────────────────
    const account = await db.collection("account").findOne({
      $or: [
        { userId: userId },
        {
          userId: (() => {
            try {
              return new ObjectId(userId);
            } catch {
              return null;
            }
          })(),
        },
      ],
      providerId: "google",
    });

    if (!account) {
      return NextResponse.json(
        {
          message:
            "No Google account linked. Please sign in with Google to enable Gmail sending.",
          success: false,
        },
        { status: 404 },
      );
    }

    // ── Parse multipart/form-data ─────────────────────────────────────────────
    const formData = await req.formData();

    const to = (formData.get("to") as string | null)?.trim() ?? "";
    const cc = (formData.get("cc") as string | null)?.trim() ?? "";
    const bcc = (formData.get("bcc") as string | null)?.trim() ?? "";
    const subject = buildSubject(formData.get("subject") as string | null);
    const html =
      (formData.get("html") as string | null) ??
      "<p>Please find my application below.</p>";

    if (!to) {
      return NextResponse.json(
        { message: "Recipient email (to) is required.", success: false },
        { status: 400 },
      );
    }

    // ── Read attachment files ─────────────────────────────────────────────────
    const attachmentFiles = formData.getAll("attachments[]") as File[];
    const attachmentParts: EmailAttachment[] = await Promise.all(
      attachmentFiles
        .filter((f) => f instanceof File && f.size > 0)
        .map(async (f) => {
          const buf = Buffer.from(await f.arrayBuffer());
          return {
            filename: f.name,
            mimeType: f.type || "application/octet-stream",
            data: buf,
          };
        }),
    );

    // ── Build MIME message ────────────────────────────────────────────────────
    const senderEmail = session?.user?.email ?? "";

    const encodedMessage = await composeRawEmail({
      from: senderEmail,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      html,
      attachments: attachmentParts,
    });

    // ── Set up Gmail client ───────────────────────────────────────────────────
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // ── Ensure "JobPilot" label exists ────────────────────────────────────────
    const labelsRes = await gmail.users.labels.list({ userId: "me" });
    let jobPilotLabel = labelsRes.data.labels?.find(
      (label) => label.name === "JobPilot",
    );

    if (!jobPilotLabel) {
      const newLabel = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: "JobPilot",
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      jobPilotLabel = newLabel.data;
    }

    // ── Send the email ────────────────────────────────────────────────────────
    const sentMessage = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    const gmailMessageId = sentMessage.data.id!;
    const threadId = sentMessage.data.threadId!;

    // ── Label the sent message ────────────────────────────────────────────────
    if (jobPilotLabel?.id) {
      await gmail.users.messages.modify({
        userId: "me",
        id: gmailMessageId,
        requestBody: { addLabelIds: [jobPilotLabel.id] },
      });
    }

    // ── Save Application record ───────────────────────────────────────────────
    try {
      await ConnectDB();

      const userObjectId = new mongoose.Types.ObjectId(userId);

      let company = "";
      let position = "";
      let location = "";
      let platform = "";
      let aiSummary = "";
      let notes = "";

      try {
        const parsed = await parseEmailWithAI({
          subject,
          from: senderEmail,
          body: html,
          snippet: html.replace(/<[^>]+>/g, "").slice(0, 200),
        });
        company = parsed.company || "";
        position = parsed.position || "";
        location = parsed.location || "";
        platform = parsed.platform || "";
        aiSummary = parsed.aiSummary || "";
        notes = parsed.notes || "";
      } catch {
        // AI parse failed — continue with empty fields
      }

      const attachmentMeta = attachmentParts.map((a) => ({
        name: a.filename,
        type: a.filename.split(".").pop()?.toLowerCase() || "file",
        size: `${(a.data.length / 1024).toFixed(0)} KB`,
      }));

      await ApplicationModel.updateOne(
        { userId: userObjectId, gmailMessageId },
        {
          $setOnInsert: {
            userId: userObjectId,
            gmailMessageId,
            threadId,
            company,
            companyLogo: "",
            position,
            recruiterEmail: to,
            candidateEmail: senderEmail,
            location,
            salary: "",
            platform,
            appliedVia: "Email",
            status: ApplicationStatus.APPLIED,
            subject,
            from: senderEmail,
            snippet: html.replace(/<[^>]+>/g, "").slice(0, 200),
            fullEmail: html,
            aiSummary,
            notes,
            labels: [],
            attachments: attachmentMeta,
            applicationDate: new Date(),
            receivedAt: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (dbErr) {
      console.error("[send-email] Failed to save application record:", dbErr);
    }

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send email",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
