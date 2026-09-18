/*!
 * STACKLY - premium mobile navbar (nav.css + nav.js)
 * ============================================================================
 * DROP-IN SNIPPET - copy/paste into any marketing page (home, about, programs,
 * membership, coaches, contact, login, signup).
 *
 * 1) In <head>, after the Google Fonts link:
 *
 *    <link rel="stylesheet" href="nav.css">
 *
 * 2) Right after <body>, paste this markup:
 *
 *    <header class="sk-nav" data-sk-nav>
 *      <div class="sk-nav-inner">
 *        <a class="sk-logo" href="index.html" aria-label="Stackly home"><span class="sk-logo-mark" aria-hidden="true"></span></a>
 *        <button class="sk-burger" type="button" data-sk-burger aria-expanded="false" aria-controls="sk-menu" aria-label="Open menu"><i></i><i></i><i></i></button>
 *      </div>
 *    </header>
 *
 *    <div class="sk-menu" id="sk-menu" data-sk-menu role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden="true">
 *      <span class="sk-menu-backdrop" data-sk-backdrop aria-hidden="true"></span>
 *      <div class="sk-menu-panel">
 *        <div class="sk-menu-head">
 *          <a class="sk-logo" href="index.html" aria-label="Stackly home"><span class="sk-logo-mark" aria-hidden="true"></span></a>
 *          <button class="sk-burger sk-burger-x" type="button" data-sk-close aria-label="Close menu"><i></i><i></i><i></i></button>
 *        </div>
 *        <nav class="sk-menu-nav" aria-label="Mobile navigation">
 *          <ul class="sk-menu-list">
 *            <li><a class="sk-menu-link" href="index.html" data-sk-link><span class="sk-link-index">01</span><span class="sk-link-label">Home</span><svg class="sk-link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a></li>
 *            <li><a class="sk-menu-link" href="about.html" data-sk-link><span class="sk-link-index">02</span><span class="sk-link-label">About</span><svg class="sk-link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a></li>
 *            <li><a class="sk-menu-link" href="programs.html" data-sk-link><span class="sk-link-index">03</span><span class="sk-link-label">Programs</span><svg class="sk-link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a></li>
 *            <li><a class="sk-menu-link" href="login.html" data-sk-link><span class="sk-link-index">04</span><span class="sk-link-label">Login</span><svg class="sk-link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a></li>
 *            <li><a class="sk-menu-link" href="signup.html" data-sk-link><span class="sk-link-index">05</span><span class="sk-link-label">Join Now</span><svg class="sk-link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a></li>
 *          </ul>
 *        </nav>
 *        <div class="sk-menu-foot">
 *          <div class="sk-social">
 *            <a href="https://www.instagram.com" aria-label="Stackly on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1"/></svg></a>
 *            <a href="https://www.youtube.com" aria-label="Stackly on YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="3.5"/><path d="M10.5 9.5l5 2.5-5 2.5z"/></svg></a>
 *            <a href="https://www.strava.com" aria-label="Stackly on Strava"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 17.5H6L12 7l6 10.5h-3.5"/><path d="M13.5 17.5l2.5 4.5 2.5-4.5"/></svg></a>
 *          </div>
 *          <p class="sk-contact"><a href="mailto:hello@stackly.fit">hello@stackly.fit</a><a href="tel:+914275550182">+91 427 555 0182</a></p>
 *          <a class="sk-cta" href="login.html">Start Your Free Trial<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a>
 *        </div>
 *      </div>
 *    </div>
 *
 * 3) Before </body>:
 *
 *    <script src="nav.js" defer></script>
 *
 * GOOD TO KNOW
 * - Below 1024px this replaces the legacy header: nav.js adds body.sk-nav-ready
 *   and nav.css hides .site-header / .auth-header so two headers never stack.
 *   Delete that marked block in nav.css to opt out.
 * - Zero-flash tip: nav.js adds that class on load; to set it before first paint,
 *   add this inline script right after the snippet markup ->
 *   <script>document.body.classList.add("sk-nav-ready")</script>
 * - Desktop (>= 1024px) hides this component and keeps the site's normal nav.
 * - Optional overlay backdrop image (swap the black + glow look if wanted):
 *   add to .sk-menu in nav.css ->
 *   background-image: linear-gradient(rgba(10,10,10,.88), rgba(10,10,10,.96)), url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?fit=crop&fm=webp&q=80&w=800");
 *   background-size: cover; background-position: center;
 * - Programmatic access: window.StacklyNav.open() / .close() / .toggle()
 * ============================================================================
 */
(() => {
  "use strict";

  const init = () => {
    if (window.StacklyNav) return;
    const nav = document.querySelector("[data-sk-nav]");
    const menu = document.querySelector("[data-sk-menu]");
    if (!nav || !menu) return;

    const burger = nav.querySelector("[data-sk-burger]");
    const closeButton = menu.querySelector("[data-sk-close]");
    const backdrop = menu.querySelector("[data-sk-backdrop]");
    const links = [...menu.querySelectorAll("[data-sk-link]")];
    const supportsInert = "inert" in menu;
    const desktop = () => window.innerWidth >= 1024;
    let open = false;
    let lastY = window.scrollY;
    let ticking = false;

    document.body.classList.add("sk-nav-ready");
    if (supportsInert) menu.inert = true;

    /* Stagger index + active page highlight */
    const currentPage = () => (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    links.forEach((link, index) => {
      link.style.setProperty("--sk-i", link.dataset.skIndex ?? index);
      const target = (link.getAttribute("href") || "").split("#")[0].split("/").pop().toLowerCase();
      if (target && target === currentPage()) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });

    const focusables = () => [...menu.querySelectorAll("a[href], button:not([disabled])")].filter(element => element.getClientRects().length);

    const setOpen = (next, silent) => {
      if (next === open) return;
      open = next;
      menu.classList.toggle("is-open", open);
      burger?.classList.toggle("is-open", open);
      burger?.setAttribute("aria-expanded", String(open));
      burger?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) menu.removeAttribute("aria-hidden");
      else menu.setAttribute("aria-hidden", "true");
      if (supportsInert) menu.inert = !open;
      document.documentElement.classList.toggle("sk-menu-open", open);
      document.body.classList.toggle("sk-menu-open", open);
      if (open) {
        nav.classList.remove("is-hidden");
        requestAnimationFrame(() => (closeButton || focusables()[0])?.focus({ preventScroll: true }));
      } else if (!silent) {
        burger?.focus({ preventScroll: true });
      }
    };

    /* Hide on scroll down, show on scroll up */
    const onScroll = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastY;
      nav.classList.toggle("is-scrolled", y > 8);
      if (!open) {
        if (y > 140 && delta > 4) nav.classList.add("is-hidden");
        else if (delta < -4 || y <= 140) nav.classList.remove("is-hidden");
      }
      lastY = y;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    }, { passive: true });
    onScroll();

    /* Controls */
    burger?.addEventListener("click", () => setOpen(!open));
    closeButton?.addEventListener("click", () => setOpen(false));
    backdrop?.addEventListener("click", () => setOpen(false));
    links.forEach(link => link.addEventListener("click", () => setOpen(false, true)));
    document.addEventListener("keydown", event => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.addEventListener("resize", () => { if (open && desktop()) setOpen(false, true); });

    window.StacklyNav = {
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen(!open),
      isOpen: () => open
    };
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
