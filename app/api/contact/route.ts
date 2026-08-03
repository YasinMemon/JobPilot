import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations/contact";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const parsed = contactFormSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please review the form fields and try again.",
        },
        { status: 400 },
      );
    }

    const submissionId = crypto.randomUUID();

    console.info("[contact-form] Received message", {
      submissionId,
      category: parsed.data.category,
      email: parsed.data.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thanks for contacting JobPilot. We received your message and will respond within 24-48 hours.",
        submissionId,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "We could not process your message right now.",
      },
      { status: 500 },
    );
  }
}
