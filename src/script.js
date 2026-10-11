/*
  Himadri Creation Website
  ------------------------
  Edit content in index.html.
  Replace the DSLR model at assets/models/camera.glb.
  Replace logo images inside assets/ if needed.
*/

const loader = document.querySelector('.loader');
const progress = document.querySelector('.progress-bar');
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const backTop = document.querySelector('.back-top');
const sections = [...document.querySelectorAll('[data-view]')];
const navLinks = [...document.querySelectorAll('.main-nav a')];

const cameraModel = document.querySelector('#cameraModel');
const cameraViewer = document.querySelector('#cameraViewer');
const modelTitle = document.querySelector('#modelTitle');
const modelCaption = document.querySelector('#modelCaption');

const cameraViews = [
  { orbit: '-28deg 69deg 4.1m', fov: '24deg', title: 'Wedding Moments', caption: 'Move cursor to rotate' },
  { orbit: '12deg 70deg 4.35m', fov: '25deg', title: 'Creative Coverage', caption: 'Photography + Videography' },
  { orbit: '-43deg 63deg 4.0m', fov: '23deg', title: '4K Cinematic Film', caption: 'Ultra HD event videos' },
  { orbit: '38deg 76deg 4.45m', fov: '26deg', title: 'Premium Retouch', caption: 'Clean professional editing' },
  { orbit: '-52deg 67deg 3.95m', fov: '23deg', title: 'Gallery Ready', caption: 'Replace samples with real photos' },
  { orbit: '4deg 74deg 4.3m', fov: '25deg', title: 'Custom Packages', caption: 'Basic • Standard • Premium' },
  { orbit: '-14deg 66deg 4.45m', fov: '25deg', title: 'Book Your Shoot', caption: 'Call, WhatsApp or mail now' }
];

let activeCameraIndex = -1;
let mouseX = 0;
let mouseY = 0;
let targetTheta = -28;
let targetPhi = 69;
let currentTheta = -28;
let currentPhi = 69;
let currentRadius = 4.1;
let targetRadius = 4.1;
let scrollTicking = false;

function hideLoader() {
  if (!loader) return;
  if (progress) progress.style.width = '100%';
  setTimeout(() => loader.classList.add('hide'), 500);
  setTimeout(() => loader.remove(), 1500);
}

function startIntroAnimation() {
  setTimeout(() => cameraModel?.classList.add('entered'), 350);
}

function updateHeader() {
  const scrolled = window.scrollY > 30;
  header?.classList.toggle('scrolled', scrolled);
  backTop?.classList.toggle('show', window.scrollY > 600);
}

function getActiveSectionIndex() {
  let activeIndex = 0;
  const triggerLine = window.innerHeight * 0.42;
  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= triggerLine && rect.bottom >= triggerLine) activeIndex = index;
  });
  return activeIndex;
}

function parseOrbit(orbit) {
  const match = orbit.match(/(-?\d+(?:\.\d+)?)deg\s+(-?\d+(?:\.\d+)?)deg\s+(\d+(?:\.\d+)?)m/);
  if (!match) return { theta: -28, phi: 69, radius: 4.1 };
  return { theta: Number(match[1]), phi: Number(match[2]), radius: Number(match[3]) };
}

function applyCameraView(index) {
  if (index === activeCameraIndex) return;
  activeCameraIndex = index;
  const view = cameraViews[index] || cameraViews[0];
  const orbit = parseOrbit(view.orbit);
  targetTheta = orbit.theta;
  targetPhi = orbit.phi;
  targetRadius = orbit.radius;

  if (cameraViewer) cameraViewer.setAttribute('field-of-view', view.fov);
  if (modelTitle) modelTitle.textContent = view.title;
  if (modelCaption) modelCaption.textContent = view.caption;

  const activeId = sections[index]?.id;
  navLinks.forEach((link) => {
    const active = Boolean(activeId) && link.getAttribute('href') === `#${activeId}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}

function updateScrollEffects() {
  updateHeader();
  applyCameraView(getActiveSectionIndex());
}

function onScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    updateScrollEffects();
    scrollTicking = false;
  });
}

function setupRevealAnimations() {
  const revealItems = [...document.querySelectorAll('.reveal')];
  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  revealItems.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 6, 5) * 0.06}s`;
    revealObserver.observe(el);
  });
}

function setupMobileMenu() {
  menuToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    document.body.classList.toggle('menu-open', Boolean(open));
    menuToggle.setAttribute('aria-expanded', String(Boolean(open)));
  });
  navLinks.forEach((link) => link.addEventListener('click', () => {
    nav?.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));
}

