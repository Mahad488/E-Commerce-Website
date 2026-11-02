# NOVA — Improvement Prompts for an AI Coding Assistant

Copy-paste prompts for Claude, Cursor, Copilot or any assistant that can read and edit this project.

## How to use these

1. **Give the assistant the project context once.** Save the *Project context* block below as `CLAUDE.md` (Claude Code), `AGENTS.md` or `.cursor/rules` in the project root, so every session reads it automatically. Or paste it at the start of a new chat.
2. **One prompt per session.** Paste a single task, let it finish, test it yourself, then commit before starting the next one (`git add . && git commit -m "..."`).
3. **Fill in the `[brackets]`** where a prompt asks you to choose something (email provider, hosting, etc.).
4. **Recommended order:** 0A → 0B (redesign, one page group per session) → 1 → 2 → 3 → 8 → 15 → 16 → 17, then whatever interests you. Doing the redesign first means every feature you add afterwards follows the new look.

---

## Project context (paste first, or save as CLAUDE.md / AGENTS.md)

```text
PROJECT: NOVA e-commerce store (portfolio project). Three parts:

1) Storefront — React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + react-router-dom v7 + lucide-react icons.
   - Pages: src/pages/*  · components: src/components/*  · helpers: src/lib/* (catalog.ts, auth.ts, recentlyViewed.ts)
   - State: src/context/* (AuthContext, CartContext incl. coupons + mini-cart drawer, WishlistContext, CurrencyContext, ToastContext)
   - API base URL: src/config/api.ts (VITE_API_URL, default http://localhost:5000)
   - Images go through getImageUrl()/imageFallbackHandler() in src/lib/catalog.ts (relative paths are prefixed with the API URL)
2) Admin portal — admin/frontend/* (Admin.tsx has tabs: overview, orders, products, add-product, settings;
   AdminAnalytics.tsx is the Overview tab). Admin JWT is stored in localStorage "nova_admin_token".
3) API — backend/* (Node + Express 5, CommonJS, mysql2/promise).
   - DB pool: backend/config/db.js · secrets: backend/config/secrets.js
   - Schema: backend/database/schema.sql (CREATE TABLE IF NOT EXISTS). New columns on existing tables
     go in COLUMN_UPGRADES in backend/database/migrate.js. Demo data: backend/database/seed.js.
     `npm run db:setup` creates/upgrades everything; the server also runs ensureSchema() on start.
   - Auth: middleware/authMiddleware.js exports verifyToken + optionalToken (customers);
     admin/adminAuth.js exports verifyAdmin. Rate limiter: middleware/rateLimit.js.
   - Order/stock/coupon logic lives in services/orderService.js (money is calculated in cents).
   - Routes: routes/auth.js, routes/products.js, routes/orders.js, routes/store.js (coupons, newsletter,
     contact, featured reviews), admin/* mounted at /api/admin.
   - Responses are JSON shaped like { success: boolean, message?: string, ...data }.

RULES
- Read the relevant files before changing them. Keep existing features working.
- Never trust prices, totals or stock sent by the client — the server recalculates.
- Schema changes must work on a fresh DB AND upgrade an existing one without data loss.
- Match the existing UI style: Tailwind utility classes, orange-500/600 accent, gray-950 dark surfaces,
  rounded-2xl/3xl cards, lucide-react icons, toasts via useToast(), prices via useCurrency().formatPrice().
  Once docs/DESIGN.md exists (prompt 0A), follow it instead: its tokens, components and motion rules win.
- No `any` in TypeScript. Keep components small; put shared logic in src/lib.
- Don't add a dependency if a few lines of code will do; if you add one, say why.

DEFINITION OF DONE (every task)
- `npx tsc -b`, `npm run lint` and `npm run build` pass in the project root.
- Backend starts with `cd backend && npm run dev` with no errors.
- README.md updated (features, setup steps, new env vars, new endpoints).
- Finish with a short summary: files changed, how to test it manually, anything left to do.
```

---

# Phase 0 — Make it animated and gorgeous

Two prompts. **0A** sets the design direction and builds the animation foundation (one session, and you approve the plan before any code changes). **0B** applies it to the pages, one page group per session.

## 0A. Design direction + motion foundation

