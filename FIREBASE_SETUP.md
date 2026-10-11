# Firebase setup for Himadri Creation

Use the existing **Himadri Creation** project, ID **`himadri-creation`**, on **Spark**. Open [its Firebase Console](https://console.firebase.google.com/project/himadri-creation/overview). This guide does not require another project, billing activation, GoDaddy DNS changes, or deployment of the existing live website.

## Current integration status

The actual public Web App configuration supplied by the user is saved in the ignored `.env` file, and the rebuilt modular Firebase SDK initializes for **`himadri-creation`**. `.firebaserc` selects that existing project. **The frontend is configured and Authentication is active; live Firestore remains disabled.** No further configuration values need to be supplied for the current checkout.

Read-only `npm run firebase:status` returned:

| Check | Actual result | Required action |
| --- | --- | --- |
| SDK/Web App configuration | Complete; local SDK initialization succeeds | Preserve the supplied `.env` values |
| Authentication | HTTP 200; existing administrator shown in the Console | Sign in with the password created for that Firebase user; assign the administrator claim |
| Published Firestore query | HTTP 403; Cloud Firestore API has not been used in this project or is disabled | Create/reuse the default database and activate its API if needed |
| Draft Firestore query | The same service-disabled HTTP 403 | Live draft privacy remains unverified; test again after database/rules setup |
| Firebase CLI account | No authorized accounts | Sign in before CLI rule/index or Hosting operations |

The draft request's 403 is **not proof that security rules denied a draft**: the Firestore service is unavailable before rule evaluation can be verified. App/service console inspection remains unavailable without an authorized CLI account. No live Firebase service was enabled by this session. Storage remains disabled locally; no new project, paid service, deployment, billing, or DNS change was made.

## Preserve the supplied Web App configuration

The current checkout already has the supplied configuration. Do not replace `.env` with the blank example or register a duplicate app. For a fresh checkout or a future configuration review:

1. In the same project's **Project settings → General → Your apps**, reuse the existing Web App's SDK configuration.
2. Only if the Console confirms that no Web App exists, choose **Project Overview → Add app → Web**, enter an app nickname, and register it inside `himadri-creation`. Hosting setup during registration is optional; do not deploy there.
3. Copy the genuine public values from that panel into `.env`. Create the file only if it does not already exist:

```powershell
npm ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

| Environment variable | Value or purpose |
| --- | --- |
| `FIREBASE_API_KEY` | Exact `apiKey` from the existing Web App |
| `FIREBASE_AUTH_DOMAIN` | Exact `authDomain` from that configuration |
| `FIREBASE_PROJECT_ID` | `himadri-creation` |
| `FIREBASE_APP_ID` | Exact registered Web App `appId` |
| `FIREBASE_STORAGE_BUCKET` | Supplied bucket identifier is preserved; Storage is not initialized on Spark |
| `FIREBASE_MESSAGING_SENDER_ID` | Optional supplied `messagingSenderId`; Messaging is not imported or enabled |
| `FIREBASE_MEASUREMENT_ID` | Optional supplied `measurementId`; Analytics is not imported or enabled |
| `FIREBASE_STORAGE_ENABLED` | Keep `false` on Spark |
| `PRERENDER_BLOG` | Keep `false` until Firestore setup succeeds; enable for article HTML/SEO exports |

Do not guess these values or paste service-account credentials/private keys into `.env`, chat, or website files. Web App values are public configuration compiled into browser bundles; database access is controlled by claims and security rules. Rebuild after changing them. The build rejects enabling Storage uploads for the configured Spark project.

## Authentication and the first administrator

In **Authentication**, click **Get started** if initialization is required. Then in **Sign-in method**, enable **Email/Password**. In **Users**, add the first administrator with a strong password and copy the user's UID. There is no public administrator registration page. Configure Authentication authorized domains for local testing, any preview hostname that requires authorization, and the eventual production hostname.

The operator must assign the boolean custom claim `admin: true` from a trusted environment. Use Application Default Credentials with permission to administer Firebase Authentication in `himadri-creation`; Firebase CLI login alone does not supply Admin SDK credentials. An operator with Google Cloud CLI can use `gcloud auth application-default login`. Alternatively, point `GOOGLE_APPLICATION_CREDENTIALS` at an authorized service-account file stored **outside this repository**. The existing utility merges existing claims:

```powershell
node scripts/admin-claim.mjs himadri-creation USER_UID grant
```

Sign out and back in, then visit `/admin/login`. Admin routes check the claim, and Firestore rules independently require it for writes and private reads. A regular signed-in user cannot manage posts. Custom claims must be set through a privileged Admin SDK environment. [Firebase custom claims documentation](https://firebase.google.com/docs/auth/admin/custom-claims).

To revoke access later, run `node scripts/admin-claim.mjs himadri-creation USER_UID revoke`. Existing ID tokens can remain valid until expiry; urgent revocation also requires disabling the user and tightening rules for that UID. Do not expose the operator script through a public endpoint.

## Firestore, rules, and indexes

Reuse the project's existing default Firestore database if present. Otherwise, choose **Firestore Database → Create database**, **Standard edition**, and **production mode** within `himadri-creation`. Select the location deliberately. If the Console still reports the API disabled, enable **Cloud Firestore API** for this same project in Google Cloud's API Library and retry the status command. Activating the API does not mean the database, rules, or indexes are already ready. Do not replace existing rules until reviewing them if this project already supports another application.

The repository's [firestore.rules](firestore.rules) validates allowed post fields, lengths, categories, timestamps, and `draft`/`published` status. Public visitors can read only published posts; collection queries require a limit of at most 12. Only a boolean administrator claim allows private reads or mutations. Other paths are denied. [firestore.indexes.json](firestore.indexes.json) supplies the public list/category/slug indexes.

`posts/{id}` stores `title`, `slug`, `excerpt`, sanitized rich-text `content`, `coverImage`, `category`, `author`, `seoTitle`, `seoDescription`, `status`, `createdAt`, `updatedAt`, `publishedAt`, plus the document's `id`. Timestamps use Firestore server values. Draft publication dates are null. The editor reserves `slugs/{slug}` and writes the article atomically; existing slugs stay permanent, and deletion releases the reservation. Use the editor instead of creating incomplete posts manually in the console.

Review and publish [firestore.rules](firestore.rules) through the Console's **Firestore → Rules** tab, and create the indexes from [firestore.indexes.json](firestore.indexes.json) through **Indexes**. Alternatively, sign into the authorized CLI account and deploy the repository's Firestore configuration:

```powershell
npx firebase login
npx firebase apps:list --project himadri-creation
npx firebase deploy --project himadri-creation --only firestore
```

These are manual commands, not actions already performed. Wait for indexes to finish building before testing the journal. [storage.rules](storage.rules) is retained for the optional upload implementation; do not deploy or activate Storage on Spark. Avoid unrestricted `firebase deploy`, which could include services outside this setup.

## Images while staying on Spark

The editor includes cover and article image selectors populated from existing `assets/gallery/` images and any public images in `assets/blog/`. `scripts/static-images.mjs` builds the catalog at `dist/blog-images.json`. Select an image for the cover, or select an article image, enter descriptive text, and click **Insert image**. You can also enter an existing `/assets/...` path or HTTPS image reference.

For a new image, optimize it locally, add it to `assets/blog/`, rebuild, and include it in the next reviewed site deployment. This updates the catalog. Static images are public regardless of draft status; keep confidential draft images outside the deployed assets.

**Uploading new files directly through the dashboard is unavailable on Spark.** As verified on 11 October 2026, Cloud Storage for Firebase requires the Blaze plan, including access to existing buckets; the current requirement took effect starting 3 February 2026. No billing was enabled. Dashboard uploads would need separately approved Storage billing or an additional storage/backend solution. [Official Firebase Storage billing FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

Spark Authentication, Firestore, and Hosting still have quotas; large galleries, frequent blog reads, and rebuild exports consume them. Review [Firestore quotas](https://firebase.google.com/docs/firestore/quotas), [Hosting usage limits](https://firebase.google.com/docs/hosting/usage-quotas-pricing), and [Authentication limits](https://firebase.google.com/docs/auth/limits) before launch. No Cloud Functions, App Hosting, extensions, or paid runtime are required by this static site.

## Run and test locally

Use Node 22+ and Java 21+ for emulator tests:

```powershell
npm ci
npm start
```

Open `http://127.0.0.1:8000/`, `/careers`, `/blog`, and `/admin/login`. `npm start` builds and serves `dist`; rebuild and reload after source/configuration changes. The current supplied configuration shows the admin login interface, and Authentication is now active. Administrator access requires the custom claim; journal reads require the Firestore setup above.

```powershell
npm run build
npm run check
npm test
npm run test:rules
npm run firebase:status
```

`check` provides syntax/shared-navigation checks; there was no original lint configuration. Rules tests use the isolated `demo-himadri` emulator project and perform no live project writes. Tests and their actual results are recorded separately in [TESTING.md](TESTING.md); running emulator tests does not prove live project setup succeeded.

`firebase:status` makes read-only live Authentication and one-record published/draft Firestore requests using the public Web App configuration. It prints no API key and performs no deployments or service activation. It currently exits unsuccessfully because the live services are unavailable. Rerun it after Console setup; a draft rejection must come from deployed rules, rather than an API/database setup error, before claiming live draft privacy works.

## Firebase Hosting preview

[firebase.json](firebase.json) already points Hosting at `dist`, enables clean URLs, retains blog/admin rewrites, and sets admin noindex/no-store headers. [.firebaserc](.firebaserc) already selects the existing project. **Skip `firebase init` in this prepared repository** to preserve those settings.

If you need to inspect the initialization wizard, run the following in a separate empty reference directory, select the existing project, use `dist` as the public directory, decline the automatic single-page rewrite and GitHub deployment, and do not overwrite files or copy generated defaults over this repository's routing configuration:

```powershell
npx firebase init hosting --project himadri-creation
```

The prepared configuration is sufficient for a preview after Authentication/Firestore/rules/index setup:

```powershell
npx firebase login
# Set PRERENDER_BLOG=true in .env once rules and indexes are ready.
npm run build
npx firebase hosting:channel:deploy review --project himadri-creation --expires 7d
```

Open the returned preview URL. A Hosting preview uses the same configured `himadri-creation` backend; editing articles there changes that project's data. Use clearly identified test articles, never private snapshots, and remove tests after checking them. Preview URLs are publicly accessible and expire independently of the live site. [Firebase preview-channel documentation](https://firebase.google.com/docs/hosting/test-preview-deploy).

Build and redeploy after every publication change when prerendering is enabled. Firestore immediately denies draft reads, but an older deployed article HTML snapshot or sitemap remains until redeployment; delete old preview channels when withdrawing content. Unknown article fallbacks may return HTTP 200 with an unavailable/noindex state. See [IMPLEMENTATION.md](IMPLEMENTATION.md) for the full static SEO limitation.

Production Hosting deployment is a separate action, **only after explicit approval**:

```powershell
npx firebase deploy --project himadri-creation --only hosting
```

Do not change GoDaddy records or the live site's existing deployment. This guide has not performed a preview or production deployment.

## Manual acceptance checklist

- Preserve the supplied Web App configuration for `himadri-creation`; SDK initialization is already verified locally.
- Confirm Email/Password, the first user, its administrator claim, deployed rules, and completed indexes.
- Rerun `npm run firebase:status`; confirm Authentication and published reads succeed and draft reads fail for the security-rule reason rather than a disabled-service error.
- Verify real login/logout, rejection of a signed-in non-admin, article creation/editing/preview, search/filter, cover/article image selection, and confirmed deletion.
- Verify an anonymous visitor cannot read a draft; publish it, check `/blog` and `/blog/:slug`, unpublish, and check denial again. Rebuild/redeploy static exports after changes.
- Refresh `/blog/:slug`, `/admin/blog`, `/admin/blog/new`, and `/admin/blog/edit/:id` directly on the preview website.
- Check desktop/tablet/mobile navigation and tagline, compact Careers hero, Apply Now scrolling, application validation, booking, gallery, and prepared WhatsApp URLs without sending test messages.
- Confirm the Firebase Console still shows Spark; no Storage, billing, Cloud Functions, DNS, or production deployment changes.

Relevant implementation files: [src/firebase.js](src/firebase.js), [scripts/firebase-config.mjs](scripts/firebase-config.mjs), [scripts/firebase-status.mjs](scripts/firebase-status.mjs), [src/blog-store.js](src/blog-store.js), [src/admin-app.js](src/admin-app.js), [src/blog-app.js](src/blog-app.js), [src/image-library.js](src/image-library.js), [scripts/static-images.mjs](scripts/static-images.mjs), [scripts/admin-claim.mjs](scripts/admin-claim.mjs), [.env.example](.env.example), [firestore.rules](firestore.rules), [firestore.indexes.json](firestore.indexes.json), [firebase.json](firebase.json), and [.firebaserc](.firebaserc).

## Authorized Firebase Hosting launch

The owner selected free Firebase Hosting for deployment. The source is backed up in the private GitHub repository https://github.com/Surjendu-Pal/himadri-creation. Firebase CLI authentication is still required; no production deployment has succeeded yet. After account authorization and project access verification, deploy only Hosting using `npx firebase deploy --project himadri-creation --only hosting`. This does not activate Storage or change GoDaddy DNS. Publishing Hosting alone does not complete the Firestore/admin setup.
