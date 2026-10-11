export const CATEGORIES = ['Wedding Photography', 'Pre-Wedding Shoots', 'Photography Tips', 'Cinematography', 'Behind the Scenes'];
export const slugify = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100).replace(/-+$/, '');
export const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function safeImage(value) {
  if (typeof value !== 'string') return '';
  if (value.startsWith('/assets/')) {
    try {
      if (/[?#\\\u0000-\u001f]/.test(value)) return '';
      const segments = value.slice(8).split('/').map(decodeURIComponent);
      if (segments.some(segment => !segment || segment === '.' || segment === '..' || /[\/\\\u0000-\u001f]/.test(segment))) return '';
      return '/assets/' + segments.map(encodeURIComponent).join('/');
    } catch { return ''; }
  }
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
export function validatePost(post) {
  if (!post.title.trim() || post.title.length > 180) throw new Error('Enter a title of up to 180 characters.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || post.slug.length > 100) throw new Error('Use a slug with lowercase letters, numbers and hyphens.');
  if (!CATEGORIES.includes(post.category)) throw new Error('Choose a category.');
  if (!post.author.trim() || post.author.length > 100) throw new Error('Enter an author of up to 100 characters.');
  if (!post.excerpt.trim() || post.excerpt.length > 500) throw new Error('Enter an excerpt of up to 500 characters.');
  if (!post.content.replace(/<[^>]*>/g, '').trim()) throw new Error('Write your article content.');
  if (post.content.length > 300000) throw new Error('Article is too long.');
  if (post.seoTitle?.length > 180 || post.seoDescription?.length > 300) throw new Error('Shorten the SEO title or description.');
  if (!safeImage(post.coverImage)) throw new Error('Choose an HTTPS cover image or a deployed /assets/ image.');
  return post;
}
export function dateLabel(value) {
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
