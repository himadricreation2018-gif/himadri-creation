import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { escapeHTML as e, safeImage } from '../src/blog-core.js';
const purify = createDOMPurify(new JSDOM('').window);
const clean = html => purify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style','iframe','form','input','button','video','audio'], FORBID_ATTR: ['style'] });
function decode(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  return null;
}
export async function fetchPublished(config, request = fetch) {
  const posts = [];
  let offset = 0;
  while (true) {
    const response = await request(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents:runQuery?key=${encodeURIComponent(config.apiKey)}`, {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId:'posts' }], where: { fieldFilter: { field: { fieldPath:'status' }, op:'EQUAL', value:{ stringValue:'published' } } }, orderBy: [{ field:{ fieldPath:'publishedAt' }, direction:'DESCENDING' }], limit:12, offset } })
    });
    if (!response.ok) throw new Error(`Published article export failed (${response.status}). Check project, rules and indexes. Deployment must not proceed with an incomplete export.`);
    const rows = (await response.json()).filter(row => row.document);
    for (const row of rows) {
      const post = Object.fromEntries(Object.entries(row.document.fields).map(([key,value]) => [key,decode(value)]));
      if (post.status !== 'published' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) throw new Error('Invalid published article in export.');
      posts.push(post);
    }
    if (rows.length < 12) break;
    offset += 12;
  }
  return posts;
}
export function renderArticle(template, post, posts = []) {
  const dom = new JSDOM(template); const document = dom.window.document;
  const canonical = `https://himadricreation.com/blog/${post.slug}`;
  document.title = `${post.seoTitle || post.title} | Himadri Creation`;
  document.querySelector('meta[name="description"]').content = post.seoDescription || post.excerpt;
  document.querySelector('link[rel="canonical"]').href = canonical;
  const image = new URL(safeImage(post.coverImage), canonical).href;
  for (const [name,content] of Object.entries({ 'og:title':post.seoTitle || post.title,'og:description':post.seoDescription || post.excerpt,'og:url':canonical,'og:image':image,'og:type':'article','twitter:card':'summary_large_image' })) {
    const meta = document.createElement('meta'); meta.setAttribute(name.startsWith('og:') ? 'property' : 'name', name); meta.content = content; document.head.append(meta);
  }
  const date = new Date(post.publishedAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  document.querySelector('#blog-root').innerHTML = `<article class="journal-article"><a class="read-more" href="/blog">← Back to Blog</a><header class="article-heading"><p class="eyebrow">${e(post.category)}</p><h1>${e(post.title)}</h1><p>By ${e(post.author)} · ${e(date)}</p><p class="article-deck">${e(post.excerpt)}</p></header><img class="article-cover" src="${e(image)}" alt="${e(post.title)}"><div class="article-content">${clean(post.content)}</div><section class="related"><h2>Related stories</h2>${posts.filter(p => p.category === post.category && p.id !== post.id).slice(0,3).map(p => `<p><a href="/blog/${e(p.slug)}">${e(p.title)}</a></p>`).join('')}</section></article>`;
  const schema = document.createElement('script'); schema.type = 'application/ld+json'; schema.textContent = JSON.stringify({ '@context':'https://schema.org','@type':'BlogPosting',headline:post.title,description:post.excerpt,image,author:{'@type':'Person',name:post.author},publisher:{'@type':'Organization',name:'Himadri Creation'},datePublished:post.publishedAt,dateModified:post.updatedAt,mainEntityOfPage:canonical }).replace(/</g,'\\u003c'); document.head.append(schema);
  document.querySelector('noscript')?.remove();
  return dom.serialize();
}
export async function prerender(config) {
  const posts = await fetchPublished(config);
  const template = await readFile('blog.html','utf8');
  for (const post of posts) {
    await mkdir(`dist/blog/${post.slug}`,{recursive:true});
    await writeFile(`dist/blog/${post.slug}/index.html`,renderArticle(template,post,posts));
  }
  const listing = new JSDOM(template); listing.window.document.querySelector('#blog-root').innerHTML = `<section class="journal-hero"><p class="eyebrow">THE HIMADRI JOURNAL</p><h1>Stories behind<br><em>the memories.</em></h1><p>Wedding inspiration and the craft of capturing life.</p></section><section class="post-grid">${posts.map(post => `<article class="journal-card"><img src="${e(safeImage(post.coverImage))}" alt="${e(post.title)}"><div class="card-copy"><p class="eyebrow">${e(post.category)}</p><h2><a href="/blog/${e(post.slug)}">${e(post.title)}</a></h2><p>${e(post.excerpt)}</p></div></article>`).join('')}</section>`;
  await writeFile('dist/blog.html',listing.serialize());
  const base = ['','booking.html','careers','blog'].map(p => `<url><loc>https://himadricreation.com/${p}</loc></url>`);
  await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${base.join('')}${posts.map(p => `<url><loc>https://himadricreation.com/blog/${e(p.slug)}</loc><lastmod>${e(p.updatedAt)}</lastmod></url>`).join('')}</urlset>`);
  console.log(`Prerendered ${posts.length} published articles. Drafts were not exported.`);
}
