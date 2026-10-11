import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInvocation, changeAdminClaim } from '../scripts/admin-claim.mjs';

function account(overrides = {}) {
  let user = { uid: 'existing-user', email: 'operator@example.test', disabled: false, customClaims: { editor: true }, ...overrides };
  const writes = [], revocations = [];
  return { writes, revocations,
    getUser: async uid => { assert.equal(uid, 'existing-user'); return structuredClone(user); },
    setCustomUserClaims: async (uid, claims) => { writes.push({ uid, claims }); user.customClaims = claims; },
    revokeRefreshTokens: async uid => revocations.push(uid)
  };
}

test('administrator CLI refuses wrong projects, placeholders and writes without --apply', () => {
  for (const args of [[], ['other-project','existing-user','grant','--apply'], ['himadri-creation','USER_UID','grant','--apply'], ['himadri-creation','existing-user','grant'], ['himadri-creation','existing-user','grant','--force']]) {
    assert.throws(() => validateInvocation(args, 'himadri-creation'));
  }
  assert.deepEqual(validateInvocation(['himadri-creation','existing-user','check'], 'himadri-creation'), { projectId:'himadri-creation', uid:'existing-user', action:'check', apply:false });
});

test('read-only check never mutates the existing account', async () => {
  const auth = account();
  const report = await changeAdminClaim(auth, 'existing-user', 'check');
  assert.equal(report.admin, false); assert.equal(report.changed, false);
  assert.equal(auth.writes.length, 0);
  await assert.rejects(changeAdminClaim(auth, 'existing-user', 'grant'), /--apply/);
  assert.equal(auth.writes.length, 0);
});

test('grant preserves unrelated claims, verifies exact UID and is safe to repeat', async () => {
  const auth = account({ customClaims: { admin:'true', editor:true, organization:{ role:'author' } } });
  const result = await changeAdminClaim(auth, 'existing-user', 'grant', { apply:true });
  assert.equal(result.admin, true); assert.equal(result.changed, true);
  assert.deepEqual(auth.writes, [{ uid:'existing-user', claims:{ admin:true, editor:true, organization:{ role:'author' } } }]);
  assert.equal((await changeAdminClaim(auth, 'existing-user', 'grant', { apply:true })).changed, false);
  assert.equal(auth.writes.length, 1);
});

test('grant fails closed for missing, mismatched or disabled users and oversized claims', async () => {
  await assert.rejects(changeAdminClaim({ getUser:async()=>{ throw new Error('User not found'); } }, 'existing-user', 'grant', { apply:true }), /not found/);
  for (const overrides of [{ uid:'another-user' }, { disabled:true }, { customClaims:{ note:'x'.repeat(1000) } }]) {
    const auth = account(overrides);
    await assert.rejects(changeAdminClaim(auth, 'existing-user', 'grant', { apply:true }));
    assert.equal(auth.writes.length, 0);
  }
  const auth = account(); auth.setCustomUserClaims = async () => {};
  await assert.rejects(changeAdminClaim(auth, 'existing-user', 'grant', { apply:true }), /could not be verified/);
});

test('revoke removes only admin and revokes refresh tokens', async () => {
  const auth = account({ customClaims:{ admin:true, editor:true } });
  assert.equal((await changeAdminClaim(auth, 'existing-user', 'revoke', { apply:true })).admin, false);
  assert.deepEqual(auth.writes, [{ uid:'existing-user', claims:{ editor:true } }]);
  assert.deepEqual(auth.revocations, ['existing-user']);
});