```text
TASK: Give the NOVA storefront a gorgeous, memorable, animated frontend. You have full permission to
redesign the frontend of EVERY page (storefront and admin portal): layout, typography, colour, components
and motion. You may NOT change backend behaviour, API calls, routes, data or business logic — every
existing feature must keep working exactly as it does now.

THE BRIEF
- NOVA is a curated lifestyle store (fashion, footwear, accessories, electronics, lifestyle, gaming & tech)
  for young shoppers in Pakistan who mostly browse on their phones. The site should feel premium, playful
  and alive: the kind of store people screenshot and share, not a template.
- "Animated" means motion that makes shopping feel responsive and fun: things react to what the shopper
  does (add to cart, favourite, filter, open, confirm). It does NOT mean every section fading up on scroll.

STEP 1 — AUDIT (no code changes)
- Run the app, visit every route in src/App.tsx (desktop 1366px and mobile 390px), and list what feels
  generic, cluttered or inconsistent on each page.

STEP 2 — DESIGN PLAN (no code changes; show it to me and WAIT for my approval)
Write docs/DESIGN.md containing:
- Concept: one or two sentences on the visual idea and why it fits NOVA's products and shoppers.
- Colour: 4–6 named hex tokens (background, surface, ink, muted ink, accent, one supporting colour) plus
  status colours (success/warning/error) that pass WCAG AA contrast for text.
- Type: one or two typefaces chosen deliberately for this brand (not the defaults you'd use anywhere),
  with roles and a type scale (sizes, weights, line-heights, letter-spacing).
- Layout: grid, spacing scale, radius scale (different radii for different levels of hierarchy, not one
  radius on everything), elevation/shadow rules. Include ASCII wireframes for Home, Shop and Product page.
- Motion system: durations, easings/springs, and a short list of named motions (see STEP 4) with what
  user action each one answers. Choose ONE signature moment for the site (e.g. the hero, or the
  add-to-cart animation) and make that the boldest thing; keep everything else calm.
- Avoid these generic looks unless you can justify them for NOVA: cream background with terracotta accent;
  black background with one neon accent; identical rounded cards with the same soft shadow everywhere;
  gradient washes as decoration; an ALL-CAPS label above every heading; one word in a headline coloured
  differently; fade-and-slide-up on every section; "→" on every button.
- Then review your own plan: what would you have produced for ANY e-commerce site? Change those parts
  and tell me what you changed and why.

STEP 3 — FOUNDATION (after I approve)
- Tokens in src/index.css using Tailwind v4 @theme (colours, fonts, radii, shadows, easing, durations)
  and the same tokens in admin/frontend/src/index.css. Load the chosen fonts with font-display: swap.
- Install `motion` (import from "motion/react"). Wrap the app in <MotionConfig reducedMotion="user">
  and use LazyMotion + the `m` component to keep the bundle small.
- Build reusable primitives in src/components/motion/: PageTransition (route change animation using
  AnimatePresence keyed by location), Reveal (used sparingly), AnimatedNumber (count/roll for prices,
  totals, counters), Stagger (for grids), Pressable (tap/press feedback for buttons), and a
  useFlyToCart() hook that animates a product thumbnail from where it was clicked into the navbar cart icon.
- Restyle the shared building blocks first: Navbar, Footer, ProductCard, buttons, inputs, badges,
  CartDrawer, QuickViewModal, Toast, skeleton loaders, empty states.

STEP 4 — MOTION LIST (implement in the foundation, then use in 0B)
- Route change: quick cross-fade/slide between pages; scroll restores to top.
- Product card → product page: shared-element transition of the product image (motion layoutId).
- Add to cart: thumbnail flies into the cart icon, the badge pops, the mini-cart drawer springs open.
- Favourite: heart burst; wishlist count pops.
- Filters/sort on the shop page: the grid reflows with layout animation instead of jumping.
- Price and cart totals: numbers roll when they change (quantity, coupon applied, currency switch).
- Drawers and modals: spring in, backdrop fades, focus is trapped and returned on close.
- Hover on desktop only (no hover-only features on touch): product card swaps to the next colour's image.
- Loading: shimmer skeletons that match the final layout (no layout shift when content arrives).
- Success moments: order placed (checkmark draws + a short, tasteful confetti burst), coupon applied,
  message sent, review submitted.

QUALITY BAR (non-negotiable)
- Respect prefers-reduced-motion: no movement, only instant or opacity changes.
- Animate only transform and opacity; 60fps on a mid-range phone; no scroll-jacking or smooth-scroll libraries.
- Lighthouse mobile ≥ 90 for Performance and Accessibility; CLS < 0.1.
- Visible keyboard focus everywhere, aria-labels kept, colour contrast AA.
- Works from 360px to 1920px wide with no horizontal scrolling.
- `npx tsc -b`, `npm run lint`, `npm run build` pass. Take before/after screenshots (desktop + mobile)
  of every page you touch and show them to me.
```

## 0B. Redesign the pages (run once per group below)

