import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { build } from 'esbuild';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, query, where, limit, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject, listAll } from 'firebase/storage';
let env, admin, visitor, member, store;
const input = (id,slug,status='draft') => ({id,title:'Wedding story',slug,excerpt:'A lovely wedding.',content:'<p>Story</p>',coverImage:'/assets/logo-nav.jpeg',category:'Wedding Photography',author:'Studio',seoTitle:'',seoDescription:'',status,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),publishedAt:status==='published'?serverTimestamp():null});
async function create(db,id,slug,status='draft') {
  await runTransaction(db,async tx => {
    const reservation=doc(db,'slugs',slug); const found=await tx.get(reservation);
    if(found.exists()) throw new Error('Slug already reserved');
    tx.set(reservation,{postId:id}); tx.set(doc(db,'posts',id),input(id,slug,status));
  });
}
before(async () => {
  env=await initializeTestEnvironment({projectId:'demo-himadri',firestore:{host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')},storage:{host:'127.0.0.1',port:9199,rules:await readFile('storage.rules','utf8')}});
  admin=env.authenticatedContext('admin-user',{admin:true}); visitor=env.unauthenticatedContext(); member=env.authenticatedContext('regular-user');
  globalThis.__storeTestDb = admin.firestore();
  const result = await build({entryPoints:['src/blog-store.js'],bundle:true,format:'esm',platform:'node',packages:'external',write:false,plugins:[{name:'test-database',setup(builder){builder.onLoad({filter:/[\\/]firebase\.js$/},()=>({contents:'export const db = globalThis.__storeTestDb;',loader:'js'}));}}]});
  await writeFile('tests/.store-runtime.mjs',result.outputFiles[0].text);
  store = await import('./.store-runtime.mjs');
  await rm('tests/.store-runtime.mjs');
});
after(async () => {await env?.cleanup();});
test('claims enforce administrator writes; forged string claims do not grant access',async()=>{
  await assertFails(setDoc(doc(visitor.firestore(),'posts','bad'),input('bad','bad')));
  await assertFails(setDoc(doc(member.firestore(),'posts','bad'),input('bad','bad')));
  await assertFails(setDoc(doc(env.authenticatedContext('forged',{admin:'true'}).firestore(),'posts','bad'),input('bad','bad')));
  await assertSucceeds(create(admin.firestore(),'private','private-story'));
});
test('draft privacy, bounded public queries and private slug registry',async()=>{
  await assertFails(getDoc(doc(visitor.firestore(),'posts','private')));
  await assertFails(getDoc(doc(member.firestore(),'posts','private')));
  await assertSucceeds(getDoc(doc(admin.firestore(),'posts','private')));
  await assertFails(getDocs(collection(visitor.firestore(),'posts')));
  await assertFails(getDoc(doc(visitor.firestore(),'slugs','private-story')));
  await assertSucceeds(create(admin.firestore(),'public','public-story','published'));
  await assertSucceeds(getDoc(doc(visitor.firestore(),'posts','public')));
  const results=await assertSucceeds(getDocs(query(collection(visitor.firestore(),'posts'),where('status','==','published'),limit(9))));
  assert.equal(results.size,1);
  await assertFails(getDocs(query(collection(visitor.firestore(),'posts'),where('status','==','published'),limit(50))));
});
test('slugs cannot be stolen or changed; schema and timestamps are enforced',async()=>{
  await assert.rejects(create(admin.firestore(),'collision','public-story'));
  await assertFails(setDoc(doc(admin.firestore(),'slugs','public-story'),{postId:'collision'}));
  await assertFails(setDoc(doc(admin.firestore(),'posts','no-slug'),input('no-slug','no-slug')));
  const refPost=doc(admin.firestore(),'posts','private'); const old=(await getDoc(refPost)).data();
  await assertFails(setDoc(refPost,{...old,category:'Invalid',updatedAt:serverTimestamp()}));
  await assertFails(setDoc(refPost,{...old,slug:'other-slug',updatedAt:serverTimestamp()}));
  await assertFails(setDoc(refPost,{...old,admin:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(setDoc(refPost,{...old,title:'Edited title',updatedAt:serverTimestamp()}));
});
test('publish and unpublish change public read access immediately',async()=>{
  const postRef=doc(admin.firestore(),'posts','private'); const old=(await getDoc(postRef)).data();
  await assertSucceeds(setDoc(postRef,{...old,status:'published',publishedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
  await assertSucceeds(getDoc(doc(visitor.firestore(),'posts','private')));
  const published=(await getDoc(postRef)).data();
  await assertSucceeds(setDoc(postRef,{...published,status:'draft',publishedAt:null,updatedAt:serverTimestamp()}));
  await assertFails(getDoc(doc(visitor.firestore(),'posts','private')));
});
test('image upload ownership, MIME, size and draft/public access rules',async()=>{
  const bytes=new Uint8Array([82,73,70,70]); const path='blog/private/example.webp';
  await assertFails(uploadBytes(ref(member.storage(),path),bytes,{contentType:'image/webp'}));
  await assertFails(uploadBytes(ref(admin.storage(),'blog/private/unsafe.svg'),bytes,{contentType:'image/svg+xml'}));
  await assertFails(uploadBytes(ref(admin.storage(),'blog/private/large.webp'),new Uint8Array(5*1024*1024+1),{contentType:'image/webp'}));
  await assertFails(uploadBytes(ref(admin.storage(),'blog/missing/image.webp'),bytes,{contentType:'image/webp'}));
  await assertSucceeds(uploadBytes(ref(admin.storage(),path),bytes,{contentType:'image/webp'}));
  await assertFails(getBytes(ref(visitor.storage(),path)));
  await assertSucceeds(getBytes(ref(admin.storage(),path)));
  await assertSucceeds(uploadBytes(ref(admin.storage(),'blog/public/example.webp'),bytes,{contentType:'image/webp'}));
  await assertSucceeds(getBytes(ref(visitor.storage(),'blog/public/example.webp')));
  await assertFails(listAll(ref(visitor.storage(),'blog/public')));
  await assertFails(deleteObject(ref(member.storage(),'blog/public/example.webp')));
  await assertSucceeds(deleteObject(ref(admin.storage(),'blog/public/example.webp')));
});
test('deletion must release the slug in the same transaction',async()=>{
  await assertFails(deleteDoc(doc(admin.firestore(),'posts','public')));
  await assertFails(deleteDoc(doc(admin.firestore(),'slugs','public-story')));
  await assertSucceeds(runTransaction(admin.firestore(),async tx=>{tx.delete(doc(admin.firestore(),'posts','public'));tx.delete(doc(admin.firestore(),'slugs','public-story'));}));
  await assertSucceeds(create(admin.firestore(),'reused','public-story'));
});
test('actual blog repository creates, edits, publishes, paginates and deletes under rules',async()=>{
  const editable={title:'Repository story',slug:'repository-story',excerpt:'A real repository test.',content:'<p>Article content.</p>',coverImage:'/assets/logo-nav.jpeg',category:'Photography Tips',author:'Studio',seoTitle:'',seoDescription:'',status:'draft'};
  const id=await store.savePost(editable);
  assert.equal((await store.getPost(id)).status,'draft');
  assert.equal(await store.publishedPost(editable.slug),null);
  await store.savePost({...editable,title:'Edited repository story',status:'published'},id);
  assert.equal((await store.publishedPost(editable.slug)).title,'Edited repository story');
  const page=await store.listPublished('Photography Tips',null,1);
  assert.equal(page.posts[0].id,id); assert.equal(page.more,true);
  const next=await store.listPublished('Photography Tips',page.cursor,1); assert.equal(next.posts.length,0);
  await assert.rejects(store.savePost({...editable,slug:'changed-slug'},id),/permanent/);
  await assert.rejects(store.savePost(editable),/already in use/);
  await store.savePost({...editable,status:'draft'},id); assert.equal(await store.publishedPost(editable.slug),null);
  await store.deletePost(id); assert.equal(await store.getPost(id),null);
  const reused=await store.savePost(editable); assert.ok(reused); await store.deletePost(reused);
});
