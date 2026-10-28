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
- **1-Click Demo Access**: Click "Use Demo Admin Credentials" on the login screen to enter immediately.

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
│   ├── Admin.tsx                 # Full Admin Dashboard (Catalog, Orders, Analytics, Modals)
│   ├── AdminLogin.tsx            # Secure Admin Authentication & Demo Access
│   ├── AdminPortalData.tsx       # Admin Data Hub & Export utility
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
    ├── adminStats.js             # Overview stats (revenue, order counts, status breakdown)
    └── index.js                  # Unified router & middleware export
```

---

## 🔌 Backend Endpoints

Mounted under `/api/admin`:
- `POST /api/admin/login`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/stats`
