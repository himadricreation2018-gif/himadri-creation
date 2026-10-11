# Verification results - 11 October 2026

## Passed locally

- `npm run build`: production bundles, existing gallery generation and the new image catalog succeeded. All 87 gallery images are preserved and available in the picker. The build now uses the user's public Web App configuration for `himadri-creation`. Article prerendering remains disabled until Firestore is available.
- `npm run check`: JavaScript syntax, required navigation and restored tagline across all five templates. No original lint configuration exists.
- `npm test`: **15 tests** covering careers validation/WhatsApp message construction; safe image URLs/long slugs; article validation; sanitized prerender content/metadata; export filters/errors; blog categories/load-more/details; admin claims; editor preview/draft/publish; pending requests after logout; related-story failure handling; Spark image selection; catalog generation; and official modular SDK initialization using synthetic demo values with Storage disabled.
- `npm run test:rules`: **7 demo-project emulator tests** covering server-enforced claims, unauthorized/forged-claim rejection, draft privacy, bounded published queries, private slug reservations, field/timestamp validation, slug uniqueness, publish/unpublish behavior, image upload constraints and actual blog repository create/edit/paginate/delete functions. Tests use `demo-himadri`, regardless of the real project's CLI default.
- `npm run test:browser`: **35 page/viewport checks** passed in the installed headless Chromium browser. Five pages (`/`, `/careers`, `/booking.html`, `/blog`, `/admin/login`) were checked at widths 1440, 1191, 1051, 1024, 768, 390 and 320 pixels. Header items fit without overlap, tagline appears above 1050px, mobile menus open/close with correct inert/expanded states, and Escape dismissal works. Apply Now reached the careers form at every width.
- Desktop hero measurements against the previous CSS applied to the same rendered page: **563px to 439px at 1440px (22.1% smaller)**, **535px to 422px at 1191px (21.2%)**, and **500px to 422px at 1051px (15.6%)**. Final desktop padding is 65px and heading size is 48-56px. No fixed height was introduced.
- Careers screenshots at all seven widths were generated in `test-results/`; desktop and mobile screenshots were visually inspected. Geometry results are in `test-results/browser-results.json`. These artifacts are ignored by source control.
- Local direct routes and bundles returned successful HTTP responses. Article fallback HTTP 200 does not mean an unavailable sample article exists.
- `npm audit --omit=dev`: **zero production dependency vulnerabilities**. Quill remains pinned to 2.0.2, content is sanitized, and a patched gRPC version is enforced.

## Actual Firebase checks - not successful yet

`npm run firebase:status` sent read-only requests using the supplied real public configuration:

| Check | Observed result | Required action |
| --- | --- | --- |
| Public configuration | Complete; project `himadri-creation` | Saved in ignored `.env` and compiled by the build |
| Authentication configuration | HTTP 200; project number `68247301170` | Authentication is active; administrator claim remains unverified |
| Published Firestore query | HTTP 403; Cloud Firestore API not used or disabled | Create/enable default Firestore database/API, then apply rules and indexes |
| Draft query | Same service-disabled HTTP 403 | Live draft security cannot be inferred from a disabled service |
| CLI account | No authorized account; app listing failed authentication | Authorized operator runs `npx firebase login` |
| Storage | Disabled in the application | Keep disabled on Spark |

No live article CRUD, administrator login/custom claim, rules/index deployment or live draft-privacy test has succeeded. Real Web App configuration alone does not activate its services. No service-account credentials are in the frontend or repository. Analytics and Messaging are not initialized merely because their optional IDs were supplied.

## Remaining limits

- The in-app browser connection failed with a tool environment error. Local headless Chromium was used afterward for actual rendered layout and interaction checks. Browser QA blocks external requests, sends no analytics/WhatsApp messages and does not establish real account login.
- DOM admin tests use controlled fixtures. Rules/repository tests use real local emulators. Neither proves the rules are deployed to the live project.
- No WhatsApp message was sent. The career test inspects a synthetic application's prepared destination/message; files must still be attached manually in WhatsApp.
- Optional upload rules were tested locally. Live uploads are unavailable on Spark and were not enabled or claimed functional.
- Article snapshots must be rebuilt/redeployed after publication changes. Previously public HTML can remain until that update; see `FIREBASE_SETUP.md` and `IMPLEMENTATION.md`.
- Firebase CLI's Storage runtime prints a Java null-pointer error during shutdown after successful tests; the script itself completes with seven passes and exit code zero. A lingering Windows demo Firestore process from an earlier run was identified and stopped.
- Full dependency audit still reports 11 development tooling issues, mainly Firebase CLI dependencies (four moderate, seven high). They are excluded from browser bundles. A forced CLI downgrade was not applied.
- No production or preview deployment, HTTPS migration, DNS edit, paid-service activation or billing change occurred. The live site remains untouched.

Run the manual Firebase/staging checklist in `FIREBASE_SETUP.md` after enabling the services.
## Preview-only follow-up

The default local project remains `himadri-creation`. Rechecked CLI authentication: no authorized accounts, with a pending login session in the current Windows profile. `firebase use` could not authenticate, so remote project access is not confirmed.

`npm run deploy:preview` rebuilt successfully, then failed before deployment with `Failed to authenticate, have you run firebase login?`. No preview URL was created. This command targets only the seven-day `review` Hosting channel in the explicit project and suppresses Authentication domain synchronization. Production deployment now requires fresh approval.

Syntax checks, 15 application tests and the demo emulator rules suite were rerun successfully. Live Firestore still reports its API disabled; the status utility now explicitly marks draft privacy as unverified unless published reads succeed and draft reads are denied.
