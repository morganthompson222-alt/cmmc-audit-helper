# CMMC Audit Helper

A self-assessment preparation tool for small DoD contractors working toward CMMC (Cybersecurity Maturity Model Certification) compliance.

**Important:** This is a self-assessment PREP tool, not a certification and not a substitute for a C3PAO assessor.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage)
- **Payments:** Stripe (Checkout + Webhook)
- **Deployment:** Vercel

## Setup

### Prerequisites

- Node.js 18+
- Supabase project (uses your existing project)
- Stripe account (test mode for development)

### 1. Clone & Install

```bash
git clone <repo-url>
cd cmmc-audit-helper
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase — uses your EXISTING project, all tables in "cmmc" schema
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (test mode keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run the migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor. This creates:
- `cmmc` schema (fully isolated from `public` schema)
- All tables with proper foreign keys and indexes
- Row Level Security policies (company-scoped access)

### 4. Supabase Storage

Create a private bucket called `evidence` in Supabase Storage. No public access — all downloads go through RLS-authenticated API calls.

### 5. Stripe Setup

1. Create a product/price in Stripe Dashboard for £1,000 (one-time)
2. Set the price ID as `STRIPE_PRICE_ID`
3. Set up a webhook endpoint pointing to `https://your-domain.com/api/webhooks/stripe`
4. The webhook listens for `checkout.session.completed` events

### 6. Run

```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Set all environment variables in Vercel project settings
4. Deploy

## Environment Variables for Vercel

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for webhooks) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe price ID for £1,000 product |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL (e.g., https://cmmc.example.com) |

## Project Structure

```
├── app/
│   ├── layout.tsx            # Root layout with Header/Footer
│   ├── page.tsx              # Marketing landing page
│   ├── globals.css           # Tailwind + custom styles
│   ├── signup/page.tsx       # Sign up with company creation
│   ├── login/page.tsx        # Email/password + magic link login
│   ├── auth/callback/route.ts # Supabase OAuth callback
│   ├── onboarding/page.tsx   # CUI scoping + level selection
│   ├── dashboard/page.tsx    # Progress overview
│   ├── assessment/page.tsx   # Control checklist + evidence upload
│   ├── export/page.tsx       # Paywall + zip export
│   └── api/
│       ├── checkout/route.ts # Stripe checkout session
│       └── webhooks/stripe/route.ts # Stripe webhook handler
├── components/
│   ├── Header.tsx            # App header with auth state
│   ├── Footer.tsx            # Disclaimer footer
│   ├── AuthGuard.tsx         # Route protection wrapper
│   └── Toast.tsx             # Toast notification system
├── lib/
│   ├── types.ts              # TypeScript types
│   ├── utils.ts              # Utility functions
│   ├── controls.ts           # Level 1 (15) + Level 2 (110) control data
│   ├── stripe.ts             # Stripe client config
│   └── supabase/
│       ├── client.ts         # Browser client
│       ├── server.ts         # Server client
│       └── middleware.ts     # Auth middleware
├── hooks/
│   └── useAutosave.ts        # Debounced autosave with status
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema + RLS
├── middleware.ts             # Next.js middleware (auth redirect)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Importing from Prototype

All control content (questions, good/mistake guidance, evidence guidance) has been ported from the original prototype into `lib/controls.ts`. The data structure matches the original `LEVEL1_CONTROLS` array for Level 1 and the generated Level 2 controls.

## Key Features

- **Autosave:** Every field change saves to Supabase with visual feedback
- **File Uploads:** Drag-and-drop evidence uploads to Supabase Storage (private bucket)
- **Paywall:** Full assessment is free; payment unlocks the export package
- **Export:** Generates a .zip with SSP summary, POA&M, and all uploaded evidence files

## Disclaimer

CMMC Audit Helper is a self-assessment preparation tool. It is not a certification and does not replace a C3PAO assessment. Submission of false claims to SPRS may result in penalties under the False Claims Act (31 U.S.C. §§ 3729-3733).