```text
TASK: Apply the design system and motion primitives from docs/DESIGN.md (built in prompt 0A) to
[PAGE GROUP — pick one from the list below]. You have full permission to change layout, styling, copy
and animation on these pages. Do not change API calls, routes, data, validation or business logic.

Rules
- Read docs/DESIGN.md first and follow it exactly. Use the shared primitives in src/components/motion/
  instead of writing one-off animations.
- One signature moment per page at most; everything else stays calm and fast.
- Copy: plain, specific, active voice, sentence case. Buttons say exactly what happens
  ("Add to cart", "Place order"), errors say what went wrong and how to fix it.
- Keep every existing feature on the page working (check the list for that page below).
- Before/after screenshots at 390px and 1366px, then tsc + lint + build.

PAGE GROUPS (one per session)
1. Home (src/pages/Home.tsx + Hero, TrustBar, Categories, FlashSale, FeaturedProducts, CustomerReviews,
   PromoBanner, RecentlyViewed): make the hero the site's signature moment — an orchestrated page-load
   sequence built from real products, not a stock photo with stats. Flash-sale digits flip. Featured tabs
   slide an indicator and cross-fade the grid. Keep: live coupons, featured reviews, flash-sale countdown.
2. Shop + Categories (Products.tsx, CategoriesPage.tsx): animated filter chips, grid layout animation on
   filter/sort, price slider with live count, sticky filter bar on mobile as a bottom sheet.
   Keep: every URL filter param, Load more, offline banner.
3. Product page (ProductDetails.tsx, QuickViewModal.tsx): shared-element image transition from the card,
   swipeable gallery with zoom, colour change cross-fades the image, sticky "Add to cart" bar on mobile,
   rating bars fill when scrolled into view, fly-to-cart. Keep: stock per colour, Buy it now, share,
   reviews, related, recently viewed.
4. Cart + mini cart + Checkout (Cart.tsx, CartDrawer.tsx, CouponBox.tsx, Checkout.tsx,
   OrderInvoiceModal.tsx): items collapse smoothly when removed, totals roll, free-shipping bar fills with a
   small celebration at 100%, checkout as clear steps (Address → Payment → Review) with a progress
   indicator, payment options morph between forms, success screen animation. Keep: coupon rules,
   server-calculated totals, wallet OTP modal, invoice printing, login redirect.
5. Account + Track order (Account.tsx, TrackOrder.tsx): tab indicator slides, stat numbers count up once,
   order timeline draws up to the current step, cancelled orders clearly marked.
   Keep: cancel order, invoice, profile and password forms.
6. Auth (Login.tsx, Register.tsx): a visual side panel that matches the new brand, inputs with animated
   focus/validation states, password-strength meter, smooth password-recovery steps.
   Keep: demo account button, redirect back to checkout, recovery flow.
7. Content pages (Contact, Faq, About, Legal, NotFound, Wishlist): FAQ accordion height animation,
   contact form success state, a playful 404. Keep: FAQ search, contact API, wishlist move-to-cart.
8. Admin portal (admin/frontend/*: AdminLogin, Admin, AdminAnalytics, AdminPortalData): same design
   tokens with a calmer, denser "workspace" feel — chart bars grow once on load, numbers count up,
   tables get sticky headers, status changes animate the pill. Keep every admin action working.
```

---

# Phase 1 — Make the "fake" parts real

## 1. Coupon manager in the admin portal

```text
TASK: Add a coupon manager to the admin portal so the admin can create, edit, pause and delete coupons
from the UI. Today coupons only exist in the database/seed (table `coupons`).

BACKEND
- New router backend/admin/adminCoupons.js mounted at /api/admin/coupons (protected by verifyAdmin):
  GET / (list, newest first, include used_count), POST / (create), PUT /:id (update),
  PATCH /:id/active (toggle active), DELETE /:id.
- Validate: code is 3–30 chars, A–Z/0–9 only, stored uppercase and unique (409 if taken);
  discount_type is percent|fixed|shipping; percent value 1–90; fixed value > 0; shipping value 0;
  min_order >= 0; usage_limit empty or a positive integer; expires_at empty or a future date.
- Reuse the existing table columns (code, description, discount_type, discount_value, min_order,
  usage_limit, used_count, expires_at, active). No new columns needed.

FRONTEND (admin/frontend)
- New component AdminCoupons.tsx and a "Coupons" tab in Admin.tsx (Tag icon).
- Table: code, description, type/value (e.g. "20%", "$15 off", "Free shipping"), min order,
  usage "used / limit", expiry, status pill (Active / Paused / Expired / Used up), actions.
- Create/edit form in a modal with live preview text ("20% off orders over $150, 100 uses, ends Dec 31").
- Confirm before delete. Toast on success/error.

ACCEPTANCE
- A coupon created in the admin works immediately in the storefront cart and checkout.
- Pausing a coupon makes /api/coupons/validate reject it with a clear message.
- Expired and used-up coupons stop appearing in /api/coupons/public (the homepage coupon strip).
```

