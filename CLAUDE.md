# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

رُوَّاد المحافظات الحدودية (Rowwad Al-Mohafazat Al-Hodoudiya) — a youth-empowerment NGO site covering Egyptian governorates (originally the five border governorates, expanded to ten: North Sinai, South Sinai, Aswan, New Valley, Matrouh, Red Sea, Suez, Ismailia, Greater Cairo, Sharqia). A rich single-page marketing homepage (about/programs/articles/events/testimonials/gallery/governorates/contact sections) plus standalone deep-link pages, events/bookings, news articles, and a full admin CRUD dashboard. All user-facing text is Arabic, RTL. Visual identity is a violet/indigo palette with a single Arabic font (Noto Sans Arabic), modeled after a reference site (`rowad-elmohafzat.web.app`).

Two independent projects, no shared package manager or root build:
- `backend/` — Laravel 11 REST API (Sanctum auth)
- `frontend/` — Next.js 14 (App Router) site, consumes the API

## Backend is a real, runnable Laravel install

Unlike some earlier states of this repo, `backend/` is now a complete Laravel project (`vendor/`, `artisan`, `bootstrap/`, `public/index.php`, SQLite DB, the works) — it was bootstrapped via `composer create-project laravel/laravel` and had the project-specific `app/`, `database/`, `routes/api.php`, `config/cors.php` merged in. You can run it directly:

```bash
cd backend
composer install          # only needed if vendor/ is missing (e.g. fresh clone)
php artisan migrate --seed
php artisan storage:link  # required once, for gallery image uploads
php artisan serve         # -> http://localhost:8000/api
```

A sibling directory `backend_old_template/` holds the pre-bootstrap state (project files only, no framework scaffold) kept for reference — safe to delete once you've confirmed `backend/` works for you.

Seeded admin accounts (all password `ChangeMe123!`), one per role — see Roles below:
- `admin@rowwad-borders.test` — super_admin
- `editor@rowwad-borders.test` — editor
- `viewer@rowwad-borders.test` — viewer

## Common commands

Frontend (`frontend/`):
```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL (default http://localhost:8000/api)
NODE_ENV=development npm run dev   # http://localhost:3000 — see NODE_ENV gotcha below
npm run build
npm run lint                       # not yet configured; first run prompts an interactive ESLint setup wizard
```

**NODE_ENV gotcha**: if the shell environment has `NODE_ENV=production` set globally (check with `echo $NODE_ENV`), plain `npm install` silently skips devDependencies (tailwindcss, postcss, autoprefixer, typescript) and the dev server fails with a cryptic "Module parse failed: Unexpected character '@'" on `globals.css`. Fix: `rm -rf node_modules .next && NODE_ENV=development npm install`.

There is no test suite configured in either project currently.

## Architecture

### Backend (Laravel API, stateless Bearer-token auth via Sanctum)

