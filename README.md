# Saasifyy — Multi-Tenant SaaS Marketplace Platform

A full-stack, multi-tenant SaaS marketplace where developers build and deploy SaaS products (via a built-in code editor or WordPress no-code builder) and customers discover, subscribe, and manage software — all from one platform. Built as a Final Year Project for BS Computer Science at UET Peshawar.

---

## Architecture

```
Turborepo Monorepo
├── apps/web              Next.js 16 (App Router + Turbopack) — Frontend
├── apps/api              Express.js 5 + TypeScript 6 — REST API
├── packages/shared       Shared types, constants, validators
└── wordpress/            MU-plugin + VPS provisioning scripts
```

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 6, Tailwind CSS 4, shadcn/ui, Zustand, Recharts |
| **Backend** | Express.js 5, TypeScript 6, Prisma 7 ORM, Zod validation |
| **Database** | PostgreSQL (Supabase), Prisma with `@prisma/adapter-pg` |
| **Payments** | Stripe (Checkout, Subscriptions, Webhooks, Connect) |
| **Auth** | JWT (access + refresh tokens), bcrypt, role-based access control |
| **IDE** | Monaco Editor (VS Code engine), in-browser code editing |
| **WordPress** | Multisite (subdomain), MU-plugin, WP-CLI, SSO via JWT |
| **DevOps** | Turborepo, GitHub Actions CI, Docker-ready |

---

## Features

### For Customers
- Browse marketplace with search, filtering, sorting, and pagination
- View detailed product pages with pricing plans and reviews
- Subscribe to SaaS products via Stripe Checkout (test mode)
- Manage active subscriptions (view, cancel at period end)
- View billing history and transaction details
- Account settings with profile update and password management
- Light/dark mode toggle across the entire platform

### For Developers
- Apply for developer account with business details
- **Two ways to build SaaS products:**
  - **Code Editor (IDE)** — Full-featured web-based IDE with Monaco Editor, file explorer, terminal, live preview, extensions marketplace, and one-click deploy to the platform
  - **No-Code Builder** — Provision WordPress subsites for drag-and-drop SaaS creation
- Create products with multi-tier pricing plans (monthly/yearly + free trials)
- Submit products for admin review before marketplace listing
- Analytics dashboard with revenue charts (daily/weekly/monthly)
- Transaction history with 85/15 revenue split (developer/platform)
- Extension marketplace in IDE (install/uninstall/enable/disable)

### For Admins
- Platform-wide analytics dashboard with KPI cards
- Approve/reject developer applications with rejection reasons
- Moderate product submissions (approve/reject with feedback)
- User management (search, filter by role, suspend accounts)
- Developer payout tracking and management
- Financial reports with date filtering and CSV export

### Built-in Code Editor (IDE)
The platform includes a professional web-based IDE at `/ide` with:

| Feature | Description |
|---------|-------------|
| **Monaco Editor** | Same engine as VS Code — syntax highlighting, IntelliSense, bracket colorization, minimap |
| **File Explorer** | Full CRUD — create, rename, delete files and folders with inline editing |
| **Tabbed Editor** | Multi-file editing with dirty indicators and tab management |
| **4 Starter Templates** | React SaaS, Node.js API, Full-Stack Next.js, Django Backend |
| **Live Preview** | In-browser preview with mobile/tablet/desktop device toggles |
| **Terminal Panel** | Console output with color-coded messages (info, error, success, system) |
| **Extensions Panel** | 15 extensions across 6 categories with install/uninstall/enable/disable |
| **Deploy to Marketplace** | Product details form → API submission → admin review queue |
| **Theme Sync** | Light/dark mode synced with platform theme |
| **Status Bar** | Panel toggles, language indicator, save status, running state |

### WordPress Integration
- WordPress Multisite on VPS (subdomain-based: `app.yourdomain.com`)
- MU-plugin for subscription-based content gating
- SSO via JWT tokens from marketplace
- Shortcode `[saas_content plan="pro"]...[/saas_content]` for paywalled content
- WP-CLI automation for site provisioning

---

## Screenshots & UI

The platform features a professional, animated UI with:
- Gradient hero sections with floating decorative elements
- Glass-card effects and smooth hover animations
- CSS keyframe animations (fade-in, slide-up, float, pulse-glow)
- Responsive design across all breakpoints
- Dark mode with oklch color space for vibrant colors
- Consistent branding with Saasifyy logo across all pages

