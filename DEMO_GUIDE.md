# Demo Script — Saasifyy Platform

This guide walks through a complete demonstration of all user roles and the built-in Code Editor. Estimated time: 20-25 minutes.

---

## Pre-Demo Setup

1. **Start the platform:**
   ```bash
   npm run dev                    # API on :4000, Web on :3000
   ```

2. **Seed the database** (if not done):
   ```bash
   npm run db:seed
   ```

3. **Start Stripe webhook forwarding** (optional, for live checkout demo):
   ```bash
   stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
   ```

4. **Open browser**: Navigate to `http://localhost:3000`

---

## Part 1: Landing Page & Theme (2 min)

1. **Show the landing page** — Animated hero section, gradient effects, floating blobs
2. **Toggle dark mode** — Click the Sun/Moon icon in the top-right corner
3. **Scroll through sections:**
   - "How it works" — 3-step cards with hover animations
   - Stats section — Platform metrics
   - "Built for everyone" — Customer, Developer, Admin role cards
   - CTA section with pulse-glow animation
4. **Show the footer** — Professional branding

---

## Part 2: Customer Experience (5 min)

1. **Quick Login as Customer** — Click "Customer" badge on the login page, or use:
   - Email: `david@company.com` | Password: `Password1!`

2. **Browse Marketplace** (`/marketplace`):
   - Show the search bar — try searching "analytics" or "CRM"
   - Note the product cards with star ratings, hover effects, gradient top bars
   - Click pagination buttons

3. **View a Product** — Click on any product card
   - Show description, pricing plans, reviews

4. **My Subscriptions** (`/customer/subscriptions`):
   - Show active subscriptions with status badges
   - Note the "Cancel" option for each

5. **Billing History** (`/customer/billing`):
   - Transaction table with amounts and dates

6. **Settings** (`/customer/settings`):
   - Profile update form
   - Password change form

---

## Part 3: Developer Experience — Code Editor (7 min)

This is the highlight of the demo.

1. **Login as Developer:**
   - Email: `alice@devstudio.com` | Password: `Password1!`

2. **Navigate to Code Editor** — Click "Code Editor" in the sidebar

3. **Template Selection**:
   - Show all 4 templates: React SaaS, Node.js API, Full-Stack Next.js, Django Backend
   - Note the "Popular" badge, tags, hover animations
   - **Select "React SaaS Starter"**

4. **IDE Tour:**
   - **Activity Bar** (left icons) — Toggle between Files and Extensions
   - **File Explorer** — Expand folders, show the file tree
   - **Monaco Editor** — Click on different files, show syntax highlighting
   - **Tabs** — Multiple files open with dirty indicators

5. **File Operations:**
   - **Create a file** — Hover a folder → click `+` file icon → type `utils.ts` → Enter
   - **Create a folder** — Hover a folder → click `+` folder icon → type `hooks` → Enter
   - **Rename** — Hover a file → click pencil icon → change name → Enter
   - **Delete** — Hover a file → click trash icon → file removed

6. **Edit Code:**
   - Type some code in the editor
   - Note the dirty indicator (dot) on the tab
   - Click **Save** — see "Project saved" in console

7. **Run & Preview:**
   - Click **Run** (green button)
   - Watch the terminal: compile steps, "Ready in 1.2s"
   - **Live Preview** appears on the right — the React SaaS landing page
   - Toggle device sizes: Desktop → Tablet → Mobile
   - Click **Stop** to end the preview

8. **Extensions:**
   - Click the puzzle piece icon in the Activity Bar
   - Show 3 pre-installed: Prettier, ESLint, Tailwind IntelliSense
   - **Install an extension** — Click "Install" on Python → loading animation → installed
   - **Disable an extension** — Click the green toggle → turns to "Disabled"
   - **Search** — Type "theme" → filtered results
   - **Category filter** — Click "Themes" pill → Dracula, One Dark Pro

9. **Deploy to Marketplace:**
   - Click **"Deploy to Marketplace"** (purple button, top-right)
   - Fill in the deploy dialog:
     - Product Name: "My React SaaS App"
     - Description: "A modern SaaS analytics dashboard built with React"
     - Category: Select "Analytics"
     - Tags: "react, analytics, dashboard"
   - Click **Deploy**
   - Watch the progress bar animate (0% → 100%)
   - See success screen: "Your product has been submitted for admin review"
   - Console shows deployment logs

---

## Part 4: Developer — Traditional Product Management (3 min)

1. **My Products** (`/developer/products`):
   - Show existing products (from seed data + the one just deployed)
   - Note status badges: Published, Pending, Draft

2. **Create New Product** (traditional form):
   - Click "New Product"
   - Show the form: name, description, category, tags
   - (Can skip submitting — just show the form)

3. **WordPress Sites** (`/developer/sites`):
   - Show the sites table with status badges
   - Show "New Site" button — dialog for provisioning a WordPress subsite

4. **Analytics** (`/developer/analytics`):
   - Revenue charts, subscriber counts

5. **Revenue** (`/developer/revenue`):
   - Transaction history with 85/15 split breakdown

---

## Part 5: Admin Experience (5 min)

1. **Login as Admin:**
   - Email: `admin@saasifyy.com` | Password: `Password1!`

2. **Dashboard** (`/admin/analytics`):
   - KPI cards: Total Users, Products, Revenue, Subscriptions
   - Charts and growth metrics

3. **Product Moderation** (`/admin/moderation`) — **Key demo moment:**
   - The product deployed from the Code Editor should appear here as PENDING
   - Click **"Review"** on it
   - Show the review dialog: description, category, pricing plans
   - **Approve** the product
   - Product is now PUBLISHED and will appear on the marketplace

4. **Developer Applications** (`/admin/applications`):
   - Show pending applications
   - Approve or reject with reason

5. **User Management** (`/admin/users`):
   - Search and filter users by role
   - Show user details

6. **Payouts** (`/admin/payouts`):
   - Developer payout tracking

7. **Reports** (`/admin/reports`):
   - Financial reports with date filtering
   - CSV export button

---

## Part 6: End-to-End Flow Recap (2 min)

Summarize the complete lifecycle:

```
Developer signs up → Applies for developer status
        ↓
Admin approves developer application
        ↓
Developer opens Code Editor → Picks React template
        ↓
Writes code → Tests with Run/Preview
        ↓
Clicks Deploy → Fills product details → Submits
        ↓
Admin reviews in moderation queue → Approves
        ↓
Product listed on marketplace
        ↓
Customer browses → Subscribes via Stripe → Access granted
```

---

## Quick Login Reference

| Role | Email | Password |
|------|-------|----------|
| Customer | `david@company.com` | `Password1!` |
| Developer | `alice@devstudio.com` | `Password1!` |
| Admin | `admin@saasifyy.com` | `Password1!` |

The login page has **Quick Login** buttons that auto-fill these credentials.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API not connecting | Check `apps/api/.env` has correct `DATABASE_URL` |
| Login fails | Run `npm run db:seed` to create demo accounts |
| Stripe checkout fails | Add test keys to `.env` files |
| Build errors | Run `npm install` then `npm run build` |
| Monaco Editor not loading | Clear browser cache, ensure `@monaco-editor/react` is installed |
