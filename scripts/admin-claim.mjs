// Trusted local operator only. Never import this script from src/ or serve it.
import { initializeApp, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, relative, isAbsolute, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

class SetupError extends Error {}

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const usage = 'Usage: node scripts/admin-claim.mjs himadri-creation EXACT_UID check|grant|revoke [--apply]';

export function validateInvocation(args, expectedProject) {
  const [projectId, uid, action, ...flags] = args;
  if (!projectId || !uid || !['check', 'grant', 'revoke'].includes(action) ||
      flags.some(flag => flag !== '--apply') || flags.length > 1) throw new SetupError(usage);
  if (projectId !== expectedProject) throw new SetupError('Project must match the existing default project in .firebaserc.');
  if (uid.length > 128 || uid.trim() !== uid || /^(USER_UID|EXACT_UID|YOUR_UID)$/i.test(uid)) {
    throw new SetupError('Copy the exact existing User UID from Firebase Authentication > Users.');
  }
  if (action !== 'check' && !flags.includes('--apply')) {
    throw new SetupError('No change made. Run check first, then add --apply to authorize the selected UID change.');
  }
  return { projectId, uid, action, apply: flags.includes('--apply') };
}

export async function changeAdminClaim(auth, uid, action, { apply = false } = {}) {
  if (!['check', 'grant', 'revoke'].includes(action)) throw new SetupError('Unknown action.');
  if (action !== 'check' && !apply) throw new SetupError('Explicit --apply is required for a claim change.');
  const user = await auth.getUser(uid);
  if (user.uid !== uid) throw new SetupError('User lookup did not return the exact requested UID.');
  const report = record => ({ uid: record.uid, email: record.email || null, disabled: Boolean(record.disabled), admin: record.customClaims?.admin === true });
  if (action === 'check') return { ...report(user), changed: false };
  if (action === 'grant' && user.disabled) throw new SetupError('Cannot grant administrator access to a disabled user.');
  const claims = { ...(user.customClaims || {}) };
  const unchanged = action === 'grant' ? claims.admin === true : !Object.hasOwn(claims, 'admin');
  if (unchanged) return { ...report(user), changed: false };
  if (action === 'grant') claims.admin = true;
  else delete claims.admin;
  if (Buffer.byteLength(JSON.stringify(claims), 'utf8') > 1000) throw new SetupError('Merged custom claims exceed Firebase\'s 1000-byte limit.');
  await auth.setCustomUserClaims(uid, claims);
  if (action === 'revoke') await auth.revokeRefreshTokens(uid);
  const verified = await auth.getUser(uid);
  if (verified.uid !== uid || (action === 'grant' ? verified.customClaims?.admin !== true : Object.hasOwn(verified.customClaims || {}, 'admin'))) {
    throw new SetupError('Claim write could not be verified. Run check before retrying.');
  }
  return { ...report(verified), changed: true };
}

async function main() {
  const rc = JSON.parse(await readFile(resolve(workspace, '.firebaserc'), 'utf8'));
  const { projectId, uid, action, apply } = validateInvocation(process.argv.slice(2), rc.projects?.default);
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new SetupError('Remove FIREBASE_AUTH_EMULATOR_HOST before setting up the real administrator.');
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credentialPath = await realpath(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const inside = relative(await realpath(workspace), credentialPath);
    if (inside === '' || (inside !== '..' && !inside.startsWith(`..${sep}`) && !isAbsolute(inside))) {
      throw new SetupError('Store Google credentials outside this repository and its deployed assets.');
    }
    const credential = JSON.parse(await readFile(credentialPath, 'utf8'));
    if (credential.type === 'service_account' && credential.project_id !== projectId) {
      throw new SetupError('The service-account file belongs to a different project.');
    }
  }
  const app = initializeApp({ projectId, credential: applicationDefault() }, 'trusted-admin-setup');
  try {
    const result = await changeAdminClaim(getAuth(app), uid, action, { apply });
    console.log(JSON.stringify({ projectId, ...result }, null, 2));
    if (action === 'grant') console.log('Sign out of the website, then sign back in to receive the administrator claim in a new ID token.');
    if (action === 'revoke') console.log('New tokens lose administrator access. Existing ID tokens can remain valid until expiry (about one hour).');
  } finally { await deleteApp(app); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const code = typeof error.code === 'string' && /^[a-zA-Z0-9/_.-]+$/.test(error.code) ? ` (${error.code})` : '';
    console.error(error instanceof SetupError ? error.message : `Administrator setup failed${code}. Check the credential and IAM steps in FIREBASE_SETUP.md. Credentials and provider details are not printed.`);
    process.exitCode = 1;
  });
}
