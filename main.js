(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
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
    nav.classList.toggle('is-open', !open);
    document.body.classList.toggle('menu-open', !open);
  });
  const navLinks = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
  const setActiveLink = link => navLinks.forEach(item => item.classList.toggle('is-active', item === link));
  navLinks.forEach(link => link.addEventListener('click', () => {
    setActiveLink(link);
    closeMenu();
  }));

  const spyTargets = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (spyTargets.length && 'IntersectionObserver' in window) {
    const spyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const link = navLinks.find(item => item.getAttribute('href') === `#${entry.target.id}`);
        if (link) setActiveLink(link);
      });
    }, { rootMargin: '-45% 0px -50%' });
    spyTargets.forEach(target => spyObserver.observe(target));
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  let parallaxFrame;
  const updateScrollState = () => {
    header?.classList.toggle('scrolled', window.scrollY > 24);
    if (!reduceMotion && hero && !parallaxFrame) {
      parallaxFrame = requestAnimationFrame(() => {
        hero.style.setProperty('--hero-shift', `${Math.min(window.scrollY * .16, 90)}px`);
        parallaxFrame = null;
      });
    }
  };
  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(item => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .14, rootMargin: '0px 0px -50px' });
    reveals.forEach(item => revealObserver.observe(item));
  }

  const counters = document.querySelectorAll('.counter');
  const setCounter = (counter, value) => {
    counter.textContent = Number(value).toLocaleString('en-US');
  };
  const animateCounter = counter => {
    const target = Number(counter.dataset.target || 0);
    if (reduceMotion) {
      setCounter(counter, target);
      return;
    }
    const started = performance.now();
    const duration = 1500;
    const tick = now => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounter(counter, Math.floor(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && !reduceMotion) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.target.dataset.counted) return;
        entry.target.dataset.counted = 'true';
        animateCounter(entry.target);
      });
    }, { threshold: .75 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else counters.forEach(animateCounter);

  const slides = [...document.querySelectorAll('.quote-slide')];
  const currentNumber = document.querySelector('#slide-current');
  const slider = document.querySelector('.quote-window');
  const sliderButtons = document.querySelectorAll('[data-slide]');
  let activeSlide = 0;
  let sliderTimer;
  const showSlide = index => {
    if (!slides.length) return;
    slides[activeSlide].classList.remove('is-active');
    activeSlide = (index + slides.length) % slides.length;
    slides[activeSlide].classList.add('is-active');
    if (currentNumber) currentNumber.textContent = String(activeSlide + 1).padStart(2, '0');
  };
  const stopSlider = () => clearInterval(sliderTimer);
  const startSlider = () => {
    stopSlider();
    if (!reduceMotion && slides.length > 1) sliderTimer = setInterval(() => showSlide(activeSlide + 1), 6500);
  };
  sliderButtons.forEach(button => button.addEventListener('click', () => {
    showSlide(activeSlide + (button.dataset.slide === 'next' ? 1 : -1));
    startSlider();
  }));
  slider?.addEventListener('mouseenter', stopSlider);
  slider?.addEventListener('mouseleave', startSlider);
  document.addEventListener('visibilitychange', () => document.hidden ? stopSlider() : startSlider());
  startSlider();

  document.addEventListener('click', event => {
    const control = event.target.closest('main a, main button:not([data-slide])');
    if (!control) return;
    event.preventDefault();
    window.location.href = '404.html';
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