## 2. Product image upload (instead of pasting URLs)

```text
TASK: Let the admin upload product images (main image and one per colour variant) instead of pasting URLs.

BACKEND
- Add multer. New route POST /api/admin/uploads (verifyAdmin) accepting one image field "image".
- Accept only image/jpeg, image/png, image/webp, max 3 MB. Rename to a random UUID + extension.
- Save to backend/uploads/products/ (server.js already serves /uploads statically) and return
  { success: true, url: "/uploads/products/<file>" }.
- Add backend/uploads/ to .gitignore (keep an empty .gitkeep).
- Make the storage layer swappable: put save logic in backend/services/storage.js with a
  "local" driver now, so a Cloudinary or S3 driver can be added later via STORAGE_DRIVER env var.

FRONTEND (admin/frontend/Admin.tsx — add-product and edit-product forms)
- Replace the image URL inputs with a drag-and-drop upload box (click to choose, preview thumbnail,
  progress/spinner, "Remove" button). Keep a small "or paste a URL" link for existing products.
- Same uploader for each colour variant's image.
- Storefront already renders relative paths through getImageUrl() in src/lib/catalog.ts — verify
  uploaded images show on product cards, product page, cart and invoices.

ACCEPTANCE
- Uploading a 5 MB file or a .pdf shows a clear error and nothing is saved.
- A new product created with uploaded images displays correctly everywhere in the storefront.
```

## 3. Real emails (password reset, order confirmation, shipping updates)

```text
TASK: Send real emails. Today password-reset codes are only logged / shown on screen in dev mode.
Provider: [Brevo SMTP / Resend / Gmail SMTP with an app password] using Nodemailer.

BACKEND
- backend/services/email.js: createTransport from env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
  MAIL_FROM). If SMTP isn't configured, log the email to the console instead (dev fallback).
- Simple HTML templates (inline styles, NOVA logo text, orange accent) + plain-text versions in
  backend/emails/: passwordReset, orderConfirmation (items, totals, address, tracking link),
  orderStatusChanged (Processing / Shipped / Delivered / Cancelled), contactAutoReply.
- Hook them in: routes/auth.js forgot-password; routes/orders.js after a successful order commit;
  services/orderService.js changeOrderStatus() after commit; routes/store.js contact form.
- Email sending must never break the request: send after the DB commit, catch and log failures.
- Keep the dev-only on-screen reset code exactly as it is when NODE_ENV !== "production".
- Add the new variables to backend/.env.example with comments.

ACCEPTANCE
- With SMTP configured, placing an order sends a confirmation with a working
  /track-order?orderId=..&email=.. link; changing status in the admin emails the customer.
- With SMTP not configured, everything still works and emails are printed to the console.
```

## 4. Real payment sandbox with a webhook

```text
TASK: Replace the simulated card/wallet payment with a real sandbox integration of [JazzCash / Easypaisa /
Safepay — choose one]. Read the provider's official developer docs first and follow them exactly.

FLOW
1. Checkout creates the order as status "Pending", payment_status "Awaiting payment" (stock reserved).
2. Backend creates a payment session with the provider and returns the redirect/checkout URL.
3. Customer pays on the provider's page and returns to /checkout/result?orderId=...
4. The provider calls our webhook POST /api/payments/webhook. We VERIFY THE SIGNATURE/HASH,
   check the amount and currency match the order, then set payment_status "Paid" and status
   "Processing" using a transaction, and record it in order_status_history.
5. If payment fails or expires (e.g. after 30 minutes), cancel the order via changeOrderStatus()
   so stock is restored.

REQUIREMENTS
- New table payments (id, order_id, provider, provider_ref, amount, currency, status, raw_payload JSON,
  created_at, updated_at) in schema.sql.
- Webhook must be idempotent (same event twice = no double update) and must never trust the browser redirect.
- Keys from env only (PAYMENT_PROVIDER, PAYMENT_MERCHANT_ID, PAYMENT_SECRET, PAYMENT_SANDBOX=true).
- Keep Cash on Delivery working as it does now.
- Remove the "payments are simulated" notice only for the provider you integrated.
- Document how to test with the provider's sandbox credentials in README.

ACCEPTANCE
- A sandbox payment marks the order Paid via the webhook even if the customer closes the tab.
- A forged webhook (bad signature or wrong amount) is rejected with 400 and logged.
```

