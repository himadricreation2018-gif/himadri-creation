import { ref, uploadBytes, getBlob, deleteObject, listAll } from 'firebase/storage';
import { storage } from './firebase.js';
export async function uploadImage(file, postId) {
  if (!storage) throw new Error('Uploads are disabled on Spark. Deploy images in assets/blog and use their paths.');
  if (!postId) throw new Error('Save a draft before uploading images.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.');
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .85));
  if (!blob) throw new Error('Image conversion failed.');
  const imageRef = ref(storage, `blog/${postId}/${crypto.randomUUID()}.webp`);
  await uploadBytes(imageRef, blob, { contentType: 'image/webp' });
  // Never issue bearer download tokens: access follows the article's current status.
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(imageRef.bucket)}/o/${encodeURIComponent(imageRef.fullPath)}?alt=media`;
}
function storedPath(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'firebasestorage.googleapis.com' || parsed.searchParams.has('token')) return null;
    return decodeURIComponent(parsed.pathname.split('/o/')[1] || '');
  } catch { return null; }
}
export async function hydratePrivateImages(container) {
  if (!storage) return;
  await Promise.all([...container.querySelectorAll('img')].map(async img => {
    const path = storedPath(img.getAttribute('src'));
    if (!path) return;
    try { img.src = URL.createObjectURL(await getBlob(ref(storage, path))); } catch { img.alt += ' (image unavailable)'; }
  }));
}
export async function cleanupImages(postId, oldPost, newPost = null) {
  if (!storage) return;
  const retained = `${newPost?.coverImage || ''} ${newPost?.content || ''}`;
  // Scan the directory so abandoned uploads are also removed. Call only after save/delete.
  const files = await listAll(ref(storage, `blog/${postId}`));
  for (const item of files.items) {
    if (!retained.includes(encodeURIComponent(item.fullPath))) await deleteObject(item);
  }
}
