const SITE_CONFIG = {
  brandName: 'gemshidden',
  supportEmail: 'support@gemshidden.com',
  paymentLinks: {
    starter: 'https://buy.stripe.com/REPLACE_WITH_YOUR_REAL_STARTER_LINK',
    builder: 'https://buy.stripe.com/REPLACE_WITH_YOUR_REAL_BUILDER_LINK',
    forge: 'https://buy.stripe.com/REPLACE_WITH_YOUR_REAL_FORGE_LINK',
    studio: 'https://buy.stripe.com/REPLACE_WITH_YOUR_REAL_STUDIO_LINK',
    founder: 'https://buy.stripe.com/REPLACE_WITH_YOUR_REAL_FOUNDER_LINK'
  }
};

const AUTH_STORAGE_KEY = 'gemshidden_user';
const NEWSLETTER_STORAGE_KEY = 'gemshidden_newsletter';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function logoutUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'G';
}

function isPlaceholderLink(url = '') {
  return url.includes('REPLACE_WITH_YOUR_REAL');
}

function injectHeaderState() {
  const user = getUser();
  $$('[data-header-actions]').forEach((target) => {
    target.innerHTML = user ? `
      <div class="account-area" data-account-area>
        <button class="account-trigger" type="button" data-account-trigger aria-haspopup="true" aria-expanded="false">
          <span class="avatar">${initials(user.name)}</span>
        </button>
        <div class="account-menu" role="menu">
          <div class="account-top">
            <div class="avatar">${initials(user.name)}</div>
            <div>
              <div class="account-name">${user.name}</div>
              <div class="account-email">${user.email}</div>
            </div>
          </div>
          <a class="menu-link" href="account.html">Your account</a>
          <a class="menu-link" href="courses.html">Browse passes</a>
          <button class="menu-btn" type="button" data-logout-btn>Sign out</button>
        </div>
      </div>` : `
      <a class="btn btn-ghost" href="signin.html">Sign in</a>
      <a class="btn btn-primary" href="signup.html">Sign up</a>`;
  });

  $$('[data-mobile-actions]').forEach((target) => {
    target.innerHTML = user ? `
      <a href="account.html">Your account</a>
      <button type="button" data-logout-btn>Sign out</button>` : `
      <a href="signin.html">Sign in</a>
      <a href="signup.html">Sign up</a>`;
  });
}

function setupMobileMenu() {
  const toggle = $('[data-mobile-toggle]');
  const menu = $('[data-mobile-menu]');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

function setupAccountMenu() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-account-trigger]');
    const area = event.target.closest('[data-account-area]');
    $$('[data-account-area]').forEach((node) => {
      if (area && node === area && trigger) {
        const open = !node.classList.contains('open');
        node.classList.toggle('open', open);
        const button = $('[data-account-trigger]', node);
        if (button) button.setAttribute('aria-expanded', String(open));
      } else if (!area) {
        node.classList.remove('open');
        const button = $('[data-account-trigger]', node);
        if (button) button.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

function setupLogout() {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-logout-btn]');
    if (!btn) return;
    logoutUser();
    window.location.href = 'index.html';
  });
}

function showAlert(target, message, type = 'success') {
  if (!target) return;
  target.textContent = message;
  target.className = `alert ${type === 'error' ? 'error' : ''} show`;
}

function setupAuthForms() {
  const signUpForm = $('[data-signup-form]');
  const signInForm = $('[data-signin-form]');

  if (signUpForm) {
    signUpForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = $('[name="name"]', signUpForm).value.trim();
      const email = $('[name="email"]', signUpForm).value.trim().toLowerCase();
      const password = $('[name="password"]', signUpForm).value.trim();
      const terms = $('[name="terms"]', signUpForm).checked;
      const alert = $('[data-form-alert]', signUpForm);
      if (!name || !email || password.length < 6 || !terms) {
        showAlert(alert, 'Enter your name, a valid email, a password with 6+ characters, and accept the terms.', 'error');
        return;
      }
      const user = { name, email, password, createdAt: new Date().toISOString(), plan: 'No pass yet' };
      setUser(user);
      window.location.href = 'account.html';
    });
  }

  if (signInForm) {
    signInForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = $('[name="email"]', signInForm).value.trim().toLowerCase();
      const password = $('[name="password"]', signInForm).value.trim();
      const alert = $('[data-form-alert]', signInForm);
      const existing = getUser();
      if (!existing) {
        showAlert(alert, 'No account is saved in this browser yet. Create one first on the sign up page.', 'error');
        return;
      }
      if (existing.email !== email || existing.password !== password) {
        showAlert(alert, 'That email or password does not match the saved account.', 'error');
        return;
      }
      window.location.href = 'account.html';
    });
  }
}

function protectAccountPage() {
  const gate = $('[data-account-gate]');
  if (!gate) return;
  const user = getUser();
  if (!user) {
    window.location.href = 'signin.html';
    return;
  }
  $$('[data-account-name]').forEach(el => el.textContent = user.name);
  $$('[data-account-email]').forEach(el => el.textContent = user.email);
  $$('[data-account-created]').forEach(el => el.textContent = new Date(user.createdAt).toLocaleDateString());
  $$('[data-account-plan]').forEach(el => el.textContent = user.plan || 'No pass yet');
  $$('[data-account-initials]').forEach(el => el.textContent = initials(user.name));
}

function setupCheckoutButtons() {
  $$('[data-plan]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const plan = button.getAttribute('data-plan');
      const link = SITE_CONFIG.paymentLinks[plan];
      const user = getUser();
      if (!user) {
        localStorage.setItem('gemshidden_pending_plan', plan);
        window.location.href = 'signup.html';
        return;
      }
      if (!link || isPlaceholderLink(link)) {
        alert(`Add your real Stripe checkout link for the ${plan} plan in script.js before going live.`);
        return;
      }
      user.plan = `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Pass`;
      setUser(user);
      window.location.href = link;
    });
  });
}

function setupPendingPlanMessage() {
  const pending = localStorage.getItem('gemshidden_pending_plan');
  const note = $('[data-pending-plan]');
  if (!pending || !note) return;
  note.innerHTML = `<strong>${pending.charAt(0).toUpperCase()}${pending.slice(1)} Pass</strong> is waiting. Create your account and you'll be ready to continue to checkout.`;
  note.style.display = 'block';
  localStorage.removeItem('gemshidden_pending_plan');
}

function setupNewsletterForm() {
  const form = $('[data-news-form]');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = $('[type="email"]', form).value.trim().toLowerCase();
    const alert = $('[data-news-alert]');
    if (!email || !email.includes('@')) {
      showAlert(alert, 'Enter a valid email address to join the list.', 'error');
      return;
    }
    const signups = JSON.parse(localStorage.getItem(NEWSLETTER_STORAGE_KEY) || '[]');
    signups.push({ email, date: new Date().toISOString() });
    localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(signups));
    form.reset();
    showAlert(alert, 'Thanks — your email was saved locally for this demo build. Connect your real email tool before launch.');
  });
}

function setupContactForm() {
  const form = $('[data-support-form]');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const alert = $('[data-form-alert]', form);
    form.reset();
    showAlert(alert, `Message saved for demo review. For launch, connect this form to ${SITE_CONFIG.supportEmail}.`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  injectHeaderState();
  setupMobileMenu();
  setupAccountMenu();
  setupLogout();
  setupAuthForms();
  setupCheckoutButtons();
  setupPendingPlanMessage();
  setupNewsletterForm();
  setupContactForm();
  protectAccountPage();
});