## 5. Replace the made-up hero numbers with real stats

```text
TASK: src/components/Hero.tsx shows hard-coded marketing numbers ("10K+ Happy Clients", "500+ Products Live",
"4.9 Top Rating", "(1,240+ reviews)", "Up to 40% Off"). Replace them with real data.

- Add GET /api/stats/public in routes/store.js returning { customers, products, averageRating,
  reviewCount, maxDiscountPercent } (cached in memory for 5 minutes).
- Hero fetches it once; show compact numbers (1.2K), hide any stat that is 0, and keep a skeleton while loading.
- If the API is down, hide the stats row instead of showing fake numbers.
```

## 6. Save the wishlist to the database

```text
TASK: The wishlist lives only in localStorage ("nova_wishlist"). Sync it to the database for signed-in users.

- Table wishlists (user_id, product_id, created_at, PRIMARY KEY(user_id, product_id)).
- Routes (verifyToken): GET /api/wishlist (products with the same shape as /api/products),
  POST /api/wishlist/:productId, DELETE /api/wishlist/:productId, POST /api/wishlist/merge { productIds }.
- WishlistContext: guests keep using localStorage. On login, merge the local list into the server and
  clear local storage. When signed in, toggles call the API optimistically and roll back on error.
- Show "Saved to your account" vs "Saved on this device" in the toast.

ACCEPTANCE: wishlist survives logout/login and appears on another browser for the same account.
```

## 7. Live exchange rates

```text
TASK: Exchange rates are hard-coded in src/context/CurrencyContext.tsx (CURRENCIES[].rate).
Fetch live USD rates instead, with the hard-coded values as fallback.

- Backend GET /api/currency/rates: fetch from [a free exchange-rate API of your choice] at most once
  every 12 hours, cache in memory (and in a small table so restarts don't refetch), return
  { base: "USD", updatedAt, rates: { PKR: 278.5, ... } } for the currencies we support.
- CurrencyContext loads rates on startup and merges them into CURRENCIES; if the call fails, keep current values.
- CurrencySidebar shows "Rates updated <time ago>".
- Orders are still charged in USD — don't change checkout maths.
```

---

# Phase 2 — Code quality

## 8. Automated tests (API + browser)

```text
TASK: Add an automated test suite.

BACKEND (Jest + Supertest)
- Refactor so tests can import the app without listening: move app setup from backend/server.js into
  backend/app.js (export app); server.js only calls app.listen + ensureSchema/seed.
- Tests use a separate database (DB_NAME=nova_test from backend/.env.test). A global setup drops and
  recreates it with ensureSchema + seedIfEmpty before the run.
- Cover at least: auth (register, login, wrong password, profile), products (list, sort, onSale, category,
  404, related, reviews breakdown), coupons (valid, min order, invalid), orders (place order with coupon,
  server-side totals incl. $10 shipping under $100, stock + colour-variant stock decrement, insufficient
  stock 409, cancel restores stock, cannot cancel twice, tracking needs the right email), admin (login,
  stats, invalid status 400, cancel/un-cancel stock), newsletter, contact, password reset single-use code.
- Script: "test": "jest --runInBand" in backend/package.json.

FRONTEND (Playwright e2e)
- tests/e2e/*.spec.ts with a config that starts the API (test DB) and Vite.
- Flows: browse → filter → quick view → add to cart; apply coupon; guest checkout redirects to login and
  back; place COD order; track it; cancel from account; admin login → overview chart renders.
- Script in root package.json: "test:e2e".

ACCEPTANCE: `cd backend && npm test` and `npm run test:e2e` both pass from a clean database.
```

## 9. Split the giant files into components

```text
TASK: Refactor without changing behaviour or appearance. These files are too large:
admin/frontend/Admin.tsx (~140 KB), src/pages/Account.tsx (~60 KB), src/pages/Checkout.tsx (~50 KB),
src/pages/Login.tsx (~40 KB).

- Admin.tsx → admin/frontend/tabs/{OrdersTab,ProductsTab,ProductForm,SettingsTab}.tsx,
  admin/frontend/components/{OrderDetailsModal,StatusSelect,...}.tsx, admin/frontend/hooks/useAdminData.ts.
- Account.tsx → src/pages/account/{OrdersPanel,OrderCard,OrderDetailsModal,PasswordPanel,ProfilePanel}.tsx.
- Checkout.tsx → src/pages/checkout/{ShippingForm,PaymentMethods,CardForm,WalletOtpModal,OrderSummary,OrderSuccess}.tsx.
- Login.tsx → move the password-recovery modal into its own component.
- Shared types go in src/types/ (Order, OrderItem, Product...) instead of being redefined per file.
- Work file by file; after each file run tsc + lint and click through that page to confirm nothing changed.
- No file should end up larger than ~400 lines.
```

