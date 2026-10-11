import { configured } from './firebase.js';
import { CATEGORIES, escapeHTML as e } from './blog-core.js';
import { listPublished, publishedPost } from './blog-store.js';
import { card, article, metadata } from './blog-view.js';
import './new-menu.js';
const root = document.querySelector('#blog-root');
let cursor = null, category = '', loading = false, generation = 0;
const slug = location.pathname.replace(/\/$/, '').match(/^\/blog\/([^/]+)$/)?.[1];
function message(text) { root.innerHTML = `<div class="journal-state" role="status"><h2>${e(text)}</h2><p>Explore our <a href="/index.html#gallery">gallery</a> or <a href="/booking.html">plan your shoot</a>.</p><a href="/blog">Back to Blog</a></div>`; }
async function load(reset = false) {
  if (loading && !reset) return;
  const token = reset ? ++generation : generation;
  loading = true;
  const button = document.querySelector('#load-more'); button.disabled = true; button.textContent = 'Loading stories…';
  if (reset) { cursor = null; document.querySelector('#post-grid').innerHTML = ''; document.querySelector('#featured').innerHTML = ''; }
  try {
    const result = await listPublished(category, cursor);
    if (token !== generation) return;
    cursor = result.cursor;
    const posts = [...result.posts];
    if (reset && !category && posts.length) document.querySelector('#featured').innerHTML = card(posts.shift(), true);
    document.querySelector('#post-grid').insertAdjacentHTML('beforeend', posts.map(p => card(p)).join(''));
    document.querySelector('#list-status').textContent = reset && !result.posts.length ? 'No stories in this category yet. Check back soon.' : '';
    button.hidden = !result.more;
  } catch { document.querySelector('#list-status').textContent = 'Stories could not be loaded. Please try again.'; button.hidden = false; }
  finally { if (token === generation) { loading = false; button.disabled = false; button.textContent = 'Load more stories'; } }
}
async function start() {
  if (slug) {
    if (!configured) { message('Our journal is coming soon.'); return; }
    // Remove any build snapshot while validating current publication status.
    root.innerHTML = '<p class="journal-state" role="status">Loading story…</p>';
    try {
      const post = await publishedPost(decodeURIComponent(slug));
      if (!post) { document.querySelector('meta[name="robots"]').content = 'noindex'; message('This story is unavailable.'); return; }
      root.innerHTML = `<article class="journal-article">${article(post)}<div class="share-links"><button class="btn ghost" id="share">Share story</button><a class="btn ghost" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(post.title + ' ' + location.href)}">WhatsApp</a><a class="btn ghost" target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}">Facebook</a></div></article><section class="related"><p class="eyebrow">Keep exploring</p><h2>More from the journal</h2><div id="related-grid" class="post-grid"></div></section>`;
      metadata(post);
      document.querySelector('#share').onclick = async () => {
        try { if (navigator.share) await navigator.share({ title: post.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); document.querySelector('#share').textContent = 'Link copied'; } } catch { /* User cancelled sharing. */ }
      };
      try {
        const related = await listPublished(post.category, null, 4);
        document.querySelector('#related-grid').innerHTML = related.posts.filter(p => p.id !== post.id).slice(0, 3).map(p => card(p)).join('');
      } catch {
        document.querySelector('#related-grid').innerHTML = '<p>More stories will be available soon. <a href="/blog">Explore the journal</a>.</p>';
      }
    } catch { document.querySelector('meta[name="robots"]').content = 'noindex'; message('This story could not be loaded. Please try again later.'); }
    return;
  }
  root.innerHTML = `<section class="journal-hero"><p class="eyebrow">THE HIMADRI JOURNAL</p><h1>Stories behind<br><em>the memories.</em></h1><p>Wedding inspiration, thoughtful advice and a closer look at the craft of capturing life.</p></section><div class="category-filters" role="group" aria-label="Filter stories">${['All stories', ...CATEGORIES].map((c,i) => `<button type="button" data-category="${i ? e(c) : ''}" aria-pressed="${!i}">${e(c)}</button>`).join('')}</div><section id="featured" aria-label="Featured story"></section><div id="list-status" role="status" aria-live="polite"></div><section id="post-grid" class="post-grid" aria-label="Journal stories"></section><div class="load-wrap"><button id="load-more" class="btn primary">Load more stories</button></div>`;
  document.querySelectorAll('[data-category]').forEach(button => button.onclick = () => {
    category = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    load(true);
  });
  document.querySelector('#load-more').onclick = () => load();
  if (!configured) {
    document.querySelector('#list-status').innerHTML = '<div class="journal-state"><h2>A new chapter is on its way.</h2><p>Our journal will open soon. In the meantime, explore our <a href="/index.html#gallery">gallery</a> or <a href="/booking.html">plan your shoot</a>.</p></div>';
    document.querySelector('#load-more').hidden = true;
    document.querySelectorAll('[data-category]').forEach(button => button.disabled = true);
    return;
  }
  await load(true);
}
start();
