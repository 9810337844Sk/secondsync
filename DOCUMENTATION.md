# Second Sync — Full Project Documentation

> Nepal's second-hand marketplace · किन्नुहोस्, बेच्नुहोस्, पुन: प्रयोग गर्नुहोस्

**Live Site:** https://secondsync-five.vercel.app  
**Stack:** TanStack Start · React 19 · Supabase · Tailwind CSS v4 · Vercel  
**Admin:** `teamkalpantrix@gmail.com` / `MegaDilasha9090`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend](#4-frontend)
5. [Backend & Server Functions](#5-backend--server-functions)
6. [Database](#6-database)
7. [Authentication & Email Verification](#7-authentication--email-verification)
8. [Design System](#8-design-system)
9. [Environment Variables](#9-environment-variables)
10. [Install & Run on a New Device](#10-install--run-on-a-new-device)
11. [Deployment (Vercel)](#11-deployment-vercel)
12. [Admin Panel](#12-admin-panel)
13. [Routes Reference](#13-routes-reference)
14. [Common Issues & Fixes](#14-common-issues--fixes)

---

## 1. Project Overview

Second Sync is a full-stack SSR web application — Nepal's marketplace for pre-owned goods. Users can browse, buy, and sell second-hand items across categories like electronics, vehicles, books, furniture, fashion, and antiques.

### Core Features

| Feature | Description |
|---|---|
| Browse & Search | Filter listings by category, condition, price |
| Post a Listing | Upload photos (Cloudinary), set price, description |
| Email Verification | Custom 6-digit code via Gmail SMTP |
| AI Chatbot | Groq-powered shopping assistant ("Mega AI") |
| Admin Dashboard | Manage users, listings, messages, activity logs |
| Nepali UI | Bilingual English/Nepali interface throughout |

---

## 2. Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19.2.0 | UI library |
| TanStack Start | 1.167.50 | Full-stack SSR framework |
| TanStack Router | 1.168.25 | File-based routing |
| TanStack Query | 5.83.0 | Server state management |
| Tailwind CSS | 4.2.1 | Utility-first styling |
| Radix UI | Various | Headless accessible components |
| Lucide React | 0.575.0 | Icon library |
| React Hook Form | 7.71.2 | Form state management |
| Zod | 3.24.2 | Schema validation |
| Recharts | 2.15.4 | Admin charts |
| Sonner | 2.0.7 | Toast notifications |

### Backend
| Package | Version | Purpose |
|---|---|---|
| Nitro | 3.0.x | SSR server (Vercel preset) |
| Nodemailer | 9.0.0 | Gmail SMTP email sending |
| @supabase/supabase-js | 2.108.2 | Database + Auth client |

### Infrastructure
| Service | Purpose |
|---|---|
| Supabase | PostgreSQL database + Auth |
| Cloudinary | Image upload & CDN |
| Vercel | Hosting + serverless functions |
| Gmail SMTP | Transactional email (verification codes) |
| Groq API | AI chatbot (qwen/qwen3-32b) |

### Build Tools
| Tool | Purpose |
|---|---|
| Vite 8 | Dev server + build |
| Rolldown | Bundler (Rust-based) |
| TypeScript 5.8 | Type safety |
| ESLint + Prettier | Code quality |

---

## 3. Project Structure

```
secondsync/
├── src/
│   ├── routes/                  # File-based pages (TanStack Router)
│   │   ├── __root.tsx           # App shell — Header, Footer, Chatbot, providers
│   │   ├── index.tsx            # Home page (/)
│   │   ├── browse.tsx           # Browse listings (/browse)
│   │   ├── product.$id.tsx      # Product detail (/product/:id)
│   │   ├── sell.tsx             # Post an item (/sell)
│   │   ├── login.tsx            # Sign in / Sign up (/login)
│   │   ├── verify.tsx           # Email verification (/verify)
│   │   ├── team.tsx             # Team page (/team)
│   │   ├── about.tsx            # About page (/about)
│   │   ├── contact.tsx          # Contact form (/contact)
│   │   └── admin.tsx            # Admin dashboard (/admin)
│   │
│   ├── components/
│   │   ├── site/
│   │   │   ├── Header.tsx       # Sticky navigation bar
│   │   │   ├── Footer.tsx       # Site footer
│   │   │   ├── Chatbot.tsx      # Floating AI assistant
│   │   │   └── ProductCard.tsx  # Reusable listing card
│   │   └── ui/                  # shadcn/ui primitives (40+ components)
│   │
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client + TypeScript types
│   │   ├── auth-context.tsx     # React auth context + useAuth() hook
│   │   ├── send-verification.ts # Server function — sends email via Gmail
│   │   ├── products.ts          # Product types, categories, formatters
│   │   ├── cloudinary.ts        # Image upload helper
│   │   └── utils.ts             # cn() Tailwind class merger
│   │
│   ├── assets/
│   │   ├── logo.png             # Site logo (circle-with-border)
│   │   ├── mega-love.png        # Hero section image
│   │   └── pattern.jpg          # Background texture
│   │
│   ├── styles.css               # Tailwind v4 config + design tokens
│   └── router.tsx               # Router setup (createRouter)
│
├── database/
│   └── schema.sql               # Complete DB setup — run once in Supabase
│
├── vite.config.ts               # Vite + Nitro + Vercel preset config
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies + scripts
└── vercel.json                  # Minimal Vercel config (version: 2)
```

---

## 4. Frontend

### Routing

TanStack Router uses **file-based routing** — the filename is the URL path.

| File | URL | Description |
|---|---|---|
| `index.tsx` | `/` | Home — hero, featured listings, how-it-works |
| `browse.tsx` | `/browse` | All listings with filters |
| `product.$id.tsx` | `/product/:id` | Single listing detail |
| `sell.tsx` | `/sell` | Post a new item (auth required) |
| `login.tsx` | `/login` | Sign in + sign up tabs |
| `verify.tsx` | `/verify?email=...` | 6-digit email verification |
| `team.tsx` | `/team` | Team members page |
| `about.tsx` | `/about` | About Second Sync |
| `contact.tsx` | `/contact` | Contact form |
| `admin.tsx` | `/admin` | Admin dashboard (auth gated) |

**Dynamic route example:**
```tsx
// src/routes/product.$id.tsx
export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  // use id to fetch listing from Supabase
}
```

**Search params with validation:**
```tsx
// src/routes/verify.tsx
export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s.email === "string" ? s.email : "",
  }),
  component: VerifyPage,
});
```

### App Shell (`__root.tsx`)

The root layout wraps every page:

```
QueryClientProvider
  └── AuthProvider
        └── Header (hidden on /admin)
        └── <Outlet />   ← each page renders here
        └── Footer (hidden on /admin)
        └── Chatbot (hidden on /admin)
```

### Components

#### `Header.tsx`
- Sticky top navigation with blur backdrop
- Logo + "Second Sync" + Nepali tagline
- Nav links with Nepali translations
- Search bar (routes to `/browse?q=...`)
- Auth state: Sign In button OR user dropdown (profile, admin link, logout)
- Mobile: hamburger menu
- Shows admin badge when `profile.is_admin === true`

#### `Footer.tsx`
- Dark ink background, paper text
- 4 columns: Brand · Explore · Contact · Social
- Address: Maitidevi, Kathmandu
- Email: teamkalpantrix@gmail.com

#### `ProductCard.tsx`
- Links to `/product/:id`
- Hover zoom on image
- Condition badge (Like New / Excellent / Good / Fair)
- Discount % if `original_price` set
- `timeAgo()` formatted posted date
- Formatted NPR price

#### `Chatbot.tsx` (Mega AI)
- Floating action button (bottom-right)
- Groq API streaming (qwen/qwen3-32b model)
- Maintains last 10 messages for context
- Answers only marketplace-related questions
- Quick suggestion chips
- Replies in user's language (English/Nepali)

### State Management

- **Auth state** → `AuthProvider` + `useAuth()` hook
- **Server data** → TanStack Query (`useQuery`, `useMutation`)
- **Form state** → React Hook Form + Zod
- **UI state** → `useState` / `useEffect` (local)

### Image Uploads

Handled by `src/lib/cloudinary.ts`:

```typescript
// Client generates a signed request (SHA-1 signature)
// then POSTs to Cloudinary directly
const url = await uploadToCloudinary(file);
// returns: https://res.cloudinary.com/de4edmbhw/image/upload/...
```

Cloud name: `de4edmbhw`

---

## 5. Backend & Server Functions

TanStack Start uses `createServerFn` for server-only code. These run inside the Vercel serverless function — never in the browser.

### `sendVerificationEmail`

**File:** `src/lib/send-verification.ts`

```typescript
export const sendVerificationEmail = createServerFn({ method: "POST" })
  .validator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    // 1. Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 2. Store code in Supabase (expires in 15 min)
    await db.rpc("store_verification_code", { p_email: data.email, p_code: code });

    // 3. Send email via Gmail SMTP
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 587, secure: false,
      auth: { user: "teamkalpantrix@gmail.com", pass: "rdahsrzbgfxknpsb" },
    });
    await transport.sendMail({ ... });

    return { ok: true };
  });
```

**Called from:**
- `login.tsx` → after signup → navigates to `/verify`
- `login.tsx` → on login when email not confirmed
- `verify.tsx` → resend button

### How SSR Works

```
Browser Request
    ↓
Vercel Edge → /__server (serverless function)
    ↓
Nitro server renders React → HTML
    ↓
Client hydrates → React takes over
    ↓
createServerFn calls → POST /__server/fn → runs server-only code
```

The build output goes to `.vercel/output/` (Build Output API format) via the `nitro: { preset: "vercel" }` config.

---

## 6. Database

### Setup

Run `database/schema.sql` **once** in your Supabase SQL Editor:
`https://supabase.com/dashboard/project/swxrdjijzvzsrqrrvbdr/sql/new`

The file handles: clean slate → tables → RLS policies → trigger → functions → indexes → grants → admin account.

### Tables

#### `profiles`
Extends Supabase's `auth.users` with app-specific data.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | uuid | — | FK → auth.users(id) |
| `email` | text | — | User email |
| `full_name` | text | — | Display name |
| `avatar_url` | text | null | Profile photo URL |
| `phone` | text | null | Mobile number |
| `location` | text | null | City/district |
| `is_banned` | boolean | false | Ban status |
| `is_admin` | boolean | false | Admin privilege |
| `is_verified` | boolean | false | Email verified via our system |
| `created_at` | timestamptz | now() | Account creation time |

#### `listings`
All marketplace items.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `title` | text | English title |
| `title_np` | text | Nepali title |
| `category` | text | electronics / vehicles / books / furniture / fashion / antiques |
| `price` | numeric | Asking price in NPR |
| `original_price` | numeric | Original price (for discount %) |
| `condition` | text | Like New / Excellent / Good / Fair |
| `location` | text | City/area |
| `phone` | text | Seller contact |
| `description` | text | Full description |
| `images` | text[] | Cloudinary URLs |
| `seller_id` | uuid | FK → profiles(id) |
| `seller_name` | text | Denormalized name |
| `seller_email` | text | Denormalized email |
| `is_active` | boolean | Soft delete / visibility |
| `posted_at` | timestamptz | Post time |

#### `verification_codes`
Temporary email verification codes.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `email` | text | Target email |
| `code` | text | 6-digit code |
| `expires_at` | timestamptz | now() + 15 minutes |
| `used` | boolean | One-time use flag |
| `created_at` | timestamptz | Created time |

> **Note:** Direct client access is blocked by RLS. Only `SECURITY DEFINER` functions can read/write this table.

#### `activity_logs`
Audit trail of user actions.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → profiles(id) |
| `action` | text | Action name |
| `detail` | text | Extra context |
| `created_at` | timestamptz | When it happened |

#### `contact_messages`
Messages from the /contact page.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Sender name |
| `email` | text | Sender email |
| `subject` | text | Subject line |
| `message` | text | Message body |
| `is_read` | boolean | Read status |
| `created_at` | timestamptz | Sent time |

### Row Level Security (RLS)

| Table | anon SELECT | auth INSERT | auth UPDATE | auth DELETE | admin ALL |
|---|---|---|---|---|---|
| profiles | ✅ all rows | own row only | own row only | ❌ | ✅ |
| listings | ✅ active only | own seller_id | own seller_id | own seller_id | ✅ |
| verification_codes | ❌ | ❌ | ❌ | ❌ | ❌ (functions only) |
| activity_logs | ❌ | ✅ | ❌ | ❌ | ✅ |
| contact_messages | ❌ | ✅ | ❌ | ❌ | ✅ |

### Database Functions (SECURITY DEFINER)

These run as the database owner — they bypass RLS and can be called with the anon key.

#### `store_verification_code(p_email, p_code)`
Deletes any existing code for the email, inserts a fresh one with a 15-minute expiry.

#### `verify_email_code(p_email, p_code)`
Validates the code, marks it as used, sets `profiles.is_verified = true`, and sets `auth.users.email_confirmed_at`. Returns `boolean`.

#### `handle_new_user()` (trigger)
Fires `AFTER INSERT ON auth.users`. Auto-creates a profile row for every new signup.

### Indexes

```sql
listings_category_idx     -- category filter
listings_posted_at_idx    -- newest sort
listings_seller_id_idx    -- seller's listings
listings_is_active_idx    -- active filter
logs_created_at_idx       -- admin log view
logs_user_id_idx          -- user log lookup
messages_created_at_idx   -- admin message view
messages_is_read_idx      -- unread filter
ver_codes_email_idx       -- fast code lookup
```

---

## 7. Authentication & Email Verification

### Supabase Auth (disabled built-in email confirmation)

> **Important:** In Supabase Dashboard → Authentication → Providers → Email, **"Confirm email" must be OFF**. Second Sync handles verification itself via Gmail SMTP to avoid Supabase's email rate limits.

### Signup Flow

```
User fills signup form
        ↓
supabase.auth.signUp({ email, password, data: { full_name, phone } })
        ↓
Supabase creates auth.users row
        ↓
Trigger: handle_new_user() → creates profiles row (is_verified: false)
        ↓
Server: sendVerificationEmail() → generates 6-digit code
        ↓
RPC: store_verification_code() → stores in verification_codes table
        ↓
Gmail SMTP sends branded HTML email with code
        ↓
Navigate to /verify?email=...
```

### Verification Flow

```
User enters 6-digit code on /verify page
        ↓
supabase.rpc("verify_email_code", { p_email, p_code })
        ↓
DB Function checks: code exists + not used + not expired
        ↓
If valid:
  - verification_codes.used = true
  - profiles.is_verified = true
  - auth.users.email_confirmed_at = now()
        ↓
Show success screen → Link to /login
```

### Login Flow

```
User enters email + password
        ↓
supabase.auth.signInWithPassword({ email, password })
        ↓
If error "email not confirmed":
  → sendVerificationEmail() → redirect /verify
        ↓
If success:
  → fetch profiles.is_verified
  → if false: signOut() → sendVerificationEmail() → redirect /verify
  → if true: redirect to /
```

### Auth Context (`useAuth`)

```typescript
import { useAuth } from "@/lib/auth-context";

const { user, session, profile, loading, signOut, refreshProfile } = useAuth();

// user      → Supabase User object (null if logged out)
// session   → Supabase Session (JWT tokens)
// profile   → profiles row (is_admin, is_verified, etc.)
// loading   → true during initial session check
// signOut() → logs out and clears state
// refreshProfile() → re-fetches profiles row from DB
```

### Protecting Routes

```tsx
function ProtectedPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <Spinner />;
  if (!user) {
    navigate({ to: "/login" });
    return null;
  }
  return <PageContent />;
}
```

### Admin Guard

```tsx
function AdminPage() {
  const { profile } = useAuth();
  if (!profile?.is_admin) return <AccessDenied />;
  return <AdminDashboard />;
}
```

---

## 8. Design System

### Color Palette (OKLCH)

| Token | Value | Usage |
|---|---|---|
| `--paper` | `oklch(0.985 0.008 80)` | Cream background |
| `--ink` | `oklch(0.20 0.03 25)` | Primary text |
| `--crimson` | `oklch(0.52 0.21 25)` | Nepal flag red — CTA, accents |
| `--gold` | `oklch(0.78 0.14 80)` | Warm accent — headings, badges |
| `--border` | `oklch(0.90 0.01 80)` | Dividers, card borders |
| `--muted-foreground` | `oklch(0.55 0.02 80)` | Secondary text |

### Typography

| Font | Usage |
|---|---|
| `Tiro Devanagari Sanskrit` | Nepali characters |
| `Cormorant Garamond` | Display headings (serif) |
| `Inter` | Body text (sans-serif) |

```css
/* Usage in Tailwind */
font-display   /* Cormorant Garamond for headings */
font-sans      /* Inter for body text */
```

### Custom Utilities

```css
.bg-gradient-hero      /* crimson → deep brown gradient (used in banners) */
.shadow-elegant        /* Soft multi-stop drop shadow */
.shadow-card           /* Subtle card lift shadow */
.nepali-divider        /* Alternating crimson & gold stripe border */
.animate-float-in      /* Fade + slide up (page entry) */
.animate-bob           /* Vertical bounce (icons) */
```

### Spacing & Radius

```css
--radius: 0.75rem          /* Base border radius */
rounded-xl  → 0.875rem
rounded-2xl → 1rem
rounded-3xl → 1.5rem       /* Cards, modals */
rounded-full               /* Buttons, avatars */
```

### Component Conventions

- **Cards:** `rounded-3xl border border-border bg-card shadow-card`
- **Primary buttons:** `rounded-full bg-crimson text-paper hover:scale-105`
- **Input fields:** `rounded-xl border border-border bg-paper focus:border-crimson`
- **Section headers:** `font-display text-4xl font-bold text-ink`

---

## 9. Environment Variables

Currently the project uses hardcoded values. For production security, move these to environment variables:

| Variable | Current Value | Used In |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://swxrdjijzvzsrqrrvbdr.supabase.co` | `src/lib/supabase.ts` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | `src/lib/supabase.ts` |
| `SMTP_USER` | `teamkalpantrix@gmail.com` | `src/lib/send-verification.ts` |
| `SMTP_PASS` | `rdahsrzbgfxknpsb` | `src/lib/send-verification.ts` |
| `VITE_CLOUDINARY_CLOUD_NAME` | `de4edmbhw` | `src/lib/cloudinary.ts` |
| `VITE_GROQ_API_KEY` | `gsk_...` | `src/components/site/Chatbot.tsx` |

To use `.env`:
```env
# .env.local (never commit this file)
VITE_SUPABASE_URL=https://swxrdjijzvzsrqrrvbdr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SMTP_USER=teamkalpantrix@gmail.com
SMTP_PASS=rdahsrzbgfxknpsb
VITE_CLOUDINARY_CLOUD_NAME=de4edmbhw
VITE_GROQ_API_KEY=gsk_...
```

In Vercel: Settings → Environment Variables → add each key.

---

## 10. Install & Run on a New Device

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ (20 recommended) | https://nodejs.org |
| npm | 9+ (comes with Node) | — |
| Git | any | https://git-scm.com |
| Vercel CLI | latest | `npm i -g vercel` |

### Step 1 — Clone the repository

```bash
git clone https://github.com/sachinsunway/secondsync.git
cd secondsync
```

If no GitHub remote yet, copy the project folder and open a terminal inside it.

### Step 2 — Install dependencies

```bash
npm install
```

This installs all packages from `package.json` (~100 packages including React, TanStack, Supabase, Tailwind, etc.).

### Step 3 — Start the development server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. The dev server supports hot module replacement (HMR) — changes reflect instantly without refresh.

### Step 4 — Database setup (first time only)

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/swxrdjijzvzsrqrrvbdr/sql/new)
2. Open `database/schema.sql` from this project
3. Paste the entire contents and click **Run**
4. This creates all tables, RLS policies, functions, indexes, and the admin account

### Step 5 — Disable Supabase email confirmation (first time only)

1. Go to [Supabase → Authentication → Providers → Email](https://supabase.com/dashboard/project/swxrdjijzvzsrqrrvbdr/auth/providers)
2. Toggle **"Confirm email"** OFF
3. Save

This stops Supabase from sending its own confirmation emails (we handle verification ourselves with Gmail SMTP).

### Available Scripts

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build → .vercel/output/
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run format       # Run Prettier formatter
```

### Build Output

```
npm run build
```

Generates:
```
.vercel/output/
├── config.json                    # Vercel routing rules (auto-generated by Nitro)
├── static/                        # Hashed static assets (CSS, JS, images)
│   └── assets/
└── functions/
    └── __server.func/             # Serverless function (all SSR + server fns)
        ├── index.mjs
        ├── _libs/                 # Vendor chunks (nodemailer, supabase, etc.)
        └── _ssr/                  # Route chunks
```

---

## 11. Deployment (Vercel)

### One-Command Deploy

```bash
vercel --prod --yes --scope sachinitktm-3792s-projects
```

This:
1. Runs `npm run build` on Vercel's servers
2. Uploads `.vercel/output/` (Build Output API)
3. Deploys the serverless function + static assets
4. Aliases to `https://secondsync-five.vercel.app`

### How It Works

The `nitro: { preset: "vercel" }` in `vite.config.ts` tells Nitro to generate Vercel's Build Output API format:

```
All page requests   → /__server (serverless function renders HTML)
/assets/*           → static files served from CDN directly
createServerFn POST → /__server (same function handles API calls)
```

### Vercel Config

`vercel.json` is intentionally minimal:
```json
{ "version": 2 }
```

The routing config is fully handled by Nitro inside `.vercel/output/config.json`.

### Re-deploy after changes

```bash
npm run build                                          # build locally first to catch errors
vercel --prod --yes --scope sachinitktm-3792s-projects # deploy
```

### Project on Vercel

- **Dashboard:** https://vercel.com/sachinitktm-3792s-projects/secondsync
- **Production URL:** https://secondsync-five.vercel.app
- **Runtime:** `nodejs24.x` serverless

---

## 12. Admin Panel

### Access

URL: `https://secondsync-five.vercel.app/admin`

Credentials:
- **Email:** `teamkalpantrix@gmail.com`
- **Password:** `MegaDilasha9090`

### Features

| Tab | Description |
|---|---|
| Dashboard | Stats: total users, listings, messages, revenue |
| Users | List all users, ban/unban, promote to admin |
| Listings | View all listings, deactivate/delete |
| Messages | Contact form submissions, mark as read |
| Activity | Full audit log of user actions |

### Making Someone an Admin via SQL

```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'user@example.com';
```

### Banning a User

```sql
UPDATE profiles SET is_banned = TRUE WHERE email = 'user@example.com';
```

---

## 13. Routes Reference

### Public Routes (no login required)

| Route | File | Description |
|---|---|---|
| `/` | `index.tsx` | Homepage — hero, featured, how it works |
| `/browse` | `browse.tsx` | All listings with category/condition filters |
| `/product/:id` | `product.$id.tsx` | Single listing detail + contact seller |
| `/team` | `team.tsx` | 5 team members with roles |
| `/about` | `about.tsx` | About Second Sync |
| `/contact` | `contact.tsx` | Contact form → stored in DB |

### Auth Routes

| Route | File | Description |
|---|---|---|
| `/login` | `login.tsx` | Sign in tab + sign up tab |
| `/verify` | `verify.tsx` | 6-digit code entry (requires `?email=` param) |

### Protected Routes (login required)

| Route | File | Description |
|---|---|---|
| `/sell` | `sell.tsx` | Post a new listing with image upload |

### Admin Route

| Route | File | Description |
|---|---|---|
| `/admin` | `admin.tsx` | Full admin dashboard (is_admin required) |

### Navigation Links (Header)

```
Home · Browse · Sell · Team · About · Contact
```

With Nepali labels:
```
घर · ब्राउज · बेच्नुहोस् · टोली · बारे · सम्पर्क
```

---

## 14. Common Issues & Fixes

### "Email rate limit exceeded" on signup
**Cause:** Supabase's built-in email confirmation is enabled.  
**Fix:** Go to Authentication → Providers → Email → disable **"Confirm email"**.

### 404 NOT_FOUND on Vercel
**Cause:** Old `vercel.json` had SPA rewrites pointing to `index.html` which doesn't exist in SSR builds.  
**Fix:** Already fixed — `vercel.json` is `{ "version": 2 }` and `vite.config.ts` has `nitro: { preset: "vercel" }`.

### "Could not store verification code" error
**Cause:** `store_verification_code` function doesn't exist in DB yet.  
**Fix:** Run `database/schema.sql` in Supabase SQL Editor.

### Login works but user can't access /sell
**Cause:** `is_verified` is still `false` in profiles.  
**Fix:** User must complete email verification at `/verify`.

### Profile not updating after admin change
**Cause:** Auth context caches the profile.  
**Fix:** Call `refreshProfile()` from `useAuth()`, or the user can sign out and back in.

### Images not showing after upload
**Cause:** Cloudinary unsigned preset issue or network.  
**Fix:** Check `src/lib/cloudinary.ts` — API key is `397166311342929`, cloud name is `de4edmbhw`.

### Build error: "Rolldown failed to resolve import"
**Cause:** A package imported in a server function is not installed.  
**Fix:** `npm install <package-name>` — never use `import "server-only"` (not installed).

### Admin SQL: "already registered" error
**Cause:** The admin account already exists in auth.users.  
**Fix:** The schema SQL uses `ON CONFLICT ... DO UPDATE` — re-running it will update the password safely.

---

## Team

| Name | Role |
|---|---|
| Mega Basnet | Backend |
| Rahul Shah | Frontend |
| Dilasha Basnet | UI/UX Design & Frontend |
| Swoyam Rajkarnikar | Backend |
| Swarup Ghorsaine | AI Integration |

**Contact:** teamkalpantrix@gmail.com  
**Address:** Maitidevi, Kathmandu, Nepal

---

*Second Sync — किन्नुहोस्, बेच्नुहोस्, पुन: प्रयोग गर्नुहोस्*