## 10. TanStack Query for data fetching

```text
TASK: Replace hand-written fetch + useState + useEffect loading code with TanStack Query (@tanstack/react-query).

- Add a QueryClientProvider in src/App.tsx and admin/frontend/src/App.tsx.
- Create src/lib/api.ts: a typed fetch wrapper (base URL, JSON, Authorization header from AuthContext,
  throws an ApiError with status + message) and query hooks: useProducts, useProduct(id),
  useRelatedProducts(id), useReviews(id), useMyOrders, useProfile, useTrackOrder, useAdminStats(days), useAdminOrders.
- Mutations with cache invalidation: placeOrder, cancelOrder, addReview, updateProfile, updateOrderStatus,
  create/update/delete product.
- Keep the offline catalogue fallback in src/lib/catalog.ts working.
- Remove the now-unused manual loading/error state. Behaviour and UI must stay the same.
```

## 11. Shared validation with Zod

```text
TASK: Use Zod schemas to validate request bodies on the backend and forms on the frontend.

- backend/validation/*.js: schemas for register, login, profile update, change/reset password, place order,
  review, contact, newsletter, product create/update, coupon. A middleware validate(schema) returns
  400 { success:false, message, errors: { field: message } }.
- Replace the hand-written checks in the routes with these schemas (keep the same error wording where possible).
- Frontend: matching schemas in src/lib/validation.ts used by Register, Login, Checkout, Contact and the
  admin product form to show inline field errors before submitting.
- Add tests for at least three invalid payloads per schema.
```

## 12. Safer auth: httpOnly cookies + refresh tokens

```text
TASK: Stop storing JWTs in localStorage (readable by any injected script). Use httpOnly cookies.

- Login/register set two cookies: access token (15 min) and refresh token (7 days), both httpOnly,
  sameSite=lax, secure in production. Store refresh tokens hashed in a refresh_tokens table
  (user_id, token_hash, expires_at, revoked_at) so logout and password change can revoke them.
- POST /api/auth/refresh rotates the refresh token. POST /api/auth/logout clears cookies and revokes.
- verifyToken reads the cookie (keep Bearer header support temporarily for the admin).
- CORS: credentials: true with the CLIENT_URL allow-list. Add CSRF protection for state-changing
  requests (double-submit token or SameSite + Origin check — explain your choice).
- Frontend: fetch with credentials: "include"; AuthContext keeps only the user object, calls /api/auth/me
  on load, and retries once after /refresh on a 401.
- Do the same for the admin portal (separate cookie names).
```

## 13. Server-side pagination, filtering and sorting

```text
TASK: GET /api/products returns every product and src/pages/Products.tsx filters in the browser.
Move filtering to the server.

- Extend GET /api/products with: page, limit (max 48), search, category, minPrice, maxPrice, minRating,
  inStock, onSale, sort (latest|popular|price_asc|price_desc|rating|discount|name).
  Response: { products, total, page, totalPages, facets: { categories: [{name,count}], priceRange: {min,max} } }.
- All filters use parameterised SQL. Add indexes for price, rating, created_at.
- Products.tsx keeps all filter state in the URL (as now) but requests one page at a time; "Load more"
  appends the next page. Category counts come from facets.
- Keep the offline fallback working (filter the bundled catalogue client-side when the API is down).
```

## 14. Admin roles and activity log

```text
TASK: Add roles to the admin portal and record who changed what.

- admins table: add role ENUM('owner','manager','support') DEFAULT 'owner' (via COLUMN_UPGRADES).
  Owner: everything incl. managing admins. Manager: products, orders, coupons. Support: view orders,
  change order status, read contact messages.
- Middleware requireRole(...roles) used on admin routes. Include role in the admin JWT.
- "Team" tab (owner only): list/create/disable admins, reset their password.
- Table admin_activity (admin_id, action, entity, entity_id, details JSON, created_at). Log product
  create/update/delete, order status changes, coupon changes, admin changes. "Activity" tab with filters.
- Hide UI the current role can't use, and enforce it on the server too.
```

---

# Phase 3 — Cloud & DevOps (career skills)

## 15. Docker Compose for the whole stack

