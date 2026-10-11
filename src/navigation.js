// Complements existing menu toggles without duplicating their click handlers.
const navigation = document.querySelector('.main-nav');
const toggle = document.querySelector('.menu-toggle');
if (navigation && toggle) {
  navigation.id = 'main-navigation';
  toggle.setAttribute('aria-controls', navigation.id);
  const media = matchMedia('(max-width: 1190px)');
  const sync = () => {
    navigation.inert = media.matches && !navigation.classList.contains('open');
    toggle.setAttribute('aria-label', navigation.classList.contains('open') ? 'Close menu' : 'Open menu');
  };
  new MutationObserver(sync).observe(navigation, { attributes: true, attributeFilter: ['class'] });
  media.addEventListener('change', sync);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) {
      navigation.classList.remove('open'); document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) {
      navigation.classList.remove('open'); document.body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false');
    }
  });
  sync();
}
// Keep labels for the existing form accessible after validation messages appear.
document.querySelectorAll('.field-error').forEach((error, index) => {
  error.id ||= `field-error-${index}`;
  const field = error.closest('label')?.querySelector('input, select, textarea');
  if (field) field.setAttribute('aria-describedby', error.id);
});
