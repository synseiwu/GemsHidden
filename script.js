const toggle = document.querySelector('[data-mobile-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
if (toggle && mobileMenu) {
  toggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}
