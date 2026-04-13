import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy Policy — MOVE' };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 prose prose-sm">
      <Link href="/" className="text-sm text-primary hover:underline block mb-8">← MOVE</Link>

      <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026</p>

      {[
        {
          title: '1. Information we collect',
          body: `We collect information you provide when creating an account (name, email, phone number), booking a move (addresses, move date, room size), or requesting utilities setup. We also collect usage data to improve our service.`,
        },
        {
          title: '2. How we use your information',
          body: `Your personal information is used to: (a) process and fulfill your moving and utilities requests, (b) communicate booking confirmations and status updates via email and SMS, (c) improve our services, and (d) comply with legal obligations.`,
        },
        {
          title: '3. Data sharing',
          body: `We share your address and contact information only with our verified moving company partners to fulfill your booking. We do not sell your personal data. Third-party services (Stripe for payments, Twilio for SMS, Clerk for authentication) process data under their own privacy policies.`,
        },
        {
          title: '4. APPI compliance',
          body: `We comply with Japan's Act on the Protection of Personal Information (個人情報保護法). You have the right to request access to, correction of, or deletion of your personal data. Contact us at privacy@move.jp.`,
        },
        {
          title: '5. Data retention',
          body: `We retain personal data for the duration of your subscription plus 3 years for legal compliance. Booking records may be retained for 7 years per Japanese accounting requirements.`,
        },
        {
          title: '6. Security',
          body: `All data is encrypted in transit (TLS) and at rest. We use industry-standard security practices and conduct regular security reviews.`,
        },
        {
          title: '7. Contact',
          body: `For privacy inquiries: privacy@move.jp`,
        },
      ].map(({ title, body }) => (
        <section key={title} className="mb-6">
          <h2 className="text-base font-semibold mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
        </section>
      ))}
    </div>
  );
}
