# 🚀 NOVA Store — Remaining Tasks & Prompts (Frontend + Backend)

Yeh file un tamam bache hue kaamo ke mukammal aur ready-to-use prompts par mushtamil hai jo is project ko 100% production-ready banane ke liye zaroori hain. 

Aap kisi bhi AI Assistant (jaise Antigravity, Claude, ChatGPT, ya Cursor) ko yahan se ek waqt mein **ek prompt** copy karke de sakte hain aur kaam mukammal karwa sakte hain.

---

## 📌 Index / Fihrist

1. [Prompt 1: Product Image Upload System (Frontend + Backend)](#-prompt-1-product-image-upload-system-frontend--backend)
2. [Prompt 2: Admin Coupon Manager (Frontend + Backend)](#-prompt-2-admin-coupon-manager-frontend--backend)
3. [Prompt 3: Real Email Notification System (Frontend + Backend)](#-prompt-3-real-email-notification-system-frontend--backend)
4. [Prompt 4: Real Payment Gateway Sandbox (Frontend + Backend)](#-prompt-4-real-payment-gateway-sandbox-frontend--backend)
5. [Prompt 5: Database-Synced Wishlist (Frontend + Backend)](#-prompt-5-database-synced-wishlist-frontend--backend)
6. [Prompt 6: Production Build & Live Deployment Setup](#-prompt-6-production-build--live-deployment-setup)

---

## 📋 Prompt 1: Product Image Upload System (Frontend + Backend)

```markdown
TASK: Add real image upload support for products (main image and colour variants) instead of typing/pasting URLs.

1. BACKEND (Node.js/Express):
- Install `multer`.
- Create a storage service in `backend/services/storage.js` that handles saving files locally to `backend/uploads/products/` (with UUID filenames). Keep the design modular so Cloudinary or S3 can be plugged in later via `STORAGE_DRIVER` env var.
- Create route `POST /api/admin/uploads` protected by `verifyAdmin`.
- Accept single image field "image". Validate MIME types (image/jpeg, image/png, image/webp) and restrict file size to max 3MB.
- Return `{ success: true, url: "/uploads/products/<filename>" }`.
- Ensure `backend/server.js` serves `backend/uploads` statically at `/uploads`.
- Update `.gitignore` to ignore uploaded product images except `.gitkeep`.

2. FRONTEND (admin/frontend/Admin.tsx):
- Update the Add Product and Edit Product forms.
- Replace the plain URL inputs with a modern Drag & Drop file uploader component:
  - Drag over state, file picker button, image thumbnail preview, upload progress spinner, and "Remove/Change" button.
  - Keep a small toggle link: "Or paste image URL instead".
  - Add the same upload capability for each Color Variant's photo.
- Ensure the storefront renders uploaded relative paths through `getImageUrl()` seamlessly on Product Cards, Product Details, Cart Drawer, and Invoices.
```

---

## 📋 Prompt 2: Admin Coupon Manager (Frontend + Backend)

```markdown
TASK: Build a full Coupon Management feature inside the Admin Portal so admins can create, view, edit, pause, and delete discount codes.

1. BACKEND (Node.js/Express):
- Create `backend/admin/adminCoupons.js` and mount it at `/api/admin/coupons` with `verifyAdmin`:
  - `GET /` — Fetch all coupons (sorted by newest, including `used_count`).
  - `POST /` — Create coupon with validation (unique uppercase code 3-30 chars, discount_type: percent|fixed|shipping, discount_value, min_order, usage_limit, expires_at).
  - `PUT /:id` — Update existing coupon fields.
  - `PATCH /:id/toggle` — Quickly toggle `active` status (1 or 0).
  - `DELETE /:id` — Delete a coupon.
- Ensure public routes (`/api/coupons/validate` and `/api/coupons/public`) only accept active, non-expired, under-limit coupons.

2. FRONTEND (admin/frontend/):
- Create `admin/frontend/AdminCoupons.tsx` and integrate it as a new "Coupons" tab in `Admin.tsx` with a Tag icon.
- Features:
  - Stats row: Total Coupons, Active Codes, Total Times Used.
  - Interactive Table: Code badge, Discount details, Min Order, Usage meter (e.g. "14 / 50 uses"), Expiry date, Status pill (Active, Paused, Expired), and Actions.
  - Modal Form: Create/Edit modal with a live card preview ("Save 20% on orders above $100").
  - Quick Toggle button to pause/resume coupon without opening the edit modal.
  - Confirmation prompt before deleting.
```

---

## 📋 Prompt 3: Real Email Notification System (Frontend + Backend)

```markdown
TASK: Integrate a real email notification system using Nodemailer with SMTP (Gmail / Brevo / Resend) and a graceful development fallback.

1. BACKEND (Node.js/Express):
- Install `nodemailer`.
- Create `backend/services/email.js` configured with environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`).
- Fallback: If SMTP variables are missing (in local dev), log formatted email previews directly to the terminal without crashing the server.
- Create branded HTML & plain-text templates in `backend/emails/`:
  1. `orderConfirmation.html`: Order number, item breakdown, price summary, delivery address, and a clickable "Track Your Order" button.
  2. `orderStatusChanged.html`: Notifies customer when order changes to Processing, Shipped, Delivered, or Cancelled (with tracking notes).
  3. `passwordReset.html`: Clean 6-digit OTP code with 15-minute expiration notice.
  4. `contactAutoReply.html`: Quick acknowledgment when a user submits the Contact Us form.
- Hook emails into `backend/routes/auth.js` (forgot password), `backend/routes/orders.js` (order placed), `backend/services/orderService.js` (status updated), and `backend/routes/store.js` (contact form). Send emails asynchronously after DB commits so requests never freeze.

2. FRONTEND:
- On Checkout success, Account order tracking, and Contact page, show clear UI indicators: "A confirmation email has been dispatched to your email address."
```

---

## 📋 Prompt 4: Real Payment Gateway Sandbox (Frontend + Backend)

```markdown
TASK: Replace the simulated payment in checkout with a real sandbox integration (e.g. JazzCash / Easypaisa Sandbox / Stripe).

1. BACKEND (Node.js/Express):
- Add table `payments` in `backend/database/schema.sql` (id, order_id, provider, transaction_ref, amount, currency, status, raw_response, created_at).
- Implement endpoint `POST /api/payments/create-session`:
  - Validates cart and stock, generates pending order, and returns sandbox redirect URL/token from the payment provider.
- Implement webhook `POST /api/payments/webhook`:
  - Securely verifies cryptographic signature/hash.
  - Matches order amount and currency.
  - In a SQL transaction: sets payment status to "Paid", order status to "Processing", reserves stock, and records in history.
- Handle failure/timeout by restoring reserved inventory.
- Configure credentials strictly via `backend/.env`.

2. FRONTEND (src/pages/Checkout.tsx):
- For the chosen payment method, redirect user to the secure sandbox gateway or open the official checkout sheet.
- Create a dedicated result page `/checkout/result` that checks payment verification from the backend and displays the Order Invoice upon confirmation.
- Retain Cash on Delivery (COD) as an instant checkout option.
```

---

## 📋 Prompt 5: Database-Synced Wishlist (Frontend + Backend)

```markdown
TASK: Sync customer wishlists to the database so items persist across devices and browser sessions for logged-in users.

1. BACKEND (Node.js/Express):
- Add `wishlists` table (user_id, product_id, created_at, PRIMARY KEY(user_id, product_id)).
- Create endpoints protected by `verifyToken`:
  - `GET /api/wishlist`: Returns full product objects currently favorited by the user.
  - `POST /api/wishlist/:productId`: Adds item to user's saved wishlist.
  - `DELETE /api/wishlist/:productId`: Removes item from saved wishlist.
  - `POST /api/wishlist/merge`: Takes an array of `productIds` from localStorage and merges them into the user's database records upon login.

2. FRONTEND (src/context/CartContext.tsx / Wishlist Context):
- Update Wishlist state management:
  - For guests: Store items in `localStorage`.
  - On user login: Automatically call `/api/wishlist/merge` to sync guest items to their database profile.
  - For logged-in users: Perform optimistic UI updates when clicking the Heart icon and sync with the backend in the background.
```

---

## 📋 Prompt 6: Production Build & Live Deployment Setup

```markdown
TASK: Prepare the entire NOVA e-commerce repository for live production deployment (Frontend on Vercel/Netlify, Backend & Database on Railway/Render).

1. FRONTEND:
- Configure `vercel.json` or `_redirects` to handle client-side routing (Single Page Application SPA rewrite for react-router-dom v7).
- Verify environment variables: ensure `VITE_API_URL` points dynamically to the production backend URL.
- Test production build with `npm run build` to confirm zero TypeScript or bundling errors.

2. BACKEND:
- Ensure `backend/server.js` reads dynamic `process.env.PORT` and configures CORS dynamically via `process.env.CLIENT_URL` (supporting multiple allowed origins).
- Add `Procfile` / production start script `"start": "node server.js"`.
- Ensure `ensureSchema()` runs automatically on startup so MySQL database tables are created automatically on any cloud host.
- Provide a step-by-step deployment guide with exact environment variable configurations.
```

---

## 💡 Istemaal Karne Ka Tareeqa (How to Use)

1. Is file ko open karein: `PROMPTS_README.md`.
2. Jis feature par kaam karna ho, uska **Prompt box copy** karein.
3. Chat mein paste karein aur send kar dein.
4. Har feature ke complete hone par code ko test karein aur commit karein:
   ```bash
   git add .
   git commit -m "feat: completed <feature-name>"
   git push origin main
   ```