```text
TASK: Run the entire project with one command: `docker compose up --build`.

- backend/Dockerfile: node:22-alpine, npm ci --omit=dev, non-root user, HEALTHCHECK on /api/health.
- Dockerfile (root) for the storefront: multi-stage — build with Vite (VITE_API_URL as a build arg),
  serve dist with nginx, SPA fallback (try_files ... /index.html).
- docker-compose.yml: mysql:8 (named volume, healthcheck), api (depends_on mysql healthy, runs
  `npm run db:setup` then `node server.js`), web (nginx, port 8080), optional admin app.
- .dockerignore files (node_modules, dist, .env, uploads).
- .env.docker.example with every variable. Uploaded images stored in a named volume.
- README section "Run with Docker".

ACCEPTANCE: on a machine with only Docker installed, `docker compose up --build` gives a working store at
http://localhost:8080 with demo data, and data survives `docker compose down` / `up`.
```

## 16. GitHub Actions CI

```text
TASK: Add .github/workflows/ci.yml that runs on every push and pull request to main.

Jobs:
1. frontend: Node 22, npm ci, npx tsc -b, npm run lint, npm run build. Cache npm.
2. backend: Node 22 with a MySQL 8 service container, npm ci in backend, run `npm test`
   (needs task 8) against the service DB.
3. e2e (optional, after the two above): start MySQL + API + Vite preview, run Playwright, upload the
   HTML report as an artifact on failure.

Also add a CI status badge to README.md. Fail fast on lint/type errors.
```

## 17. Deploy it live

```text
TASK: Prepare the project for production and deploy it. Hosting: [Vercel for the storefront +
Render/Railway for the API + a managed MySQL]  OR  [AWS: S3 + CloudFront for the storefront,
EC2 or ECS for the API, RDS MySQL]. Walk me through each step and make the code changes needed.

CODE CHANGES
- Storefront: vercel.json (or CloudFront config) with an SPA rewrite to /index.html so routes like
  /products/3 work on refresh. VITE_API_URL set per environment.
- API: trust proxy, NODE_ENV=production, CLIENT_URL CORS allow-list, helmet security headers,
  compression, request logging, graceful shutdown (close the DB pool on SIGTERM).
- Uploaded images: switch the storage driver (task 2) to Cloudinary or S3 — server disks on most
  hosts are wiped on redeploy.
- Production checklist in README: strong JWT_SECRET/ADMIN_SECRET, changed admin password,
  SEED_DEMO_ORDERS=false if you don't want demo orders, email configured, HTTPS only.

ACCEPTANCE: public URLs for the store and admin; register, order, track and admin status changes all
work in production. Add the live link and screenshots to the top of README.md.
```

## 18. Redis for rate limiting and caching

```text
TASK: The rate limiter in backend/middleware/rateLimit.js stores counts in memory, which breaks with
more than one server instance. Add Redis (optional — fall back to memory when REDIS_URL isn't set).

- backend/config/redis.js with ioredis, connected only if REDIS_URL exists.
- rateLimit.js: same function signature; use Redis INCR + EXPIRE when available.
- Cache GET /api/products (60 s), /api/products/categories (5 min), /api/coupons/public (60 s)
  and /api/reviews/featured (5 min). Invalidate on product/coupon/review changes.
- Add a redis service to docker-compose.yml (task 15).
```

## 19. Error monitoring and logging

```text
TASK: Add production monitoring.

- Sentry: @sentry/react in src/main.tsx and admin/frontend/src/main.tsx (DSN from VITE_SENTRY_DSN,
  disabled when empty), @sentry/node in the API with Express error handling. Tag user id (not email).
- Replace console.log in the API with a small logger (pino) that outputs JSON in production and pretty
  logs in development; add a request id to every request and include it in error responses.
- /api/health also reports DB latency and app version (from package.json).
- Document how to set up a free uptime monitor that pings /api/health.
```

---

# Phase 4 — Features that make it feel like a real store

## 20. Sizes and a multi-image gallery

```text
TASK: Products only have colour variants. Add sizes and multiple images.

- Table product_images (id, product_id, url, alt, sort_order, color_name NULL).
- Table product_variants (id, product_id, color_name, size, sku, stock) replacing per-colour quantity in
  the products.colors JSON. Write a migration that converts existing colours into variants (size "One size").
  products.stock becomes the sum of variant stock.
- Order items store variant_id, size and color. Stock checks/decrements in services/orderService.js use variants.
- Product page: image gallery with thumbnails, swipe on mobile, keyboard arrows; colour + size pickers
  (sold-out sizes crossed out); size guide modal for Fashion/Footwear.
- Cart lines are unique per variant. Admin product form manages images (drag to reorder) and a
  colour × size stock grid.
```

## 21. Better search

