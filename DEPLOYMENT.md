# Existing GitHub and Vercel handoff

Updated 11 October 2026. Website push and preview/production deployment are paused until authentication is verified. Do not create another repository or Vercel project. Do not change GoDaddy DNS, disconnect Netlify, or deploy to production.

## Secure GitHub sign-in

The requested repository is https://github.com/himadricreation2018-gif/himadri-creation. The current Surjendu-Pal account has pull access but permissions.push is false. The repository returned no refs when checked. No push was attempted.

In a terminal, run:

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

Complete GitHub's browser/device flow as himadricreation2018-gif. Keep passwords, one-time codes and tokens out of chat. Then verify:

```powershell
gh auth switch --hostname github.com --user himadricreation2018-gif
gh auth status
gh api repos/himadricreation2018-gif/himadri-creation --jq '.permissions.push'
gh auth setup-git
```

The push permission must be true. Alternatively, as repository owner open Settings > Collaborators > Add people, invite Surjendu-Pal and accept the invitation under that account. Verify permissions.push afterward.

The original origin remote was preserved. A separate requested remote points to the exact requested repository. Once access is verified, inspect remote refs again and push only to requested, without force. Use a review branch so a Git integration cannot accidentally deploy the production branch.

## Access the existing Vercel project

Run `npx vercel login` and complete the secure browser flow with the account that owns the existing Himadri project. Run `npx vercel whoami`, `npx vercel teams ls` and `npx vercel project ls --scope EXISTING_TEAM_SLUG`. Switch to the existing team with `npx vercel switch EXISTING_TEAM_SLUG` if necessary. The currently signed-in surjendu-pal account sees only unrelated projects and cannot verify the existing project's settings.

In Vercel Dashboard select the team containing the existing deployment, then open that existing project. Project Settings > Git > Connect Git Repository must select himadricreation2018-gif/himadri-creation. Authorize the Vercel GitHub app for that repository as its owner. Vercel documents that a collaborator on a personal repository cannot connect it to a project. Review production auto-deployment settings before linking; use a non-production review branch for preview work. Do not click New Project, Promote to Production, or change domains.

Configuration prepared locally:

- Framework: Other (static HTML plus esbuild; framework is null).
- Root directory: repository root.
- Install: npm ci. Build: npm run build. Output: dist.
- cleanUrls: true. Narrow blog and admin rewrites use extensionless destinations, as required with cleanUrls. Filesystem assets retain precedence. No catch-all rewrite or API rewrite.
- Existing homepage sections use /#about, /#services, /#gallery, /#packages and /#contact. They are anchors, not separate routed pages. Careers is /careers; booking is /booking; blog is /blog; articles use /blog/slug; admin uses /admin/login and /admin/blog.
- Add Firebase public Web App variables from .env.example to Vercel Preview environment securely using the existing Firebase project configuration. Keep FIREBASE_STORAGE_ENABLED=false. No Admin SDK credential belongs in Vercel client variables.
- PRERENDER_BLOG=false until published queries and indexes are ready. Enable it for crawlable article HTML/social metadata after checking the backend. Rebuild after content changes to refresh or remove static article pages.

After authentication is verified, link only the existing project. A preview CLI deployment must omit --prod and target the existing project/team; do not run it until the user confirms authentication is complete. No Vercel preview has been deployed during this task.

## Firebase status

The existing default database is Firestore Native, STANDARD, asia-south1, freeTier=true. Its API is enabled. The authorized rules/index update started before the user's request to pause deployments and completed successfully. Only Firestore rules/indexes were deployed; Hosting, Authentication domains and billing were not changed.

Read-only checks now show Firebase SDK initialization succeeds, public published reads return 200 and anonymous draft reads return 403. The ordered listing query initially reported that its composite index was still building; retest once indexes are READY. No articles were created or altered to test this.

Administrator setup is pending the exact existing user's email or UID; the user's supplied email was a placeholder. No user was created or granted privileges. The local utility requires trusted Application Default Credentials and an explicit exact UID. See FIREBASE_SETUP.md. It verifies the account, preserves unrelated claims and verifies the written admin:true claim. Website login/CRUD using the real administrator remains unverified.

Firebase Storage remains disabled. Free image support uses existing deployed assets, or new images added under assets/blog and deployed through the website; these files are public. Private draft images must not be added to static assets.

## Verification and remaining work

npm run build and npm run check passed. npm test: 20 passed. npm run test:rules: 8 passed including real repository CRUD against emulated rules and rejection of unauthorized writes. The rules emulator exited successfully but printed a Java shutdown warning. npm run test:browser: 63 page/viewport checks passed at 320-1440px, verifying footer image decoding, object-fit:cover, 16-20px desktop gaps, menu open/Escape/inert behavior and header fit. Static HTML asset references passed a case-sensitive filesystem audit.

The in-app browser connection failed with a sandbox metadata error; verification used the project's existing installed-browser test script. That browser suite blocks external requests, so it does not prove live login or Firebase CRUD. Careers form validation and WhatsApp message construction passed application tests; no external form message was sent.

Remaining: GitHub write access, correct Vercel account/project access, exact administrator identity and privileged credential availability, ready composite indexes, live administrator login/CRUD, review-branch push and Vercel preview route/asset checks. DNS and the live custom-domain deployment remain unchanged.

References: https://vercel.com/docs/project-configuration/vercel-json ; https://vercel.com/docs/git/vercel-for-github ; https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository ; https://firebase.google.com/docs/auth/admin/custom-claims
