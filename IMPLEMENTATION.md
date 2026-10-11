# Himadri Creation website upgrade

The existing static HTML/CSS/JavaScript architecture is retained. No galleries, image assets, booking logic, careers fields, application categories, contact details or WhatsApp destinations were intentionally removed. The site is not deployed. The Firebase SDK initializes using the supplied public Web App configuration, but live Authentication and Firestore remain unavailable. No DNS or billing changes were made.

The current setup targets the user's existing **`himadri-creation`** project on **Spark**. The actual supplied configuration is preserved in ignored `.env`; no more Web App values are needed for this checkout. Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for service activation, first-administrator, static-image, and Hosting preview steps. CLI inspection found no authorized Firebase accounts. Read-only `npm run firebase:status` returned Authentication HTTP 400 `CONFIGURATION_NOT_FOUND` and published/draft Firestore HTTP 403 stating that the Cloud Firestore API has not been used or is disabled. That draft response does not verify live privacy rules. No live Firebase service was enabled by this session.

## Architecture and inspection

- `index.html` contains Home, About, Services, Gallery, Packages and Contact as anchor sections. It retains its camera/drone models, animations, gallery filters/lightbox, package and contact features.
- `booking.html` uses `src/booking.js`; `careers.html` uses `src/careers.js`. Both prepare WhatsApp messages for `918327482228`. Careers files are attached manually in WhatsApp, as before.
- `src/styles.css` is the existing styling system; new CSS extends it. Header markup remains in each HTML page for static accessibility; the checker verifies navigation across all five templates.
- `scripts/generate-gallery.js` generates `gallery-data.json` from the existing image folders (87 images at verification). The separate older `scripts/build-gallery.js` is retained.
- The original package only provided a gallery build and a Python static server. There was no Firebase initialization, backend, deployment configuration or test suite.
- An HTTP HEAD request on 11 October 2026 returned `Server: Netlify` and `Cache-Status: Netlify Edge` for the live domain. GoDaddy DNS nameservers were found; domain registration does not determine hosting. Account/site ownership was not checked.
- No Lovable screenshot was attached. Navigation and careers styling follow the written cream, burgundy and gold specifications.

## Implemented behavior

1. Floating rounded cream navigation, existing logo, requested link order, active indicators, visible booking action, mobile menu, Escape/outside-click dismissal, closed-menu keyboard exclusion and focus outlines. Home section highlighting includes `aria-current`.
2. Burgundy centered careers panel, requested heading, gold eyebrow and Apply Now anchor. Smooth scrolling respects reduced-motion preferences. Existing form and validation are preserved; error descriptions are linked to fields.
3. Blog listing with a featured story, categories, responsive cards, load more, loading/error/empty states. Individual articles include sanitized rich content, cover, author/date, related stories and social sharing.
4. Admin login and claim checks; overview, search/status filtering, create/edit, Quill rich editor, cover URLs/previews, inline images with alt text, SEO fields, draft save, publish/unpublish, article preview, logout and confirmed deletion. No admin registration UI is provided.
5. Modular Firebase Web SDK initialization. Firestore transactions reserve permanent slugs. Rules enforce the administrator claim independently of the UI, validate post schemas and deny public draft reads.
6. Optional Storage uploads resize to 1920 pixels and convert to WebP. Uploads require a saved draft, accept JPEG/PNG/WebP up to 5 MB, and use tokenless URLs. Rules check the owning article's current publication status for anonymous image reads. Replaced, abandoned and deleted uploads are cleaned up after saves/deletion; failures are reported.
7. An optional production prerender reads only publicly readable published posts, sanitizes them, emits visible HTML, unique metadata, canonical URLs, Open Graph/Twitter metadata, BlogPosting JSON-LD, related links and a public sitemap. Export errors abort the build. Admin pages are marked noindex.

## Local development and production build

Use Node 22+ (verified with Node 24) and Java 21+ for emulator tests.

```powershell
npm ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
# The current checkout already has the supplied configuration; preserve .env.
# Fresh checkouts need the genuine public Web App values from this same project.
npm start
```

Open `http://127.0.0.1:8000`. The server serves the built `dist` directory and supports direct blog/admin URLs. Rebuild and reload after source changes; this is not a hot-reloading server.

```powershell
npm run build
npm run preview
npm run check
npm test
npm run test:rules
npm run firebase:status
```

There was no original lint configuration. `npm run check` checks JavaScript syntax and shared navigation. `npm test` runs core and DOM interaction tests; `npm run test:rules` uses demo-project emulators and makes no writes to a real Firebase project.

