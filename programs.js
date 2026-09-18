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
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }), { threshold: .12, rootMargin: '0px 0px -45px' });
    revealItems.forEach(item => revealObserver.observe(item));
  }

  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.program-card')];
  const count = document.querySelector('#program-count');
  const setFilter = filter => {
    let visible = 0;
    filterButtons.forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    cards.forEach(card => {
      const matches = filter === 'all' || card.dataset.category.split(' ').includes(filter);
      if (matches) {
        visible += 1;
        clearTimeout(card.filterTimer);
        card.hidden = false;
        card.classList.remove('is-filtered-out');
        requestAnimationFrame(() => card.classList.add('is-filtered-in'));
      } else {
        card.classList.remove('is-filtered-in');
        card.classList.add('is-filtered-out');
        clearTimeout(card.filterTimer);
        card.filterTimer = setTimeout(() => { card.hidden = true; }, reduceMotion ? 0 : 340);
      }
    });
    if (count) count.textContent = `${String(visible).padStart(2, '0')} program${visible === 1 ? '' : 's'}`;
  };
  filterButtons.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  setFilter('all');

  const pathTabs = [...document.querySelectorAll('.path-tab')];
  const pathPanels = [...document.querySelectorAll('.path-panel')];
  const setPath = level => {
    pathTabs.forEach(tab => {
      const active = tab.dataset.level === level;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    pathPanels.forEach(panel => {
      const active = panel.dataset.panel === level;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', String(!active));
    });
  };
  pathTabs.forEach(tab => tab.addEventListener('click', () => setPath(tab.dataset.level)));
  setPath('beginner');

  const schedule = document.querySelector('[data-schedule]');
  const dayButtons = [...(schedule?.querySelectorAll('.schedule-head [data-day]') || [])];
  const scheduleCells = [...(schedule?.querySelectorAll('.schedule-cell') || [])];
  const setDay = day => {
    if (!schedule) return;
    schedule.dataset.mobileDay = day;
    dayButtons.forEach(button => button.classList.toggle('is-active', button.dataset.day === day));
    scheduleCells.forEach(cell => cell.classList.toggle('is-mobile-active', cell.dataset.day === day));
  };
  const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = weekdays[new Date().getDay()];
  if (schedule) {
    schedule.querySelectorAll(`[data-day="${today}"]`).forEach(item => item.classList.add('is-today'));
    setDay(dayButtons.some(button => button.dataset.day === today) ? today : 'mon');
    dayButtons.forEach(button => button.addEventListener('click', () => setDay(button.dataset.day)));
    scheduleCells.forEach(cell => {
      const row = cell.closest('.schedule-row');
      cell.addEventListener('mouseenter', () => row?.classList.add('is-hovered'));
      cell.addEventListener('mouseleave', () => row?.classList.remove('is-hovered'));
    });
  }

  const progressItems = [...document.querySelectorAll('.progress-item')];
  progressItems.forEach(item => item.style.setProperty('--progress', `${item.dataset.progress || 0}%`));

  const comparison = document.querySelector('[data-comparison]');
  const handle = comparison?.querySelector('.comparison-handle');
  const setComparison = clientX => {
    if (!comparison || !handle) return;
    const box = comparison.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - box.left) / box.width) * 100));
    comparison.style.setProperty('--compare', `${percent}%`);
    handle.setAttribute('aria-valuenow', String(Math.round(percent)));
  };
  let dragging = false;
  comparison?.addEventListener('pointerdown', event => {
    dragging = true;
    setComparison(event.clientX);
    comparison.setPointerCapture?.(event.pointerId);
  });
  comparison?.addEventListener('pointermove', event => { if (dragging) setComparison(event.clientX); });
  comparison?.addEventListener('pointerup', () => { dragging = false; });
  comparison?.addEventListener('pointercancel', () => { dragging = false; });
  handle?.addEventListener('keydown', event => {
    const current = Number(handle.getAttribute('aria-valuenow') || 52);
    const next = event.key === 'ArrowLeft' ? current - 5 : event.key === 'ArrowRight' ? current + 5 : event.key === 'Home' ? 0 : event.key === 'End' ? 100 : current;
    if (next === current) return;
    event.preventDefault();
    const box = comparison.getBoundingClientRect();
    setComparison(box.left + box.width * next / 100);
  });

  const counters = document.querySelectorAll('.counter');
  const setCounter = (counter, value) => { counter.textContent = Number(value).toLocaleString('en-US'); };
  const animateCounter = counter => {
    const target = Number(counter.dataset.target || 0);
    if (reduceMotion) return setCounter(counter, target);
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / 1400, 1);
      setCounter(counter, Math.floor(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && !reduceMotion) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      entry.target.dataset.counted = 'true';
      animateCounter(entry.target);
    }), { threshold: .7 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else counters.forEach(animateCounter);

  const trialForm = document.querySelector('.trial-form');
  if (trialForm) {
    const nameInput = trialForm.querySelector('#tf-name');
    const emailInput = trialForm.querySelector('#tf-email');
    const phoneInput = trialForm.querySelector('#tf-phone');
    const focusSelect = trialForm.querySelector('#tf-focus');
    const messageInput = trialForm.querySelector('#tf-message');
    const success = trialForm.querySelector('#tf-success');
    const setFieldError = (input, message) => {
      const error = trialForm.querySelector(`#${input.id}-error`);
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
        [focusSelect, focusSelect.value ? '' : 'Please choose a focus.'],
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
    trialForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!validate()) return;
      if (success) {
        success.textContent = "Thank you \u2014 your free trial is booked. We'll be in touch.";
        success.classList.add('is-visible');
        setTimeout(() => {
          success.classList.remove('is-visible');
          success.textContent = '';
        }, 3000);
      }
      trialForm.reset();
    });
  }

  document.addEventListener('click', event => {
    const control = event.target.closest('main a, main button');
    if (!control || control.matches('[data-filter], [data-level]') || control.closest('form')) return;
    event.preventDefault();
    window.location.href = '404.html';
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
