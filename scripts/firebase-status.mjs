import { existsSync } from 'node:fs';
import { readFirebaseConfig, missingFirebaseFields } from './firebase-config.mjs';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
if (existsSync('.env')) process.loadEnvFile('.env');
const config = readFirebaseConfig();
const missing = missingFirebaseFields(config);
if (missing.length) { console.log(JSON.stringify({ configured:false, missing },null,2)); process.exitCode=1; }
else {
  const app = initializeApp(config, 'himadri-read-only-check');
  const sdkInitialized = Boolean(getAuth(app) && getFirestore(app));
  async function request(url, options) {
    try {
      const response = await fetch(url,{...options,signal:AbortSignal.timeout(15000)});
      const body = await response.json();
      return { status:response.status, body };
    } catch { return { status:0, body:{error:{message:'Network request failed or timed out.'}} }; }
  }
  const endpoint=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents:runQuery?key=${encodeURIComponent(config.apiKey)}`;
  const query = status => ({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({structuredQuery:{from:[{collectionId:'posts'}],select:{fields:[{fieldPath:'status'}]},where:{fieldFilter:{field:{fieldPath:'status'},op:'EQUAL',value:{stringValue:status}}},limit:1}})});
  const [auth,published,drafts]=await Promise.all([
    request(`https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(config.apiKey)}`,{}),
    request(endpoint,query('published')),
    request(endpoint,query('draft'))
  ]);
  const failure = result => result.body?.error || (Array.isArray(result.body) ? result.body.find(row => row.error)?.error : null);
  const error = result => failure(result)?.message || failure(result)?.status || null;
  const summary={
    projectId:config.projectId,
    webConfigurationComplete:true,
    sdkInitialized,
    authentication:{httpStatus:auth.status,projectId:auth.body?.projectId || null,authorizedDomains:auth.body?.authorizedDomains || [],error:error(auth)},
    publishedRead:{httpStatus:published.status,readSucceeded:published.status===200,error:error(published)},
    draftPrivacy:{httpStatus:drafts.status,accessDenied:drafts.status===403,verified:published.status===200 && drafts.status===403,error:error(drafts)},
    storageEnabled:process.env.FIREBASE_STORAGE_ENABLED==='true',
    deployedByThisCommand:false
  };
  console.log(JSON.stringify(summary,null,2));
  await deleteApp(app);
  if(published.status!==200 || auth.status!==200 || drafts.status===200)process.exitCode=1;
}
