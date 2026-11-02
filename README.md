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
| **Quick view** | Eye icon on every product card opens a modal to pick a colour and add to cart without leaving the page |
| **Cart** | **Slide-out mini cart**, free-shipping progress bar, **coupon codes**, colour-variant stock limits |
| **Checkout** | Saved address pre-filled, COD / card / JazzCash-EasyPaisa (card & wallet are *simulated*), coupon + shipping totals calculated by the server, printable invoice |
| **Account** | Order history, cancel pending orders (stock is restored), detailed tracking link, profile & address book, change password |
| **Track order** | Public tracking page (order # + email) with a timestamped status timeline |
| **Help pages** | Contact form (saved to the DB), searchable FAQ / shipping & returns, About, Privacy, Terms, custom 404 |
| **Multi-currency** | 19 currencies with a side drawer; prices convert everywhere, orders are charged in USD |
| **Offline mode** | If the API isn't running, the catalogue and product pages fall back to a bundled demo catalogue |

### Admin portal (`/admin`)
- **Overview dashboard**: revenue/orders/AOV/customers, **daily revenue chart** (7/14/30 days, hover tooltips, table view), orders by status, top products, revenue by category, **low-stock alerts**, **contact inbox**
- Order management with status changes (stock is restored/re-deducted when cancelling/un-cancelling; COD orders are marked paid on delivery)
- Product catalogue CRUD with colour variants and sale prices
- Change admin username/password

### Backend
- One-command database setup with **schema, migrations and seed data**
- Server-side price, stock, shipping and **coupon** calculation inside a DB transaction
- Order **status history** table (powers tracking timelines)
- bcrypt password hashing, JWT auth for customers and admins (separate secrets)
- In-memory **rate limiting** on login, registration, password recovery and public forms
- Consistent JSON errors (404 for unknown routes, 400 for malformed JSON)

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
cp .env.example .env       # then edit DB_PASSWORD, JWT_SECRET and ADMIN_SECRET
```

### 3. Create the database (tables + demo data)
```bash
npm run db:setup           # inside backend/
```
This creates the database if needed, creates/upgrades every table, and — only when the `products` table is empty — seeds 20 products, reviews, coupons, a demo shopper and two weeks of demo orders (set `SEED_DEMO_ORDERS=false` to skip the orders).
Running it again is safe; it never deletes data. Existing databases from earlier versions are upgraded in place (missing columns are added).

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

---

## 🔑 Demo accounts & codes

| What | Value |
|---|---|
| Demo shopper | `demo@nova.store` / `Demo@1234` (or the *demo account* button on the login page) |
| Admin | `nova_admin` / `Nova@Admin#2024` — **change it** under *Security & Password* |
| Coupons | `WELCOME10` (10% off) · `SAVE15` ($15 off $100+) · `NOVA20` (20% off $150+) · `FREESHIP` |
| Test card | `4242 4242 4242 4242`, any future expiry, any CVC — payments are simulated |

> Password-reset codes are logged in the API console. In development they're also shown on screen so you can test the flow without email; with `NODE_ENV=production` they never leave the server.

---

## 🗂 Project structure
```text
ecommerce-website/
├── src/                      # Storefront (React)
│   ├── components/           # Navbar, ProductCard, CartDrawer, QuickViewModal, FlashSale, …
│   ├── context/              # Auth, Cart (incl. coupons), Wishlist, Currency, Toast
│   ├── lib/                  # catalog.ts (API + offline fallback), auth.ts, recentlyViewed.ts
│   ├── pages/                # Home, Products, ProductDetails, Cart, Checkout, Account, TrackOrder, …
│   └── data/products.ts      # Offline demo catalogue (mirrors the seed)
├── admin/
│   ├── frontend/             # Admin portal (Admin.tsx, AdminAnalytics.tsx, AdminLogin.tsx, …)
│   └── backend/              # Re-exports of backend/admin
└── backend/
    ├── server.js
    ├── config/               # db.js, secrets.js
    ├── database/             # schema.sql, migrate.js, seed.js, setup.js
    ├── middleware/           # authMiddleware.js, rateLimit.js
    ├── services/             # orderService.js (stock, coupons, status changes)
    ├── routes/               # auth, products, orders, store (coupons/newsletter/contact)
    └── admin/                # adminAuth, adminOrders, adminProducts, adminStats
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
| POST | `/api/orders` | user | Place order (server recalculates totals) |
| GET | `/api/orders/my-orders` | user | Order history |
| DELETE | `/api/orders/cancel/:id` | user | Cancel a pending order |
| GET | `/api/orders/track?orderId=&email=` | — | Public tracking |
| POST | `/api/coupons/validate` · GET `/api/coupons/public` | — | Coupons |
| GET | `/api/reviews/featured` | — | Homepage reviews |
| POST | `/api/newsletter` · `/api/contact` | — | Newsletter / contact form |
| POST | `/api/admin/login` | — | Admin sign in |
| GET | `/api/admin/stats?days=14` | admin | Dashboard analytics |
| GET / PATCH | `/api/admin/orders` · `/api/admin/orders/:id/status` | admin | Orders |
| POST / PUT / DELETE | `/api/products` · `/api/products/:id` | admin | Manage products |
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
- Change the default admin password.
- Connect a real email provider for password-reset codes (see `routes/auth.js`) and a real payment gateway (card/wallet payments are simulated).
- Have the Privacy and Terms pages reviewed — they're plain-language templates.
