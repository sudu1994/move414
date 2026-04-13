# MOVE — Japan Relocation Subscription

> Monthly subscription for moving, utilities setup, AI room design, and recycle — built for foreign residents in Japan.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Database | PostgreSQL via Prisma |
| Payments | Stripe |
| AI | Anthropic Claude (Vision API) |
| SMS | Twilio |
| UI | Tailwind CSS + Radix UI |
| Testing | Playwright |

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd move-app
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in:
- **Clerk** — create project at clerk.com, copy publishable + secret keys
- **Database** — Supabase or Railway (free tier works). Copy connection string.
- **Stripe** — create products + prices for each plan (Lite/Standard/Plus/Business). Copy price IDs.
- **Anthropic** — get API key from console.anthropic.com
- **Twilio** — optional, for SMS confirmations

### 3. Database

```bash
npm run db:generate   # generate Prisma client
npm run db:push       # push schema to DB
npm run db:seed       # seed peak seasons + sample partners
```

### 4. Stripe products

Create 4 recurring products in Stripe dashboard:

| Product | Price | Interval | Env key |
|---|---|---|---|
| MOVE Lite | ¥1,980 | Monthly | `STRIPE_PRICE_LITE` |
| MOVE Standard | ¥3,200 | Monthly | `STRIPE_PRICE_STANDARD` |
| MOVE Plus | ¥4,800 | Monthly | `STRIPE_PRICE_PLUS` |
| MOVE Business | ¥8,000 | Monthly | `STRIPE_PRICE_BUSINESS` |

Set webhook endpoint: `https://yourdomain.com/api/webhooks`
Events to listen: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000

---

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout (Clerk)
│   ├── auth/                 # Login / Signup
│   ├── dashboard/            # Customer dashboard
│   ├── booking/              # Multi-step booking form
│   ├── utilities/            # Utility setup request
│   ├── ai-design/            # AI room design (Claude Vision)
│   ├── room-scanner/         # LiDAR room scanner
│   ├── recycle/              # Recycle shop integration
│   ├── admin/                # Admin dashboard
│   └── api/                  # All API routes
│       ├── bookings/
│       ├── utilities/
│       ├── ai-design/
│       ├── subscriptions/
│       ├── recycle/
│       ├── notifications/
│       ├── webhooks/         # Stripe webhooks
│       ├── user/profile/
│       └── admin/
├── components/
│   ├── ui/                   # Button, Card, Input, Badge...
│   ├── layout/               # Sidebar, AdminSidebar
│   ├── forms/                # BookingForm, UtilitiesForm
│   ├── dashboard/            # RoomScanner
│   └── charts/               # RevenueChart, StatusChart
├── lib/
│   ├── db/                   # Prisma client
│   ├── types/                # TypeScript types + plan configs
│   ├── utils/                # Pricing, formatting, helpers
│   └── hooks/                # useSubscription, useBookings, useNotifications
└── styles/
    └── globals.css
```

---

## Key features

### Subscription + billing
- 4 plans (Lite ¥1,980 → Business ¥8,000/mo)
- 2-year contracts, 1 move per contract period
- Distance cap per plan (10/20/30km)
- Peak season surcharge (Feb–Apr)
- Stripe Checkout + webhooks + billing portal

### Booking flow
- 5-step form: From → To → Room → Date → Confirm
- Eligibility check against subscription
- Automatic partner assignment
- SMS confirmation via Twilio
- Pricing breakdown (base + distance overage + peak)

### Utilities setup
- Gas, electricity, water, internet
- Multi-language (EN/JA/ZH/VI/KO)
- Provider preferences
- Admin tracks completion per service

### AI room design
- Upload up to 3 room photos
- Claude Vision analyzes and returns layout plan
- Furniture suggestions with recycle shop recommendations
- Estimated prices in ¥

### LiDAR room scanner
- Animated radar sweep viewfinder
- Simulated depth scan with progress phases
- Captures furniture with dimensions (W×D×H)
- Confidence scores per item
- Grid-based room layout (10×8 = 5m×4m)
- Drag-and-place furniture into floor plan
- Links to AI Design for full recommendations

### Admin
- MRR, subscriber counts, plan distribution
- Booking management with status updates
- Utility request tracking
- User management + role assignment

---

## Tests

```bash
npm test              # Playwright E2E
npm run test:ui       # Playwright UI mode
```

Critical path coverage:
- Landing page renders
- Auth protection on all routes
- API 401 without auth
- Room scanner redirect

---

## Deploy

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Set all env vars in Vercel dashboard. Database must be accessible from Vercel edge.

### Stripe webhook for production

```bash
stripe listen --forward-to https://yourdomain.com/api/webhooks
```

---

## Phase roadmap

| Phase | Target | Key milestones |
|---|---|---|
| 1 (mo 1–3) | 20 subscribers | MVP live, first paying customers |
| 2 (mo 4–8) | 100 subscribers | AI design live, partner integrations |
| 3 (mo 9–18) | 500+ subscribers | B2B HR portal, gig dispatch |
