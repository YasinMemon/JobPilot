import { NextRequest, NextResponse } from "next/server";
import { requireGoogleAccount } from "@/lib/requireGoogleAccount";
import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import { fetchJobEmails } from "@/services/gmail.service";
import { parseEmailWithAI } from "@/services/parser.service";
import mongoose from "mongoose";
import { notifyApplicationsImported } from "@/lib/notifications/triggers";

/**
 * POST /api/applications/sync
 *
 * Fetches latest job emails from the user's Gmail account,
 * parses them with AI, and stores new applications in MongoDB.
 *
 * Requires the user to have a Google account linked.
 *
 * Response:
 *   { success: true, imported: number, total: number, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth (requires Google account) ────────────────────────────────────────
    const result = await requireGoogleAccount(req);
    if (result instanceof NextResponse) return result;

    const { session, googleAccount } = result;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await ConnectDB();

    // ── Fetch Gmail access token via Better Auth (handles decrypt + refresh) ──
    let accessToken: string;
    try {
      const tokenResponse = await auth.api.getAccessToken({
        body: {
          providerId: googleAccount.providerId,
          accountId: googleAccount.accountId,
        },
        headers: req.headers,
      });

      if (!tokenResponse?.accessToken) {
        throw new Error("No access token returned");
      }

      accessToken = tokenResponse.accessToken;
    } catch (err) {
      console.error("[sync] Failed to get access token:", err);
      return NextResponse.json(
        {
          success: false,
          message:
            "Could not retrieve Gmail access token. Please reconnect your Google account.",
        },
        { status: 403 },
      );
    }

    // ── Fetch emails from Gmail ───────────────────────────────────────────────
    const emails = await fetchJobEmails(accessToken, 50);

    if (emails.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        total: 0,
        message: "No new job emails found in your Gmail.",
      });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // ── Find already-imported message IDs ────────────────────────────────────
    const incomingIds = emails.map((e) => e.gmailMessageId);
    const existingDocs = await ApplicationModel.find(
      { userId, gmailMessageId: { $in: incomingIds } },
      { gmailMessageId: 1 },
    ).lean();

    const existingIds = new Set(existingDocs.map((d) => d.gmailMessageId));

    // ── Filter to new emails only ─────────────────────────────────────────────
    const newEmails = emails.filter(
      (e) => !existingIds.has(e.gmailMessageId),
    );

    if (newEmails.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        total: emails.length,
        message: "All emails have already been imported.",
      });
    }

    // ── Parse each new email with AI ──────────────────────────────────────────
    // Process in small batches to avoid overwhelming the AI API
    const BATCH_SIZE = 5;
    const docsToInsert = [];

    for (let i = 0; i < newEmails.length; i += BATCH_SIZE) {
      const batch = newEmails.slice(i, i + BATCH_SIZE);

      const parsedBatch = await Promise.allSettled(
        batch.map((email) =>
          parseEmailWithAI({
            subject: email.subject,
            from: email.from,
            body: email.body,
            snippet: email.snippet,
          }),
        ),
      );

      for (let j = 0; j < batch.length; j++) {
        const email = batch[j];
        const parseResult = parsedBatch[j];

        const parsed =
          parseResult.status === "fulfilled"
            ? parseResult.value
            : {
                company: "",
                position: "",
                recruiterEmail: "",
                candidateEmail: "",
                location: "",
                salary: "",
                status: "Unknown" as const,
                platform: "",
                applicationDate: null,
                notes: "",
                aiSummary: "",
                companyLogo: "",
              };

        docsToInsert.push({
          userId,
          gmailMessageId: email.gmailMessageId,
          threadId: email.threadId,

          // From AI
          company: parsed.company,
          companyLogo: parsed.companyLogo,
          position: parsed.position,
          recruiterEmail: parsed.recruiterEmail,
          candidateEmail: parsed.candidateEmail,
          location: parsed.location,
          salary: parsed.salary,
          status: parsed.status,
          platform: parsed.platform,
          applicationDate: parsed.applicationDate
            ? new Date(parsed.applicationDate)
            : undefined,
          aiSummary: parsed.aiSummary,
          notes: parsed.notes,

          // From email
          subject: email.subject,
          from: email.from,
          snippet: email.snippet,
          fullEmail: email.body,
          attachments: email.attachments,
          receivedAt: email.receivedAt,

          // Defaults
          labels: [],
          appliedVia: "",
        });
      }
    }

    // ── Bulk insert (skip duplicates with ordered: false) ────────────────────
    let imported = 0;
    let insertedApps: { gmailMessageId: string; company?: string; position?: string }[] = [];
    if (docsToInsert.length > 0) {
      try {
        const insertResult = await ApplicationModel.insertMany(docsToInsert, {
          ordered: false, // Continue on duplicate key errors
        });
        imported = insertResult.length;
        insertedApps = insertResult.map((d) => ({
          gmailMessageId: d.gmailMessageId,
          company: d.company,
          position: d.position,
        }));
      } catch (err: unknown) {
        // BulkWriteError — some docs may have been inserted
        const bulkErr = err as {
          insertedDocs?: { gmailMessageId: string; company?: string; position?: string }[];
          writeErrors?: unknown[];
        };
        imported = bulkErr.insertedDocs?.length ?? 0;
        insertedApps = bulkErr.insertedDocs ?? [];
        console.warn(
          `[sync] BulkWrite partial: ${imported} inserted, ${bulkErr.writeErrors?.length ?? 0} duplicates skipped`,
        );
      }
    }

    // Only applications that were actually inserted trigger a notification.
    await notifyApplicationsImported(userId, insertedApps);

    return NextResponse.json({
      success: true,
      imported,
      total: emails.length,
      message:
        imported === 0
          ? "All emails were already imported."
          : `Successfully imported ${imported} new application${imported > 1 ? "s" : ""}.`,
    });
  } catch (error) {
    console.error("[POST /api/applications/sync] Error:", error);
    return NextResponse.json(
      { success: false, message: "Sync failed. Please try again." },
      { status: 500 },
    );
  }
}
