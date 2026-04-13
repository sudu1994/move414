// Twilio SMS service
// Credentials from env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn('[SMS] Twilio credentials not set — skipping');
    return false;
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('[SMS] Failed:', err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[SMS] Error:', err);
    return false;
  }
}

// ─── SMS Templates ────────────────────────────────────────

export const SMS = {
  bookingConfirmed: (params: {
    name: string; moveDate: string; fromCity: string; toCity: string; lang: 'en' | 'ja';
  }) => params.lang === 'ja'
    ? `【MOVE】${params.name}様\n引越し予約が確定しました。\n日時：${params.moveDate}\n${params.fromCity}→${params.toCity}\nご質問はアプリからどうぞ。`
    : `[MOVE] Hi ${params.name}! Move confirmed.\n${params.moveDate}: ${params.fromCity} → ${params.toCity}\nCheck the app for details.`,

  moveReminder: (params: { name: string; moveDate: string; lang: 'en' | 'ja' }) =>
    params.lang === 'ja'
      ? `【MOVE】${params.name}様\n明日は引越し日です！（${params.moveDate}）\nご準備をお忘れなく。`
      : `[MOVE] Reminder: Your move is tomorrow (${params.moveDate}). See you then!`,

  utilityComplete: (params: { name: string; service: string; lang: 'en' | 'ja' }) =>
    params.lang === 'ja'
      ? `【MOVE】${params.name}様\n${params.service}の開設手続きが完了しました。`
      : `[MOVE] Hi ${params.name}! Your ${params.service} setup is complete.`,

  gigWorkerDispatch: (params: { workerName: string; city: string; date: string }) =>
    `[MOVE] Hi ${params.workerName}! Move job available in ${params.city} on ${params.date}.\nReply YES to accept or NO to pass.`,

  subscriptionActive: (params: { name: string; plan: string; lang: 'en' | 'ja' }) =>
    params.lang === 'ja'
      ? `【MOVE】${params.name}様\n${params.plan}プランが有効になりました。いつでも引越し予約ができます。`
      : `[MOVE] Welcome ${params.name}! Your ${params.plan} plan is active. Book your move anytime.`,
};
