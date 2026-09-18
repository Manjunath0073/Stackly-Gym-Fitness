(() => {
  "use strict";

  const DATA = window.STACKLY_DATA || {};
  const COACH = DATA.coach || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const routes = ["overview", "clients", "sessions", "programs", "analytics", "messages", "reviews", "settings"];
  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const storage = {
    read(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (error) { return fallback; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { return false; }
      return true;
    },
    remove(key) { try { localStorage.removeItem(key); } catch (error) {} }
  };

  const rawUser = storage.read("stackly_user", null);
  if (rawUser?.role && rawUser.role.toLowerCase() !== "coach") {
    window.location.replace("dashboard.html");
    return;
  }

  const savedProfile = storage.read("stackly_coach_profile", {});
  let coach = { ...(COACH.demoCoach || {}), ...(rawUser || {}), ...(savedProfile || {}) };

  const defaults = COACH.defaultState || {};
  let sessionStatus = { ...(defaults.sessionStatus || {}), ...(storage.read("stackly_coach_sessions", {}) || {}) };
  let schedule = storage.read("stackly_coach_schedule", {}) || {};
  let clientNotes = storage.read("stackly_coach_notes", {}) || {};
  let programs = storage.read("stackly_coach_programs", COACH.programs || []);
  let threads = storage.read("stackly_coach_messages", COACH.messages || []);
  const reviewReplies = storage.read("stackly_coach_replies", {}) || {};
  let availability = { ...(defaults.availability || {}), ...(storage.read("stackly_coach_availability", {}) || {}) };
  let hours = { start: "06:00", end: "20:00", ...(storage.read("stackly_coach_hours", {}) || {}) };
  let preferences = { ...(COACH.notificationDefaults || {}), ...(storage.read("stackly_coach_preferences", {}) || {}) };
  let notifications = storage.read("stackly_coach_notification_feed", COACH.notifications || []);

  let clientFilter = "All";
  let clientQuery = "";
  let reviewFilter = "All";
  let activeThreadId = null;
  let selectedSessionId = null;
  let weekOffset = 0;
  let toastTimer;

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const initials = name => String(name || "MC").split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "MC";
  const firstName = name => String(name || "Coach").trim().split(/\s+/)[0] || "Coach";
  const formatNumber = value => Number(value || 0).toLocaleString("en-IN");
  const moneyShort = value => `${(Number(value || 0) / 100000).toFixed(2)}L`;
  const text = (selector, value) => { $$(selector).forEach(element => { element.textContent = value; }); };
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const avatarMarkup = (src, name, size = "avatar-medium") => `<span class="avatar ${size}"><img src="${esc(src)}" alt=""><span>${esc(initials(name))}</span></span>`;
  const statusClass = status => String(status).toLowerCase().replace(/[^a-z]/g, "-");
  const statusTag = status => `<span class="status-tag ${statusClass(status)}">${esc(status)}</span>`;
  const starsMarkup = rating => Array.from({ length: 5 }, (_, index) => `<i class="${index < Math.round(rating) ? "" : "is-empty"}">${icon("star")}</i>`).join("");
  const renderStars = (element, rating) => { if (element) element.innerHTML = starsMarkup(rating); };

  function showToast(message) {
    const toast = $("[data-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function applyCoach() {
    const name = coach.name || "Stackly Coach";
    const specialties = Array.isArray(coach.specialties) ? coach.specialties.join(" / ") : String(coach.specialties || "");
    text("[data-coach-name]", name);
    text("[data-coach-first]", firstName(name));
    text("[data-coach-email]", coach.email || "coach@stackly.fit");
    text("[data-coach-tier]", coach.tier || "COACH");
    text("[data-coach-rating]", Number(coach.rating || 4.9).toFixed(1));
    text("[data-coach-specialties]", specialties);
    text("[data-coach-initials]", initials(name));
    renderStars($("[data-rating-inline]"), coach.rating || 4.9);
    $$("[data-coach-verified]").forEach(tick => { tick.hidden = coach.verified === false; });
    $$("[data-coach-avatar]").forEach(image => {
      image.alt = `${name} avatar`;
      image.style.display = coach.avatar ? "block" : "none";
      image.onerror = () => { image.style.display = "none"; };
      if (coach.avatar && image.src !== coach.avatar) image.src = coach.avatar;
    });
    const setValue = (selector, value) => { const input = $(selector); if (input && document.activeElement !== input) input.value = value; };
    setValue("[data-coach-form] [name=name]", name);
    setValue("[data-coach-form] [name=email]", coach.email || "");
    setValue("[data-coach-form] [name=rate]", coach.hourlyRate ?? 1200);
    setValue("[data-bio-input]", coach.bio || "");
    setValue("[data-avatar-input]", coach.avatar || "");
    setValue("[data-specialties-input]", specialties);
  }

  function updateClock() {
    const now = new Date();
    text("[data-clock]", now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    text("[data-today-label]", now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }

  function animateCounter(element, target, options = {}) {
    if (!element) return;
    const { decimals = 0, prefix = "", suffix = "", divisor = 1 } = options;
    const format = value => `${prefix}${divisor > 1 ? (value / divisor).toFixed(decimals) : (decimals ? value.toFixed(decimals) : formatNumber(value))}${suffix}`;
    if (reduceMotion) { element.textContent = format(target); return; }
    const started = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - started) / 800);
      element.textContent = format(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function renderStats() {
    const stats = COACH.stats || {};
    animateCounter($('[data-stat="clients"]'), stats.clients || 0);
    animateCounter($('[data-stat="sessions"]'), stats.sessions || 0);
    animateCounter($('[data-stat="rating"]'), stats.rating || 0, { decimals: 1 });
    animateCounter($('[data-stat="earnings"]'), stats.earnings || 0, { decimals: 2, divisor: 100000, suffix: "L" });
  }

  /* Charts */
  function svgElement(name, attrs = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }
  function pathFor(points) { return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" "); }
  const nextFrame = callback => requestAnimationFrame(() => requestAnimationFrame(callback));
  function animateStroke(path) {
    if (!path?.getTotalLength) return;
    let length = 0;
    try { length = path.getTotalLength(); } catch (error) { return; }
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = reduceMotion ? 0 : length;
    if (!reduceMotion) nextFrame(() => { path.style.strokeDashoffset = 0; });
  }
  function showTip(tooltip, svg, x, y, html) {
    if (!tooltip) return;
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    tooltip.innerHTML = html;
    tooltip.style.left = `${x / viewBox.width * rect.width}px`;
    tooltip.style.top = `${y / viewBox.height * rect.height}px`;
    tooltip.classList.add("is-visible");
  }
  const hideTip = tooltip => tooltip?.classList.remove("is-visible");

  function renderAreaChart(svg, labels, values, options = {}) {
    if (!svg || !values.length) return;
    const width = Number(svg.viewBox.baseVal.width) || 800;
    const height = Number(svg.viewBox.baseVal.height) || 290;
    const padding = { left: 42, right: 17, top: 18, bottom: 35 };
    const min = options.min ?? 0;
    const max = options.max ?? Math.max(...values) * 1.1;
    const span = Math.max(1, max - min);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const points = values.map((value, index) => ({ value, x: padding.left + index * plotWidth / (values.length - 1), y: padding.top + (max - value) / span * plotHeight }));
    const grid = $("[data-chart-grid]", svg);
    const pointsGroup = $("[data-chart-points]", svg);
    const labelsGroup = $("[data-chart-labels]", svg);
    const line = $("[data-chart-line]", svg);
    const area = $("[data-chart-area]", svg);
    if (!grid || !pointsGroup || !labelsGroup || !line || !area) return;
    grid.innerHTML = "";
    pointsGroup.innerHTML = "";
    labelsGroup.innerHTML = "";
    for (let index = 0; index <= 4; index += 1) {
      const y = padding.top + index * plotHeight / 4;
      grid.append(svgElement("line", { x1: padding.left, x2: width - padding.right, y1: y, y2: y }));
      const label = svgElement("text", { x: 0, y: y + 3 });
      label.textContent = options.gridFormat ? options.gridFormat(max - span * index / 4) : Math.round(max - span * index / 4);
      grid.append(label);
    }
    labels.forEach((labelText, index) => {
      const label = svgElement("text", { x: points[index].x, y: height - 7 });
      label.textContent = labelText;
      labelsGroup.append(label);
    });
    const linePath = pathFor(points);
    line.setAttribute("d", linePath);
    area.setAttribute("d", `${linePath} L${points[points.length - 1].x} ${height - padding.bottom} L${points[0].x} ${height - padding.bottom} Z`);
    area.style.opacity = reduceMotion ? ".95" : "0";
    animateStroke(line);
    if (!reduceMotion) nextFrame(() => { area.style.opacity = ".95"; });
    const shell = svg.closest("[data-chart-shell]");
    const tooltip = $("[data-chart-tooltip]", shell);
    points.forEach((point, index) => {
      const circle = svgElement("circle", { cx: point.x, cy: point.y, r: 4.5, tabindex: "0", class: "chart-point" });
      const display = options.tooltip ? options.tooltip(values[index]) : values[index];
      const show = () => showTip(tooltip, svg, point.x, point.y, `<strong>${display}</strong><span>${esc(labels[index])}</span>`);
      circle.addEventListener("mouseenter", show);
      circle.addEventListener("focus", show);
      circle.addEventListener("mouseleave", () => hideTip(tooltip));
      circle.addEventListener("blur", () => hideTip(tooltip));
      pointsGroup.append(circle);
    });
  }

  function renderBarChart(svg, records, options = {}) {
    if (!svg || !records.length) return;
    const width = Number(svg.viewBox.baseVal.width) || 500;
    const height = Number(svg.viewBox.baseVal.height) || 240;
    const padding = { left: 34, right: 15, top: 20, bottom: 38 };
    const max = Math.max(...records.map(record => record.value), 1) * 1.12;
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const bars = $("[data-chart-bars]", svg);
    const grid = $("[data-chart-grid]", svg);
    const labels = $("[data-chart-labels]", svg);
    if (!bars || !grid || !labels) return;
    bars.innerHTML = "";
    grid.innerHTML = "";
    labels.innerHTML = "";
    for (let index = 0; index <= 2; index += 1) {
      const y = padding.top + index * plotHeight / 2;
      grid.append(svgElement("line", { x1: padding.left, x2: width - padding.right, y1: y, y2: y }));
      const label = svgElement("text", { x: 0, y: y + 3 });
      label.textContent = options.gridFormat ? options.gridFormat(max - max * index / 2) : Math.round(max - max * index / 2);
      grid.append(label);
    }
    const slot = plotWidth / records.length;
    const shell = svg.closest("[data-chart-shell]");
    const tooltip = $("[data-chart-tooltip]", shell);
    records.forEach((record, index) => {
      const barWidth = slot * .6;
      const x = padding.left + index * slot + (slot - barWidth) / 2;
      const barHeight = record.value / max * plotHeight;
      const y = height - padding.bottom - barHeight;
      const rect = svgElement("rect", { x, y: reduceMotion ? y : height - padding.bottom, width: barWidth, height: reduceMotion ? barHeight : 0, rx: 1, class: "chart-bar", tabindex: "0" });
      const value = svgElement("text", { x: x + barWidth / 2, y: y - 8, class: "chart-value" });
      value.textContent = options.valueFormat ? options.valueFormat(record.value) : record.value;
      const label = svgElement("text", { x: x + barWidth / 2, y: height - 8, class: "chart-label" });
      label.textContent = record.label;
      const show = () => {
        showTip(tooltip, svg, x + barWidth / 2, y, `<strong>${options.tooltip ? options.tooltip(record.value) : record.value}</strong><span>${esc(record.label)}</span>`);
        rect.classList.add("is-hover");
      };
      rect.addEventListener("mouseenter", show);
      rect.addEventListener("focus", show);
      rect.addEventListener("mouseleave", () => { hideTip(tooltip); rect.classList.remove("is-hover"); });
      rect.addEventListener("blur", () => { hideTip(tooltip); rect.classList.remove("is-hover"); });
      bars.append(rect, value);
      labels.append(label);
      if (!reduceMotion) nextFrame(() => { rect.setAttribute("y", y); rect.setAttribute("height", barHeight); });
    });
  }

  function renderDonut(svg, segments, tooltip) {
    const group = svg && $("[data-donut-segments]", svg);
    if (!group) return;
    group.innerHTML = "";
    const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    segments.forEach((item, index) => {
      const length = item.value / total * circumference;
      const circle = svgElement("circle", { cx: 70, cy: 70, r: radius, class: "donut-segment", "stroke-opacity": [1, .68, .42, .2, .1][index % 5], tabindex: "0", "stroke-dasharray": `0 ${circumference}`, "stroke-dashoffset": -offset });
      const show = () => {
        if (!tooltip) return;
        tooltip.innerHTML = `<strong>${item.value}${item.suffix || "%"}</strong><span>${esc(item.label)}</span>`;
        tooltip.classList.add("is-visible");
      };
      circle.addEventListener("mouseenter", show);
      circle.addEventListener("focus", show);
      circle.addEventListener("mouseleave", () => tooltip?.classList.remove("is-visible"));
      circle.addEventListener("blur", () => tooltip?.classList.remove("is-visible"));
      if (reduceMotion) circle.setAttribute("stroke-dasharray", `${length} ${circumference - length}`);
      else nextFrame(() => circle.setAttribute("stroke-dasharray", `${length} ${circumference - length}`));
      offset += length;
      group.append(circle);
    });
  }

  function renderOverviewCharts() {
    const earnings = COACH.earnings || {};
    renderAreaChart($("[data-chart=earnings]"), earnings.labels || [], earnings.values || [], { min: 90000, max: 200000, gridFormat: value => moneyShort(value), tooltip: value => `Rs ${formatNumber(Math.round(value))}` });
    const best = (earnings.labels || [])[(earnings.values || []).indexOf(Math.max(...(earnings.values || [0])))];
    text("[data-best-earnings]", best || "SEP");
    const split = COACH.sessionTypes || [];
    renderDonut($("[data-chart=split]"), split, $("[data-split-tooltip]"));
    text("[data-split-total]", split.reduce((sum, item) => sum + item.value, 0) || 100);
    const legend = $("[data-split-legend]");
    if (legend) legend.innerHTML = split.map((item, index) => `<span><i style="opacity:${[1, .68, .42, .2, .1][index % 5]}"></i>${esc(item.label)}<b>${item.value}%</b></span>`).join("");
  }

  function renderAnalytics() {
    const analytics = COACH.analytics || {};
    renderAreaChart($("[data-chart=retention]"), analytics.retention?.labels || [], analytics.retention?.values || [], { min: 75, max: 95, gridFormat: value => `${Math.round(value)}%`, tooltip: value => `${Math.round(value)}%` });
    renderBarChart($("[data-chart=attendance]"), (analytics.attendance?.labels || []).map((label, index) => ({ label, value: analytics.attendance.values[index] })), { tooltip: value => `${value} visits` });
    renderBarChart($("[data-chart=earnings-bars]"), (COACH.earnings?.labels || []).map((label, index) => ({ label, value: COACH.earnings.values[index] })), { gridFormat: value => moneyShort(value), valueFormat: value => moneyShort(value), tooltip: value => `Rs ${formatNumber(value)}` });
    const ratings = analytics.ratings || [];
    const total = ratings.reduce((sum, item) => sum + item.count, 0) || 1;
    renderDonut($("[data-chart=ratings]"), ratings.map(item => ({ label: `${item.stars} star`, value: item.count, suffix: "" })), $("[data-ratings-tooltip]"));
    const legend = $("[data-ratings-legend]");
    if (legend) {
      legend.innerHTML = ratings.map(item => `<div class="rating-row"><span>${item.stars} star</span><span class="meter"><span style="width:${item.count / total * 100}%"></span></span><b>${item.count}</b></div>`).join("");
      if (!reduceMotion) $$(".meter > span", legend).forEach(bar => { const width = bar.style.width; bar.style.width = "0"; nextFrame(() => { bar.style.width = width; }); });
    }
    const insight = analytics.insight || {};
    text("[data-insight-name]", insight.program || "Foundations A");
    text("[data-insight-retention]", `${insight.retention || 92}%`);
    text("[data-insight-clients]", insight.clients || 9);
    text("[data-insight-note]", insight.note || "");
  }

  /* Clients */
  function renderClients() {
    const list = $("[data-client-list]");
    if (!list) return;
    const query = clientQuery.trim().toLowerCase();
    const items = (COACH.clients || []).filter(client => (clientFilter === "All" || client.status === clientFilter) && (!query || `${client.name} ${client.goal} ${client.status}`.toLowerCase().includes(query)));
    const circumference = 2 * Math.PI * 12;
    list.innerHTML = items.map(client => `<article class="client-card" data-client-id="${esc(client.id)}" tabindex="0" role="button" aria-label="Open ${esc(client.name)}"><div class="client-top">${avatarMarkup(client.avatar, client.name)}<div><strong>${esc(client.name)}</strong>${statusTag(client.status)}</div></div><p class="client-goal">Goal / <b>${esc(client.goal)}</b></p><div class="client-progress"><span class="progress-ring large"><svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="12"></circle><circle style="stroke-dasharray:${circumference};stroke-dashoffset:${circumference * (1 - client.progress / 100)}" cx="15" cy="15" r="12"></circle></svg><span>${client.progress}%</span></span><div><strong>${client.progress}%</strong><small>to goal</small></div></div><div class="client-foot"><span><i class="live-indicator"></i>${esc(client.lastActive)}</span><b>${client.attendance}% attendance</b></div></article>`).join("");
    const empty = $("[data-client-empty]");
    if (empty) empty.hidden = items.length > 0;
  }

  function openClientDrawer(id) {
    const client = (COACH.clients || []).find(item => item.id === id);
    const drawer = $("[data-client-drawer]");
    if (!client || !drawer) return;
    text("[data-drawer-name]", client.name);
    text("[data-drawer-goal]", client.goal);
    text("[data-drawer-initials]", initials(client.name));
    const status = $("[data-drawer-status]");
    if (status) { status.textContent = client.status; status.className = `status-tag ${statusClass(client.status)}`; }
    const avatar = $("[data-drawer-avatar]");
    if (avatar) { avatar.src = client.avatar; avatar.alt = `${client.name} avatar`; }
    const stats = $("[data-drawer-stats]");
    if (stats) stats.innerHTML = `<span><strong>${client.attendance}%</strong>attendance</span><span><strong>${client.sessions}</strong>sessions</span><span><strong>${client.streak}</strong>day streak</span>`;
    const workouts = $("[data-drawer-workouts]");
    if (workouts) workouts.innerHTML = (client.workouts || []).map(item => `<div class="mini-item"><span class="record-icon">${icon("check")}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.when)}</small></div></div>`).join("");
    const note = $("[data-client-note]");
    if (note) note.value = clientNotes[client.id] ?? client.note ?? "";
    const form = $("[data-client-note-form]");
    if (form) form.dataset.clientId = client.id;
    const state = $("[data-note-state]");
    if (state) state.textContent = "Saved to this browser";
    drawer.classList.add("is-open");
    document.body.classList.add("client-open");
    drawer.focus({ preventScroll: true });
  }

  function closeClientDrawer() {
    $("[data-client-drawer]")?.classList.remove("is-open");
    document.body.classList.remove("client-open");
  }

  /* Sessions */
  function parseTime(value) { const [hoursValue, minutes] = String(value).split(":").map(Number); return (hoursValue || 0) * 60 + (minutes || 0); }
  function startOfWeek(date = new Date()) { const result = new Date(date); result.setHours(0, 0, 0, 0); result.setDate(result.getDate() - (result.getDay() + 6) % 7); return result; }
  function addDays(date, amount) { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
  function dateKey(date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
  function formatWeek(start) {
    const end = addDays(start, 6);
    if (start.getMonth() === end.getMonth()) return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    return `${start.getDate()} ${start.toLocaleDateString("en-US", { month: "short" })}-${end.getDate()} ${end.toLocaleDateString("en-US", { month: "short" })} ${end.getFullYear()}`;
  }
  function effectiveSession(session) {
    const override = schedule[session.id] || {};
    return { ...session, day: override.day ?? session.day, start: override.start ?? session.start, status: sessionStatus[session.id] || session.status };
  }
  const statusLabel = status => status.charAt(0).toUpperCase() + status.slice(1);

  function renderSessions() {
    const calendar = $("[data-calendar]");
    if (!calendar) return;
    const start = addDays(startOfWeek(), weekOffset * 7);
    text("[data-week-label]", formatWeek(start));
    const days = $("[data-calendar-days]");
    const timeColumn = $("[data-time-column]");
    const hourLines = $("[data-hour-lines]");
    const layer = $("[data-session-layer]");
    if (!days || !timeColumn || !hourLines || !layer) return;
    days.innerHTML = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      const today = dateKey(date) === dateKey(new Date());
      return `<div class="calendar-day ${today ? "is-today" : ""}"><span>${date.toLocaleDateString("en-US", { weekday: "short" })}</span><strong>${String(date.getDate()).padStart(2, "0")}</strong></div>`;
    }).join("");
    timeColumn.innerHTML = Array.from({ length: 17 }, (_, index) => `<span class="time-label" style="top:${index * 74}px">${String(index + 6).padStart(2, "0")}:00</span>`).join("");
    hourLines.innerHTML = Array.from({ length: 17 }, () => "<i></i>").join("");
    layer.innerHTML = (COACH.sessions || []).map(item => {
      const session = effectiveSession(item);
      const top = (parseTime(session.start) - 360) / 60 * 74 + 4;
      const height = session.duration / 60 * 74 - 8;
      const compact = height < 52;
      return `<button class="calendar-session ${compact ? "is-compact " : ""}is-${esc(session.status)} ${session.id === selectedSessionId ? "is-selected" : ""}" type="button" data-session-id="${esc(session.id)}" data-type="${esc(session.type)}" aria-pressed="${session.id === selectedSessionId}" aria-label="${esc(session.title)} with ${esc(session.client)} at ${esc(session.start)}, ${esc(statusLabel(session.status))}" style="left:calc(${session.day * 14.2857}% + 4px);width:calc(14.2857% - 8px);top:${top}px;height:${height}px"><strong>${esc(session.title)}</strong>${compact ? "" : `<span>${esc(session.start)} / ${esc(session.client)}</span><i class="session-state">${esc(statusLabel(session.status))}</i>`}</button>`;
    }).join("");
  }

  function updateSessionActions() {
    const bar = $("[data-session-actions]");
    if (!bar) return;
    const session = selectedSessionId ? (COACH.sessions || []).map(effectiveSession).find(item => item.id === selectedSessionId) : null;
    if (!session) { bar.hidden = true; return; }
    text("[data-action-title]", session.title);
    text("[data-action-meta]", `${session.client} / ${session.room} / ${WEEKDAYS[session.day]} ${session.start}`);
    bar.hidden = false;
  }

  function selectSession(id) {
    selectedSessionId = selectedSessionId === id ? null : id;
    renderSessions();
    updateSessionActions();
  }

  function setSessionStatus(id, status, message) {
    if (!id) return;
    sessionStatus[id] = status;
    storage.write("stackly_coach_sessions", sessionStatus);
    renderSessions();
    updateSessionActions();
    renderNextSession();
    if (message) showToast(message);
  }

  function renderNextSession() {
    const today = (new Date().getDay() + 6) % 7;
    const booked = (COACH.sessions || []).map(effectiveSession).filter(session => session.status === "booked");
    const next = booked.find(session => session.day >= today) || booked[0];
    const button = $("[data-next-session-action]");
    if (!next) {
      if (button) button.disabled = true;
      return;
    }
    const focus = { Strength: "Clean reps under load", Conditioning: "Interval pacing", Mobility: "Range and control", Assessment: "Baseline numbers" }[next.type] || "Technique first";
    text("[data-next-session-time]", `${next.day === today ? "Today" : WEEKDAYS[next.day]} / ${next.start}`);
    text("[data-next-session-name]", next.title);
    text("[data-next-session-details]", `${next.client} / ${next.room} / ${next.duration} min`);
    text("[data-next-session-focus]", focus);
    if (button) {
      button.disabled = false;
      button.dataset.sessionTarget = next.id;
    }
  }

  function renderAvailability() {
    const days = { Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun" };
    const chip = (day, attribute) => `<button class="day-chip ${availability[day] ? "is-on" : ""}" type="button" ${attribute}="${day}" aria-pressed="${Boolean(availability[day])}">${day}</button>`;
    const compact = $("[data-availability-days]");
    if (compact) compact.innerHTML = Object.keys(days).map(day => chip(day, "data-availability-day")).join("");
    const editor = $("[data-schedule-days]");
    if (editor) editor.innerHTML = Object.keys(days).map(day => chip(day, "data-schedule-day")).join("");
    $$("[data-schedule-start]").forEach(input => { input.value = hours.start || "06:00"; });
    $$("[data-schedule-end]").forEach(input => { input.value = hours.end || "20:00"; });
  }

  function toggleAvailability(day) {
    availability[day] = !availability[day];
    storage.write("stackly_coach_availability", availability);
    renderAvailability();
    const state = $("[data-availability-state]");
    if (state) state.textContent = `${day} ${availability[day] ? "open" : "closed"}`;
  }

  /* Programs */
  function blankDraft() {
    return { id: null, name: "", level: "Intermediate", weeks: 4, assigned: [], days: [{ name: "Day 1", exercises: [{ name: "", sets: 3, reps: "10" }] }] };
  }
  let draft = blankDraft();

  function renderDraft() {
    const nameInput = $("[data-program-name]");
    if (!nameInput) return;
    nameInput.value = draft.name;
    $("[data-program-level]").value = draft.level;
    $("[data-program-weeks]").value = draft.weeks;
    text("[data-builder-mode]", draft.id ? "Editing program" : "New program");
    const assign = $("[data-program-assign]");
    if (assign) assign.innerHTML = (COACH.clients || []).map(client => `<label class="assign-chip"><input type="checkbox" value="${esc(client.name)}" ${draft.assigned.includes(client.name) ? "checked" : ""}> ${esc(client.name)}</label>`).join("");
    renderDraftDays();
  }

  function renderDraftDays() {
    const box = $("[data-program-days]");
    if (!box) return;
    box.innerHTML = draft.days.map((day, dayIndex) => `<div class="builder-day"><div class="builder-day-head"><input value="${esc(day.name)}" placeholder="Day name" data-day-name="${dayIndex}" aria-label="Day name"><button class="icon-button" type="button" data-remove-day="${dayIndex}" aria-label="Remove day">${icon("close")}</button></div>${day.exercises.map((exercise, exerciseIndex) => `<div class="exercise-row"><input value="${esc(exercise.name)}" placeholder="Exercise" data-ex-name="${dayIndex}:${exerciseIndex}" aria-label="Exercise name"><input type="number" min="1" value="${esc(exercise.sets)}" data-ex-sets="${dayIndex}:${exerciseIndex}" aria-label="Sets"><input value="${esc(exercise.reps)}" placeholder="Reps" data-ex-reps="${dayIndex}:${exerciseIndex}" aria-label="Reps"><button class="icon-button" type="button" data-remove-exercise="${dayIndex}:${exerciseIndex}" aria-label="Remove exercise">${icon("close")}</button></div>`).join("")}<button class="text-link small" type="button" data-add-exercise="${dayIndex}">${icon("plus")} Add exercise</button></div>`).join("");
  }

  function renderPrograms() {
    const list = $("[data-program-list]");
    if (!list) return;
    list.innerHTML = programs.map((program, index) => `<article class="template-card" data-program-id="${esc(program.id)}"><div class="template-head"><div><h3>${esc(program.name)}</h3><p class="template-meta"><span>${esc(program.level)}</span><span>${esc(program.weeks)} weeks</span><span>${(program.days || []).length} days</span></p></div><span class="template-mark">S / ${String(index + 1).padStart(2, "0")}</span></div><div class="assign-list">${(program.assigned || []).map(name => `<span class="assign-chip is-static">${esc(name)}</span>`).join("") || `<span class="assign-chip is-static">Unassigned</span>`}</div><div class="template-actions"><button class="outline-button" type="button" data-edit-program="${esc(program.id)}">Edit</button><button class="outline-button" type="button" data-duplicate-program="${esc(program.id)}">Duplicate</button></div></article>`).join("");
    const empty = $("[data-program-empty]");
    if (empty) empty.hidden = programs.length > 0;
    text("[data-program-count]", programs.length);
    text("[data-program-count-note]", programs.length);
  }

  /* Messages */
  const unreadTotal = () => threads.reduce((sum, thread) => sum + (thread.unread || 0), 0);

  function renderThreads() {
    const list = $("[data-thread-list]");
    if (!list) return;
    list.innerHTML = threads.map(thread => {
      const last = thread.messages[thread.messages.length - 1];
      return `<button class="thread-item ${thread.id === activeThreadId ? "is-active" : ""} ${thread.unread ? "unread" : ""}" type="button" data-thread-id="${esc(thread.id)}">${avatarMarkup(thread.avatar, thread.name)}<span class="thread-copy"><strong>${esc(thread.name)}</strong><small>${esc(last ? last.text : "No messages yet")}</small></span><span class="thread-side"><time>${esc(last ? last.time : "")}</time>${thread.unread ? `<b class="thread-badge">${thread.unread}</b>` : ""}</span></button>`;
    }).join("");
    const unread = unreadTotal();
    text("[data-unread-total]", unread);
    text("[data-unread-inline]", unread);
    const pip = $("[data-unread-total-badge]");
    if (pip) {
      pip.textContent = unread > 0 ? unread : "";
      pip.classList.toggle("thread-pip", unread > 0);
      pip.hidden = unread === 0;
    }
  }

  function renderMessages() {
    const box = $("[data-chat-messages]");
    const thread = threads.find(item => item.id === activeThreadId);
    if (!box || !thread) return;
    box.innerHTML = thread.messages.map(message => `<div class="msg ${esc(message.from)}">${esc(message.text)}<time>${esc(message.time)}</time></div>`).join("");
    box.scrollTop = box.scrollHeight;
  }

  function selectThread(id) {
    const thread = threads.find(item => item.id === id);
    if (!thread) return;
    activeThreadId = id;
    thread.unread = 0;
    storage.write("stackly_coach_messages", threads);
    const avatar = $("[data-chat-avatar]");
    if (avatar) { avatar.src = thread.avatar; avatar.alt = `${thread.name} avatar`; }
    text("[data-chat-initials]", initials(thread.name));
    text("[data-chat-name]", thread.name);
    const client = (COACH.clients || []).find(item => item.name === thread.name);
    text("[data-chat-meta]", client ? `${statusLabel(client.status)} client / ${client.goal}` : "Client thread");
    const link = $("[data-open-client]");
    if (link && client) link.dataset.openClient = client.id;
    renderMessages();
    renderThreads();
  }

  /* Reviews */
  const reviewReply = review => reviewReplies[review.id] || review.reply || "";

  function renderReviews() {
    const ratings = COACH.analytics?.ratings || [];
    const total = ratings.reduce((sum, item) => sum + item.count, 0) || 1;
    const average = ratings.reduce((sum, item) => sum + item.count * item.stars, 0) / total;
    text("[data-rating-avg]", average.toFixed(1));
    text("[data-ratings-total]", formatNumber(total));
    text("[data-review-count]", formatNumber(total));
    text("[data-review-count-inline]", formatNumber(total));
    renderStars($("[data-rating-stars]"), average);
    const distribution = $("[data-rating-distribution]");
    if (distribution) {
      distribution.innerHTML = ratings.map(item => `<div class="rating-row"><span>${item.stars} star</span><span class="meter"><span style="width:${item.count / total * 100}%"></span></span><b>${item.count}</b></div>`).join("");
      if (!reduceMotion) $$(".meter > span", distribution).forEach(bar => { const width = bar.style.width; bar.style.width = "0"; nextFrame(() => { bar.style.width = width; }); });
    }
    const list = (COACH.reviews || []).filter(review => reviewFilter === "All" || review.rating === Number(reviewFilter));
    const listBox = $("[data-review-list]");
    if (listBox) listBox.innerHTML = list.map(review => {
      const reply = reviewReply(review);
      return `<article class="review-card" data-review-id="${esc(review.id)}"><div class="review-head">${avatarMarkup(review.avatar, review.name)}<div><strong>${esc(review.name)}</strong><small>${esc(review.date)}</small></div><span class="stars">${starsMarkup(review.rating)}</span></div><p>${esc(review.text)}</p>${reply ? `<div class="review-reply"><strong>Your reply</strong><p>${esc(reply)}</p></div>` : ""}<div class="review-actions"><button class="text-link" type="button" data-reply-open="${esc(review.id)}">${reply ? "Edit reply" : "Reply"}</button></div><form class="reply-form" data-reply-form="${esc(review.id)}" hidden><label class="sr-only" for="reply-${esc(review.id)}">Reply to ${esc(review.name)}</label><input id="reply-${esc(review.id)}" data-reply-input placeholder="Write a public reply"><button class="primary-button" type="submit">Send</button></form></article>`;
    }).join("");
    const empty = $("[data-review-empty]");
    if (empty) empty.hidden = list.length > 0;
    text("[data-reply-pending]", (COACH.reviews || []).filter(review => !reviewReply(review)).length);
  }

  /* Shell */
  function closePopovers() {
    const panels = [$("[data-notification-panel]"), $("[data-profile-panel]")];
    panels.forEach(panel => { if (panel) panel.hidden = true; });
    $("[data-notifications]")?.setAttribute("aria-expanded", "false");
    $("[data-profile-toggle]")?.setAttribute("aria-expanded", "false");
    const results = $("[data-search-results]");
    if (results) results.hidden = true;
  }
  function closeDrawer() {
    document.body.classList.remove("drawer-open");
    $(".sidebar")?.classList.remove("is-open");
  }
  function routeFromHash() {
    const route = window.location.hash.replace(/^#/, "").split("?")[0];
    return routes.includes(route) ? route : "overview";
  }
  function navigate(route) {
    if (!routes.includes(route)) return;
    if (window.location.hash !== `#${route}`) window.location.hash = route;
    else renderRoute(route);
  }
  function renderRoute(route = routeFromHash()) {
    const active = $(`[data-view="${route}"]`);
    if (!active) return;
    $$("[data-view]").forEach(view => {
      const isActive = view === active;
      view.classList.toggle("is-active", isActive);
      view.hidden = !isActive;
      view.setAttribute("aria-hidden", String(!isActive));
    });
    $$("[data-route]").forEach(link => link.classList.toggle("is-active", link.dataset.route === route));
    text("[data-current-view]", route.toUpperCase());
    closePopovers();
    closeDrawer();
    closeClientDrawer();
    if (route === "overview") requestAnimationFrame(renderOverviewCharts);
    if (route === "analytics") requestAnimationFrame(renderAnalytics);
  }

  function renderSearch(query) {
    const results = $("[data-search-results]");
    if (!results) return;
    const value = query.trim().toLowerCase();
    if (!value) { results.hidden = true; results.innerHTML = ""; return; }
    const matches = [
      ...(COACH.clients || []).filter(client => `${client.name} ${client.goal} ${client.status}`.toLowerCase().includes(value)).map(client => ({ title: client.name, detail: `${client.status} / ${client.goal}`, route: "clients", client: client.id })),
      ...(COACH.sessions || []).map(effectiveSession).filter(session => `${session.title} ${session.client} ${session.type}`.toLowerCase().includes(value)).map(session => ({ title: session.title, detail: `${session.client} / ${WEEKDAYS[session.day]} ${session.start}`, route: "sessions" })),
      ...programs.filter(program => program.name.toLowerCase().includes(value)).map(program => ({ title: program.name, detail: `${program.level} / ${program.weeks} weeks`, route: "programs" }))
    ].slice(0, 6);
    results.innerHTML = matches.length ? matches.map(item => `<button class="search-result" type="button" data-search-route="${item.route}" ${item.client ? `data-search-client="${esc(item.client)}"` : ""}><span><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></span>${icon("arrow")}</button>`).join("") : `<div class="search-result"><span><strong>No matches</strong><small>Try a client, session, or program.</small></span></div>`;
    results.hidden = false;
  }

  /* Init */
  applyCoach();
  updateClock();
  setInterval(updateClock, 1000);
  renderStats();
  renderOverviewCharts();
  renderNextSession();
  renderClients();
  renderSessions();
  updateSessionActions();
  renderAvailability();
  renderDraft();
  renderPrograms();
  renderAnalytics();
  renderThreads();
  if (threads[0]) selectThread(threads[0].id);
  renderReviews();
  renderNotifications();
  renderPreferences();
  renderRoute(routeFromHash());

  const sidebarCollapsed = storage.read("stackly_coach_sidebar", false);
  if (sidebarCollapsed && window.innerWidth > 760) document.body.classList.add("sidebar-collapsed");
  setTimeout(() => $("[data-loading]")?.classList.add("is-hidden"), reduceMotion ? 60 : 480);

  function renderNotifications() {
    const list = $("[data-notification-list]");
    if (!list) return;
    list.innerHTML = (notifications || []).map(item => `<div class="notification-item ${item.read ? "is-read" : ""}"><i></i><p><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></p></div>`).join("");
    const dot = $(".notification-dot");
    if (dot) dot.hidden = !(notifications || []).some(item => !item.read);
  }
  function renderPreferences() {
    $$("[data-coach-toggle]").forEach(input => { input.checked = Boolean(preferences[input.name]); });
  }

  window.addEventListener("hashchange", () => renderRoute(routeFromHash()));

  document.addEventListener("click", event => {
    const routeLink = event.target.closest("[data-route]");
    if (routeLink) {
      event.preventDefault();
      navigate(routeLink.dataset.route);
      if (routeLink.dataset.openClient) openClientDrawer(routeLink.dataset.openClient);
      return;
    }
    const clientCard = event.target.closest("[data-client-id]");
    if (clientCard) { openClientDrawer(clientCard.dataset.clientId); return; }
    if (event.target.closest("[data-client-close]")) { closeClientDrawer(); return; }
    const clientFilterButton = event.target.closest("[data-client-filter]");
    if (clientFilterButton) {
      clientFilter = clientFilterButton.dataset.clientFilter;
      $$("[data-client-filter]").forEach(button => { const active = button === clientFilterButton; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); });
      renderClients();
      return;
    }
    const sessionButton = event.target.closest("[data-session-id]");
    if (sessionButton) { selectSession(sessionButton.dataset.sessionId); return; }
    if (event.target.closest("[data-session-dismiss]")) { selectedSessionId = null; renderSessions(); updateSessionActions(); return; }
    if (event.target.closest("[data-session-complete]")) { setSessionStatus(selectedSessionId, "completed", "Session marked complete."); return; }
    if (event.target.closest("[data-session-reschedule]")) {
      const session = selectedSessionId ? (COACH.sessions || []).map(effectiveSession).find(item => item.id === selectedSessionId) : null;
      if (!session) return;
      const day = (session.day + 1) % 7;
      schedule[session.id] = { day, start: session.start };
      storage.write("stackly_coach_schedule", schedule);
      renderSessions();
      updateSessionActions();
      renderNextSession();
      showToast(`${session.title} moved to ${WEEKDAYS[day]} ${session.start}.`);
      return;
    }
    if (event.target.closest("[data-session-cancel]")) { setSessionStatus(selectedSessionId, "cancelled", "Session cancelled."); return; }
    const nextAction = event.target.closest("[data-next-session-action]");
    if (nextAction?.dataset.sessionTarget) {
      selectedSessionId = nextAction.dataset.sessionTarget;
      renderSessions();
      updateSessionActions();
      navigate("sessions");
      showToast("Session selected. Complete, reschedule or cancel it.");
      return;
    }
    const weekShift = event.target.closest("[data-week-shift]");
    if (weekShift) { weekOffset += Number(weekShift.dataset.weekShift); renderSessions(); return; }
    if (event.target.closest("[data-week-today]")) { weekOffset = 0; renderSessions(); return; }
    const availabilityDay = event.target.closest("[data-availability-day], [data-schedule-day]");
    if (availabilityDay) {
      toggleAvailability(availabilityDay.dataset.availabilityDay || availabilityDay.dataset.scheduleDay);
      return;
    }
    if (event.target.closest("[data-schedule-save]")) {
      hours = { start: $("[data-schedule-start]").value || "06:00", end: $("[data-schedule-end]").value || "20:00" };
      storage.write("stackly_coach_hours", hours);
      const state = $("[data-schedule-state]");
      if (state) state.textContent = `Saved ${hours.start}-${hours.end}`;
      showToast(`Availability updated to ${hours.start}-${hours.end}.`);
      return;
    }
    const addDay = event.target.closest("[data-add-day]");
    if (addDay) { draft.days.push({ name: `Day ${draft.days.length + 1}`, exercises: [{ name: "", sets: 3, reps: "10" }] }); renderDraftDays(); return; }
    const removeDay = event.target.closest("[data-remove-day]");
    if (removeDay) { draft.days.splice(Number(removeDay.dataset.removeDay), 1); if (!draft.days.length) draft.days = [{ name: "Day 1", exercises: [{ name: "", sets: 3, reps: "10" }] }]; renderDraftDays(); return; }
    const addExercise = event.target.closest("[data-add-exercise]");
    if (addExercise) { draft.days[Number(addExercise.dataset.addExercise)].exercises.push({ name: "", sets: 3, reps: "10" }); renderDraftDays(); return; }
    const removeExercise = event.target.closest("[data-remove-exercise]");
    if (removeExercise) {
      const [dayIndex, exerciseIndex] = removeExercise.dataset.removeExercise.split(":").map(Number);
      draft.days[dayIndex].exercises.splice(exerciseIndex, 1);
      if (!draft.days[dayIndex].exercises.length) draft.days[dayIndex].exercises.push({ name: "", sets: 3, reps: "10" });
      renderDraftDays();
      return;
    }
    const editProgram = event.target.closest("[data-edit-program]");
    if (editProgram) {
      const program = programs.find(item => item.id === editProgram.dataset.editProgram);
      if (program) {
        draft = { ...program, assigned: [...(program.assigned || [])], days: program.days.map(day => ({ ...day, exercises: day.exercises.map(exercise => ({ ...exercise })) })) };
        renderDraft();
        $("[data-program-name]")?.focus();
        showToast(`Editing ${program.name}.`);
      }
      return;
    }
    const duplicateProgram = event.target.closest("[data-duplicate-program]");
    if (duplicateProgram) {
      const program = programs.find(item => item.id === duplicateProgram.dataset.duplicateProgram);
      if (program) {
        programs.unshift({ ...program, id: `p${Date.now()}`, name: `${program.name} copy`, days: program.days.map(day => ({ ...day, exercises: day.exercises.map(exercise => ({ ...exercise })) })) });
        storage.write("stackly_coach_programs", programs);
        renderPrograms();
        showToast(`${program.name} duplicated.`);
      }
      return;
    }
    if (event.target.closest("[data-reset-draft]")) { draft = blankDraft(); renderDraft(); return; }
    const threadButton = event.target.closest("[data-thread-id]");
    if (threadButton) { selectThread(threadButton.dataset.threadId); return; }
    const replyOpen = event.target.closest("[data-reply-open]");
    if (replyOpen) {
      const form = $(`[data-reply-form="${replyOpen.dataset.replyOpen}"]`);
      if (form) {
        form.hidden = !form.hidden;
        if (!form.hidden) {
          const current = reviewReplies[replyOpen.dataset.replyOpen];
          if (current) $("[data-reply-input]", form).value = current;
          $("[data-reply-input]", form)?.focus();
        }
      }
      return;
    }
    const reviewFilterButton = event.target.closest("[data-review-filter]");
    if (reviewFilterButton) {
      reviewFilter = reviewFilterButton.dataset.reviewFilter;
      $$("[data-review-filter]").forEach(button => { const active = button === reviewFilterButton; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); });
      renderReviews();
      return;
    }
    const searchResult = event.target.closest("[data-search-route]");
    if (searchResult) {
      $("[data-search]").value = "";
      navigate(searchResult.dataset.searchRoute);
      if (searchResult.dataset.searchClient) openClientDrawer(searchResult.dataset.searchClient);
      return;
    }
    const notificationButton = event.target.closest("[data-notifications]");
    if (notificationButton) {
      const panel = $("[data-notification-panel]");
      const open = panel.hidden;
      closePopovers();
      panel.hidden = !open;
      notificationButton.setAttribute("aria-expanded", String(open));
      return;
    }
    const profileButton = event.target.closest("[data-profile-toggle]");
    if (profileButton) {
      const panel = $("[data-profile-panel]");
      const open = panel.hidden;
      closePopovers();
      panel.hidden = !open;
      profileButton.setAttribute("aria-expanded", String(open));
      return;
    }
    if (event.target.closest("[data-mark-read]")) {
      notifications = notifications.map(item => ({ ...item, read: true }));
      storage.write("stackly_coach_notification_feed", notifications);
      renderNotifications();
      showToast("Notifications marked as read.");
      return;
    }
    if (event.target.closest("[data-drawer-open]")) { document.body.classList.add("drawer-open"); $(".sidebar")?.classList.add("is-open"); return; }
    if (event.target.closest("[data-drawer-close]")) { closeDrawer(); return; }
    if (event.target.closest("[data-sidebar-collapse]") && window.innerWidth > 760) {
      document.body.classList.toggle("sidebar-collapsed");
      storage.write("stackly_coach_sidebar", document.body.classList.contains("sidebar-collapsed"));
      return;
    }
    if (event.target.closest("[data-logout]")) {
      storage.remove("stackly_user");
      window.location.href = "login.html";
      return;
    }
    if (event.target.closest("[data-add-client]")) { showToast("Client invites connect to the member app next."); return; }
    if (event.target.closest("[data-focus-avatar]")) { $("[data-avatar-input]")?.focus(); return; }
    if (!event.target.closest(".topbar-action-wrap, .global-search")) closePopovers();
  });

  $("[data-program-days]")?.addEventListener("input", event => {
    const target = event.target;
    if (target.dataset.dayName !== undefined) { draft.days[Number(target.dataset.dayName)].name = target.value; return; }
    const exerciseKey = target.dataset.exName || target.dataset.exSets || target.dataset.exReps;
    if (exerciseKey === undefined) return;
    const [dayIndex, exerciseIndex] = exerciseKey.split(":").map(Number);
    const exercise = draft.days[dayIndex]?.exercises[exerciseIndex];
    if (!exercise) return;
    if (target.dataset.exName !== undefined) exercise.name = target.value;
    if (target.dataset.exSets !== undefined) exercise.sets = target.value;
    if (target.dataset.exReps !== undefined) exercise.reps = target.value;
  });

  $("[data-program-assign]")?.addEventListener("change", event => {
    draft.assigned = $$("[data-program-assign] input:checked").map(input => input.value);
  });

  $("[data-program-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    draft.name = $("[data-program-name]").value.trim();
    draft.level = $("[data-program-level]").value;
    draft.weeks = Number($("[data-program-weeks]").value) || 4;
    if (!draft.name) { showToast("Name the program before saving."); return; }
    const cleaned = {
      id: draft.id || `p${Date.now()}`,
      name: draft.name,
      level: draft.level,
      weeks: draft.weeks,
      assigned: [...draft.assigned],
      days: draft.days.map((day, index) => ({ name: day.name || `Day ${index + 1}`, exercises: day.exercises.filter(exercise => String(exercise.name).trim()).map(exercise => ({ name: String(exercise.name).trim(), sets: Number(exercise.sets) || 1, reps: exercise.reps || "10" })) })).filter(day => day.exercises.length)
    };
    if (!cleaned.days.length) { showToast("Add at least one exercise before saving."); return; }
    const index = programs.findIndex(item => item.id === cleaned.id);
    if (index > -1) programs[index] = cleaned; else programs.unshift(cleaned);
    storage.write("stackly_coach_programs", programs);
    draft = blankDraft();
    renderPrograms();
    renderDraft();
    showToast(index > -1 ? "Program updated." : "Program saved.");
  });

  $("[data-chat-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    const input = $("[data-chat-input]");
    const thread = threads.find(item => item.id === activeThreadId);
    const value = input?.value.trim();
    if (!value || !thread) return;
    thread.messages.push({ from: "coach", text: value, time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) });
    storage.write("stackly_coach_messages", threads);
    input.value = "";
    renderMessages();
    renderThreads();
  });

  document.addEventListener("submit", event => {
    const replyForm = event.target.closest("[data-reply-form]");
    if (!replyForm) return;
    event.preventDefault();
    const id = replyForm.dataset.replyForm;
    const value = $("[data-reply-input]", replyForm).value.trim();
    if (!value) return;
    reviewReplies[id] = value;
    storage.write("stackly_coach_replies", reviewReplies);
    renderReviews();
    showToast("Reply published.");
  });

  $("[data-client-note-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    const id = event.currentTarget.dataset.clientId;
    if (!id) return;
    clientNotes[id] = $("[data-client-note]").value;
    storage.write("stackly_coach_notes", clientNotes);
    const state = $("[data-note-state]");
    if (state) state.textContent = "Saved just now";
    showToast("Client note saved.");
  });

  $("[data-client-search]")?.addEventListener("input", event => { clientQuery = event.target.value; renderClients(); });
  $("[data-search]")?.addEventListener("input", event => renderSearch(event.target.value));
  $("[data-search]")?.addEventListener("keydown", event => { if (event.key === "Escape") { event.currentTarget.value = ""; renderSearch(""); event.currentTarget.blur(); } });
  document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) { event.preventDefault(); $("[data-search]")?.focus(); }
    if (event.key === "Escape") { closePopovers(); closeDrawer(); closeClientDrawer(); }
    if (event.key === "Enter" || event.key === " ") {
      const card = event.target.closest?.("[data-client-id]");
      if (card) { event.preventDefault(); openClientDrawer(card.dataset.clientId); }
    }
  });

  $("[data-coach-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const specialties = String(formData.get("specialties") || "").split(",").map(item => item.trim()).filter(Boolean);
    coach = {
      ...coach,
      name: String(formData.get("name") || "").trim() || coach.name,
      email: String(formData.get("email") || "").trim() || coach.email,
      hourlyRate: Number(formData.get("rate")) || coach.hourlyRate || 1200,
      bio: String(formData.get("bio") || "").trim(),
      avatar: String(formData.get("avatar") || "").trim(),
      specialties: specialties.length ? specialties : coach.specialties
    };
    storage.write("stackly_coach_profile", coach);
    applyCoach();
    const state = $("[data-save-state]");
    if (state) { state.textContent = "Saving changes"; setTimeout(() => { state.textContent = "All changes saved"; }, 650); }
    text("[data-profile-updated]", "just now");
    showToast("Coach profile updated.");
  });

  $$("[data-coach-toggle]").forEach(input => input.addEventListener("change", event => {
    preferences[event.target.name] = event.target.checked;
    storage.write("stackly_coach_preferences", preferences);
    showToast(`${event.target.checked ? "Enabled" : "Disabled"}: ${event.target.name.replace(/([A-Z])/g, " $1").toLowerCase()}.`);
  }));
})();
