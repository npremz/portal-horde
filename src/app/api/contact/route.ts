import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { contactFormEmail } from "@/lib/email/templates";

const ADMIN_EMAIL = "hello@hordeagence.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, category, subject, message } = body;

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate email HTML
    const html = contactFormEmail({
      name,
      email,
      company: company || null,
      category,
      subject,
      message,
    });

    // Send email to admin
    const result = await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Contact Portal] ${subject}`,
      html,
    });

    if (!result.success) {
      console.error("[Contact API] Failed to send email:", result.error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