function setupBackToTop() {
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function setupContactLinks() {
  document.querySelectorAll('[data-contact-link="whatsapp"]').forEach((link) => {
    link.addEventListener('click', () => {
      // The href already contains the correct wa.me redirect. This touch keeps the browser focused on the real link.
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
    });
  });
}

function initFloatingDrone() {
  const container = document.getElementById('floatingDrone3D');
  if (!container || typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.35, 4);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.pointerEvents = 'none';
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(4, 5, 5);
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0xf7dc8d, 0.7);
  fillLight.position.set(-3, 2, 4);
  scene.add(fillLight);

  const loader = new THREE.GLTFLoader();
  let drone;
  let mixer;
  const baseRotX = THREE.MathUtils.degToRad(18);
  const baseRotY = THREE.MathUtils.degToRad(135);
  const baseRotZ = THREE.MathUtils.degToRad(-8);
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  loader.load('./assets/models/drone.glb', (gltf) => {
    drone = gltf.scene;

    const box = new THREE.Box3().setFromObject(drone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const modelScale = 1.55 / maxDim;

    drone.scale.setScalar(modelScale * 1.25);
    drone.position.set(0, -0.08, 0);
    drone.rotation.set(baseRotX, baseRotY, baseRotZ);
    drone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(drone);

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(drone);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
    }
  }, undefined, (error) => {
    console.error('Floating drone model could not load:', error);
  });

  const clock = new THREE.Clock();

  function animateDrone() {
    requestAnimationFrame(animateDrone);

    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (drone) {
      const autoLeftRight = Math.sin(elapsed * 0.75) * 0.28;
      const cursorTurn = mouseX * 0.18;
      const cursorTilt = mouseY * 0.08;

      drone.rotation.x += ((baseRotX + cursorTilt) - drone.rotation.x) * 0.05;
      drone.rotation.y += ((baseRotY + autoLeftRight + cursorTurn) - drone.rotation.y) * 0.05;
      drone.rotation.z += ((baseRotZ + mouseX * 0.06) - drone.rotation.z) * 0.05;

      drone.position.y = -0.08 + Math.sin(elapsed * 1.5) * 0.06;
      drone.position.x = Math.sin(elapsed * 0.7) * 0.035;
    }

    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
  }

  animateDrone();

  window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }, { passive: true });
}

