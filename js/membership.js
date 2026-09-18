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

  const billingOptions = [...document.querySelectorAll('[data-billing]')];
  const prices = [...document.querySelectorAll('.plan-price')];
  const suffixes = [...document.querySelectorAll('.plan-suffix')];
  const setBilling = billing => {
    billingOptions.forEach(option => {
      const active = option.dataset.billing === billing;
      option.classList.toggle('is-active', active);
      option.setAttribute('aria-pressed', String(active));
    });
    prices.forEach(price => { price.textContent = price.dataset[billing]; });
    suffixes.forEach(suffix => { suffix.textContent = billing === 'month' ? '/month' : '/week'; });
  };
  billingOptions.forEach(option => option.addEventListener('click', () => setBilling(option.dataset.billing)));
  setBilling('week');

  const benefitTabs = [...document.querySelectorAll('.benefit-tab')];
  const benefitRows = [...document.querySelectorAll('.benefit-row:not(.benefit-head)')];
  const setBenefitPlan = plan => {
    benefitTabs.forEach(tab => {
      const active = tab.dataset.benefitPlan === plan;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    benefitRows.forEach(row => row.querySelectorAll('i').forEach(cell => cell.classList.toggle('is-selected', cell.classList.contains(plan))));
  };
  benefitTabs.forEach(tab => tab.addEventListener('click', () => setBenefitPlan(tab.dataset.benefitPlan)));
  setBenefitPlan('solo');

  const details = [...document.querySelectorAll('.faq-list details')];
  details.forEach(item => item.addEventListener('toggle', () => {
    if (!item.open) return;
    details.filter(other => other !== item).forEach(other => { other.open = false; });
  }));

  document.addEventListener('click', event => {
    const control = event.target.closest('main a, main button');
    if (!control || control.matches('[data-billing], [data-benefit-plan]')) return;
    event.preventDefault();
    window.location.href = '404.html';
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
