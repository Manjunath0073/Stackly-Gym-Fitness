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
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  let scrollFrame;
  const timeline = document.querySelector('[data-timeline]');
  const updateScrollState = () => {
    header?.classList.toggle('scrolled', window.scrollY > 24);
    if (reduceMotion) {
      timeline?.style.setProperty('--timeline-progress', '100%');
      return;
    }
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      if (timeline) {
        const box = timeline.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (window.innerHeight * .72 - box.top) / Math.max(box.height, 1)));
        timeline.style.setProperty('--timeline-progress', `${progress * 100}%`);
      }
      scrollFrame = null;
    });
  };
  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  const revealItems = document.querySelectorAll('.reveal, .mask-reveal');
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

  const beliefs = [...document.querySelectorAll('.belief')];
  const setBelief = active => beliefs.forEach(item => item.classList.toggle('is-current', item === active));
  if ('IntersectionObserver' in window && beliefs.length) {
    const beliefObserver = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach(entry => setBelief(entry.target));
    }, { rootMargin: '-42% 0px -45% 0px', threshold: 0 });
    beliefs.forEach(belief => beliefObserver.observe(belief));
  }

  const counters = document.querySelectorAll('.counter');
  const setCounter = (counter, value) => { counter.textContent = Number(value).toLocaleString('en-US'); };
  const animateCounter = counter => {
    const target = Number(counter.dataset.target || 0);
    if (reduceMotion) return setCounter(counter, target);
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / 1500, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounter(counter, Math.floor(target * eased));
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

  document.addEventListener('click', event => {
    const control = event.target.closest('main a, main button');
    if (!control) return;
    event.preventDefault();
    window.location.href = '404.html';
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
