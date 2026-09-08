# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

رُوَّاد المحافظات الحدودية (Rowwad Al-Mohafazat Al-Hodoudiya) — a youth-empowerment NGO site covering Egyptian governorates (originally the five border governorates, expanded to ten: North Sinai, South Sinai, Aswan, New Valley, Matrouh, Red Sea, Suez, Ismailia, Greater Cairo, Sharqia). A rich single-page marketing homepage (about/programs/articles/events/testimonials/gallery/governorates/contact sections) plus standalone deep-link pages, events/bookings, news articles, and a full admin CRUD dashboard. All user-facing text is Arabic, RTL. Visual identity is a violet/indigo palette with a single Arabic font (Noto Sans Arabic), modeled after a reference site (`rowad-elmohafzat.web.app`).

## ⚠️ Architecture has migrated: Firebase, not Laravel

The frontend **no longer talks to the Laravel backend**. It was fully migrated to call **Firebase Realtime Database + Firebase Auth directly from the browser** (plus Cloudflare R2 for image storage via a small Next.js API route). `backend/` (Laravel) is still present in the repo and still runnable, but nothing in `frontend/` references it anymore — no `NEXT_PUBLIC_API_URL`, no `fetch` calls to it. Treat `backend/` as legacy/orphaned unless the user says otherwise, and don't assume the "Backend (Laravel API)" architecture section below is still what's live — it documents `backend/` as it stands, not what the site runs on.

`frontend/README-SETUP.md` is **stale** — it still describes the old "run Laravel first, set `NEXT_PUBLIC_API_URL`" flow. Don't follow it; follow this file instead.

There's also a one-off `scripts/` package (`migrate-to-firebase`, deps on `firebase` + `@aws-sdk/client-s3`) used to migrate data out of the old Laravel/SQLite store into Firebase — it has no tracked script files currently, just `package.json`. Not part of the running app.

## Current architecture (Firebase-backed frontend)

