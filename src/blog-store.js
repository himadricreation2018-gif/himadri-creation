import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';
import { validatePost } from './blog-core.js';
export async function listPublished(category = '', cursor = null, count = 9) {
  const constraints = [where('status', '==', 'published')];
  if (category) constraints.push(where('category', '==', category));
  constraints.push(orderBy('publishedAt', 'desc'), limit(count));
  if (cursor) constraints.push(startAfter(cursor));
  const result = await getDocs(query(collection(db, 'posts'), ...constraints));
  return { posts: result.docs.map(d => ({ ...d.data(), id: d.id })), cursor: result.docs.at(-1), more: result.size === count };
}
export async function publishedPost(slug) {
  const snapshot = await getDocs(query(collection(db, 'posts'), where('slug', '==', slug), where('status', '==', 'published'), limit(1)));
  return snapshot.empty ? null : { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
}
export async function allPosts() {
  const result = await getDocs(query(collection(db, 'posts'), orderBy('updatedAt', 'desc')));
  return result.docs.map(d => ({ ...d.data(), id: d.id }));
}
export async function getPost(id) {
  const result = await getDoc(doc(db, 'posts', id));
  return result.exists() ? { ...result.data(), id: result.id } : null;
}
// Slugs are permanently reserved to an article ID. Deletion frees the reservation.
// Edits cannot change an existing slug, preserving links and avoiding races.
export async function savePost(input, id = null) {
  validatePost(input);
  const ref = id ? doc(db, 'posts', id) : doc(collection(db, 'posts'));
  const slugRef = doc(db, 'slugs', input.slug);
  await runTransaction(db, async transaction => {
    const [current, reserved] = await Promise.all([transaction.get(ref), transaction.get(slugRef)]);
    if (id && !current.exists()) throw new Error('This article has been deleted.');
    if (current.exists() && current.data().slug !== input.slug) throw new Error('Published URLs are permanent; keep the original slug.');
    if (reserved.exists() && reserved.data().postId !== ref.id) throw new Error('That slug is already in use. Choose another.');
    const previous = current.data();
    const post = { ...input, id: ref.id, updatedAt: serverTimestamp(), createdAt: previous?.createdAt || serverTimestamp(), publishedAt: input.status === 'published' ? previous?.publishedAt || serverTimestamp() : null };
    transaction.set(slugRef, { postId: ref.id });
    transaction.set(ref, post);
  });
  return ref.id;
}
export async function deletePost(id) {
  await runTransaction(db, async transaction => {
    const ref = doc(db, 'posts', id);
    const post = await transaction.get(ref);
    if (!post.exists()) return;
    transaction.delete(doc(db, 'slugs', post.data().slug));
    transaction.delete(ref);
  });
}
