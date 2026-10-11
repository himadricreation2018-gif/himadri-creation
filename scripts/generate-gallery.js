const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(projectRoot, "gallery-data.json");
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const galleryCategories = [
  { label: "Wedding", slug: "wedding", folder: "wedding" },
  { label: "Pre-Wedding", slug: "pre-wedding", folder: "pre-wedding" },
  { label: "Birthday", slug: "birthday", folder: "birthday" },
  { label: "Engagement", slug: "engagement", folder: "engagement" },
  { label: "Reception", slug: "reception", folder: "reception" },
  { label: "Rice Ceremony", slug: "rice-Ceremony", folder: "rice-Ceremony" },
  { label: "Drone Shoots", slug: "drone-shoots", folder: "drone-shoots" },
  { label: "Event Shoots", slug: "event-shoots", folder: "event-shoots" },
];

function ensureGalleryFolders() {
  galleryCategories.forEach(({ folder }) => {
    fs.mkdirSync(path.join(projectRoot, "assets", "gallery", folder), { recursive: true });
  });
}

function getImagesFromFolder(folder) {
  const folderPath = path.join(projectRoot, "assets", "gallery", folder);

  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => allowedExtensions.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

function buildGalleryData() {
  ensureGalleryFolders();

  return galleryCategories.flatMap(({ label, slug, folder }) => {
    return getImagesFromFolder(folder).map((fileName) => ({
      category: label,
      categorySlug: slug,
      title: `${label} Memory`,
      src: `./assets/gallery/${folder}/${encodeURIComponent(fileName)}`,
    }));
  });
}

const galleryData = buildGalleryData();
fs.writeFileSync(outputPath, `${JSON.stringify(galleryData, null, 2)}\n`, "utf8");

console.log(`Gallery images loaded: ${galleryData.length}`);
console.log(`Generated gallery-data.json at ${outputPath}`);