- Core resources: `Event` (+ `Booking`), `Article`, `ContactMessage`, plus `Program`, `Governorate`, `SuccessStory`, `GalleryImage` (added for the reference-site redesign), and an admin `User` for auth. Models live in `backend/app/Models`, controllers in `backend/app/Http/Controllers/Api`.
- `backend/routes/api.php` is the single source of truth for routing: public `GET` routes (`/events`, `/articles`, `/programs`, `/governorates`, `/success-stories`, `/gallery`, `/contact-messages` POST, `/admin/login` POST) are unauthenticated; everything under `/admin/*` (except login) requires `auth:sanctum` and an `Authorization: Bearer <token>` header — there are no session/cookie-based routes. Every content resource follows the same shape: public `index` (published-only), admin `adminIndex` (all rows), `store`, `update`, `destroy`.
- **Roles**: `User.role` is `super_admin` | `editor` | `viewer` (plain string column, default `editor`). Enforced via `app/Http/Middleware/EnsureAdminRole.php` (aliased as `role` in `bootstrap/app.php`), applied as `->middleware('role:super_admin,editor')` etc. inside nested route groups in `routes/api.php` — not on controllers. Inside the `admin` route group: plain `GET`/`adminIndex` routes require only `auth:sanctum` (any role can view, including bookings/contact-messages); content mutation routes (`POST`/`PUT`/`DELETE` on events/articles/programs/governorates/success-stories/gallery) require `role:super_admin,editor`; `/admin/users/*` requires `role:super_admin` only. When adding a new admin route, decide which of these three tiers it belongs to and nest it in the matching group — don't add ad-hoc role checks inside controller methods. `UserController` (super_admin-only) also guards against self-delete and demoting/deleting the last remaining `super_admin`.
- `Event` computes `status` (`upcoming`/`past`) and `seats_remaining` as Eloquent appended accessors compared against `now()`/`seats_total - seats_taken`, not stored columns — controllers filter by `starts_at` directly rather than by `status`.
- Slugs (`Event`, `Article`, `Governorate`) are auto-generated from title + random suffix in a `booted()` hook if not supplied (note: `Str::slug()` doesn't transliterate Arabic, so auto-generated slugs for Arabic-titled records end up as just the random suffix — seeders set explicit English slugs to work around this). Public routes use route-model binding on `slug` (e.g. `{event:slug}`); admin mutation routes bind on numeric id.
- Validation is done inline per-controller-method with `Validator::make` (no Form Request classes) — follow that pattern for new endpoints, returning `422` with `{message, errors}` on failure.
- `GalleryImageController` is the one resource with file upload: `store`/`update` accept `multipart/form-data` with an optional `image` file, stored via `Storage::disk('public')->store('gallery')`. Since native HTML forms can't send a real `PUT` with `multipart/form-data`, the frontend POSTs with a `_method=PUT` field (Laravel method-spoofing) rather than issuing an actual PUT — see `adminUpdateGalleryImage` in `frontend/lib/api.ts`. `GalleryImage` also has an `art_theme` fallback (same `art-1..art-4` abstract-pattern convention as `Event`/`Article`) so the gallery renders sensibly with zero real photos uploaded.
- CORS (`backend/config/cors.php`) is restricted to a single `FRONTEND_URL` origin with `supports_credentials => true` — update `FRONTEND_URL`/`SANCTUM_STATEFUL_DOMAINS` env vars, not the CORS file, when changing allowed origins.
- Deployment target is Render via Docker (`backend/Dockerfile` using `richarvey/nginx-php-fpm`, `backend/deploy.sh` runs `composer install --no-dev`, config/route caching, and `migrate --force` on boot).

### Frontend (Next.js App Router)

- `lib/api.ts` is the only place that talks to the backend: a single `request<T>()` wrapper (fetch with `cache: 'no-store'`, optional Bearer token) backs every exported API function; it skips forcing a JSON `Content-Type` when the body is a `FormData` instance (needed for the gallery file upload) so don't re-add that header unconditionally. `getStorageUrl(path)` derives the Laravel storage origin from `NEXT_PUBLIC_API_URL` (strips the trailing `/api`) for rendering uploaded gallery images. Add new backend calls here rather than calling `fetch` from components/pages directly. Errors surface as `ApiException` (`status`, optional field `errors`).
- `lib/types.ts` mirrors the Laravel API's JSON shapes — keep these in sync manually when backend fields change (no codegen).
- Admin auth is intentionally client-side only for this reference build: `lib/adminAuth.ts` stores the Sanctum token in `localStorage` (no HttpOnly cookies, no Next.js middleware guarding `/admin/*` at the server level). `app/admin/dashboard` checks auth client-side. Don't assume `/admin` routes are protected server-side.
- `lib/bookings.ts` tracks which event IDs the current browser has booked in `localStorage` (`rowwad-my-bookings`), purely a client-side UX nicety, not a source of truth.
- `app/page.tsx` is the main "long homepage" (Hero → `#about` → `#programs` → `#articles` → `#events` → `#testimonials` → `#gallery` → `#governorates` → CTA → `#contact`), fetching all of it client-side (`'use client'` + `useEffect`), so the section anchors exist in the initial SSR HTML but the data-driven content only appears after hydration. Standalone deep-link pages (`about/`, `activities/`, `news/` + `news/[slug]/`, `contact/`) still exist independently for direct navigation/SEO — the header/footer link to homepage anchors (`/#programs` etc.) for sections that only live on the homepage, and to the standalone pages for the rest.
- `components/ContactSection.tsx` holds the actual contact form + info card; both `app/contact/page.tsx` and the homepage's `#contact` section render it — don't duplicate the form logic, extend the shared component instead.
- `app/admin/dashboard/page.tsx` has one manager component per content resource (`EventsManager`, `ArticlesManager`, `ProgramsManager`, `GovernoratesManager`, `SuccessStoriesManager`, `GalleryManager`, `UsersManager`, plus read-only `BookingsCard`/`ContactMessagesCard`). Each manager follows the same list + inline add/edit form + delete pattern; the edit form uses `key={editing?.id ?? 'new'}` on the `<form>` to force remount with fresh `defaultValue`s when switching between add and edit. Follow this pattern for any new manageable resource rather than introducing a different admin UI style. Every content manager takes a `canEdit: boolean` prop (`user.role !== 'viewer'`, computed once in `AdminDashboardPage`) that hides its add/edit/delete form and buttons when false — a viewer sees list-only. This is a **frontend UX convenience only**; the real enforcement is the `role` middleware on the backend, so don't treat `canEdit` as a security boundary when adding new UI. `UsersManager` is rendered only when `user.role === 'super_admin'` and additionally disables the delete button on the logged-in user's own row (backend still enforces this too).
- Design system lives in `tailwind.config.ts`: the palette tokens (`night`, `sand`, `gold`, `rust`, `sea`, `ink`, `cream`) are semantic, not literal — they were repointed from the original navy/gold scheme to a violet/indigo scheme in one place, which re-themed the whole site without touching per-component classes. Prefer reusing/re-remapping these tokens over hardcoding new hex values. The one exception: primary CTA buttons use raw Tailwind `bg-violet-600`/`hover:bg-violet-700`/`text-white` directly (not the `gold` token) because the token's light value doesn't have contrast for solid buttons — follow that pattern for new primary buttons rather than `bg-gold ... text-night`. All three font roles (`font-display`/`font-body`/`font-utility`) point to the same `--font-arabic` (Noto Sans Arabic) CSS variable set in `app/layout.tsx` — there's no separate serif/display font anymore.
- `components/RouteStrip.tsx` is unused dead code (was the old hero's decorative route-strip element, dropped when the hero was redesigned) — left in place but not imported anywhere.
- The whole app is RTL (`<html dir="rtl" lang="ar">` in `app/layout.tsx`); keep new UI Arabic-first and RTL-aware.
- Deployment target is Vercel; `NEXT_PUBLIC_API_URL` must point at the deployed backend + `/api`.

### Known gaps to keep in mind (not yet fixed)

- Admin auth has no server-side session verification (client-side token check only) and stores the token in `localStorage`, not an HttpOnly cookie.
- No rate limiting on booking/contact endpoints.
- SQLite is the default local DB; production should use MySQL/PostgreSQL.
- Governorate/population/project-count seed data is illustrative placeholder content, not verified official statistics.

## Deployment

Two backend deployment paths are prepared side by side in `backend/`:
- **Firebase Hosting + Cloud Run** (current primary path — see the "النشر على Firebase Hosting + Cloud Run" section in `backend/README-SETUP.md`): `Dockerfile` + `docker/` build a `php:8.2-apache` image listening on port `8080` for Cloud Run; `firebase.json` rewrites Hosting traffic to a Cloud Run service named `rowwad-api`. Requires a Google Cloud Blaze (billing-enabled) plan — Firebase's free Spark plan cannot run any backend compute (PHP or otherwise), only static Hosting. Also requires an external database (SQLite doesn't survive Cloud Run's ephemeral/multi-instance filesystem) — README recommends Neon/Supabase Postgres as a free, no-card option.
- **Render** (original path, preserved as a fallback): `Dockerfile.render` + `deploy.render.sh` (rename to `Dockerfile`/`deploy.sh` to activate) — genuinely free with no card required, documented in the "بديل: Render" section of the same README.

Neither path has actually been deployed from this environment — `gcloud` CLI isn't installed here and deployment requires the user's own cloud account credentials/billing, so this is prep work only, not a live deployment.
