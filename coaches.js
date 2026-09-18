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

  const filterButtons = [...document.querySelectorAll('[data-coach-filter]')];
  const coachCards = [...document.querySelectorAll('.coach-card')];
  const setCoachFilter = filter => {
    filterButtons.forEach(button => {
      const active = button.dataset.coachFilter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    coachCards.forEach(card => {
      const match = filter === 'all' || card.dataset.specialty === filter;
      clearTimeout(card.filterTimer);
      if (match) {
        card.classList.remove('is-filtered-out');
        card.hidden = false;
      } else {
        card.classList.add('is-filtered-out');
        card.filterTimer = setTimeout(() => { card.hidden = true; }, reduceMotion ? 0 : 320);
      }
    });
  };
  filterButtons.forEach(button => button.addEventListener('click', () => setCoachFilter(button.dataset.coachFilter)));
  setCoachFilter('all');

  const profileTabs = [...document.querySelectorAll('.profile-tab')];
  const profilePanels = [...document.querySelectorAll('.profile-panel')];
  const setProfile = profile => {
    profileTabs.forEach(tab => {
      const active = tab.dataset.profile === profile;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    profilePanels.forEach(panel => {
      const active = panel.dataset.profilePanel === profile;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', String(!active));
    });
  };
  profileTabs.forEach(tab => tab.addEventListener('click', () => setProfile(tab.dataset.profile)));
  setProfile('marcus');

  const matchData = {
    stronger: { image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?fit=crop&fm=webp&q=80&w=1440', alt: 'Marcus Cole, recommended coach', kicker: 'YOUR MATCH / STRENGTH', name: 'Marcus Cole', copy: 'Build strength with a clear plan and a coach who knows how to make the next rep count.' },
    fitter: { image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?fit=crop&fm=webp&q=80&w=1024', alt: 'Nina Reyes, recommended coach', kicker: 'YOUR MATCH / CONDITIONING', name: 'Nina Reyes', copy: 'Build an engine that lasts with smart intervals, clean pacing, and a reason to come back.' },
    moving: { image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?fit=crop&fm=webp&q=80&w=800', alt: 'Tori Williams, recommended coach', kicker: 'YOUR MATCH / MOVEMENT', name: 'Tori Williams', copy: 'Find more range, less friction, and a body that trusts the work you ask it to do.' }
  };
  const matchButtons = [...document.querySelectorAll('.match-option')];
  const matchResult = document.querySelector('.match-result');
  const matchImage = document.querySelector('[data-match-image]');
  const matchKicker = document.querySelector('[data-match-kicker]');
  const matchName = document.querySelector('[data-match-name]');
  const matchCopy = document.querySelector('[data-match-copy]');
  const setMatch = key => {
    const data = matchData[key];
    if (!data || !matchResult) return;
    matchButtons.forEach(button => button.classList.toggle('is-active', button.dataset.match === key));
    matchResult.classList.add('is-swapping');
    const update = () => {
      if (matchImage) { matchImage.src = data.image; matchImage.alt = data.alt; }
      if (matchKicker) matchKicker.textContent = data.kicker;
      if (matchName) matchName.textContent = data.name;
      if (matchCopy) matchCopy.textContent = data.copy;
      matchResult.classList.remove('is-swapping');
    };
    if (reduceMotion) update(); else setTimeout(update, 220);
  };
  matchButtons.forEach(button => button.addEventListener('click', () => setMatch(button.dataset.match)));

  document.addEventListener('click', event => {
    const control = event.target.closest('main a, main button');
    if (!control || control.matches('[data-coach-filter], [data-profile], [data-match]')) return;
    event.preventDefault();
    window.location.href = '404.html';
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
