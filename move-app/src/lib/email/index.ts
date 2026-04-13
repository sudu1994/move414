// Email service using Resend (https://resend.com)
// npm install resend
// Add RESEND_API_KEY to .env.local

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MOVE <noreply@move.jp>',
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[Email] Send failed:', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Email] Error:', err);
    return false;
  }
}

// ─── Email templates ──────────────────────────────────────

export function bookingConfirmedEmail(params: {
  name: string;
  fromCity: string;
  toCity: string;
  moveDate: string;
  moveTimeSlot: string;
  partnerName?: string;
  totalCost: number;
  customerPays: number;
}): string {
  const { name, fromCity, toCity, moveDate, moveTimeSlot, partnerName, totalCost, customerPays } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Booking Confirmed — MOVE</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
  <div style="margin-bottom: 24px;">
    <span style="font-size: 24px; font-weight: bold; color: #6366f1;">MOVE</span>
  </div>
  <h1 style="font-size: 20px; margin-bottom: 8px;">Your booking is confirmed!</h1>
  <p style="color: #555; margin-bottom: 24px;">Hi ${name}, your move has been confirmed. Here are the details:</p>
  <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <table style="width: 100%; font-size: 14px;">
      <tr><td style="color: #888; padding: 4px 0;">From</td><td style="font-weight: 500;">${fromCity}</td></tr>
      <tr><td style="color: #888; padding: 4px 0;">To</td><td style="font-weight: 500;">${toCity}</td></tr>
      <tr><td style="color: #888; padding: 4px 0;">Date</td><td style="font-weight: 500;">${moveDate} (${moveTimeSlot})</td></tr>
      ${partnerName ? `<tr><td style="color: #888; padding: 4px 0;">Partner</td><td style="font-weight: 500;">${partnerName}</td></tr>` : ''}
      <tr><td style="color: #888; padding: 4px 0;">Your payment</td><td style="font-weight: 600; color: ${customerPays > 0 ? '#f59e0b' : '#10b981'};">${customerPays === 0 ? 'Covered by plan' : `¥${customerPays.toLocaleString()}`}</td></tr>
    </table>
  </div>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/booking"
    style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
    View booking details
  </a>
  <p style="color: #999; font-size: 12px; margin-top: 24px;">
    Questions? Reply to this email or contact us at support@move.jp
  </p>
</body>
</html>`;
}

export function subscriptionActivatedEmail(params: {
  name: string;
  planName: string;
  monthlyPrice: number;
}): string {
  const { name, planName, monthlyPrice } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to MOVE!</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
  <div style="margin-bottom: 24px;">
    <span style="font-size: 24px; font-weight: bold; color: #6366f1;">MOVE</span>
  </div>
  <h1 style="font-size: 20px; margin-bottom: 8px;">Welcome to MOVE, ${name}!</h1>
  <p style="color: #555; margin-bottom: 24px;">
    Your <strong>${planName}</strong> subscription is now active at ¥${monthlyPrice.toLocaleString()}/month.
    You can book your first move anytime from your dashboard.
  </p>
  <div style="background: #eef2ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 14px; color: #4338ca; font-weight: 500;">What's included:</p>
    <ul style="margin: 8px 0 0; padding-left: 16px; font-size: 14px; color: #555;">
      <li>1 move per 2-year period</li>
      <li>Utilities setup (gas, electricity, water, internet)</li>
      <li>AI room design assistant</li>
      <li>Recycle shop connections</li>
    </ul>
  </div>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
    style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
    Go to dashboard
  </a>
</body>
</html>`;
}

export function utilityCompletedEmail(params: {
  name: string;
  city: string;
  services: string[];
}): string {
  const { name, city, services } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Utilities Ready — MOVE</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
  <div style="margin-bottom: 24px;">
    <span style="font-size: 24px; font-weight: bold; color: #6366f1;">MOVE</span>
  </div>
  <h1 style="font-size: 20px; margin-bottom: 8px;">Your utilities are ready!</h1>
  <p style="color: #555; margin-bottom: 16px;">
    Hi ${name}, we've completed the setup for your new place in ${city}.
  </p>
  <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
    <p style="margin: 0 0 8px; font-size: 14px; color: #166534; font-weight: 500;">Services activated:</p>
    ${services.map((s) => `<p style="margin: 2px 0; font-size: 14px; color: #15803d;">✓ ${s}</p>`).join('')}
  </div>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/utilities"
    style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
    View details
  </a>
</body>
</html>`;
}
