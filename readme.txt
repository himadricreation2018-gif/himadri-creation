Himadri Creation Website - Booking Form Final
============================================

Updated features:
- Added booking.html form page.
- Book Now and package buttons open the booking form.
- Booking form collects: name, mobile, email, event date, event location, category, budget, package, guest count and extra requirement.
- Budget slider range: ₹4,999 to ₹49,999.
- Submit button redirects the full enquiry message to WhatsApp number +91 8327482228 using wa.me.
- Fixed call link: tel:+918327482228.
- Fixed email link using mailto.
- Added contact icons and social media icons.
- Added Facebook, Instagram, YouTube and LinkedIn links.
- Fixed logo assets: logo-nav.png, logo-loader.png, logo-main.png and favicon.png.
- Fixed missing map asset and gallery image fallback.
- Improved 3D camera cursor rotation animation.

Run locally:
1. Open this folder in terminal.
2. Run: python -m http.server 8000
3. Open: http://localhost:8000

Important:
Do not open directly with file:/// because 3D model and some browser features may not work properly.

Dynamic gallery:
- Add photos to the matching category folder inside assets/gallery/.
- Category folders are: wedding, pre-wedding, birthday, engagement, reception, rice-engagement, drone, event-shoots.
- File names do not matter. Supported image types are .jpg, .jpeg, .png, .webp and .avif.
- After adding or removing photos, run: npm run build-gallery
- This regenerates gallery-data.json, which the website reads to show the gallery.
- You can also run: npm start
- This regenerates gallery-data.json and starts http://localhost:8000
- Open the site with Live Server or run python -m http.server 8000. Do not use file:/// because browser fetch() may block gallery-data.json.

Final package fixes added:
- Package cards now have top-right badges for Basic, Standard, and Premium.
- Package buttons now open booking.html with selected package and suggested budget.
- Booking page copy and mobile UI were polished.
