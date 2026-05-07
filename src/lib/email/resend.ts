import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "AI Spend Audit <onboarding@resend.dev>";

export async function sendAuditLeadEmail(args: {
  to: string;
  shareUrl: string;
  monthlySavings: number;
  annualSavings: number;
  highlights: string[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY missing; skipping email send.");
    return { sent: false as const };
  }
  const resend = new Resend(apiKey);
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#0b0c10;color:#e8eaef;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#11131a;border-radius:16px;padding:32px;border:1px solid #1f2430;">
          <tr><td style="font-size:22px;font-weight:600;padding-bottom:12px;">Your AI Spend Audit snapshot</td></tr>
          <tr><td style="opacity:.85;line-height:1.6;padding-bottom:16px;">
            Estimated savings: <strong>$${args.monthlySavings.toFixed(0)}/mo</strong>
            (~$${args.annualSavings.toFixed(0)}/yr).
          </td></tr>
          <tr><td style="padding-bottom:16px;">
            <ul style="margin:0;padding-left:18px;line-height:1.6;">
              ${args.highlights.map((h) => `<li>${h}</li>`).join("")}
            </ul>
          </td></tr>
          <tr><td style="padding:16px 0;">
            <a href="${args.shareUrl}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">Open shareable report</a>
          </td></tr>
          <tr><td style="opacity:.75;font-size:13px;line-height:1.6;">
            Credex helps teams negotiate AI vendor stacks and consolidate contracts.
            <a href="https://credex.example/consult" style="color:#a5b4fc;">Book a consultation</a> if you want hands-on support.
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Your AI Spend Audit — ~$${args.monthlySavings.toFixed(0)}/mo upside`,
    html,
  });
  return { sent: true as const };
}
