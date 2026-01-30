import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Horde Portal <portal@hordeagence.com>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] Resend API key not configured, skipping email");
    return { success: false, error: "No API key" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL, 
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Error sending email:", error);
      return { success: false, error };
    }

    console.log("[Email] Sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email] Exception:", err);
    return { success: false, error: err };
  }
}
