# Nova Store — Admin Portal

This directory contains the complete, standalone **Admin Portal** for the Nova E-Commerce platform, unifying both the **Frontend Portal** and **Backend APIs**.

---

## 🚀 How to Run the Admin Portal

### Option 1: Run from `admin/frontend` folder
```bash
cd admin/frontend
npm run dev
```
> Opens directly on **`http://localhost:5174`** at the **Admin Login page**!

### Option 2: Run from `admin` folder
```bash
cd admin
npm run dev
```

### Option 3: Run from the project root
```bash
npm run dev:admin
```

---

## 🔐 Admin Login Credentials

- **Username**: `nova_admin`
- **Password**: `Nova@Admin#2024`
- These are created automatically on first run (from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env`). Change the password from **Security & Password** after your first login.

---

## 📁 Directory Structure

```text
admin/
├── package.json                  # Root runner script for the admin portal
├── README.md                     # Documentation
│
├── frontend/                     # Independent React + Vite Admin Application
│   ├── index.html                # Entry HTML (Title: Nova Store — Admin Portal)
│   ├── vite.config.ts            # Vite server running on port 5174
│   ├── package.json              # Standalone frontend scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── Admin.tsx                 # Full Admin Dashboard (Overview, Orders, Catalog, Coupons, Settings)
│   ├── AdminAnalytics.tsx        # Overview tab: revenue chart, top products, low stock, inbox
│   ├── AdminLogin.tsx            # Admin sign-in
│   ├── AdminPortalData.tsx       # Admin Data Hub & Export utility
│   ├── ImageUploader.tsx         # Drag & drop photo uploader (main photo + colour variants)
│   ├── AdminCoupons.tsx          # Coupons tab: stats, table, pause/resume, delete confirmation
│   ├── CouponFormModal.tsx       # Create / edit coupon form with live ticket preview
│   ├── CouponParts.tsx           # Status pill + coupon ticket
│   ├── coupons.ts                # Coupon types, API calls, wording and checks
│   ├── AdminModal.tsx            # Shared dialog shell (focus trap, Escape, bottom sheet on phones)
│   ├── StatusChangeModal.tsx     # Confirm an order status change, add a note for the customer, choose whether to email
│   ├── uploadImage.ts            # Upload request with progress + client-side file checks
│   ├── index.ts                  # Barrel export
│   └── src/
│       ├── App.tsx               # Route guard: '/' opens Admin Login (or Dashboard if logged in)
│       ├── main.tsx              # React mounting root
│       └── index.css             # Tailwind design styles
│
└── backend/                      # Complete Admin Backend APIs & Controllers
    ├── adminAuth.js              # Admin Login logic & verifyAdmin JWT middleware
    ├── adminOrders.js            # Orders list & status transition endpoints
    ├── adminProducts.js          # Products create, update, delete endpoints
    ├── adminStats.js             # Dashboard analytics (revenue by day, top products, low stock, inbox)
    ├── adminUploads.js           # Product photo uploads (multer + storage service)
    ├── adminCoupons.js           # Coupon list, create, update, pause/resume, delete
    └── index.js                  # Unified router & middleware export
```

---

## 🔌 Backend Endpoints

Mounted under `/api/admin`:
- `POST /api/admin/login`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status` — `{ status, note?, notify? }`; emails the customer for Processing, Shipped, Delivered and Cancelled
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/uploads` — upload one product photo (`multipart/form-data`, field `image`, JPEG/PNG/WebP up to 3 MB) → `{ success: true, url: "/uploads/products/<uuid>.<ext>" }`
- `GET /api/admin/stats?days=14` — revenue by day, totals, top products, category revenue, low stock, recent contact messages
- `PATCH /api/admin/stats/messages/:id/read` — mark a contact message as read
- `GET /api/admin/profile` · `PUT /api/admin/change-password`
- `GET /api/admin/coupons` · `POST /api/admin/coupons` · `PUT /api/admin/coupons/:id` · `PATCH /api/admin/coupons/:id/toggle` · `DELETE /api/admin/coupons/:id` — coupon manager
