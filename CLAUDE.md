# NOVA — project context

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

## Rules
- Read the relevant files before changing them. Keep existing features working.
- Never trust prices, totals or stock sent by the client — the server recalculates.
- Schema changes must work on a fresh DB AND upgrade an existing one without data loss.
- Match the existing UI style: Tailwind utility classes, orange-500/600 accent, gray-950 dark surfaces,
  rounded-2xl/3xl cards, lucide-react icons, toasts via useToast(), prices via useCurrency().formatPrice().
  Once docs/DESIGN.md exists (prompt 0A), follow it instead: its tokens, components and motion rules win.
- No `any` in TypeScript. Keep components small; put shared logic in src/lib.
- Don't add a dependency if a few lines of code will do; if you add one, say why.

## Design system quick reference (details in docs/DESIGN.md)
- Tokens: src/styles/tokens.css (Tailwind v4 @theme) → bg-night, bg-porcelain, text-ink, text-muted, bg-flare (buying only),
  bg-marigold, bg-aurora, rounded-tag/-control/-tile/-sheet, shadow-overlay, ease-nova-out.
- Classes: btn + btn-buy/-primary/-secondary/-ghost/-danger, input, tag-*, chip, icon-btn, well, skeleton, type-*; `on-night` for dark sections.
- Motion: `m` from "motion/react" (LazyMotion strict, so never `motion.div`). Timing from src/lib/motion.ts.
  Primitives in src/components/motion/ (PageTransition, AnimatedNumber, Pressable, Reveal, Stagger, NovaGlow/NovaStars,
  useFlyToCart). DOM effects (burst, confetti, flyImage) in src/lib/flare.ts. Animate transform/opacity only; respect reduced motion.
- Drawers/modals: AnimatePresence + useFocusTrap (src/lib/useFocusTrap.ts) + Escape to close.

## Definition of done (every task)
- `npx tsc -b`, `npm run lint` and `npm run build` pass in the project root.
- Backend starts with `cd backend && npm run dev` with no errors.
- README.md updated (features, setup steps, new env vars, new endpoints).
- Finish with a short summary: files changed, how to test it manually, anything left to do.

## Roadmap
The numbered improvement tasks (0A, 0B, 1–26) are in docs/IMPROVEMENT_PROMPTS.md.
Run one task per session and commit before starting the next.
