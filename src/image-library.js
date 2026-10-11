import { safeImage } from './blog-core.js';
export async function loadImageLibrary() {
  const response = await fetch('/blog-images.json');
  if (!response.ok) throw new Error('Image library could not be loaded. You can still enter an image URL.');
  const images = await response.json();
  if (!Array.isArray(images)) throw new Error('Image library is unavailable. You can still enter an image URL.');
  return images.filter(image => image && typeof image.src === 'string' && image.src.startsWith('/assets/') && safeImage(image.src));
}
export function populateImagePicker(select, images) {
  select.replaceChildren(new Option('Choose an existing website image', ''));
  for (const image of images) select.add(new Option(image.label || image.src, safeImage(image.src)));
  select.disabled = !images.length;
}
