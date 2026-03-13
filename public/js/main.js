/* ===== NAVIGATION ===== */
const header = document.getElementById('header');
const navToggle = document.getElementById('nav-toggle');
const navList = document.getElementById('nav-list');
const navLinks = document.querySelectorAll('.nav__link');

// Sticky header on scroll
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
  updateActiveLink();
});

// Mobile menu toggle
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navList.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', navList.classList.contains('open'));
});

// Close mobile menu on link click
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navList.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Active link on scroll
function updateActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY + 90;

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 90;
    const sectionBottom = sectionTop + section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav__link[href="#${id}"]`);
    if (link) {
      link.classList.toggle('active', window.scrollY >= sectionTop && window.scrollY < sectionBottom);
    }
  });
}

/* ===== TYPING ANIMATION ===== */
const typedEl = document.getElementById('typed-text');
const phrases = [
  'Full-Stack Developer',
  'Node.js Engineer',
  'React Developer',
  'Problem Solver',
  'Open Source Contributor',
];
let phraseIdx = 0;
let charIdx = 0;
let isDeleting = false;

// Add cursor element
const cursor = document.createElement('span');
cursor.className = 'cursor';
typedEl.appendChild(cursor);

function typeLoop() {
  const currentPhrase = phrases[phraseIdx];

  if (!isDeleting) {
    charIdx++;
    typedEl.firstChild.textContent = currentPhrase.slice(0, charIdx);
    if (charIdx === currentPhrase.length) {
      isDeleting = true;
      setTimeout(typeLoop, 1800);
      return;
    }
  } else {
    charIdx--;
    typedEl.firstChild.textContent = currentPhrase.slice(0, charIdx);
    if (charIdx === 0) {
      isDeleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
    }
  }
  setTimeout(typeLoop, isDeleting ? 60 : 90);
}

// Insert text node before cursor and start typing
if (typedEl) {
  typedEl.insertBefore(document.createTextNode(''), cursor);
  setTimeout(typeLoop, 600);
}

/* ===== SCROLL REVEAL ===== */
const revealEls = document.querySelectorAll(
  '.skill-card, .work-card, .about__grid, .contact__grid, .section__header'
);
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), index * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach(el => revealObserver.observe(el));

/* ===== SKILL BAR ANIMATION ===== */
const skillBars = document.querySelectorAll('.skill-bar__fill');
const barObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        barObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);
skillBars.forEach(bar => barObserver.observe(bar));

/* ===== FOOTER YEAR ===== */
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ===== YEARS OF EXPERIENCE ===== */
const yearsEl = document.getElementById('years-exp');
if (yearsEl) {
  const START_YEAR = 2023; // year professional work began
  const years = new Date().getFullYear() - START_YEAR;
  yearsEl.textContent = `${years}+`;
}

/* ===== CONTACT FORM ===== */
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const submitLoading = document.getElementById('submit-loading');
const formFeedback = document.getElementById('form-feedback');

function validateField(id, errorId, rules) {
  const field = document.getElementById(id);
  const error = document.getElementById(errorId);
  const value = field.value.trim();
  let msg = '';

  if (rules.required && !value) {
    msg = `${rules.label} is required.`;
  } else if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    msg = 'Please enter a valid email address.';
  } else if (rules.maxLength && value.length > rules.maxLength) {
    msg = `${rules.label} must be under ${rules.maxLength} characters.`;
  }

  if (msg) {
    error.textContent = msg;
    field.classList.add('invalid');
    return false;
  }
  error.textContent = '';
  field.classList.remove('invalid');
  return true;
}

function validateAll() {
  const results = [
    validateField('name',    'name-error',    { label: 'Name',    required: true, maxLength: 100 }),
    validateField('email',   'email-error',   { label: 'Email',   required: true, email: true }),
    validateField('subject', 'subject-error', { label: 'Subject', required: true, maxLength: 200 }),
    validateField('message', 'message-error', { label: 'Message', required: true, maxLength: 2000 }),
  ];
  return results.every(Boolean);
}

// Live validation on blur
['name', 'email', 'subject', 'message'].forEach(id => {
  const field = document.getElementById(id);
  const rules = {
    name:    { label: 'Name',    required: true, maxLength: 100 },
    email:   { label: 'Email',   required: true, email: true },
    subject: { label: 'Subject', required: true, maxLength: 200 },
    message: { label: 'Message', required: true, maxLength: 2000 },
  };
  field.addEventListener('blur', () => validateField(id, `${id}-error`, rules[id]));
});

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    // Loading state
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');
    formFeedback.className = 'form-feedback hidden';
    formFeedback.textContent = '';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    document.getElementById('name').value.trim(),
          email:   document.getElementById('email').value.trim(),
          subject: document.getElementById('subject').value.trim(),
          message: document.getElementById('message').value.trim(),
        }),
      });

      const data = await res.json();

      formFeedback.className = `form-feedback ${data.success ? 'success' : 'error'}`;
      formFeedback.textContent = data.message;
      formFeedback.classList.remove('hidden');

      if (data.success) contactForm.reset();
    } catch {
      formFeedback.className = 'form-feedback error';
      formFeedback.textContent = 'Network error. Please check your connection and try again.';
      formFeedback.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
    }
  });
}