- **Data store**: Firebase Realtime Database (RTDB), not SQL. Top-level nodes: `events`, `bookings/{eventId}/{bookingId}`, `articles`, `programs`, `governorates`, `success_stories`, `gallery_albums`, `gallery_images`, `contact_messages`, `site_users` (visitor profiles), `admins/{uid}` (admin accounts), `admin_meta/super_admin_count`. There are no separate "public" vs "admin" endpoints like the old REST API — the same RTDB paths are read by both, filtered client-side by `is_published`.
- **Security model**: enforced entirely by `database.rules.json` (repo root) and `storage.rules` (Firebase Storage — mostly unused now that images go to R2, kept for the `gallery/` path). Rules encode the same three-tier role system as before (`super_admin` / `editor` / `viewer`, stored per-uid under `admins/$uid/role`): public read on published-content nodes, write gated to `super_admin`/`editor` via a rule that reads `root.child('admins').child(auth.uid).child('role')`, `admins`/`admin_meta` writes gated to `super_admin` only. `bookings/$eventId/seats_taken` has its own `.write: "true"` with a bounds `.validate` so the seat-counter transaction (see below) can run for any authenticated visitor, not just admins. When adding a new RTDB node, add matching rules here — there is no server-side controller to fall back on.
- **`frontend/lib/firebase.ts`**: initializes the Firebase app (`firebaseApp`, `auth`, `db`) from `NEXT_PUBLIC_FIREBASE_*` env vars, forces `browserLocalPersistence` on `auth`, and exposes `getSecondaryAuth()` — a second named Firebase app instance used only when an admin creates another admin account, so `createUserWithEmailAndPassword` doesn't hijack the current admin's session (it signs in as the new user by default on the primary auth instance). This file imports the Firebase JS SDK and **must never be imported into a Server Component** — it initializes Auth at module-load time, which fails server-side.
- **`frontend/lib/firebaseHelpers.ts`**: the server-safe half. Pure REST helpers (`restGet`/`restPost` against `${DATABASE_URL}/{path}.json`) with no Firebase SDK import, so it works from both Server and Client Components. Also holds `objectToArray` (RTDB's `{pushKey: {...}}` shape → `[{id, ...}]`), `makeSlug`/`makeConfirmationCode`, `computeEventFields` (derives `status`/`seats_remaining` the same way the old Eloquent accessors did — not stored), and `ApiException`.
- **`frontend/lib/publicApi.ts`**: all public *read* functions (`getEvents`, `getEvent`, `getArticles`, `getArticle`, `getPrograms`, `getGovernorates`, `getSuccessStories`, `getGallery`, `getGalleryAlbums`, `sendContactMessage`) built only on `firebaseHelpers`'s REST functions — importable from Server Components (e.g. the article-detail page). Filters `is_published` and sorts client-side since RTDB has no query language for this.
- **`frontend/lib/api.ts`**: re-exports all of `publicApi.ts`'s public reads, then adds everything that needs the Firebase SDK: visitor auth (`visitorSignIn`, `visitorSignInWithGoogle`, `visitorSignOut`, `onVisitorAuthChange`, `waitForAuthUser`), admin auth (`adminLogin`, `adminLoginWithGoogle`, `adminLogout`, `adminMe`), and full admin CRUD for every resource (`adminGetEvents`/`adminCreateEvent`/... following the same per-resource pattern for events, articles, programs, governorates, success stories, gallery images/albums, users, site users). This is the file to extend for any new Firebase-backed call — keep the "REST-only, server-safe" reads in `publicApi.ts`/`firebaseHelpers.ts` and everything requiring `auth`/`db` SDK objects here. `translateFirebaseError()` maps Firebase error codes to the same `ApiException{status, message, errors}` shape the old Laravel client used, so calling code didn't need to change shape.
- **Two separate auth "domains" on the same Firebase Auth instance**: *visitor* auth (any signed-in Firebase user; required to book an event, gated by `VisitorAuthGate`/`/login`) and *admin* auth (a visitor whose `uid` also exists under `admins/`). `onVisitorAuthChange` fires for anyone signed in and also upserts `site_users/{uid}` on every auth-state change (not just explicit login) so returning sessions get recorded too. `onAdminAuthChange` (`frontend/lib/adminAuth.ts`) additionally checks `admins/{uid}` and calls back `null` if the signed-in user isn't an admin. There is no `localStorage` token anymore — Firebase Auth SDK manages the session (IndexedDB), and `app/admin/dashboard/page.tsx` still only verifies client-side via `onAdminAuthChange`, so it's still not server-protected.
- **Event booking**: `createBooking()` in `lib/api.ts` requires a signed-in visitor (`auth.currentUser`), then does a `runTransaction` on `events/{id}/seats_taken` to atomically claim a seat (returns uncommitted if `seats_taken >= seats_total`, surfaced to the UI as a 409). `BookingModal` shows `VisitorAuthGate` inline first if the visitor isn't signed in, then the booking form.
- **Image uploads → Cloudflare R2, not Firebase Storage**: `frontend/app/api/upload/route.ts` is a Next.js Route Handler (`POST`/`DELETE`) that uploads/deletes objects in an R2 bucket via `@aws-sdk/client-s3`, using server-only `R2_*` env vars (never `NEXT_PUBLIC_*`, so the secret keys never reach the browser). `adminCreateGalleryImage`/`adminCreateSuccessStory`/etc. in `lib/api.ts` POST a `FormData` to `/api/upload`, get back `{storage_path, image_url}`, and store those two fields on the RTDB record. Max upload size is 4MB (same limit as the old Laravel config). `storage.rules` still exists for the Firebase Storage `gallery/` path but isn't what's actually used by the app now.
- **Roles UI**: `frontend/app/admin/dashboard/page.tsx` is now just the shell (auth check, sidebar nav, section switch) — each manager lives in `frontend/app/admin/dashboard/_components/` (`EventsManager`, `ArticlesManager`, `ProgramsManager`, `GovernoratesManager`, `SuccessStoriesManager`, `GalleryManager`, `UsersManager`, `OverviewSection`, plus read-only `BookingsCard`/`ContactMessagesCard`), with shared constants/UI primitives (`SectionCard`, `Badge`, `StatCard`, `SearchBox`, `ROLE_LABELS`, category/governorate lists, etc.) factored into `_components/shared.tsx`. Follow this split — shared UI/constants in `shared.tsx`, one manager file per resource — for any new manageable resource. Every manager still takes `canEdit: boolean` (`user.role !== 'viewer'`) as a **frontend UX convenience only**; real enforcement is `database.rules.json`, not this prop. `UsersManager` renders only for `super_admin`.
- **Deployment target changed accordingly**: Vercel for the frontend (unchanged), but the backend the frontend actually depends on is the Firebase project (`.firebaserc` → project `rowad-2026`) for RTDB/Storage rules deploy (`firebase deploy --only database,storage` from the repo root, using the root `firebase.json`) plus a Cloudflare R2 bucket for images — not Render/Cloud Run. Required env vars for the frontend are now `NEXT_PUBLIC_FIREBASE_*` (7 vars) and `R2_*` (5 vars, server-only) — see `frontend/.env.local.example`.

## Backend (Laravel) — present in repo, legacy/orphaned

`backend/` is a complete, runnable Laravel 11 project (Sanctum auth, SQLite, the works). It was the original API this frontend consumed, before the Firebase migration above. Nothing currently calls it. Keep the following in mind only if the user asks you to work *inside* `backend/` itself, revive the old integration, or use it as a reference for business logic that hasn't been ported to the RTDB rules/CRUD yet:

```bash
cd backend
composer install          # only needed if vendor/ is missing (e.g. fresh clone)
php artisan migrate --seed
php artisan storage:link  # required once, for gallery image uploads
php artisan serve         # -> http://localhost:8000/api
```

A sibling directory `backend_old_template/` holds the pre-bootstrap state (project files only, no framework scaffold) kept for reference — safe to delete once you've confirmed `backend/` works for you. (Currently shown as deleted in git status — someone has already removed it locally but not committed.)

Seeded admin accounts (all password `ChangeMe123!`), one per role:
- `admin@rowwad-borders.test` — super_admin
- `editor@rowwad-borders.test` — editor
- `viewer@rowwad-borders.test` — viewer

### Backend architecture (as `backend/` stands, not as currently deployed)

- Core resources: `Event` (+ `Booking`), `Article`, `ContactMessage`, plus `Program`, `Governorate`, `SuccessStory`, `GalleryImage`, and an admin `User` for auth. Models live in `backend/app/Models`, controllers in `backend/app/Http/Controllers/Api`.
- `backend/routes/api.php` is the single source of truth for routing: public `GET` routes (`/events`, `/articles`, `/programs`, `/governorates`, `/success-stories`, `/gallery`, `/contact-messages` POST, `/admin/login` POST) are unauthenticated; everything under `/admin/*` (except login) requires `auth:sanctum` and an `Authorization: Bearer <token>` header. Every content resource follows the same shape: public `index` (published-only), admin `adminIndex` (all rows), `store`, `update`, `destroy`.
- **Roles**: `User.role` is `super_admin` | `editor` | `viewer` (plain string column, default `editor`). Enforced via `app/Http/Middleware/EnsureAdminRole.php` (aliased as `role` in `bootstrap/app.php`), applied as `->middleware('role:super_admin,editor')` etc. inside nested route groups in `routes/api.php` — not on controllers. Plain `GET`/`adminIndex` routes require only `auth:sanctum`; content mutation routes require `role:super_admin,editor`; `/admin/users/*` requires `role:super_admin` only. `UserController` also guards against self-delete and demoting/deleting the last remaining `super_admin`. (This is the exact role model the Firebase migration reproduced in `database.rules.json`.)
- `Event` computes `status`/`seats_remaining` as Eloquent appended accessors, not stored columns.
- Slugs (`Event`, `Article`, `Governorate`) are auto-generated from title + random suffix in a `booted()` hook if not supplied (`Str::slug()` doesn't transliterate Arabic, so auto-generated slugs end up as just the random suffix). Public routes use route-model binding on `slug`; admin mutation routes bind on numeric id.
- Validation is inline per-controller-method with `Validator::make` (no Form Request classes), returning `422` with `{message, errors}`.
- `GalleryImageController` accepts `multipart/form-data` with an optional `image` file, stored via `Storage::disk('public')->store('gallery')`, using Laravel method-spoofing (`_method=PUT`) for updates.
- CORS (`backend/config/cors.php`) is restricted to a single `FRONTEND_URL` origin.
- Two prepared deployment paths, neither actually deployed from this environment: **Firebase Hosting + Cloud Run** (`Dockerfile` + `docker/`, needs Blaze billing + external Postgres — see `backend/README-SETUP.md`) and **Render** (`Dockerfile.render` + `deploy.render.sh`, free, no card).

There is no test suite configured for either project (backend has `phpunit.xml`/`tests/` with only the Laravel-default `ExampleTest.php` stubs; nothing project-specific).

## Common commands

Frontend (`frontend/`):
```bash
npm install
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_FIREBASE_* and R2_* — see above, NOT NEXT_PUBLIC_API_URL
NODE_ENV=development npm run dev   # http://localhost:3000 — see NODE_ENV gotcha below
npm run build
npm run lint                       # not yet configured; first run prompts an interactive ESLint setup wizard
```

**NODE_ENV gotcha**: if the shell environment has `NODE_ENV=production` set globally (check with `echo $NODE_ENV`), plain `npm install` silently skips devDependencies (tailwindcss, postcss, autoprefixer, typescript) and the dev server fails with a cryptic "Module parse failed: Unexpected character '@'" on `globals.css`. Fix: `rm -rf node_modules .next && NODE_ENV=development npm install`.

## Other frontend architecture notes (still accurate post-migration)

- `frontend/lib/types.ts` mirrors the RTDB record shapes — keep in sync manually when a node's fields change (no codegen).
- `frontend/lib/bookings.ts` tracks which event IDs the current browser has booked in `localStorage` (`rowwad-my-bookings`), purely a client-side UX nicety (shows "already booked"), not a source of truth — the real record is the RTDB `bookings/{eventId}/{bookingId}` node.
- `app/page.tsx` is the main "long homepage" (Hero → `#about` → `#programs` → `#articles` → `#events` → `#testimonials` → `#gallery` → `#governorates` → CTA → `#contact`), fetching all of it client-side (`'use client'` + `useEffect`). Standalone deep-link pages (`about/`, `activities/`, `news/` + `news/[slug]/`, `contact/`) still exist independently for direct navigation/SEO.
- `components/ContactSection.tsx` holds the actual contact form + info card; both `app/contact/page.tsx` and the homepage's `#contact` section render it — extend the shared component rather than duplicating.
- `components/Header.tsx` renders visitor login state (via `onVisitorAuthChange`) and, if that visitor is also an admin (checked with a one-off `get(ref(db, 'admins/{uid}'))`), a "لوحة التحكم" shortcut link — sign-in/out and the admin-dashboard link live in the header now, not just in `/admin/login`.
- `components/RouteStrip.tsx` is unused dead code — left in place but not imported anywhere.
- Design system lives in `tailwind.config.ts`: palette tokens (`night`, `sand`, `gold`, `rust`, `sea`, `ink`, `cream`) are semantic, not literal. Primary CTA buttons use raw Tailwind `bg-violet-600`/`hover:bg-violet-700`/`text-white` directly (not the `gold` token) since the token's light value lacks contrast for solid buttons — follow that pattern for new primary buttons. All three font roles (`font-display`/`font-body`/`font-utility`) point to the same `--font-arabic` (Noto Sans Arabic) CSS variable set in `app/layout.tsx`.
- The whole app is RTL (`<html dir="rtl" lang="ar">` in `app/layout.tsx`); keep new UI Arabic-first and RTL-aware.

### Known gaps to keep in mind (not yet fixed)

- Admin auth has no server-side session verification — `/admin/*` isn't protected at the Next.js server/middleware level, only client-side via `onAdminAuthChange`.
- No rate limiting on booking/contact writes beyond what `database.rules.json`'s `.validate` rules encode (e.g. contact messages can't be edited once created, but nothing throttles creation rate).
- Deleting an admin's `site_users` profile or a `gallery_images` RTDB entry doesn't delete the underlying Firebase Auth account or (for images predating R2) old storage blobs in every code path — check the relevant function's comments in `lib/api.ts` before assuming cleanup is automatic.
- Governorate/population/project-count seed data is illustrative placeholder content, not verified official statistics.
