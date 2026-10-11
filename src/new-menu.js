import './navigation.js';
const nav = document.querySelector('.main-nav');
const toggle = document.querySelector('.menu-toggle');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('menu-open', open);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open');
}));
