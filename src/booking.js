const WHATSAPP_NUMBER = '918327482228';

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const bookingForm = document.querySelector('#bookingForm');
const priceRange = document.querySelector('#priceRange');
const priceOutput = document.querySelector('#priceOutput');
const packageSelect = document.querySelector('#packageSelect');
const priceHelper = document.querySelector('#priceHelper');
const priceMinLabel = document.querySelector('#priceMinLabel');
const priceMaxLabel = document.querySelector('#priceMaxLabel');
const quickPriceButtons = [...document.querySelectorAll('[data-price]')];

const PACKAGE_BUDGETS = {
  custom: { label: 'Custom Package', min: 4999, max: 49999, default: 9999 },
  basic: { label: 'Basic Package', min: 4999, max: 14999, default: 9999 },
  standard: { label: 'Standard Package', min: 14999, max: 24999, default: 14999 },
  premium: { label: 'Premium Package', min: 24999, max: 49999, default: 24999 }
};

const PACKAGE_ALIASES = {
  custom: 'custom',
  'custom package': 'custom',
  basic: 'basic',
  'basic package': 'basic',
  standard: 'standard',
  'standard package': 'standard',
  premium: 'premium',
  'premium package': 'premium'
};

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value));
}

function updatePrice() {
  if (!priceRange || !priceOutput) return;
  priceOutput.textContent = formatINR(priceRange.value);
  priceOutput.classList.remove('price-pop');
  void priceOutput.offsetWidth;
  priceOutput.classList.add('price-pop');
  updateRangeFill();
  updateQuickPriceButtons();
}

function updateRangeFill() {
  if (!priceRange) return;
  const min = Number(priceRange.min);
  const max = Number(priceRange.max);
  const value = Number(priceRange.value);
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const progress = Math.max(0, Math.min(100, percent));

  priceRange.style.setProperty('--range-progress', `${progress}%`);
  priceRange.style.background = `linear-gradient(to right, #7a1f24 0%, #7a1f24 ${progress}%, rgba(201,154,58,0.28) ${progress}%, rgba(201,154,58,0.28) 100%)`;
}

function getSelectedPackageRange() {
  const selectedPackage = packageSelect?.value || 'custom';
  return PACKAGE_BUDGETS[selectedPackage] || PACKAGE_BUDGETS.custom;
}

function setBudgetValue(value) {
  if (!priceRange) return;
  const range = getSelectedPackageRange();
  const clampedValue = Math.max(range.min, Math.min(range.max, Number(value)));
  priceRange.value = Number.isNaN(clampedValue) ? range.default : clampedValue;
  updatePrice();
}

function updateQuickPriceButtons() {
  const range = getSelectedPackageRange();
  const currentValue = Number(priceRange?.value);
  quickPriceButtons.forEach((button) => {
    const price = Number(button.dataset.price);
    const disabled = price < range.min || price > range.max;
    button.disabled = disabled;
    button.classList.toggle('is-disabled', disabled);
    button.classList.toggle('is-active', !disabled && price === currentValue);
    button.setAttribute('aria-disabled', String(disabled));
    button.setAttribute('aria-pressed', String(!disabled && price === currentValue));
  });
}

function updatePackageBudgetRange(useDefault = false) {
  if (!priceRange) return;
  const range = getSelectedPackageRange();

  priceRange.min = String(range.min);
  priceRange.max = String(range.max);

  if (priceMinLabel) priceMinLabel.textContent = formatINR(range.min);
  if (priceMaxLabel) priceMaxLabel.textContent = formatINR(range.max);
  if (priceHelper) {
    priceHelper.textContent = `${range.label} budget range: ${formatINR(range.min)} to ${formatINR(range.max)}`;
  }

  setBudgetValue(useDefault ? range.default : priceRange.value);
  updateQuickPriceButtons();
}

function setupMobileMenu() {
  menuToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    document.body.classList.toggle('menu-open', Boolean(open));
    menuToggle.setAttribute('aria-expanded', String(Boolean(open)));
  });

  document.querySelectorAll('.main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      nav?.classList.remove('open');
      document.body.classList.remove('menu-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupPackageFromURL() {
  const params = new URLSearchParams(window.location.search);
  const selectedPackage = params.get('package');
  const selectedBudget = params.get('budget');

  if (selectedPackage && packageSelect) {
    const packageKey = PACKAGE_ALIASES[selectedPackage.toLowerCase().replace(/\s+/g, ' ').trim()];
    if (packageKey && PACKAGE_BUDGETS[packageKey]) packageSelect.value = packageKey;
  }

  if (selectedBudget && priceRange) {
    const budget = Math.max(Number(priceRange.min), Math.min(Number(priceRange.max), Number(selectedBudget)));
    if (!Number.isNaN(budget)) {
      setBudgetValue(budget);
    }
  }
}

function setupQuickPrices() {
  quickPriceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!priceRange || button.disabled) return;
      setBudgetValue(button.dataset.price);
    });
  });
}

function setupFormSubmit() {
  bookingForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(bookingForm);
    const category = data.get('category') || 'Not selected';
    const budget = formatINR(data.get('budget') || 14999);
    const packageKey = data.get('package') || 'custom';
    const packageLabel = PACKAGE_BUDGETS[packageKey]?.label || 'Custom Package';

    const message = [
      'Hello Himadri Creation, I want to book a professional photography/videography shoot.',
      '',
      'Customer Booking Enquiry:',
      `Name: ${data.get('name') || ''}`,
      `Phone: ${data.get('phone') || ''}`,
      `Email: ${data.get('email') || 'Not provided'}`,
      `Event Date: ${data.get('date') || 'Not decided'}`,
      `Event Location: ${data.get('location') || ''}`,
      `Shooting Category: ${category}`,
      `Budget Range: ${budget}`,
      `Preferred Package: ${packageLabel}`,
      `Expected Guests: ${data.get('guests') || 'Not decided'}`,
      '',
      `Extra Requirements: ${data.get('message') || 'No extra message'}`,
      '',
      'Source: Website Booking Form'
    ].join('\n');

    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const submitButton = bookingForm.querySelector('.submit-booking');
    if (submitButton) submitButton.innerHTML = '<img src="./assets/icons/whatsapp.svg" alt="" /> Opening WhatsApp...';
    window.location.href = whatsappURL;
  });
}

priceRange?.addEventListener('input', updatePrice);
packageSelect?.addEventListener('change', () => updatePackageBudgetRange(true));
setupMobileMenu();
setupPackageFromURL();
updatePackageBudgetRange(false);
setupQuickPrices();
setupFormSubmit();