```text
TASK: Improve product search (navbar autocomplete and the shop page).

Option A (no new service): MySQL FULLTEXT index on products(name, description, category) and
MATCH ... AGAINST in BOOLEAN MODE with prefix matching; fall back to LIKE for 1–2 letter queries.
Option B (typo-tolerant): Meilisearch running in Docker, synced when products change.
Pick [A / B].

Either way:
- GET /api/search?q= returns products, matching categories and "did you mean" suggestions.
- Navbar dropdown: keyboard navigation (↑ ↓ Enter Esc), highlighted matching text, recent searches
  (localStorage), "no results" with popular products.
- Log searches with zero results to a table and show the top ones in the admin overview.
```

## 22. Back-in-stock alerts and abandoned-cart reminders

```text
TASK: Two automated emails (needs task 3).

1. Back in stock: on a sold-out product/colour, show "Notify me" (email input, prefilled when signed in).
   Table stock_alerts (email, product_id, color, created_at, notified_at). When stock goes from 0 to >0
   (admin edit or cancelled order), email everyone waiting and mark them notified.
2. Abandoned cart: for signed-in users, save the cart server-side (table carts). A scheduled job
   (node-cron, every hour) emails users whose cart has been untouched for 24 hours and who haven't
   ordered since, once per cart, with a link that restores the cart and an optional coupon code.
- Unsubscribe link in every marketing email (store the preference on users).
```

## 23. Admin reports and CSV export

```text
TASK: Add a "Reports" tab to the admin portal.

- Date range picker (presets: today, 7 days, 30 days, this month, custom).
- Backend GET /api/admin/reports?from=&to= returning revenue, orders, average order value, discounts,
  revenue by day, by category, by payment method, top products, top customers, coupon usage,
  cancellation rate — all compared with the previous period (show +/- %).
- CSV export buttons: orders (with items), products/stock, customers, newsletter subscribers.
  Stream CSV from the server (GET /api/admin/export/:type?from=&to=), escape values properly.
- Charts follow the existing AdminAnalytics.tsx style (single orange series, hover tooltips, table view).
```

## 24. SEO and link previews

```text
TASK: Make product pages look good on Google and when shared on WhatsApp/Facebook.

- Per-page <title> and <meta name="description"> (React 19 hoists <title>/<meta> rendered inside
  components — use that, no extra library). Product pages: "<name> – <price> | NOVA".
- Crawlers that share links don't run JavaScript, so add an Express route (or a hosting edge function)
  that serves index.html with Open Graph/Twitter tags filled in for /products/:id
  (og:title, og:description, og:image, og:price).
- JSON-LD Product schema (name, image, offers, aggregateRating) on product pages.
- GET /sitemap.xml and /robots.txt generated from the products table.
- Canonical URLs; noindex on /cart, /checkout, /account, /admin*.
```

## 25. Urdu language (RTL) and dark mode

```text
TASK: Add an Urdu/English language switch and a dark mode.

LANGUAGE
- react-i18next with src/locales/en.json and src/locales/ur.json. Move all UI strings out of components
  (product data stays as-is). Language switch in the navbar and the currency drawer, saved in localStorage.
- When Urdu is active set <html lang="ur" dir="rtl">. Replace left/right utilities with logical ones
  (ms-/me-, ps-/pe-, start-/end-) and use the rtl: variant where needed. Use an Urdu-friendly font
  (e.g. Noto Nastaliq Urdu) only for Urdu.
- Format numbers/dates with Intl using the active locale.

DARK MODE
- Tailwind v4: add `@custom-variant dark (&:where(.dark, .dark *));` in src/index.css and toggle a
  `dark` class on <html> (system preference by default, manual toggle in the navbar, saved).
- Add dark: styles for surfaces, text, borders, cards, inputs, drawer, modals, footer. Check contrast.
```

## 26. Performance and Lighthouse

```text
TASK: Get Lighthouse (mobile) to 90+ for Performance, Accessibility, Best Practices and SEO on the
home page, shop page and a product page. Report the before/after scores.

- Images: width/height attributes to prevent layout shift; responsive srcset/sizes (Unsplash supports
  ?w=); WebP for uploaded images (generate with sharp on upload); lazy-load below the fold; preload the
  hero image.
- Fonts: preconnect + font-display: swap; only load the weights actually used.
- JS: check the bundle (rollup-plugin-visualizer); lazy-load heavy components (QuickViewModal,
  CurrencySidebar, OrderInvoiceModal); make sure lucide-react icons are tree-shaken.
- Accessibility: every icon-only button has aria-label, focus rings visible, modals trap focus and
  restore it on close, colour contrast passes.
- Add `npm run lighthouse` using @lhci/cli with budgets so CI (task 16) can catch regressions.
```
