import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Webhook] RESEND_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const body = await request.text();

    // Svix headers used by Resend
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = resend.webhooks.verify(
        {
          payload: body,
          headers: {
            id: svixId,
            timestamp: svixTimestamp,
            signature: svixSignature,
          },
          webhookSecret,
        },
      );
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    if (event.type === "email.clicked") {
      const { email_id } = event.data;
      const link = event.data.click.link;

      await adminClient
        .from("client_messages")
        .update({
          clicked_at: new Date().toISOString(),
          clicked_link: link,
        })
        .eq("resend_email_id", email_id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    // Always return 200 to prevent retries
    return NextResponse.json({ received: true });
  }
}
