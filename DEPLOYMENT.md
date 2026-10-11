# Hosting handoff

Build with `npm ci` followed by `npm run build`. Vercel uses `vercel.json` and serves `dist`, including public blog and admin route fallbacks.

Set the Firebase Web configuration environment variables listed in `.env.example` in the hosting project before building. Copy values from the existing project's Firebase Console. Keep `FIREBASE_STORAGE_ENABLED=false` and `PRERENDER_BLOG=false` until Firestore is enabled and tested. Never upload service-account keys or commit `.env`.

Vercel Hobby only supports personal, non-commercial use. This commercial photography site needs an appropriate Vercel plan; do not enable paid billing without the owner's explicit approval. Firebase Hosting is already configured as an alternative for the existing Spark project. Do not change GoDaddy DNS.

The CLI currently signs in as `surjendu-pal` and lists only `surjendu-pal's projects` (Hobby). The owner's screenshot shows another workspace, `himadri-creation`, which is not currently accessible through that CLI login.

Before calling the blog ready, create the Firestore database, publish the included restrictive rules and indexes, and grant the existing administrator the `admin` custom claim using the documented trusted Admin SDK script. See `FIREBASE_SETUP.md`. Creating an Authentication user alone does not grant administrator access. Add the final hosting hostname to Firebase Authentication's authorized domains and test login, draft privacy, publishing, public blog reads, Careers and booking WhatsApp links.

Verification: `npm run check`, `npm test`, `npm run test:browser`; Firestore/Storage rules can be checked against local emulators using `npm run test:rules`.

The owner selected Firebase Hosting on Spark for the launch. Vercel configuration is retained as an optional future migration. Source repository: https://github.com/Surjendu-Pal/himadri-creation (private). Production deployment requires fresh owner approval.

The latest instruction authorizes **preview only**. Production deployment requires a new approval. After Firebase login succeeds, run `npm run deploy:preview` to build and publish the `review` channel in `himadri-creation`, expiring after seven days. It uploads Hosting content only, does not publish Firestore/Storage rules, and suppresses automatic Authentication authorized-domain edits. Firebase preview channels share the configured live backend; do not create or change real articles merely to test the layout. Any authorization-domain change needed for authentication testing must be reviewed separately.

## Verified preview

Firebase CLI is authenticated as `himadricreation2018@gmail.com`; remote project access and the selected default both confirm `himadri-creation` (project number `68247301170`). Hosting preview `https://himadri-creation--review-hrcnm6us.web.app` was published successfully to `review`, expiring on 18 October 2026 at 09:10 IST. No live-channel deployment or Authentication domain synchronization was performed.

Twelve hosted page, route fallback, script, stylesheet, image-library and logo requests returned HTTP 200. This confirms Hosting delivery, not successful live article CRUD. Cloud Firestore API remains disabled. A read-only lookup confirms the existing administrator account is enabled but currently lacks `admin: true`. Database/rules/index setup and the administrator claim remain necessary before blog management can work.
