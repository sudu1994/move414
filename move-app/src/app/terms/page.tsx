import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Terms of Service — MOVE' };

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Link href="/" className="text-sm text-primary hover:underline block mb-8">← MOVE</Link>

      <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026</p>

      {[
        {
          title: '1. Service description',
          body: 'MOVE provides a subscription-based relocation service in Japan including moving coordination, utilities setup assistance, AI room design, and recycle partner connections.',
        },
        {
          title: '2. Subscription terms',
          body: 'Subscriptions are billed monthly. Each plan includes one move per 24-month contract period within the specified distance limit. Contracts auto-renew monthly until cancelled. The 2-year period refers to the eligibility window between moves, not the billing commitment.',
        },
        {
          title: '3. Move coverage',
          body: 'One move is included per 2-year period within the distance limit of your plan (10km / 20km / 30km). Additional distance, peak season (February–April), volume overages, and special items incur extra charges billed separately.',
        },
        {
          title: '4. Peak season surcharge',
          body: 'A surcharge of ¥10,000–¥20,000 applies to moves booked during peak moving season (February 1 – April 15). This is clearly disclosed at the time of booking.',
        },
        {
          title: '5. Cancellation policy',
          body: 'You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. Moves already scheduled are not affected by subscription cancellation. No refunds are issued for partial months.',
        },
        {
          title: '6. Booking cancellation',
          body: 'Bookings cancelled more than 7 days before the move date incur no penalty. Cancellations within 7 days may incur a ¥5,000–¥10,000 fee depending on partner availability.',
        },
        {
          title: '7. Liability',
          body: 'MOVE coordinates with licensed moving partners and is not directly liable for damage during transit. Moving partners carry their own insurance. For claims, contact the assigned partner directly; MOVE will assist in mediation.',
        },
        {
          title: '8. Utilities setup',
          body: 'Utilities setup is a coordination service. MOVE contacts providers on your behalf but cannot guarantee service activation dates, which depend on individual utility companies.',
        },
        {
          title: '9. Governing law',
          body: 'These terms are governed by Japanese law. Disputes shall be resolved in Tokyo District Court as the court of first instance.',
        },
        {
          title: '10. Contact',
          body: 'For questions: support@move.jp',
        },
      ].map(({ title, body }) => (
        <section key={title} className="mb-5">
          <h2 className="text-base font-semibold mb-1.5">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
        </section>
      ))}
    </div>
  );
}
