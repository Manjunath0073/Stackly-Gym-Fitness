(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.authPage;
  const form = document.querySelector('[data-auth-form]');
  const roleButtons = [...document.querySelectorAll('[data-role]')];
  const copy = document.querySelector('.auth-copy');
  const heading = document.querySelector('[data-role-heading]');
  const helper = document.querySelector('[data-role-helper]');
  const submitLabel = document.querySelector('[data-role-submit]');
  const toast = document.querySelector('.auth-toast');
  let toastTimer;

  const roleCopy = {
    login: {
      member: ['Welcome back, Member', 'Sign in to keep your training moving.', 'Log in as Member'],
      coach: ['Coach sign-in', 'Access your coaching dashboard and team tools.', 'Sign in as Coach']
    },
    signup: {
      member: ['Create your Member account', 'Set up your account and make the room part of your week.', 'Create Member account'],
      coach: ['Create your Coach account', 'Set up your coach profile and join the team behind the work.', 'Create Coach account']
    }
  };

  const setRole = role => {
    const text = roleCopy[page]?.[role] || roleCopy.login.member;
    roleButtons.forEach(button => {
      const active = button.dataset.role === role;
      button.setAttribute('aria-selected', String(active));
    });
    form?.setAttribute('data-role', role);
    const update = () => {
      if (heading) heading.textContent = text[0];
      if (helper) helper.textContent = text[1];
      if (submitLabel) submitLabel.textContent = text[2];
      copy?.classList.remove('is-switching');
    };
    if (!copy || reduceMotion) update();
    else {
      copy.classList.add('is-switching');
      setTimeout(update, 170);
    }
  };
  roleButtons.forEach(button => button.addEventListener('click', () => setRole(button.dataset.role)));
  setRole(roleButtons.find(button => button.getAttribute('aria-selected') === 'true')?.dataset.role || 'member');

  document.querySelectorAll('[data-password-toggle]').forEach(toggle => toggle.addEventListener('click', () => {
    const input = document.getElementById(toggle.dataset.passwordToggle);
    if (!input) return;
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    toggle.setAttribute('aria-pressed', String(!visible));
    toggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
  }));

  const getError = input => document.querySelector(`[data-error-for="${input.id}"]`);
  const setError = (input, message) => {
    const field = input?.closest('.auth-field');
    const error = input && getError(input);
    field?.classList.toggle('has-error', Boolean(message));
    input?.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) error.textContent = message || '';
    return !message;
  };
  const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const passwordStrength = value => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  };
  const updateStrength = input => {
    const score = passwordStrength(input.value);
    const fill = document.querySelector('.strength-fill');
    const label = document.querySelector('[data-strength-label]');
    if (fill) fill.style.width = `${score * 25}%`;
    if (label) label.textContent = input.value ? ['Keep going', 'Getting there', 'Strong', 'Excellent'][Math.max(score - 1, 0)] : 'Use 8+ characters';
    return score;
  };

  const validateSignupField = input => {
    if (!input) return true;
    if (input.id === 'signup-name') return setError(input, /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(input.value.trim()) ? '' : 'Name can only contain letters.');
    if (input.id === 'signup-email') return setError(input, validEmail(input.value.trim()) ? '' : 'Enter a valid email address.');
    if (input.id === 'signup-password') {
      updateStrength(input);
      return setError(input, input.value.length >= 8 ? '' : 'Use at least 8 characters.');
    }
    if (input.id === 'signup-confirm') {
      const password = document.querySelector('#signup-password');
      return setError(input, input.value && input.value === password?.value ? '' : 'Passwords do not match.');
    }
    return true;
  };

  const formInputs = form ? [...form.querySelectorAll('input')].filter(input => input.type !== 'checkbox') : [];
  formInputs.forEach(input => {
    input.addEventListener('blur', () => { input.dataset.touched = 'true'; if (page === 'signup') validateSignupField(input); });
    input.addEventListener('input', () => {
      if (page !== 'signup') return;
      if (input.id === 'signup-name') input.value = input.value.replace(/[^A-Za-z ]/g, '').replace(/ {2,}/g, ' ');
      if (input.id === 'signup-password') updateStrength(input);
      if (input.dataset.touched === 'true' || input.value) validateSignupField(input);
      if (input.id === 'signup-password') {
        const confirm = document.querySelector('#signup-confirm');
        if (confirm?.dataset.touched === 'true') validateSignupField(confirm);
      }
    });
  });

  const showToast = message => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4200);
  };

  const validateLogin = () => {
    const email = document.querySelector('#login-email');
    const password = document.querySelector('#login-password');
    const emailOK = email && setError(email, validEmail(email.value.trim()) ? '' : 'Enter a valid email address.');
    const passwordOK = password && setError(password, password.value.length >= 8 ? '' : 'Use at least 8 characters.');
    return Boolean(emailOK && passwordOK);
  };
  const validateSignup = () => {
    const fields = ['signup-name', 'signup-email', 'signup-password', 'signup-confirm'].map(id => document.getElementById(id));
    fields.forEach(input => { if (input) input.dataset.touched = 'true'; });
    const fieldsOK = fields.every(validateSignupField);
    const terms = form?.querySelector('[name="terms"]');
    const termsBox = terms?.closest('.auth-form-meta');
    const termsOK = Boolean(terms?.checked);
    termsBox?.classList.toggle('has-error', !termsOK);
    if (!termsOK) showToast('Please agree to the Terms to continue.');
    return fieldsOK && termsOK;
  };
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const valid = page === 'signup' ? validateSignup() : validateLogin();
    if (!valid) return;
    const role = form.dataset.role === 'coach' ? 'coach' : 'member';
    const emailInput = document.querySelector(page === 'signup' ? '#signup-email' : '#login-email');
    const email = emailInput?.value.trim() || '';
    let existing = null;
    try { existing = JSON.parse(localStorage.getItem('stackly_user') || 'null'); } catch (error) { existing = null; }
    const typedName = page === 'signup' ? document.querySelector('#signup-name')?.value.trim() : '';
    const name = typedName
      || (existing?.email === email && existing?.name)
      || email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, character => character.toUpperCase())
      || 'Stackly Member';
    const user = { name, email, role, tier: 'UNLIMITED', joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
    try { localStorage.setItem('stackly_user', JSON.stringify(user)); } catch (error) {}
    showToast('Signed in. Opening your dashboard...');
    setTimeout(() => { window.location.href = role === 'coach' ? 'coach.html' : 'dashboard.html'; }, 550);
  });

  document.querySelector('[data-forgot]')?.addEventListener('click', () => { window.location.href = '404.html'; });

  const slides = [...document.querySelectorAll('.auth-testimonial')];
  const dots = [...document.querySelectorAll('.auth-dots i')];
  let activeSlide = 0;
  const showSlide = index => {
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === activeSlide));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeSlide));
  };
  if (!reduceMotion && slides.length > 1) setInterval(() => showSlide(activeSlide + 1), 5200);

  document.querySelectorAll('.auth-social button').forEach(button => button.addEventListener('click', () => showToast(`${button.textContent.trim()} sign-in is visual only in this demo.`)));
})();
