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
| **Checkout** | Saved address pre-filled, COD / card / JazzCash-EasyPaisa (card & wallet are *simulated*), coupon + shipping totals calculated by the server, printable invoice |
| **Account** | Order history, cancel pending orders (stock is restored), detailed tracking link, profile & address book, change password |
| **Track order** | Public tracking page (order # + email) with a timestamped status timeline |
| **Help pages** | Contact form (saved to the DB), searchable FAQ / shipping & returns, About, Privacy, Terms, custom 404 |
| **Multi-currency** | 19 currencies with a side drawer; prices convert everywhere, orders are charged in USD |
| **Offline mode** | If the API isn't running, the catalogue and product pages fall back to a bundled demo catalogue |
| **Design & motion** | NOVA's own design system ([docs/DESIGN.md](docs/DESIGN.md)): Mona Sans, a night-sky brand layer with a nova glow, and motion that answers the shopper. Add to cart flies the photo into the bag with a burst, hearts spark, prices and totals roll, drawers and sheets spring in with focus trapped, pages cross-fade. Everything respects *reduce motion* |

### Admin portal (`/admin`)
- **Overview dashboard**: revenue/orders/AOV/customers, **daily revenue chart** (7/14/30 days, hover tooltips, table view), orders by status, top products, revenue by category, **low-stock alerts**, **contact inbox**
- Order management with status changes (stock is restored/re-deducted when cancelling/un-cancelling; COD orders are marked paid on delivery)
- Product catalogue CRUD with colour variants and sale prices
- **Photo uploads**: drag and drop (or pick) a JPEG, PNG or WebP up to 3 MB for the main photo and for each colour, with a preview, upload progress, Change / Remove, and an *Or paste image URL instead* option. Saving waits for any upload still running
- Change admin username/password

### Backend
- One-command database setup with **schema, migrations and seed data**
- Server-side price, stock, shipping and **coupon** calculation inside a DB transaction
- Order **status history** table (powers tracking timelines)
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

### Product photos
Photos uploaded in the admin are saved to `backend/uploads/products/` and stored on the product as a relative path such as `/uploads/products/<uuid>.webp`. The storefront turns that into a full URL with `getImageUrl()` (prefixing `VITE_API_URL`). The folder is git-ignored except for its `.gitkeep`, so back it up (or switch to cloud storage) when you deploy.

| Variable | Default | Meaning |
|---|---|---|
| `STORAGE_DRIVER` | `local` | Where uploaded images go. Only `local` exists today; add a Cloudinary or S3 driver in `backend/services/storage.js` (a driver saves the file and returns its public URL) |

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
│   ├── frontend/             # Admin portal (Admin.tsx, AdminAnalytics.tsx, AdminLogin.tsx, …)
│   └── backend/              # Re-exports of backend/admin
└── backend/
    ├── server.js
    ├── config/               # db.js, secrets.js
    ├── database/             # schema.sql, migrate.js, seed.js, setup.js
    ├── middleware/           # authMiddleware.js, rateLimit.js
    ├── services/             # orderService.js (stock, coupons, status changes), storage.js (image uploads)
    ├── uploads/products/     # Uploaded product photos (git-ignored)
    ├── routes/               # auth, products, orders, store (coupons/newsletter/contact)
    └── admin/                # adminAuth, adminOrders, adminProducts, adminStats, adminUploads
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
- Change the default admin password.
- Uploaded photos live on the API server's disk (`backend/uploads/`). On hosts with a temporary file system (Render, Railway, Heroku) mount a persistent volume there or add a cloud `STORAGE_DRIVER`, otherwise photos vanish on redeploy.
- Connect a real email provider for password-reset codes (see `routes/auth.js`) and a real payment gateway (card/wallet payments are simulated).
- Have the Privacy and Terms pages reviewed — they're plain-language templates.
