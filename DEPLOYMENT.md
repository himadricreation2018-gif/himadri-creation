# Hosting handoff

Build with `npm ci` followed by `npm run build`. Vercel uses `vercel.json` and serves `dist`, including public blog and admin route fallbacks.

Set the Firebase Web configuration environment variables listed in `.env.example` in the hosting project before building. Copy values from the existing project's Firebase Console. Keep `FIREBASE_STORAGE_ENABLED=false` and `PRERENDER_BLOG=false` until Firestore is enabled and tested. Never upload service-account keys or commit `.env`.

Vercel Hobby only supports personal, non-commercial use. This commercial photography site needs an appropriate Vercel plan; do not enable paid billing without the owner's explicit approval. Firebase Hosting is already configured as an alternative for the existing Spark project. Do not change GoDaddy DNS.

The CLI currently signs in as `surjendu-pal` and lists only `surjendu-pal's projects` (Hobby). The owner's screenshot shows another workspace, `himadri-creation`, which is not currently accessible through that CLI login.

Before calling the blog ready, create the Firestore database, publish the included restrictive rules and indexes, and grant the existing administrator the `admin` custom claim using the documented trusted Admin SDK script. See `FIREBASE_SETUP.md`. Creating an Authentication user alone does not grant administrator access. Add the final hosting hostname to Firebase Authentication's authorized domains and test login, draft privacy, publishing, public blog reads, Careers and booking WhatsApp links.

Verification: `npm run check`, `npm test`, `npm run test:browser`; Firestore/Storage rules can be checked against local emulators using `npm run test:rules`.

The owner selected Firebase Hosting on Spark for the launch. Vercel configuration is retained as an optional future migration. Source repository: https://github.com/Surjendu-Pal/himadri-creation (private). Production deployment is pending Firebase CLI sign-in.