`npm run firebase:status` performs read-only live Authentication and bounded published/draft queries, without deploying, enabling services, or printing the API key. It currently reports the service setup errors above. Emulator success must not be described as working live Auth/Firestore; rerun the status check after Console configuration.

## Firebase project setup (operator action required)

1. Open the existing **`himadri-creation`** project on **Spark**. Reuse its registered Web App configuration if present; register a Web App inside the same project only if none exists. Do not create another project or attach billing.
2. Open Authentication and click **Get started** if required, then enable Email/Password. Create the administrator's user through the Firebase console, not public self-registration. Add your staging hostname and live domain to Authentication authorized domains. Add localhost explicitly if needed.
3. Reuse the existing default Firestore database if present. Otherwise create it in production mode, using Standard edition, inside `himadri-creation`. Activate the Cloud Firestore API for that same project if needed. Choose its location deliberately; it cannot later be casually moved.
4. Preserve the supplied public Web App values already saved in ignored `.env`. For a fresh checkout, copy the genuine configuration from the same project's Web App. These values identify the project; authorization comes from rules and claims, not secrecy of the Web API key. Optional Messaging/Analytics identifiers are preserved as configuration; neither service is imported or enabled.
5. Review any existing rules before replacing them, then deploy the repository's Firestore rules and indexes to `himadri-creation`. Wait for indexes to finish building before enabling article queries.
6. Grant the administrator claim as described below. Then rebuild and test sign-in, CRUD and publication against this existing project's backend, using identifiable test articles. A Hosting preview does not isolate its database.

Required environment variables:

| Variable | Purpose |
| --- | --- |
| `FIREBASE_API_KEY` | Web App public API key |
| `FIREBASE_AUTH_DOMAIN` | Web App auth domain |
| `FIREBASE_PROJECT_ID` | `himadri-creation` |
| `FIREBASE_APP_ID` | Registered Web App ID |
| `FIREBASE_MESSAGING_SENDER_ID` | Optional supplied identifier; Messaging is not enabled |
| `FIREBASE_MEASUREMENT_ID` | Optional supplied identifier; Analytics is not enabled |
| `FIREBASE_STORAGE_BUCKET` | Only needed for approved optional Storage |
| `FIREBASE_STORAGE_ENABLED` | Default `false`; do not enable on Spark |
| `PRERENDER_BLOG` | Set `true` once Firebase rules/indexes are ready, for production article SEO |

Build-time environment values are compiled into the browser bundle. Changing `.env` requires a rebuild. Never put service-account JSON or a private key in these variables or anywhere inside `assets`, `src` or `dist`.

### Collections and indexes

`posts/{autoGeneratedId}` stores `id`, `title`, `slug`, `excerpt`, sanitized HTML `content`, `coverImage`, `category`, `author`, `seoTitle`, `seoDescription`, `status`, `createdAt`, `updatedAt`, `publishedAt`. Creation/update/publication use server timestamps. Draft `publishedAt` is null. Republish creates a new publication timestamp after unpublishing.

`slugs/{slug}` contains `postId`. Post creation and slug reservation happen in the same transaction. Existing slugs are immutable; deletion removes the reservation atomically. The registry is admin-readable only. Never create posts directly in the console without a matching reservation.

`firestore.indexes.json` declares status/publication-date, status/category/publication-date, and slug/status indexes, and excludes rich content from indexing. Public list queries are limited to 12 records per request; the UI loads nine. Admin search currently loads the article collection once and filters locally, suitable for a small studio blog.

`firestore.rules` and `storage.rules` are the deployable source of truth. Both deny unspecified paths. Public Firestore access requires published status; all mutations require a boolean `admin: true` custom claim. Neither an email address nor client-side routing grants access.

### Secure administrator claims

Use a trusted operator machine with Application Default Credentials authorized for the intended project. `firebase login` alone does not necessarily provide Admin SDK Application Default Credentials. Use `gcloud auth application-default login` with an appropriate project IAM role, or set `GOOGLE_APPLICATION_CREDENTIALS` to a securely stored service-account file **outside this checkout**. Never paste its contents into chat or frontend files.

Obtain the user's UID from Firebase Authentication, then run:

```powershell
node scripts/admin-claim.mjs himadri-creation USER_UID grant
```

The utility merges existing claims. Sign out and back in after granting access. To remove access:

```powershell
node scripts/admin-claim.mjs himadri-creation USER_UID revoke
```

Existing ID tokens can remain valid until expiry (typically about one hour); refresh-token revocation does not make every previously issued token disappear immediately. For urgent revocation, disable the user and temporarily tighten rules to reject that UID. Never expose this operator utility as a public API.

## Images and free-tier costs

