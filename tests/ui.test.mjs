import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const fixture = {id:'one',title:'Wedding story',slug:'wedding-story',excerpt:'Moments to keep.',content:'<p>A lovely memory.</p>',coverImage:'/assets/logo-nav.jpeg',category:'Wedding Photography',author:'Studio',status:'published',publishedAt:'2026-10-10',updatedAt:'2026-10-10'};
async function boot(page,path,overrides={}) {
  const result=await build({entryPoints:[`src/${page}-app.js`],bundle:true,format:'iife',write:false,loader:{'.css':'empty'},plugins:[{name:'ui-fixtures',setup(builder){
    builder.onLoad({filter:/[\\/]firebase\.js$/},()=>({contents:'export const configured = true; export const storageEnabled = false; export const storage = null; export const auth = { get currentUser() { return window.__fixture.user; } };',loader:'js'}));
    builder.onLoad({filter:/[\\/]blog-store\.js$/},()=>({contents:`export const listPublished=(...args)=>window.__fixture.listPublished(...args); export const publishedPost=(...args)=>window.__fixture.publishedPost(...args); export const allPosts=()=>window.__fixture.allPosts(); export const getPost=(...args)=>window.__fixture.getPost(...args); export const savePost=(...args)=>window.__fixture.savePost(...args); export const deletePost=()=>Promise.resolve();`,loader:'js'}));
    builder.onResolve({filter:/^firebase\/auth$/},()=>({path:'mock-auth',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export const onAuthStateChanged=(auth,fn)=>{window.__authCallback=fn;queueMicrotask(()=>fn(window.__fixture.user));}; export const getIdTokenResult=()=>Promise.resolve({claims:window.__fixture.claims}); export const signOut=()=>{window.__fixture.user=null;return window.__authCallback(null);}; export const signInWithEmailAndPassword=()=>Promise.reject(new Error('Invalid credentials'));`,loader:'js'}));
  }}]});
  const dom=new JSDOM(await readFile(`${page}.html`,'utf8'),{runScripts:'outside-only',url:`https://himadricreation.com${path}`,pretendToBeVisual:true});
  const win=dom.window;win.matchMedia=()=>({matches:false,addEventListener(){}});win.HTMLElement.prototype.scrollIntoView=function(){};
  win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  win.HTMLDialogElement.prototype.close=function(){this.open=false;};
  win.__fixture={user:null,claims:{},post:fixture,listPublished:async()=>({posts:[fixture],cursor:'next',more:false}),publishedPost:async()=>fixture,allPosts:async()=>[fixture],getPost:async()=>win.__fixture.post,savePost:async()=>fixture.id,images:[{src:'/assets/gallery/wedding/wedding%20(1).jpg',label:'Wedding / wedding (1).jpg'}],...overrides};
  win.fetch=async()=>({ok:true,json:async()=>win.__fixture.images});
  win.eval(result.outputFiles[0].text);
  for(let i=0;i<6;i++)await new Promise(resolve=>setImmediate(resolve));
  return dom;
}
test('blog lists featured articles, changes categories and loads another page',async()=>{
  const calls=[];
  const dom=await boot('blog','/blog',{listPublished:async(category,cursor)=>{calls.push([category,cursor]);return {posts:[fixture],cursor:'next',more:!cursor};}});
  const document=dom.window.document;
  assert.ok(document.querySelector('.featured-card'));
  document.querySelector('[data-category="Photography Tips"]').click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.at(-1)[0],'Photography Tips');
  assert.equal(document.querySelector('[data-category="Photography Tips"]').getAttribute('aria-pressed'),'true');
  document.querySelector('#load-more').click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.at(-1)[1],'next');assert.equal(document.querySelector('#load-more').hidden,true);
  dom.window.close();
});
test('article detail renders safe content, metadata and unavailable states',async()=>{
  const dom=await boot('blog','/blog/wedding-story');
  assert.equal(dom.window.document.querySelector('.article-heading h1').textContent,fixture.title);
  assert.equal(dom.window.document.querySelector('meta[property="og:type"]').content,'article');
  dom.window.close();
  const missing=await boot('blog','/blog/draft',{publishedPost:async()=>null});
  assert.match(missing.window.document.querySelector('#blog-root').textContent,/unavailable/);
  assert.equal(missing.window.document.querySelector('meta[name="robots"]').content,'noindex');missing.window.close();
});
test('admin routes require login and custom claims before displaying posts',async()=>{
  const anon=await boot('admin','/admin/blog');assert.ok(anon.window.document.querySelector('#login-form'));assert.equal(anon.window.document.querySelector('.admin-post'),null);anon.window.close();
  const member=await boot('admin','/admin/blog',{user:{uid:'member'},claims:{admin:false}});assert.match(member.window.document.querySelector('#admin-root').textContent,/does not have administrator/);assert.equal(member.window.document.querySelector('.admin-post'),null);member.window.close();
  const admin=await boot('admin','/admin/blog',{user:{uid:'admin'},claims:{admin:true}});assert.ok(admin.window.document.querySelector('.admin-post'));
  const search=admin.window.document.querySelector('#search');search.value='No matching article';search.dispatchEvent(new admin.window.Event('input'));assert.match(admin.window.document.querySelector('#admin-posts').textContent,/No articles found/);admin.window.close();
});
test('admin editor previews sanitized content and saves draft/published states',async()=>{
  const saves=[];
  const dom=await boot('admin','/admin/blog/edit/one',{user:{uid:'admin'},claims:{admin:true},savePost:async(data,id)=>{saves.push([data,id]);return id;}});
  const document=dom.window.document;
  assert.ok(document.querySelector('.ql-editor'));
  assert.equal(document.querySelector('[name="slug"]').readOnly,true);
  assert.equal(document.querySelector('#cover-upload').closest('label').hidden,true);
  document.querySelector('#preview').click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(document.querySelector('#preview-dialog').open,true);
  assert.match(document.querySelector('#preview-body').textContent,/A lovely memory/);
  document.querySelector('#close-preview').click();assert.equal(document.querySelector('#preview-dialog').open,false);
  document.querySelector('[name="title"]').value='Updated editor title';
  document.querySelector('#save-draft').click();for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(saves.at(-1)[0].status,'draft');assert.equal(saves.at(-1)[0].title,'Updated editor title');
  document.querySelector('#post-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true,bubbles:true}));
  for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(saves.at(-1)[0].status,'published');assert.equal(saves.at(-1)[1],'one');
  dom.window.close();
});
test('failed related-story queries preserve a valid public article',async()=>{
  const dom=await boot('blog','/blog/wedding-story',{listPublished:async()=>{throw new Error('Index not ready');}});
  assert.equal(dom.window.document.querySelector('.article-heading h1').textContent,fixture.title);
  assert.equal(dom.window.document.querySelector('meta[name="robots"]').content,'index, follow');
  assert.match(dom.window.document.querySelector('#related-grid').textContent,/Explore the journal/);
  dom.window.close();
});
test('pending admin dashboard and editor reads cannot redraw after logout',async()=>{
  for(const kind of ['dashboard','editor']) {
    let resolveRead;
    const deferred=new Promise(resolve=>{resolveRead=resolve;});
    const overrides={user:{uid:'admin'},claims:{admin:true},...(kind==='dashboard'?{allPosts:()=>deferred}:{getPost:()=>deferred})};
    const dom=await boot('admin',kind==='dashboard'?'/admin/blog':'/admin/blog/edit/one',overrides);
    dom.window.document.querySelector('#logout').click();
    resolveRead(kind==='dashboard'?[fixture]:fixture);
    for(let i=0;i<6;i++)await new Promise(resolve=>setImmediate(resolve));
    assert.ok(dom.window.document.querySelector('#login-form'));
    assert.equal(dom.window.document.querySelector('.admin-post,.ql-editor'),null);
    dom.window.close();
  }
});
test('Spark image pickers select existing assets while uploads remain disabled',async()=>{
  const dom=await boot('admin','/admin/blog/edit/one',{user:{uid:'admin'},claims:{admin:true}});
  const document=dom.window.document;
  const cover=document.querySelector('#cover-library'); assert.equal(cover.disabled,false);
  cover.selectedIndex=1;cover.dispatchEvent(new dom.window.Event('change'));
  assert.equal(document.querySelector('[name="coverImage"]').value,'/assets/gallery/wedding/wedding%20(1).jpg');
  const article=document.querySelector('#article-library');article.selectedIndex=1;article.dispatchEvent(new dom.window.Event('change'));
  assert.equal(document.querySelector('#article-image-url').value,cover.value);
  assert.equal(document.activeElement.id,'image-alt');
  assert.equal(document.querySelector('#cover-upload').closest('label').hidden,true);
  assert.equal(document.querySelector('#article-upload').closest('label').hidden,true);
  dom.window.close();
});
