// Operator-only utility. Never include this file or credentials in client bundles.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
const [projectId, uid, action] = process.argv.slice(2);
if (!projectId || !uid || !['grant','revoke'].includes(action)) throw new Error('Usage: node scripts/admin-claim.mjs PROJECT_ID USER_UID grant|revoke');
initializeApp({ projectId, credential: applicationDefault() });
const user = await getAuth().getUser(uid);
const claims = { ...(user.customClaims || {}) };
if (action === 'grant') claims.admin = true; else delete claims.admin;
await getAuth().setCustomUserClaims(uid, claims);
if (action === 'revoke') await getAuth().revokeRefreshTokens(uid);
console.log(`Administrator claim ${action === 'grant' ? 'granted' : 'removed'}. Sign out and back in to refresh access.`);
