import DOMPurify from 'dompurify';
import { escapeHTML as e, dateLabel, safeImage } from './blog-core.js';
export const sanitize = html => DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button', 'video', 'audio'], FORBID_ATTR: ['style'], ADD_ATTR: ['target'] });
export function card(post, featured = false) {
  return `<article class="journal-card ${featured ? 'featured-card' : ''}"><a href="/blog/${e(post.slug)}" tabindex="-1" aria-hidden="true"><img src="${e(safeImage(post.coverImage))}" alt="${e(post.title)}" loading="${featured ? 'eager' : 'lazy'}"></a><div class="card-copy"><p class="eyebrow">${e(post.category)}</p><p class="article-date">${e(dateLabel(post.publishedAt))}</p><h2><a href="/blog/${e(post.slug)}">${e(post.title)}</a></h2><p>${e(post.excerpt)}</p><a class="read-more" href="/blog/${e(post.slug)}">Read the story <span aria-hidden="true">↗</span></a></div></article>`;
}
export function article(post) {
  return `<a class="read-more" href="/blog">← Back to Blog</a><header class="article-heading"><p class="eyebrow">${e(post.category)}</p><h1>${e(post.title)}</h1><p>By ${e(post.author)} <span aria-hidden="true">·</span> ${e(dateLabel(post.publishedAt))}</p><p class="article-deck">${e(post.excerpt)}</p></header><img class="article-cover" src="${e(safeImage(post.coverImage))}" alt="${e(post.title)}"><div class="article-content">${sanitize(post.content)}</div>`;
}
export function metadata(post) {
  const canonical = `https://himadricreation.com/blog/${post.slug}`;
  document.title = `${post.seoTitle || post.title} | Himadri Creation`;
  const values = { description: post.seoDescription || post.excerpt, 'og:title': post.seoTitle || post.title, 'og:description': post.seoDescription || post.excerpt, 'og:image': new URL(safeImage(post.coverImage), canonical).href, 'og:url': canonical, 'og:type': 'article', 'twitter:card': 'summary_large_image' };
  for (const [key, value] of Object.entries(values)) {
    let tag = document.querySelector(`meta[${key.startsWith('og:') ? 'property' : 'name'}="${key}"]`);
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute(key.startsWith('og:') ? 'property' : 'name', key); document.head.append(tag); }
    tag.content = value;
  }
  document.querySelector('link[rel="canonical"]').href = canonical;
  const schema = document.createElement('script'); schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt, image: values['og:image'], author: { '@type': 'Person', name: post.author }, publisher: { '@type': 'Organization', name: 'Himadri Creation' }, datePublished: post.publishedAt?.toDate?.().toISOString(), dateModified: post.updatedAt?.toDate?.().toISOString(), mainEntityOfPage: canonical });
  document.querySelectorAll('script[type="application/ld+json"]').forEach(tag => tag.remove()); document.head.append(schema);
}