The default free image option works with this static architecture: put optimized public images in `assets/blog/`, build and include them in a reviewed deployment, then select them or enter `/assets/blog/filename.webp` in the editor. Cover and article image selectors include existing gallery assets and `assets/blog/` images through the generated `dist/blog-images.json` catalog. No third-party subscription or billing is needed. These deployed files are public regardless of article status, so do not deploy confidential draft images. Upload widgets are disabled in Spark mode; dashboard file uploads are not functional on this plan.

As checked on 11 October 2026, [Firebase Storage requires Blaze billing](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024), including access to existing buckets. It cannot supply the requested browser uploads on Spark. No billing has been enabled. The build prevents enabling Storage uploads for this configured Spark project. An optional future upload rollout requires explicit approval for its plan/backend changes, a reviewed change to that guard, Storage provisioning/rules/CORS, and the genuine bucket configuration. Optional upload code is retained but has not been activated. Avoid Firebase download-token links for private images; they act as bearer URLs and bypass the publication-aware access model.

Verified free-tier references:

- [Firestore quotas](https://firebase.google.com/docs/firestore/quotas): one free database, 1 GiB storage, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day and 10 GiB outbound transfer/month. Queries, admin views, rule lookups and prerender exports consume quotas; offset-based export also charges skipped reads. This export is intended for a modest article count.
- [Firebase Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing): 10 GB stored and 10 GB/month transfer at no cost. Spark can block deployments at the storage limit and disable serving after the transfer allowance/grace period. Existing high-resolution galleries and 3D models can consume bandwidth quickly.
- [Authentication limits](https://firebase.google.com/docs/auth/limits): email/password sign-in avoids SMS charges, but account creation, email and sign-in limits still apply. Upgrading to Identity Platform changes applicable limits; no such upgrade was performed.
- No Cloud Functions, App Hosting, extensions or paid automation were enabled. Static Firebase Hosting fits this project and does not require a paid runtime.

## SEO and publication workflow

Client-generated metadata alone does not guarantee crawler indexing or social previews. Use `PRERENDER_BLOG=true` for production and rebuild/deploy after **every publish, edit, unpublish or delete**. Prerendered HTML is served before the JavaScript runs. The live client subsequently checks Firestore and removes unavailable articles from its UI.

**Static-content limitation:** changing Firestore immediately changes database and Storage access, but cannot remotely erase a previously deployed HTML snapshot or its old sitemap entry. Unpublish/delete is not fully reflected on static hosting until the rebuilt site is deployed; a visitor with JavaScript disabled could read the old public snapshot until then. Preview deployments may also retain old published snapshots and must be deleted when withdrawing content. Never treat unpublish as an instant confidentiality control for previously public material. Confidential drafts created as drafts are never exported. If automatic instantaneous removal across server HTML is mandatory, add a reviewed server-rendered hosting solution before launch; Firebase's paid backend services have not been enabled to supply that feature.

Unknown/unpublished article URLs fall through to the blog client, which presents an unavailable state and marks it noindex. Static fallback responses can be HTTP 200 (a soft 404); genuine dynamic 404 status codes need a server layer. Article snapshots, metadata and sitemap are generated only for published posts at build time.

## Deployment and staging

Do not run an unrestricted `firebase deploy`, because the optional Storage configuration is included but not authorized for activation. Select services explicitly.

```powershell
npx firebase login
npx firebase deploy --project himadri-creation --only firestore
# Set PRERENDER_BLOG=true once configuration, rules and indexes are ready.
npm run build
npx firebase hosting:channel:deploy review --project himadri-creation --expires 7d
```

Test the returned preview URL, add its hostname to Authentication authorized domains if needed, and verify the entire staging checklist below. A Hosting preview is separate from live hosting but uses the configured `himadri-creation` backend; test article changes affect that project's database. Use identifiable test articles and remove them after testing. Preview URLs are publicly accessible, so never put draft snapshots or secrets in them. No new project is required or authorized.

Only after the preview is accepted and production deployment is explicitly approved:

```powershell
npx firebase deploy --project himadri-creation --only hosting
```

Firebase serves static article directories before fallback rewrites. Clean URLs keep `/careers` and `/blog` working; `/booking.html` remains linked, and admin/article direct URLs have rewrites. `dist` is the only hosting directory. Scripts, operator credentials, tests and `.env` stay outside it. `.firebaserc` selects `himadri-creation`; commands also name it explicitly. Existing `firebase.json` and `.firebaserc` already supply local Hosting initialization. Skip reinitialization to preserve custom routing, or inspect `npx firebase init hosting --project himadri-creation` in a separate empty reference folder as explained in [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

To preserve the existing Netlify host, use `netlify.toml` (`npm run build`, publish `dist`) and set the same public build variables in its environment. `_redirects` provides clean/direct route fallbacks without forcing rewrites over prerendered files. Verify a Netlify deploy preview before updating the existing site. No Netlify account was accessed.

## GoDaddy domain migration — after testing and your approval

1. Keep the existing Netlify site and domain records active during preview testing. Record/export the existing DNS values so migration can be rolled back.
2. After approving migration, in Firebase Hosting select **Add custom domain**, enter `himadricreation.com`, and follow [Firebase's custom-domain wizard](https://firebase.google.com/docs/hosting/custom-domain). Use its advanced migration path when offered for an existing live domain.
3. In GoDaddy DNS, add only the ownership TXT record supplied by Firebase. Do not guess an IP address or copy records from unrelated tutorials.
4. Once ownership/certificate preparation is complete and the cutover is approved, replace only conflicting web-host A/AAAA/CNAME records with the exact records Firebase supplies. Preserve MX, mail, SPF/DKIM/DMARC and unrelated TXT records. Do not change nameservers unnecessarily.
5. Add `www.himadricreation.com` separately and select your preferred redirect behavior. Canonicals currently use the non-www HTTPS domain.
6. Wait for DNS propagation and Firebase-managed HTTPS provisioning, then verify root/www, certificate, careers/booking, direct article/admin routes and contact links. Keep rollback values until verification is complete. DNS and HTTPS can take time; consult the wizard's current guidance.

No DNS record has been edited and no migration has been initiated.

## Remaining acceptance checks

The Web App values are already supplied and local SDK initialization is verified. Remaining external setup requires initializing Authentication/EmailPassword, creating or enabling the default Firestore database/API, deploying rules/indexes, a Firebase account authorized for CLI operations, an administrator UID/claim, and deployment approval. Live admin login, CRUD, and security-rule enforcement cannot pass before those services are ready. Optional browser uploads additionally require an explicit billing decision. No credentials are needed for local build or demo rule tests.

Before launch, manually verify desktop/tablet/mobile layouts, navigation, reduced-motion scrolling, booking totals, gallery/lightbox/models, complete careers form/resume errors, real login/logout, a non-admin denial, image upload/cleanup if approved, article create/edit/preview/publish/unpublish/delete, full rebuild after publication changes, direct URL refresh, SEO/social previews and HTTPS. Do not send test applications to WhatsApp; inspect the prepared URL first.

Automated results and verification limits are recorded in `TESTING.md`.

Latest setup/configuration additions: `.firebaserc`, `scripts/firebase-config.mjs`, `scripts/firebase-status.mjs`, `scripts/static-images.mjs`, `src/image-library.js`, and `FIREBASE_SETUP.md`. The complete Firebase operator checklist is in [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

## Changed and new files

Latest refinement files: `index.html`, `booking.html`, `careers.html`, `blog.html`, `admin.html`, `src/styles.css`, `src/admin-app.js`, `src/blog-app.js`, `src/blog-core.js`, `scripts/build.mjs`, `scripts/check.mjs`, `tests/core.test.mjs`, `tests/ui.test.mjs`, `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, and the setup/testing guides. Added `.firebaserc`, `src/image-library.js`, `scripts/firebase-config.mjs`, `scripts/firebase-status.mjs`, `scripts/static-images.mjs`, `scripts/browser-check.mjs`, `tests/setup.test.mjs`, and `FIREBASE_SETUP.md`. The ignored local `.env` now contains the user-supplied public Web App configuration; no private keys are used. Existing Firestore/Storage rules and blog repository were retained and retested.

Modified: `index.html`, `booking.html`, `careers.html`, `src/styles.css`, `src/script.js`, `package.json`, `package-lock.json`, `robots.txt`, `sitemap.xml`. `gallery-data.json` is regenerated by the existing gallery command.

New: `blog.html`, `admin.html`, `src/navigation.js`, `src/new-menu.js`, `src/journal.css`, `src/firebase.js`, `src/blog-core.js`, `src/blog-store.js`, `src/blog-images.js`, `src/blog-view.js`, `src/blog-app.js`, `src/admin-app.js`, `scripts/build.mjs`, `scripts/serve.mjs`, `scripts/prerender.mjs`, `scripts/check.mjs`, `scripts/admin-claim.mjs`, `tests/core.test.mjs`, `tests/ui.test.mjs`, `tests/rules.test.mjs`, `.gitignore`, `.env.example`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `storage.cors.example.json`, `netlify.toml`, `_redirects`, `IMPLEMENTATION.md`, `TESTING.md`. `dist/` and `node_modules/` are generated and ignored.
