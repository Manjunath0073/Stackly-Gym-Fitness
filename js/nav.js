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
 *            <li><a class="sk-menu-link" href="coaches.html" data-sk-link><span class="sk-link-index">04</span><span class="sk-link-label">Coaches</span><svg class="sk-link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a></li>
 *            <li><a class="sk-menu-link" href="membership.html" data-sk-link><span class="sk-link-index">05</span><span class="sk-link-label">Membership</span><svg class="sk-link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a></li>
 *            <li><a class="sk-menu-link" href="contact.html" data-sk-link><span class="sk-link-index">06</span><span class="sk-link-label">Contact</span><svg class="sk-link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a></li>
 *          </ul>
 *        </nav>
 *        <div class="sk-menu-foot">
 *          <div class="sk-social">
 *            <a href="404.html" aria-label="Stackly on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
 *            <a href="404.html" aria-label="Stackly on X"><svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg></a>
 *            <a href="404.html" aria-label="Stackly on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>
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
