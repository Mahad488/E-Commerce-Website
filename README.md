# NOVA — Full-Stack E-Commerce Store

A complete online store built with **React 19 + TypeScript + Vite + Tailwind CSS v4** on the front end and **Node.js + Express 5 + MySQL** on the back end, with a separate **admin portal** for running the shop.

---

## ✨ Features

### Storefront
| Area | What you get |
|---|---|
| **Home** | Hero, trust bar, live category counts, **flash-sale countdown** (deals reset at midnight), tabbed *New / Best sellers / Top rated*, real customer reviews, copy-to-clipboard coupon codes, recently viewed |
| **Shop** | Search, category, **price range**, **min rating**, **in-stock only**, **on sale**, 7 sort options, filter chips, *Load more*. All filters live in the URL so views can be shared |
| **Product page** | Colour variants with per-colour stock, **hover zoom**, quantity, **Buy it now**, delivery estimate, low-stock warnings, share link, **rating breakdown**, review sorting, **"Verified buyer"** badges, related products, recently viewed |
| **Quick view** | "Quick view" on every product card (desktop) opens a modal, or a drag-to-close bottom sheet on phones, to pick a colour and add to cart without leaving the page |
| **Cart** | **Slide-out mini cart** with a free-delivery meter that celebrates at 100%, **coupon codes**, colour-variant stock limits |
| **Checkout** | Saved address pre-filled, coupon + shipping totals calculated by the server, printable invoice, **order confirmation email** (the success screen says where it went). Pay **cash on delivery** (instant) or **by card on Stripe Checkout** (test mode): the items are held for 30 minutes while the shopper pays, and `/checkout/result` confirms the payment with the server and shows the invoice |
| **Account** | Order history (with a note on which address gets order emails), cancel pending orders (stock is restored, a cancellation email is sent), detailed tracking link, profile & address book, change password |
| **Track order** | Public tracking page (order # + email) with a timestamped status timeline |
| **Help pages** | Contact form (saved to the DB, with an emailed acknowledgement and reference number), searchable FAQ / shipping & returns, About, Privacy, Terms, custom 404 |
| **Multi-currency** | 19 currencies with a side drawer; prices convert everywhere, orders are charged in USD |
| **Offline mode** | If the API isn't running, the catalogue and product pages fall back to a bundled demo catalogue |
| **Design & motion** | NOVA's own design system ([docs/DESIGN.md](docs/DESIGN.md)): Mona Sans, a night-sky brand layer with a nova glow, and motion that answers the shopper. Add to cart flies the photo into the bag with a burst, hearts spark, prices and totals roll, drawers and sheets spring in with focus trapped, pages cross-fade. Everything respects *reduce motion* |

### Admin portal (`/admin`)
- **Overview dashboard**: revenue/orders/AOV/customers, **daily revenue chart** (7/14/30 days, hover tooltips, table view), orders by status, top products, revenue by category, **low-stock alerts**, **contact inbox**
- Order management with status changes (stock is restored/re-deducted when cancelling/un-cancelling; COD orders are marked paid on delivery). Changing a status opens a confirmation where you can add a **note for the customer** (e.g. courier and tracking number) and choose whether to email them
- Product catalogue CRUD with colour variants and sale prices
- **Photo uploads**: drag and drop (or pick) a JPEG, PNG or WebP up to 3 MB for the main photo and for each colour, with a preview, upload progress, Change / Remove, and an *Or paste image URL instead* option. Saving waits for any upload still running
- **Coupon manager** (*Coupons* tab): totals for codes, active codes and times used; a table with each code, discount, minimum order, usage meter ("14 / 50 uses"), end date and status (Active, Paused, Expired, Used up); create / edit in a modal with a live preview of the coupon ticket; one-click Pause / Resume; delete with a confirmation (and a *Pause instead* option for codes that have been used)
- Change admin username/password
- **Works on phones**: from 360px up, with a menu sheet instead of the tab strip, cards instead of the order, product and coupon tables, bottom-sheet forms and filters, and 16px fields so iOS doesn't zoom in
- **Data Hub** (`/admin-data`): your live products and orders, ready to inspect or export as JSON

### Backend
- One-command database setup with **schema, migrations and seed data**
- Server-side price, stock, shipping and **coupon** calculation inside a DB transaction
- **Stripe Checkout** for card payments (REST calls, no SDK): a `payments` table, signed webhooks (HMAC-SHA256, 5-minute tolerance), amount + currency + order checks before anything is fulfilled, and stock + coupon use returned when a payment is cancelled, fails or times out
- Order **status history** table (powers tracking timelines)
- **Transactional email** with Nodemailer over SMTP (Gmail, Brevo, Resend …): order confirmation, status updates (Processing, Shipped, Delivered, Cancelled), password-reset codes and contact-form replies. Branded HTML + plain-text templates in `backend/emails/`. Sent after the database commit, in the background, so a slow mail server never holds up a request. Without SMTP, development prints each email to the API terminal
- bcrypt password hashing, JWT auth for customers and admins (separate secrets)
- In-memory **rate limiting** on login, registration, password recovery and public forms
- Consistent JSON errors (404 for unknown routes, 400 for malformed JSON)
- Image uploads checked by their real file signature (not just the declared type), stored with random UUID names and served from `/uploads` with long-lived caching. Storage is pluggable through `STORAGE_DRIVER`

---

## 🚀 Getting started

**Requirements:** Node.js 20.19+ (or 22+) and MySQL 8 (or MariaDB 10.6+).

### 1. Install dependencies
```bash
npm install                # storefront + admin (from the project root)
cd backend && npm install  # API
```

### 2. Configure the backend
```bash
cd backend
cp .env.example .env       # then edit DB_PASSWORD, JWT_SECRET, ADMIN_SECRET, ADMIN_USERNAME and ADMIN_PASSWORD
```

### 3. Create the database (tables + demo data)
```bash
npm run db:setup           # inside backend/
```
This creates the database if needed, creates/upgrades every table, and — only when the `products` table is empty — seeds 20 products, reviews, coupons and two weeks of sample orders (set `SEED_DEMO_ORDERS=false` to skip the orders). The sample orders belong to a customer on a reserved `example.com` address with a random password, so nobody can sign in as them and no real person gets emailed about them.
Running it again is safe; it never deletes data. Existing databases from earlier versions are upgraded in place (missing columns are added, and text columns that are too short are widened, e.g. an old `orders.payment_method VARCHAR(20)` that couldn't hold "Cash on Delivery (COD)").

### 4. Run everything
```bash
# terminal 1 — API on http://localhost:5000
cd backend && npm run dev

# terminal 2 — storefront on http://localhost:5173
npm run dev

# optional — standalone admin app on http://localhost:5174
npm run dev:admin
```
The admin portal is also available inside the storefront at **`/admin-login`**.

If your API isn't on `http://localhost:5000`, create a root `.env` with `VITE_API_URL=http://your-api-host`.

### Product photos
Photos uploaded in the admin are saved to `backend/uploads/products/` and stored on the product as a relative path such as `/uploads/products/<uuid>.webp`. The storefront turns that into a full URL with `getImageUrl()` (prefixing `VITE_API_URL`). The folder is git-ignored except for its `.gitkeep`, so back it up (or switch to cloud storage) when you deploy.

| Variable | Default | Meaning |
|---|---|---|
| `STORAGE_DRIVER` | `local` | Where uploaded images go. Only `local` exists today; add a Cloudinary or S3 driver in `backend/services/storage.js` (a driver saves the file and returns its public URL) |

### Email
Leave `SMTP_HOST` empty while developing: every email is printed to the API terminal (password-reset codes included), and its HTML is saved to `backend/.email-previews/<template>.html` so you can open it in a browser. The API logs on start-up which mode it's in, and checks the SMTP login when one is set.

| Variable | Default | Meaning |
|---|---|---|
| `SMTP_HOST` | — | SMTP server, e.g. `smtp.gmail.com`, `smtp-relay.brevo.com`, `smtp.resend.com`. Empty = don't send |
| `SMTP_PORT` | `587` | `587` (STARTTLS) or `465` (TLS) |
| `SMTP_SECURE` | `true` on port 465 | Force TLS on or off |
| `SMTP_USER` / `SMTP_PASS` | — | Login. Gmail needs an [app password](https://support.google.com/accounts/answer/185833); Resend uses user `resend` and your API key |
| `MAIL_FROM` | `NOVA <SMTP_USER>` | Sender shown to customers. Gmail only sends as your own address; Brevo and Resend need a verified domain |
| `SUPPORT_EMAIL` | `support@novastore.com` | Reply-to address, also shown in the email footer |
| `STORE_URL` | first `CLIENT_URL` | Storefront address used in email links |

Emails link to `/track-order?orderId=…` without the shopper's email in the URL; they type it on the page. Status emails go out for Processing, Shipped, Delivered and Cancelled (not when an order goes back to Pending). The contact-form reply never repeats the visitor's message, so the form can't be used to send someone else's text to a stranger.

### Card payments (Stripe test mode)
1. Create a free Stripe account and copy the **test** secret key from [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys). Stripe doesn't sign up Pakistani businesses, but test mode works with an account in any supported country.
2. Put it in `backend/.env` as `STRIPE_SECRET_KEY=sk_test_…` and restart the API. It logs `[payments] Stripe test mode is on.` and the checkout shows *Card (secure payment by Stripe)*.
3. Optional locally, required in production: webhooks. With the [Stripe CLI](https://docs.stripe.com/stripe-cli) run `stripe listen --forward-to localhost:5000/api/payments/webhook --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed` and put the `whsec_…` it prints in `STRIPE_WEBHOOK_SECRET`. In production add the same endpoint and events in the Stripe dashboard.

How a card payment works:
- `POST /api/payments/create-session` checks the cart, coupon and stock, creates the order as **Pending / Awaiting payment** (taking the stock so nobody else can buy it meanwhile), records a pending `payments` row and returns Stripe's page. The order is charged as one line, *NOVA order #12*, for exactly the server's total.
- Paid: the webhook (or the result page asking Stripe directly, which is why it works without webhooks) checks the amount, currency and order number, then marks the payment **paid** and the order **Processing / Paid** in one transaction and emails the confirmation. A payment that doesn't match is held as **Needs review** and never fulfilled.
- Not paid: leaving Stripe's page, a failed payment, or a session that passes its 30 minutes (checked every 5 minutes, even without webhooks) cancels the order and gives back the stock (colour stock too) and the coupon use. Nothing is ever released while Stripe says the session might still be paid.
- Test cards: `4242 4242 4242 4242` (paid), `4000 0000 0000 0002` (declined), any future date, any CVC.

| Variable | Default | Meaning |
|---|---|---|
| `STRIPE_SECRET_KEY` | — | `sk_test_…`. Empty = card payments off, checkout offers cash on delivery only |
| `STRIPE_WEBHOOK_SECRET` | — | `whsec_…` for `POST /api/payments/webhook`. Without it the webhook answers 503 |
| `STRIPE_ALLOW_LIVE` | `false` | Live keys (`sk_live_…`) are refused unless this is `true` **and** `NODE_ENV=production` |

---

## 🔑 Accounts & codes

| What | Value |
|---|---|
| Shopper | Register on the site, or sign in with Google. There is no shared demo account |
| Admin | The `ADMIN_USERNAME` and `ADMIN_PASSWORD` you set. They create the first admin when the `admins` table is empty; change them later under *Security & Password* |
| Coupons | `WELCOME10` (10% off) · `SAVE15` ($15 off $100+) · `NOVA20` (20% off $150+) · `FREESHIP` |
| Stripe test cards | `4242 4242 4242 4242` (paid) · `4000 0000 0000 0002` (declined), any future expiry, any CVC. Needs `STRIPE_SECRET_KEY` (see *Card payments*) |

There are no built-in passwords. Without `ADMIN_USERNAME` and `ADMIN_PASSWORD` a new database gets no admin account, and the API logs a warning saying so. An older database that still has the seeded test shopper has that account locked on the next start: its orders stay, but it can no longer sign in.

> Password-reset codes are emailed. Without email set up in development they're printed to the API terminal instead; with `NODE_ENV=production` they never appear in the logs.

---

## 🎨 Design system

The look and motion rules live in **[docs/DESIGN.md](docs/DESIGN.md)**, with a clickable sketch in `docs/design-preview.html` (open it straight from the folder).

- **Tokens** are Tailwind v4 theme values in `src/styles/tokens.css`, so they're ordinary utilities:
  `bg-night`, `bg-porcelain`, `text-ink`, `text-muted`, `bg-flare` (buying only), `bg-marigold`, `bg-aurora`,
  `rounded-tag / -control / -tile / -sheet`, `shadow-overlay`, `ease-nova-out`.
- **Component classes** in `src/index.css`: `btn btn-buy | btn-primary | btn-secondary | btn-ghost | btn-danger`, `input`,
  `tag tag-deal | tag-new | tag-best | tag-out`, `chip`, `icon-btn`, `well` (product image tile), `skeleton`,
  `type-display-xl | type-display-l | type-h2 | type-h3 | type-price | type-code`. Wrap a dark section in `on-night`
  and buttons, inputs and focus rings switch to their night versions.
- **Motion** uses [`motion`](https://motion.dev) (`import { m } from "motion/react"`), loaded lazily through `LazyMotion`.
  It's the only new dependency: it gives exit animations, springs, layout reflow and drag-to-dismiss, which would be a lot
  of hand-written code. Reusable pieces are in `src/components/motion/`. To make anything fly into the bag:

  ```tsx
  const { fly } = useFlyToCart();
  fly(imageElement, imageUrl).then(() => addToCart(product));
  ```

---

## 🗂 Project structure
```text
ecommerce-website/
├── src/                      # Storefront (React)
│   ├── components/           # Navbar, ProductCard, CartDrawer, QuickViewModal, Wordmark, EmptyState, Skeleton, …
│   │   └── motion/           # MotionProvider, PageTransition, AnimatedNumber, Pressable, Reveal, Stagger,
│   │                         # NovaGlow/NovaStars, FlyToCartProvider + useFlyToCart()
│   ├── context/              # Auth, Cart (incl. coupons), Wishlist, Currency, Toast
│   ├── lib/                  # catalog.ts (API + offline fallback), auth.ts, recentlyViewed.ts,
│   │                         # motion.ts (timing tokens), flare.ts (bursts, confetti, fly), useFocusTrap, …
│   ├── styles/tokens.css     # Design tokens as Tailwind v4 @theme (shared with the admin portal)
│   ├── pages/                # Home, Products, ProductDetails, Cart, Checkout, Account, TrackOrder, …
│   └── data/products.ts      # Offline demo catalogue (mirrors the seed)
├── admin/
│   ├── frontend/             # Admin portal (Admin.tsx, AdminAnalytics.tsx, AdminCoupons.tsx, AdminLogin.tsx, …)
│   └── backend/              # Re-exports of backend/admin
└── backend/
    ├── server.js
    ├── config/               # db.js, secrets.js
    ├── database/             # schema.sql, migrate.js, seed.js, setup.js
    ├── middleware/           # authMiddleware.js, rateLimit.js
    ├── services/             # orderService.js (stock, coupons, status changes), storage.js (image uploads),
    │                         # email.js (SMTP + dev previews), notifications.js (which email, with what data),
    │                         # stripe.js (Checkout Sessions + webhook signatures), paymentService.js (holds, confirm, release, sweep)
    ├── emails/               # Email templates: _layout + orderConfirmation, orderStatusChanged, passwordReset, contactAutoReply (.html + .txt)
    ├── uploads/products/     # Uploaded product photos (git-ignored)
    ├── routes/               # auth, products, orders, payments, store (coupons/newsletter/contact)
    └── admin/                # adminAuth, adminOrders, adminProducts, adminStats, adminUploads, adminCoupons
```

---

## 🔌 API reference

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | — | Create account / sign in |
| GET / PUT | `/api/auth/profile` | user | Read / update profile & address |
| PUT | `/api/auth/change-password` | user | Change password |
| POST | `/api/auth/forgot-password` · `/verify-reset-code` · `/reset-password` | — | Password recovery |
| GET | `/api/products?search=&category=&sort=&onSale=true` | — | Catalogue (`sort`: `latest`, `popular`, `price_asc`, `price_desc`, `rating`, `discount`) |
| GET | `/api/products/categories` | — | Categories with counts |
| GET | `/api/products/:id` · `/api/products/:id/related` | — | Product / related products |
| GET / POST | `/api/products/:id/reviews` | optional | Reviews + star breakdown / add review |
| POST | `/api/orders` | user | Place a **cash-on-delivery** order (server recalculates totals). Emails a confirmation; the response's `confirmation_email` says where. Any other `payment_method` gets a 400 pointing to Stripe |
| GET | `/api/payments/config` | — | `{ card: { provider: "stripe", enabled, testMode } }`, so checkout can show or hide the card option |
| POST | `/api/payments/create-session` | user | Same body as `/api/orders`. Creates the order (stock held 30 minutes) and returns `{ orderId, url, total_amount }`; send the shopper to `url` |
| POST | `/api/payments/webhook` | Stripe signature | `checkout.session.completed`, `.expired`, `.async_payment_succeeded`, `.async_payment_failed` |
| GET | `/api/payments/orders/:orderId` | user | Payment status (`pending`, `paid`, `failed`, `expired`, `cancelled`, `review`) and the order, asking Stripe while it's pending |
| POST | `/api/payments/orders/:orderId/cancel` | user | The shopper left Stripe without paying: closes the session and releases the stock |
| GET | `/api/orders/my-orders` | user | Order history |
| DELETE | `/api/orders/cancel/:id` | user | Cancel a pending order |
| GET | `/api/orders/track?orderId=&email=` | — | Public tracking |
| POST | `/api/coupons/validate` · GET `/api/coupons/public` | — | Coupons. Only active, unexpired codes under their usage limit are accepted or listed |
| GET | `/api/reviews/featured` | — | Homepage reviews |
| POST | `/api/newsletter` · `/api/contact` | — | Newsletter / contact form (the contact reply is emailed; `confirmationEmail` in the response) |
| POST | `/api/admin/login` | — | Admin sign in |
| GET | `/api/admin/stats?days=14` | admin | Dashboard analytics |
| GET / POST | `/api/admin/coupons` | admin | List coupons (newest first, with `used_count` and `status`) / create one: `{ code, discount_type: percent|fixed|shipping, discount_value, min_order?, usage_limit?, expires_at? (YYYY-MM-DD, last day it works), description?, active? }`. Codes are 3–30 letters, numbers, `-` or `_`, saved in capitals and unique (409 if taken). Validation errors are 400 with an `errors` object per field. An empty description is written for you ("20% off orders over $150") |
| PUT / DELETE | `/api/admin/coupons/:id` | admin | Update all fields (`used_count` is kept) / delete. Orders that used a deleted code keep their discount |
| PATCH | `/api/admin/coupons/:id/toggle` | admin | Pause or resume: `{ active: true|false }`, or no body to flip it |
| GET / PATCH | `/api/admin/orders` · `/api/admin/orders/:id/status` | admin | Orders. Status body: `{ status, note?, notify? }`; `note` (≤ 500 characters) goes on the tracking timeline and in the email, `notify: false` skips the email. Responds with `emailed` |
| POST / PUT / DELETE | `/api/products` · `/api/products/:id` | admin | Manage products |
| POST | `/api/admin/uploads` | admin | Upload one product photo: `multipart/form-data` with the file in `image` (JPEG/PNG/WebP, max 3 MB). Returns `{ success, url }`; errors are 413 (too big), 415 (wrong type) or 400 (no file) |
| GET | `/uploads/products/<file>` | — | Uploaded photos (static) |
| GET | `/api/health` | — | API + database health |

---

## 🧰 Scripts
| Where | Command | Does |
|---|---|---|
| root | `npm run dev` | Storefront dev server |
| root | `npm run build` | Type-check and build the storefront |
| root | `npm run lint` | ESLint |
| root | `npm run dev:admin` | Standalone admin app |
| backend | `npm run dev` / `npm start` | API with/without auto-reload |
| backend | `npm run db:setup` | Create/upgrade the database and seed demo data |

## 🛡 Before going live
- Set `NODE_ENV=production`, long random `JWT_SECRET` / `ADMIN_SECRET`, and `CLIENT_URL` (CORS allow-list).
- Use your own strong `ADMIN_PASSWORD`. If an admin account was ever created with the old default password from earlier versions of this project, change it under *Security & Password*: it's public in this repository's history.
- Uploaded photos live on the API server's disk (`backend/uploads/`). On hosts with a temporary file system (Render, Railway, Heroku) mount a persistent volume there or add a cloud `STORAGE_DRIVER`, otherwise photos vanish on redeploy.
- Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM` (see *Email* above); without them customers get no order, status or password-reset emails. Card payments use Stripe **test mode**; to take real money, switch to live keys with `STRIPE_ALLOW_LIVE=true`, add the webhook endpoint in the Stripe dashboard, and remember Stripe needs a business in a supported country.
- Have the Privacy and Terms pages reviewed — they're plain-language templates.
