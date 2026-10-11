import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { deleteApp } from 'firebase/app';
import { readFirebaseConfig, missingFirebaseFields } from '../scripts/firebase-config.mjs';
import { staticImages } from '../scripts/static-images.mjs';
test('project ID alone is never treated as complete Firebase configuration',()=>{
  const config=readFirebaseConfig({FIREBASE_PROJECT_ID:'himadri-creation'});
  assert.equal(config.projectId,'himadri-creation');assert.equal(config.apiKey,'');
  assert.deepEqual(missingFirebaseFields(config),['FIREBASE_API_KEY','FIREBASE_AUTH_DOMAIN','FIREBASE_APP_ID']);
});
test('image library finds deployed images, encodes filenames and ignores non-images',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'himadri-images-'));
  try {
    await mkdir(path.join(root,'blog'));await mkdir(path.join(root,'gallery','wedding'),{recursive:true});
    await writeFile(path.join(root,'blog','cover.webp'),'image');await writeFile(path.join(root,'blog','private.txt'),'ignored');
    await writeFile(path.join(root,'gallery','wedding','wedding (1).jpg'),'image');
    const images=await staticImages(root);
    assert.equal(images.length,2);
    assert.ok(images.some(image=>image.src==='/assets/gallery/wedding/wedding%20(1).jpg'));
    assert.ok(images.every(image=>image.bytes===5));
  } finally {
    if (!path.resolve(root).startsWith(path.join(path.resolve(os.tmpdir()),'himadri-images-'))) throw new Error('Unexpected image test cleanup path.');
    await rm(root,{recursive:true,force:true});
  }
});
test('official modular SDK initializes a demo app only with complete configuration and leaves Storage disabled',async()=>{
  // These are synthetic demo values for local SDK initialization; no network request or live project is used.
  for(const complete of [false,true]) {
    const file=path.resolve(`tests/.firebase-runtime-${complete}.mjs`);
    const config=complete?{apiKey:'demo-api-key',authDomain:'demo-himadri.firebaseapp.com',projectId:'demo-himadri',appId:'demo-app-id'}:{projectId:'himadri-creation'};
    const result=await build({entryPoints:['src/firebase.js'],bundle:true,format:'esm',platform:'node',packages:'external',write:false,define:{__FIREBASE_CONFIG__:JSON.stringify(config),__STORAGE_ENABLED__:'false'}});
    let runtime;
    try {
      await writeFile(file,result.outputFiles[0].text);runtime=await import(pathToFileURL(file).href);
      assert.equal(runtime.configured,complete);assert.equal(runtime.storage,null);assert.equal(runtime.storageEnabled,false);
      if(complete){assert.equal(runtime.app.options.projectId,'demo-himadri');assert.ok(runtime.auth);assert.ok(runtime.db);}else{assert.equal(runtime.app,null);assert.equal(runtime.auth,null);assert.equal(runtime.db,null);}
    } finally {if(runtime?.app)await deleteApp(runtime.app);await rm(file,{force:true});}
  }
});
