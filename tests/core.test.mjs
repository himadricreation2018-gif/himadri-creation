import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { slugify, safeImage, validatePost, escapeHTML } from '../src/blog-core.js';
import { renderArticle, fetchPublished } from '../scripts/prerender.mjs';
const post = { id:'one', title:'A beautiful wedding', slug:'a-beautiful-wedding', excerpt:'Wedding memories.', content:'<h2>Our story</h2><p>Thoughtfully captured.</p>', coverImage:'/assets/logo-nav.jpeg', category:'Wedding Photography', author:'Himadri Creation', status:'published', publishedAt:'2026-10-10T10:00:00Z', updatedAt:'2026-10-10T10:00:00Z' };
test('slugs normalize punctuation and reject unsafe image protocols', () => {
  assert.equal(slugify('  Café & Wedding: 2026! '),'cafe-wedding-2026');
  assert.equal(slugify('a'.repeat(99)+' next'),'a'.repeat(99));
  for (const url of ['javascript:alert(1)','data:image/svg+xml,<svg>','//evil.example/a','/assets/../private','http://example.com/image']) assert.equal(safeImage(url),'');
  assert.equal(safeImage('/assets/blog/wedding.webp'),'/assets/blog/wedding.webp');
  assert.equal(safeImage('/assets/gallery/wedding/wedding (1).jpg'),'/assets/gallery/wedding/wedding%20(1).jpg');
  assert.equal(safeImage('/assets/%2e%2e/private'),'');
  assert.equal(safeImage('/assets/blog%2fprivate/image.jpg'),'');
  assert.equal(escapeHTML('<script>"'), '&lt;script&gt;&quot;');
});
test('article validation rejects incomplete input and invalid categories', () => {
  assert.equal(validatePost(post),post);
  assert.throws(() => validatePost({...post,title:''}));
  assert.throws(() => validatePost({...post,category:'Unapproved'}));
  assert.throws(() => validatePost({...post,slug:'../draft'}));
});
test('prerender supplies metadata, visible content, safe HTML and related links', async () => {
  const html = renderArticle(await readFile('blog.html','utf8'),{...post,content:'<p onclick="alert(1)">Hello</p><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">bad link</a>'},[{...post,id:'two',slug:'related-story'}]);
  const document = new JSDOM(html).window.document;
  assert.equal(document.querySelector('link[rel="canonical"]').href,'https://himadricreation.com/blog/a-beautiful-wedding');
  assert.equal(document.querySelector('meta[property="og:type"]').content,'article');
  assert.equal(document.querySelector('.article-content').textContent.includes('Hello'),true);
  assert.equal(document.querySelector('.article-content [onclick],.article-content [onerror],.article-content script,.article-content a[href^="javascript:"]'),null);
  assert.equal(JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@type'],'BlogPosting');
  assert.ok(document.querySelector('a[href="/blog/related-story"]'));
});
test('public prerender query filters published posts and fails closed on errors', async () => {
  let body;
  const result = await fetchPublished({projectId:'test',apiKey:'public'},async (url, options) => {body=JSON.parse(options.body);return {ok:true,json:async()=>[]};});
  assert.deepEqual(result,[]); assert.equal(body.structuredQuery.where.fieldFilter.value.stringValue,'published');
  assert.equal(body.structuredQuery.limit,12);
  await assert.rejects(fetchPublished({projectId:'test',apiKey:'public'},async()=>({ok:false,status:403})),/export failed/);
});
test('career validation preserves fields and constructs the existing WhatsApp application', async () => {
  const dom = new JSDOM(await readFile('careers.html','utf8'),{runScripts:'outside-only',url:'https://himadricreation.com/careers'});
  const window = dom.window; window.HTMLElement.prototype.scrollIntoView = function() {};
  let script = await readFile('src/careers.js','utf8');
  script = script.replace('window.location.href = whatsappURL;', 'window.__whatsappURL = whatsappURL;');
  window.eval(script);
  const form = window.document.querySelector('#careersForm');
  form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(window.__whatsappURL,undefined); assert.ok(form.querySelector('[aria-invalid="true"]'));
  const fields = {name:'Test Applicant',phone:'9876543210',email:'applicant@example.com',city:'Bankura',position:'Photographer',experience:'Fresher',qualification:'Diploma',skills:'Lightroom',whyHire:'I tell thoughtful stories.',portfolio:'https://example.com/portfolio',message:'Available to join.'};
  for (const [key,value] of Object.entries(fields)) form.elements.namedItem(key).value=value;
  form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  const url = new URL(window.__whatsappURL); assert.equal(url.origin+url.pathname,'https://wa.me/918327482228');
  const message=url.searchParams.get('text'); for (const value of Object.values(fields)) assert.ok(message.includes(value));
  assert.ok(message.includes('Source: Website Careers Form'));
  assert.ok(window.document.querySelector('.apply-now[href="#careersForm"]'));
  form.elements.namedItem('phone').value='123'; window.__whatsappURL=undefined;
  form.dispatchEvent(new window.Event('submit',{cancelable:true})); assert.equal(window.__whatsappURL,undefined);
});
