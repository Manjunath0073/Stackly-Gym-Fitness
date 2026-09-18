(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');

  const closeMenu = () => {
    if (!menu || !nav) return;
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open menu');
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    menu.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    nav?.classList.toggle('is-open', !open);
    document.body.classList.toggle('menu-open', !open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const revealItems = document.querySelectorAll('.reveal, .mask-reveal, .mask-headline');
  const showAll = items => items.forEach(item => item.classList.add('is-visible'));
  if (reduceMotion || !('IntersectionObserver' in window)) showAll(revealItems);
  else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }), { threshold: .12, rootMargin: '0px 0px -45px' });
    revealItems.forEach(item => observer.observe(item));
  }

  const form = document.querySelector('.contact-form');

  const mapWrap = document.querySelector('.map-wrap');
  const mapOverlay = mapWrap?.querySelector('.map-overlay');
  const activateMap = () => mapWrap?.classList.add('is-active');
  const deactivateMap = () => mapWrap?.classList.remove('is-active');
  mapOverlay?.addEventListener('click', activateMap);
  mapOverlay?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateMap();
    }
  });
  mapWrap?.addEventListener('mouseleave', deactivateMap);
  document.addEventListener('click', event => {
    if (mapWrap && !mapWrap.contains(event.target)) deactivateMap();
  });
  if (form) {
    const nameInput = form.querySelector('#cf-name');
    const emailInput = form.querySelector('#cf-email');
    const phoneInput = form.querySelector('#cf-phone');
    const topicSelect = form.querySelector('#cf-topic');
    const messageInput = form.querySelector('#cf-message');
    const status = form.querySelector('#cf-success');
    const setFieldError = (input, message) => {
      const error = form.querySelector(`#${input.id}-error`);
      const valid = !message;
      input.classList.toggle('is-invalid', !valid);
      if (error) {
        error.textContent = message;
        error.style.display = valid ? 'none' : 'block';
      }
      return valid;
    };
    const validate = () => {
      const checks = [
        [nameInput, /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(nameInput.value.trim()) ? '' : 'Name can only contain letters.'],
        [emailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()) ? '' : 'Enter a valid email address.'],
        [phoneInput, phoneInput.value.trim().length >= 10 ? '' : 'Phone number must contain at least 10 digits.'],
        [topicSelect, topicSelect.value ? '' : 'Please choose a topic.'],
        [messageInput, messageInput.value.trim().length >= 10 ? '' : 'Message must be at least 10 characters.']
      ];
      let firstInvalid = null;
      checks.forEach(([input, message]) => {
        if (!setFieldError(input, message) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) firstInvalid.focus();
      return checks.every(([, message]) => !message);
    };
    nameInput.addEventListener('input', () => { nameInput.value = nameInput.value.replace(/[^A-Za-z ]/g, '').replace(/ {2,}/g, ' '); });
    phoneInput.addEventListener('input', () => { phoneInput.value = phoneInput.value.replace(/\D/g, ''); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!validate()) return;
      if (status) {
        status.textContent = 'Thanks. Your note is queued for the Stackly team.';
        status.classList.add('is-visible');
        setTimeout(() => {
          status.classList.remove('is-visible');
          status.textContent = '';
        }, 3000);
      }
      form.reset();
    });
  }

  document.addEventListener('click', event => {
    const control = event.target.closest('main a, main button');
    if (!control || control.closest('form')) return;
    event.preventDefault();
    window.location.href = '404.html';
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