function setupDynamicGallery() {
  const filtersWrap = document.querySelector('#galleryFilters');
  const autoGallery = document.querySelector('#autoGallery');
  const rowOne = document.querySelector('#galleryRowOne');
  const rowTwo = document.querySelector('#galleryRowTwo');
  const emptyState = document.querySelector('#galleryEmpty');
  const lightbox = document.querySelector('#galleryLightbox');
  const lightboxImage = document.querySelector('#galleryLightboxImage');
  const lightboxCategory = document.querySelector('#galleryLightboxCategory');
  const lightboxCaption = document.querySelector('#galleryLightboxCaption');
  const lightboxClose = lightbox?.querySelector('.gallery-lightbox-close');
  const lightboxPrev = lightbox?.querySelector('.gallery-lightbox-prev');
  const lightboxNext = lightbox?.querySelector('.gallery-lightbox-next');

  if (!filtersWrap || !autoGallery || !rowOne || !rowTwo || !emptyState) return;

  const galleryCategories = [
    { label: 'Wedding', slug: 'wedding', folder: 'wedding' },
    { label: 'Pre-Wedding', slug: 'pre-wedding', folder: 'pre-wedding' },
    { label: 'Birthday', slug: 'birthday', folder: 'birthday' },
    { label: 'Engagement', slug: 'engagement', folder: 'engagement' },
    { label: 'Reception', slug: 'reception', folder: 'reception' },
    { label: 'Rice Ceremony', slug: 'rice-ceremony', folder: 'rice-ceremony' },
    { label: 'Drone Shoots', slug: 'drone-shoots', folder: 'drone-shoots' },
    { label: 'Event Shoots', slug: 'event-shoots', folder: 'event-shoots' }
  ];
  const categories = [
    { label: 'All', slug: 'all' },
    ...galleryCategories
  ];

  let items = [];
  let activeFilter = 'all';
  let visibleItems = [];
  let activeLightboxIndex = 0;
  let lastFocusedElement = null;

  function normalizeGalleryItem(item) {
    const categorySlug = item.categorySlug || item.slug || '';
    const category = item.category || categories.find((entry) => entry.slug === categorySlug)?.label || 'Gallery';
    const title = item.title || `${category} Memory`;

    return {
      category,
      categorySlug,
      title,
      src: item.src,
      alt: item.alt || `${title} by Himadri Creation`
    };
  }

  function getItemTitle(item, index) {
    return item.title || `${item.category} Memory ${index + 1}`;
  }

  function setActiveFilter(slug = 'all') {
    activeFilter = slug;
    filtersWrap.querySelectorAll('[data-gallery-filter]').forEach((button) => {
      const active = button.dataset.galleryFilter === slug;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function getFilteredItems() {
    if (activeFilter === 'all') return items;
    return items.filter((item) => item.categorySlug === activeFilter);
  }

  function updateEmptyState(show) {
    autoGallery.hidden = show;
    emptyState.classList.toggle('is-visible', show);
    emptyState.hidden = !show;
  }

  function updateLightbox(index) {
    if (!lightboxImage || !lightboxCategory || !lightboxCaption || visibleItems.length === 0) return;

    activeLightboxIndex = (index + visibleItems.length) % visibleItems.length;
    const item = visibleItems[activeLightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightboxCategory.textContent = item.category;
    lightboxCaption.textContent = getItemTitle(item, activeLightboxIndex);
  }

  function openLightbox(index, trigger) {
    if (!lightbox || visibleItems.length === 0) return;

    lastFocusedElement = trigger;
    updateLightbox(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lightboxClose?.focus();
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImage) return;

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
    document.body.classList.remove('lightbox-open');
    lastFocusedElement?.focus();
  }

  function showNextImage() {
    updateLightbox(activeLightboxIndex + 1);
  }

  function showPreviousImage() {
    updateLightbox(activeLightboxIndex - 1);
  }

  function createFilterButton(category) {
    const button = document.createElement('button');
    button.className = 'gallery-filter';
    button.type = 'button';
    button.dataset.galleryFilter = category.slug;
    button.setAttribute('aria-pressed', String(category.slug === activeFilter));
    button.textContent = category.label;
    button.addEventListener('click', () => {
      setActiveFilter(category.slug);
      renderGallery();
    });
    return button;
  }

  function createGalleryCard(item, index, duplicate = false) {
    const figure = document.createElement('figure');
    figure.className = 'gallery-card';
    figure.setAttribute('aria-hidden', String(duplicate));

    const image = document.createElement('img');
    image.src = item.src;
    image.alt = item.alt;
    image.loading = 'lazy';
    image.decoding = 'async';

    const caption = document.createElement('figcaption');
    caption.className = 'gallery-card-caption';
    caption.innerHTML = `<span>${item.category}</span><strong>${getItemTitle(item, index)}</strong>`;

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Preview ${item.category} gallery image ${index + 1}`);
    button.tabIndex = duplicate ? -1 : 0;
    button.addEventListener('click', () => openLightbox(index, button));

    figure.append(image, caption, button);
    return figure;
  }

  function fillTrack(track, rowItems, rowOffset) {
    track.innerHTML = '';
    const repeatedItems = rowItems.length >= 4 ? rowItems : [...rowItems, ...rowItems, ...rowItems].slice(0, Math.max(rowItems.length, 4));
    const firstSet = document.createElement('div');
    const secondSet = document.createElement('div');

    firstSet.className = 'gallery-track-set';
    secondSet.className = 'gallery-track-set';
    secondSet.setAttribute('aria-hidden', 'true');

    repeatedItems.forEach((item, index) => {
      const sourceIndex = visibleItems.indexOf(item);
      firstSet.appendChild(createGalleryCard(item, sourceIndex >= 0 ? sourceIndex : rowOffset + index));
    });

    repeatedItems.forEach((item, index) => {
      const sourceIndex = visibleItems.indexOf(item);
      secondSet.appendChild(createGalleryCard(item, sourceIndex >= 0 ? sourceIndex : rowOffset + index, true));
    });

    track.append(firstSet, secondSet);
  }

  function getLoopItems(items) {
    const minItems = 10;
    let loopItems = [...items];

    while (loopItems.length > 0 && loopItems.length < minItems) {
      loopItems = [...loopItems, ...items];
    }

    if (loopItems.length % 2 !== 0) {
      loopItems = [...loopItems, loopItems[0]];
    }

    return loopItems;
  }

  function updateGalleryScrollSpeed(rowOne, rowTwo, itemCount) {
    const baseSpeedPerCard = 5.5;
    const minSpeed = 42;
    const maxSpeed = 90;

    const duration = Math.min(
      Math.max(itemCount * baseSpeedPerCard, minSpeed),
      maxSpeed
    );

    rowOne.style.setProperty('--gallery-speed', `${duration}s`);
    rowTwo.style.setProperty('--gallery-speed', `${duration}s`);
  }

  function renderFilters() {
    filtersWrap.innerHTML = '';
    const fragment = document.createDocumentFragment();
    categories.forEach((category) => fragment.appendChild(createFilterButton(category)));
    filtersWrap.appendChild(fragment);
    setActiveFilter(activeFilter);
  }

  function renderGallery() {
    visibleItems = getFilteredItems();
    rowOne.innerHTML = '';
    rowTwo.innerHTML = '';

    if (visibleItems.length === 0) {
      updateEmptyState(true);
      return;
    }

    updateEmptyState(false);
    const loopItems = getLoopItems(visibleItems);
    const splitPoint = Math.ceil(loopItems.length / 2);
    const firstRowItems = loopItems.slice(0, splitPoint);
    const secondRowItems = loopItems.slice(splitPoint);
    const fallbackSecondRow = secondRowItems.length ? secondRowItems : firstRowItems;

    fillTrack(rowOne, firstRowItems, 0);
    fillTrack(rowTwo, fallbackSecondRow, splitPoint);
    updateGalleryScrollSpeed(rowOne, rowTwo, loopItems.length);
  }

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', showPreviousImage);
  lightboxNext?.addEventListener('click', showNextImage);
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  window.addEventListener('keydown', (event) => {
    if (!lightbox?.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowRight') {
      showNextImage();
    } else if (event.key === 'ArrowLeft') {
      showPreviousImage();
    }
  });

  renderFilters();
  updateEmptyState(true);

  fetch('./gallery-data.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error('Gallery data could not be loaded.');
      return response.json();
    })
    .then((data) => {
      const galleryData = Array.isArray(data)
        ? data.map(normalizeGalleryItem).filter((item) => item.categorySlug && item.src)
        : [];

      console.log("Gallery images loaded:", galleryData.length);
      console.table(galleryData);
      items = galleryData;
      setActiveFilter('all');
      renderGallery();
    })
    .catch((error) => {
      console.error('Gallery data could not be loaded:', error);
      console.log('Gallery images loaded:', 0);
      items = [];
      visibleItems = [];
      rowOne.innerHTML = '';
      rowTwo.innerHTML = '';
      updateEmptyState(true);
    });
}

function setupCameraSupport() {
  if (!cameraViewer || !cameraModel) {
    cameraModel?.classList.add('entered');
    return;
  }
  cameraViewer.addEventListener('load', startIntroAnimation);
  cameraViewer.addEventListener('error', startIntroAnimation);
  setTimeout(startIntroAnimation, 1200);
}

function setupCursorCameraAnimation() {
  window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function animateCamera() {
    const desktop = window.innerWidth >= 900;
    const cursorTheta = desktop ? mouseX * 96 : 0;
    const cursorPhi = desktop ? mouseY * -24 : 0;
    const cursorX = desktop ? mouseX * 34 : 0;
    const cursorY = desktop ? mouseY * -22 : 0;

    currentTheta += ((targetTheta + cursorTheta) - currentTheta) * 0.075;
    currentPhi += ((targetPhi + cursorPhi) - currentPhi) * 0.075;
    currentRadius += (targetRadius - currentRadius) * 0.075;

    if (cameraViewer) {
      cameraViewer.setAttribute('camera-orbit', `${currentTheta.toFixed(2)}deg ${currentPhi.toFixed(2)}deg ${currentRadius.toFixed(2)}m`);
    }
    if (cameraModel) {
      cameraModel.style.setProperty('--camera-x', `${cursorX.toFixed(2)}px`);
      cameraModel.style.setProperty('--camera-y', `${cursorY.toFixed(2)}px`);
    }
    requestAnimationFrame(animateCamera);
  }
  animateCamera();
}

window.addEventListener('load', hideLoader);
window.addEventListener('scroll', onScroll, { passive: true });
setTimeout(hideLoader, 2400);

setupRevealAnimations();
setupMobileMenu();
setupBackToTop();
setupContactLinks();
initFloatingDrone();
setupDynamicGallery();
setupCameraSupport();
setupCursorCameraAnimation();
updateScrollEffects();
