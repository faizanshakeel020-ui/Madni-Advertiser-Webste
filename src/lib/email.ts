import { Resend } from "resend";

const defaultRecipient = "shahbaziqbal233@gmail.com";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendNotificationEmail(input: {
  subject: string;
  html: string;
  replyTo?: string | null;
  idempotencyKey: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from || !from.includes("@")) {
    throw new Error("RESEND_FROM_EMAIL must be a valid verified sender address");
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [process.env.NOTIFICATION_EMAIL || defaultRecipient],
    subject: input.subject,
    html: input.html,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    headers: { "X-Notification-Type": "new-order-or-quote" },
  }, { idempotencyKey: input.idempotencyKey });

  if (error) {
    throw new Error(`Resend request failed: ${error.message}`);
  }

  if (!data?.id) throw new Error("Resend returned no email id");
}

export { escapeHtml };