---

## Quick Start

### Prerequisites
- **Node.js** >= 20
- **PostgreSQL** database (or [Supabase](https://supabase.com) free tier)
- **Stripe** account (test mode keys)
- **npm** >= 10

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/saas-marketplace.git
cd saas-marketplace
npm install
```

### 2. Environment Setup

**API** (`apps/api/.env`):
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname

JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=15

RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
```

**Web** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Generate JWT secrets:
```bash
openssl rand -base64 48   # Run twice for access + refresh
```

### 3. Database Setup

```bash
npm run db:migrate     # Run Prisma migrations
npm run db:seed        # Seed with 8 demo users, 6 products, subscriptions
```

### 4. Start Development

```bash
npm run dev            # Starts API (port 4000) + Web (port 3000) concurrently
```

### 5. Stripe Webhooks (Local)

```bash
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
```

Copy the `whsec_...` signing secret to `apps/api/.env`.

---

## Demo Accounts

After running `npm run db:seed`, these accounts are available:

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `sohaibktk969@gmail.com` | `Password1!` | Admin | Full platform access |
| `alice@devstudio.com` | `Password1!` | Developer | 2 published products |
| `bob@techcorp.com` | `Password1!` | Developer | 1 published product |
| `carol@startup.io` | `Password1!` | Developer | 1 published, 1 pending |
| `david@company.com` | `Password1!` | Customer | 3 active subscriptions |
| `emma@agency.com` | `Password1!` | Customer | 1 subscription, 1 trial |
| `frank@freelance.com` | `Password1!` | Customer | No subscriptions |
| `grace@newdev.com` | `Password1!` | Customer | Pending developer application |

The login page also includes **Quick Login** buttons for instant demo access.

---

## API Documentation

When the API is running:
- **Swagger UI**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **OpenAPI JSON**: [http://localhost:4000/api/docs.json](http://localhost:4000/api/docs.json)

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/users/me` | Get current user profile |
| `POST` | `/developers/apply` | Apply for developer status |
| `GET` | `/products` | List marketplace products |
| `POST` | `/products` | Create product (developer) |
| `POST` | `/subscriptions/checkout` | Create Stripe checkout |
| `GET` | `/admin/analytics` | Platform-wide analytics |
| `PATCH` | `/admin/products/:id/review` | Approve/reject product |

40+ endpoints documented with Swagger annotations.

---

## Project Structure

```
saas-marketplace/
├── apps/
│   ├── api/                          # Backend API
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 11 models, 8 enums
│   │   │   ├── seed.ts               # Demo data seeder
│   │   │   └── migrations/           # Database migrations
│   │   ├── src/
│   │   │   ├── config/               # Database, Stripe, Swagger, email
│   │   │   ├── controllers/          # Route handlers (analytics, products, etc.)
│   │   │   ├── middleware/            # Auth, RBAC, validation, rate limiting
│   │   │   ├── routes/               # Express routes with Swagger docs
│   │   │   ├── services/             # Business logic (Stripe, WordPress, etc.)
│   │   │   └── utils/                # JWT, hashing, pagination helpers
│   │   └── prisma.config.ts          # Prisma 7 datasource configuration
│   │
│   └── web/                          # Frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/           # Login, register, verify, forgot/reset password
│           │   ├── (dashboard)/      # Authenticated pages
│           │   │   ├── admin/        # Analytics, users, applications, moderation, payouts, reports
│           │   │   ├── customer/     # Subscriptions, billing, settings
│           │   │   └── developer/    # Onboarding, products, sites, analytics, revenue
│           │   ├── (marketing)/      # Marketplace catalog, product detail pages
│           │   ├── ide/              # Built-in code editor (full-screen)
│           │   ├── page.tsx          # Animated landing page
│           │   ├── layout.tsx        # Root layout with ThemeProvider
│           │   └── globals.css       # oklch color scheme, animations, utilities
│           ├── components/
│           │   ├── ide/              # Code editor components
│           │   │   ├── code-editor.tsx        # Monaco Editor wrapper
│           │   │   ├── file-explorer.tsx      # File tree with CRUD
│           │   │   ├── editor-tabs.tsx        # Multi-file tab bar
│           │   │   ├── terminal-panel.tsx     # Console output
│           │   │   ├── preview-panel.tsx      # Live preview iframe
│           │   │   ├── toolbar.tsx            # Run/Save/Deploy toolbar
│           │   │   ├── extensions-panel.tsx   # Extensions marketplace
│           │   │   ├── extensions-data.ts     # 15 extensions metadata
│           │   │   ├── deploy-dialog.tsx      # Deploy to marketplace form
│           │   │   ├── template-selector.tsx  # Template picker UI
│           │   │   └── templates.ts           # 4 starter templates
│           │   ├── layout/           # App sidebar, protected route
│           │   ├── ui/               # shadcn/ui component library
│           │   ├── theme-provider.tsx # Light/dark/system theme context
│           │   └── theme-toggle.tsx   # Sun/Moon toggle button
│           ├── lib/                  # API client, utilities
│           └── stores/               # Zustand auth store
│
├── packages/shared/                  # Shared types & constants
├── wordpress/                        # MU-plugin + VPS setup
├── .github/workflows/ci.yml         # GitHub Actions CI pipeline
├── turbo.json                        # Turborepo configuration
└── package.json                      # Root monorepo config
```

---

## Database Schema

11 models covering the full marketplace lifecycle:

| Model | Purpose |
|-------|---------|
| **User** | Auth, roles (Customer/Developer/Admin), profile |
| **DeveloperProfile** | Business info, application status, approval workflow |
| **DeveloperSite** | WordPress Multisite subsites per developer |
| **Product** | SaaS listings with moderation workflow (Draft → Pending → Published) |
| **PricingPlan** | Multi-tier pricing (monthly/yearly), free trials, Stripe price IDs |
| **Subscription** | Customer subscriptions synced with Stripe |
| **Transaction** | Payment records with 85/15 developer/platform split |
| **Payout** | Developer payout tracking (pending/processing/completed) |
| **Review** | Product ratings (1-5 stars) and comments |
| **AuditLog** | Admin activity trail for compliance |

---

## Developer Product Deployment Flow

```
Developer opens Code Editor (/ide)
        │
        ├── Selects a template (React SaaS / Node API / Full-Stack / Django)
        │
        ├── Writes code in Monaco Editor
        │   ├── Create/rename/delete files & folders
        │   ├── Install extensions (Prettier, ESLint, etc.)
        │   └── Preview with Run button
        │
        ├── Clicks "Deploy to Marketplace"
        │   ├── Fills product details (name, description, category, tags)
        │   ├── API call: POST /products
        │   └── Product created with PENDING status
        │
        ├── Admin reviews in /admin/moderation
        │   ├── Approves → status = PUBLISHED → listed on marketplace
        │   └── Rejects → status = REJECTED → developer notified
        │
        └── Customers discover & subscribe on marketplace
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in development mode (Turbopack) |
| `npm run build` | Build all apps for production |
| `npm run lint` | Run ESLint across all packages |
| `npm run test` | Run all test suites |
| `npm run db:migrate` | Run Prisma database migrations |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## Stripe Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Declined payment |
| `4000 0000 0000 3220` | Requires 3D Secure |

Use any future expiry date and any 3-digit CVC.

---

## WordPress Multisite Setup (VPS)

For the WordPress no-code hosting component:

```bash
# On a fresh Ubuntu 22.04+ VPS
sudo bash wordpress/setup/install.sh yourdomain.com
```

This installs Nginx, PHP 8.3, MySQL, WordPress Multisite (subdomain mode), and the subscription-gating MU-plugin. See `wordpress/setup/install.sh` for details.

---

## Theme System

The platform supports **Light**, **Dark**, and **System** themes:

- Uses `oklch` color space for vibrant, perceptually uniform colors
- Theme preference persisted in `localStorage`
- `.dark` class toggled on `<html>` element
- All pages (auth, dashboard, marketplace, IDE) respect the active theme
- Custom CSS animations: `fade-in`, `slide-up`, `float`, `pulse-glow`
- Utility classes: `.gradient-text`, `.glass-card`, `.hero-gradient`

---

## Team

| Name | Role |
|------|------|
| Muhammad Sohaib Akhtar | Lead Developer, UI/Frontend |
| Team Member 2 | Backend / Infrastructure |
| Team Member 3 | Testing / Documentation |

**University**: University of Engineering & Technology (UET), Peshawar
**Degree**: BS Computer Science — Final Year Project

---

## License

This project is part of an academic Final Year Project at UET Peshawar.
All rights reserved by the project team.
