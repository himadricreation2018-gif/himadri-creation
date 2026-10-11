const WHATSAPP_NUMBER = '918327482228';
const MAX_RESUME_SIZE = 10 * 1024 * 1024;

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const careersForm = document.querySelector('#careersForm');
const resumeInput = document.querySelector('#resumeInput');
const resumeLabel = document.querySelector('#resumeLabel');

const REQUIRED_MESSAGES = {
  name: 'Please enter your full name.',
  phone: 'Please enter your phone number.',
  email: 'Please enter your email address.',
  city: 'Please enter your city.',
  position: 'Please select the position you are applying for.',
  experience: 'Please select your experience.',
  qualification: 'Please enter your qualification.',
  skills: 'Please list your key skills.',
  whyHire: 'Please tell us why we should hire you.'
};

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

function setFieldError(field, message) {
  const error = field.closest('label')?.querySelector('.field-error');
  field.classList.toggle('is-invalid', Boolean(message));
  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (error) error.textContent = message || '';
}

function validateField(field) {
  const value = field.type === 'file' ? '' : field.value.trim();

  if (REQUIRED_MESSAGES[field.name] && !value) return REQUIRED_MESSAGES[field.name];

  if (field.name === 'phone' && !/^(\+?91[\s-]?)?[6-9]\d{9}$/.test(value.replace(/[\s-]/g, ''))) {
    return 'Please enter a valid 10-digit mobile number.';
  }

  if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Please enter a valid email address.';
  }

  if (field.name === 'portfolio' && value && !/^(https?:\/\/)?[^\s.]+\.[^\s]+$/i.test(value)) {
    return 'Please enter a valid link.';
  }

  if (field.name === 'resume' && field.files[0] && field.files[0].size > MAX_RESUME_SIZE) {
    return 'Resume file must be 10 MB or smaller.';
  }

  return '';
}

function validateForm() {
  let firstInvalid = null;
  careersForm.querySelectorAll('input, select, textarea').forEach((field) => {
    const message = validateField(field);
    setFieldError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return !firstInvalid;
}

function setupLiveValidation() {
  careersForm?.querySelectorAll('input, select, textarea').forEach((field) => {
    const eventName = field.tagName === 'SELECT' || field.type === 'file' ? 'change' : 'input';
    field.addEventListener(eventName, () => {
      if (field.classList.contains('is-invalid')) setFieldError(field, validateField(field));
    });
  });
}

function setupResumeInput() {
  resumeInput?.addEventListener('change', () => {
    const file = resumeInput.files[0];
    if (resumeLabel) {
      resumeLabel.textContent = file ? file.name : 'Choose your resume (PDF, DOC, DOCX, JPG or PNG, max 10 MB)';
    }
    setFieldError(resumeInput, validateField(resumeInput));
  });
}

function setupFormSubmit() {
  careersForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const data = new FormData(careersForm);
    const get = (key, fallback = 'Not provided') => String(data.get(key) || '').trim() || fallback;
    const resumeFile = resumeInput?.files[0];

    const message = [
      'Hello Himadri Creation, I would like to apply for a job with your team.',
      '',
      'Job Application:',
      `Full Name: ${get('name')}`,
      `Phone: ${get('phone')}`,
      `Email: ${get('email')}`,
      `City: ${get('city')}`,
      `Position Applying For: ${get('position')}`,
      `Experience: ${get('experience')}`,
      `Qualification: ${get('qualification')}`,
      `Skills: ${get('skills')}`,
      `Portfolio / Instagram: ${get('portfolio')}`,
      '',
      `Why should you hire me: ${get('whyHire')}`,
      '',
      `Resume: ${resumeFile ? `${resumeFile.name} (attaching in this chat)` : 'Not attached'}`,
      '',
      `Message: ${get('message', 'No extra message')}`,
      '',
      'Source: Website Careers Form'
    ].join('\n');

    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const submitButton = careersForm.querySelector('.submit-booking');
    if (submitButton) submitButton.innerHTML = '<img src="/assets/icons/whatsapp.svg" alt="" /> Opening WhatsApp...';
    window.location.href = whatsappURL;
  });
}

setupMobileMenu();
setupResumeInput();
setupLiveValidation();
setupFormSubmit();
