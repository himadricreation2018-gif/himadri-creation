import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, getIdTokenResult } from 'firebase/auth';
import { auth, configured, storageEnabled } from './firebase.js';
import { CATEGORIES, slugify, escapeHTML as e, safeImage, dateLabel } from './blog-core.js';
import { allPosts, getPost, savePost, deletePost } from './blog-store.js';
import { sanitize, article } from './blog-view.js';
import { uploadImage, cleanupImages, hydratePrivateImages } from './blog-images.js';
import { loadImageLibrary, populateImagePicker } from './image-library.js';
import './new-menu.js';
const root = document.querySelector('#admin-root');
let authenticated = false, editor = null, current = null, busy = false, authGeneration = 0;
const hasAccess = generation => authenticated && generation === authGeneration && Boolean(auth.currentUser);
const notice = (text, error = false) => { const el = document.querySelector('#admin-notice'); if (el) { el.textContent = text; el.classList.toggle('error', error); } };
function shell(body) {
  root.innerHTML = `<div class="admin-heading"><div><p class="eyebrow">HIMADRI CREATION STUDIO</p><h1>Journal management</h1></div><div class="admin-actions"><a class="btn ghost" href="/admin/blog">All articles</a><a class="btn primary" href="/admin/blog/new">New article</a><button class="btn ghost" id="logout">Log out</button></div></div><p id="admin-notice" role="status" aria-live="polite"></p>${body}`;
  document.querySelector('#logout').onclick = () => signOut(auth);
}
function login(reason = '') {
  root.innerHTML = `<section class="login-card"><p class="eyebrow">PRIVATE STUDIO ACCESS</p><h1>Welcome back.</h1><p>Sign in to manage the Himadri Creation journal.</p><p id="admin-notice" role="alert">${e(reason)}</p><form id="login-form"><label>Email<input type="email" name="email" autocomplete="username" required></label><label>Password<input type="password" name="password" autocomplete="current-password" required></label><button class="btn primary" type="submit">Sign in</button></form></section>`;
  document.querySelector('#login-form').onsubmit = async event => {
    event.preventDefault(); const data = new FormData(event.target); const button = event.target.querySelector('button'); button.disabled = true;
    try { await signInWithEmailAndPassword(auth, data.get('email'), data.get('password')); }
    catch { notice('Sign-in failed. Check your details and try again.', true); }
    finally { if (button.isConnected) button.disabled = false; }
  };
}
async function dashboard(generation = authGeneration) {
  if (!hasAccess(generation)) return;
  shell('<p class="journal-state">Loading articles…</p>');
  try {
    const posts = await allPosts();
    if (!hasAccess(generation)) return;
    shell(`<div class="admin-stats"><div><strong>${posts.length}</strong> articles</div><div><strong>${posts.filter(p => p.status === 'published').length}</strong> published</div><div><strong>${posts.filter(p => p.status === 'draft').length}</strong> drafts</div></div><div class="admin-filters"><label>Search articles<input id="search" type="search" placeholder="Title, author or category"></label><label>Status<select id="status"><option value="">All articles</option><option>published</option><option>draft</option></select></label></div><div id="admin-posts" class="admin-posts"></div>`);
    function render() {
      const search = document.querySelector('#search').value.toLowerCase(); const status = document.querySelector('#status').value;
      const filtered = posts.filter(p => (!status || p.status === status) && `${p.title} ${p.author} ${p.category}`.toLowerCase().includes(search));
      document.querySelector('#admin-posts').innerHTML = filtered.length ? filtered.map(p => `<article class="admin-post"><div><span class="status-badge ${e(p.status)}">${e(p.status)}</span><h2>${e(p.title)}</h2><p>${e(p.category)} · Updated ${e(dateLabel(p.updatedAt))}</p></div><a class="btn ghost" href="/admin/blog/edit/${e(p.id)}">Edit article</a></article>`).join('') : '<p class="journal-state">No articles found. Create your first story.</p>';
    }
    document.querySelector('#search').oninput = render; document.querySelector('#status').onchange = render; render();
  } catch { if (hasAccess(generation)) notice('Unable to load articles. Check Firebase configuration, rules and indexes.', true); }
}
function values(status) {
  const form = document.querySelector('#post-form'); const data = new FormData(form);
  return { title: data.get('title').trim(), slug: data.get('slug').trim(), excerpt: data.get('excerpt').trim(), content: sanitize(editor.getSemanticHTML()), coverImage: data.get('coverImage').trim(), category: data.get('category'), author: data.get('author').trim(), seoTitle: data.get('seoTitle').trim(), seoDescription: data.get('seoDescription').trim(), status };
}
async function edit(id = null, generation = authGeneration) {
  if (!hasAccess(generation)) return;
  shell('<p class="journal-state">Opening editor…</p>');
  try { current = id ? await getPost(id) : null; if (id && !current) throw new Error('Article not found.'); }
  catch (error) { if (hasAccess(generation)) notice(error.message, true); return; }
  if (!hasAccess(generation)) return;
  const p = current || { title: '', slug: '', excerpt: '', coverImage: '', author: 'Himadri Creation', seoTitle: '', seoDescription: '', content: '', status: 'draft' };
  const field = (label, name, max, type = 'text') => `<label>${label}<input type="${type}" name="${name}" value="${e(p[name])}" maxlength="${max}" ${name === 'slug' && id ? 'readonly' : ''}></label>`;
  shell(`<form id="post-form" class="editor-form"><div class="editor-main"><div class="editor-panel">${field('Article title', 'title', 180)}${field('Permanent URL slug', 'slug', 100)}<label>Excerpt<textarea name="excerpt" maxlength="500" rows="3">${e(p.excerpt)}</textarea></label><label id="content-label">Article content</label><div id="rich-editor" aria-labelledby="content-label"></div><div class="image-tools"><label>Article image URL<input id="article-image-url" placeholder="/assets/blog/your-image.webp or https://…"></label><label>Image description<input id="image-alt" maxlength="180" placeholder="Describe the image"></label><button class="btn ghost" type="button" id="insert-image">Insert image</button><label ${!storageEnabled ? 'hidden' : ''}>Upload article image<input type="file" id="article-upload" accept="image/jpeg,image/png,image/webp"></label></div></div></div><aside class="editor-panel"><p class="eyebrow">ARTICLE DETAILS</p><label>Category<select name="category">${CATEGORIES.map(c => `<option ${c === p.category ? 'selected' : ''}>${e(c)}</option>`).join('')}</select></label>${field('Author', 'author', 100)}${field('Cover image URL', 'coverImage', 2000)}<img id="cover-preview" class="cover-preview" alt="Cover image preview" ${safeImage(p.coverImage) ? `src="${e(safeImage(p.coverImage))}"` : 'hidden'}><label ${!storageEnabled ? 'hidden' : ''}>Upload cover image<input type="file" id="cover-upload" accept="image/jpeg,image/png,image/webp"></label><p class="form-note">${storageEnabled ? 'Save a draft before uploading. JPEG, PNG or WebP; maximum 5 MB. Images become publicly readable only while this article is published.' : 'Free image option: add images to assets/blog, build and deploy, then enter /assets/blog/filename.webp. Files deployed with the site are public; keep private draft images off the site.'}</p><p class="eyebrow">SEARCH & SOCIAL</p>${field('SEO title', 'seoTitle', 180)}<label>SEO description<textarea name="seoDescription" maxlength="300" rows="3">${e(p.seoDescription)}</textarea></label><div class="editor-buttons"><button class="btn ghost" type="button" id="preview">Preview</button><button class="btn ghost" type="button" id="save-draft">${p.status === 'published' ? 'Unpublish' : 'Save draft'}</button><button class="btn primary" type="submit">Publish article</button>${id ? '<button class="btn danger" type="button" id="delete">Delete article</button>' : ''}</div><p class="form-note">After publishing, editing, unpublishing or deleting, rebuild and redeploy the site to refresh static article pages and the sitemap.</p></aside></form><dialog id="preview-dialog"><button class="btn ghost" id="close-preview">Close preview</button><div id="preview-body"></div></dialog>`);
  editor = new Quill('#rich-editor', { theme: 'snow', placeholder: 'Tell your story…', modules: { toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link'], ['clean']] } });
  editor.clipboard.dangerouslyPasteHTML(sanitize(p.content));
  const title = document.querySelector('[name="title"]'), slug = document.querySelector('[name="slug"]');
  let manualSlug = Boolean(id); slug.oninput = () => manualSlug = true; title.oninput = () => { if (!manualSlug) slug.value = slugify(title.value); };
  const cover = document.querySelector('[name="coverImage"]');
  cover.oninput = () => { const image = document.querySelector('#cover-preview'); image.hidden = !safeImage(cover.value); image.src = safeImage(cover.value); };
  const makePicker = (id, label, anchor) => {
    const wrapper = document.createElement('label'); wrapper.textContent = label;
    const select = document.createElement('select'); select.id = id; select.disabled = true;
    select.add(new Option('Loading website images…', '')); wrapper.append(select); anchor.before(wrapper); return select;
  };
  const coverPicker = makePicker('cover-library', 'Choose a website cover image', cover.closest('label'));
  const articleURL = document.querySelector('#article-image-url');
  const articlePicker = makePicker('article-library', 'Choose a website article image', articleURL.closest('label'));
  coverPicker.onchange = () => { if (coverPicker.value) { cover.value = coverPicker.value; cover.oninput(); } };
  articlePicker.onchange = () => {
    if (!articlePicker.value) return;
    articleURL.value = articlePicker.value;
    document.querySelector('#image-alt').focus();
  };
  const libraryNote = document.createElement('p'); libraryNote.className = 'form-note'; libraryNote.id = 'image-library-note';
  libraryNote.textContent = 'Choose a public image already deployed with the website, or enter an image URL. New dashboard uploads are unavailable on Spark.';
  coverPicker.closest('label').after(libraryNote);
  loadImageLibrary().then(images => {
    if (!hasAccess(generation) || !coverPicker.isConnected) return;
    populateImagePicker(coverPicker, images); populateImagePicker(articlePicker, images);
    if (!images.length) libraryNote.textContent = 'No images are available yet. Add public images to assets/blog, rebuild, then choose them here.';
  }).catch(error => {
    if (hasAccess(generation) && libraryNote.isConnected) libraryNote.textContent = error.message;
  });
  await hydratePrivateImages(document.querySelector('aside'));
  if (!hasAccess(generation)) return;
  function insertImage(url) {
    const safe = safeImage(url); const alt = document.querySelector('#image-alt').value.trim();
    if (!safe || !alt) throw new Error('Enter a safe image URL and descriptive image text.');
    const range = editor.getSelection(true); editor.insertEmbed(range.index, 'image', safe);
    const image = [...editor.root.querySelectorAll('img')].find(i => i.getAttribute('src') === safe); image?.setAttribute('alt', alt);
  }
  document.querySelector('#insert-image').onclick = () => { try { insertImage(document.querySelector('#article-image-url').value); notice('Image inserted.'); } catch (error) { notice(error.message, true); } };
  for (const type of ['cover', 'article']) document.querySelector(`#${type}-upload`).onchange = async event => {
    if (!event.target.files[0] || busy) return; busy = true;
    try {
      const url = await uploadImage(event.target.files[0], current?.id);
      if (type === 'cover') { cover.value = url; cover.oninput(); await hydratePrivateImages(document.querySelector('aside')); }
      else { insertImage(url); }
      notice('Image uploaded. Save your article to keep it.');
    } catch (error) { notice(error.message, true); } finally { busy = false; event.target.value = ''; }
  };
  const dialog = document.querySelector('#preview-dialog');
  document.querySelector('#preview').onclick = async () => { document.querySelector('#preview-body').innerHTML = `<article class="journal-article">${article({ ...values('draft'), publishedAt: current?.publishedAt || new Date() })}</article>`; dialog.showModal(); await hydratePrivateImages(dialog); };
  document.querySelector('#close-preview').onclick = () => dialog.close();
  async function save(status) {
    if (busy || !hasAccess(generation)) return; busy = true;
    document.querySelectorAll('.editor-buttons button').forEach(b => b.disabled = true);
    try {
      const data = values(status); const savedId = await savePost(data, current?.id);
      if (!hasAccess(generation)) return;
      const previous = current; current = await getPost(savedId);
      if (!hasAccess(generation)) return;
      slug.readOnly = true; manualSlug = true; history.replaceState(null, '', `/admin/blog/edit/${savedId}`);
      notice(status === 'published' ? 'Article published. Rebuild and deploy to refresh SEO pages.' : 'Draft saved. Rebuild and deploy to remove any previously published static page.');
      try { await cleanupImages(savedId, previous, data); } catch { notice('Article saved. Image cleanup failed; retry after checking Storage permissions.', true); }
      if (!hasAccess(generation)) return;
      document.querySelector('#save-draft').textContent = status === 'published' ? 'Unpublish' : 'Save draft';
      if (!previous) await edit(savedId);
    } catch (error) { if (hasAccess(generation)) notice(error.message || 'Unable to save article.', true); }
    finally { busy = false; document.querySelectorAll('.editor-buttons button').forEach(b => b.disabled = false); }
  }
  document.querySelector('#post-form').onsubmit = event => { event.preventDefault(); save('published'); };
  document.querySelector('#save-draft').onclick = () => save('draft');
  if (id) document.querySelector('#delete').onclick = async () => {
    if (busy || !confirm('Permanently delete this article and its uploaded images? Rebuild and redeploy afterward to remove its static page.')) return;
    busy = true;
    try { await deletePost(id); try { await cleanupImages(id, current); } catch { alert('Article deleted, but some uploaded files remain. Remove them from Storage.'); } location.href = '/admin/blog'; }
    catch (error) { notice(error.message, true); busy = false; }
  };
}
if (!configured) {
  root.innerHTML = '<section class="login-card"><p class="eyebrow">SETUP REQUIRED</p><h1>Connect your Firebase project.</h1><p>Set the public Web App configuration in .env and rebuild. Administrator access is enforced by Firebase custom claims and security rules.</p></section>';
} else onAuthStateChanged(auth, async user => {
  const generation = ++authGeneration;
  authenticated = false; root.innerHTML = '<p class="journal-state">Checking access…</p>';
  if (!user) { login(); return; }
  try {
    const token = await getIdTokenResult(user, true);
    if (generation !== authGeneration || auth.currentUser?.uid !== user.uid) return;
    if (token.claims.admin !== true) { await signOut(auth); if (!auth.currentUser) login('This account does not have administrator access.'); return; }
    authenticated = true;
    const match = location.pathname.match(/^\/admin\/blog\/edit\/([a-zA-Z0-9_-]+)\/?$/);
    if (match) await edit(match[1], generation); else if (location.pathname.replace(/\/$/, '') === '/admin/blog/new') await edit(null, generation);
    else { if (location.pathname === '/admin/login') history.replaceState(null, '', '/admin/blog'); await dashboard(generation); }
  } catch { if (generation === authGeneration) login('Unable to verify access. Please sign in again.'); }
});
