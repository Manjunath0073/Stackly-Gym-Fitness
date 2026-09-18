(() => {
  "use strict";

  const DATA = window.STACKLY_DATA || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const routes = ["overview", "workouts", "schedule", "progress", "membership", "achievements", "settings"];

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
  if (rawUser?.role?.toLowerCase() === "coach") {
    window.location.replace("coach.html");
    return;
  }

  const savedProfile = storage.read("stackly_member_profile", {});
  let user = { ...(DATA.demoUser || {}), ...(rawUser || {}), ...(savedProfile || {}) };

  const savedState = storage.read("stackly_member_state", {});
  const oldState = {
    bookedClasses: storage.read("stackly_member_booked_classes", null),
    completedWorkouts: storage.read("stackly_member_completed_workouts", null),
    favorites: storage.read("stackly_member_favorites", null),
    goals: storage.read("stackly_member_goals", null)
  };
  let state = {
    ...(DATA.defaultState || {}),
    ...Object.fromEntries(Object.entries(oldState).filter(([, value]) => Array.isArray(value))),
    ...(savedState || {})
  };
  ["bookedClasses", "completedWorkouts", "favorites", "goals"].forEach(key => {
    if (!Array.isArray(state[key])) state[key] = [];
  });
  let notifications = storage.read("stackly_member_notification_feed", DATA.notifications || []);
  let preferences = { ...(DATA.notificationDefaults || {}), ...(storage.read("stackly_member_preferences", {}) || {}) };
  let weekOffset = 0;
  let workoutFilter = "All";
  let workoutQuery = "";
  let toastTimer;

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const initials = name => String(name || "AM").split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "AM";
  const firstName = name => String(name || "Member").trim().split(/\s+/)[0] || "Member";
  const formatNumber = value => Number(value || 0).toLocaleString("en-IN");
  const text = (selector, value) => { $$(selector).forEach(element => { element.textContent = value; }); };
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;

  function showToast(message) {
    const toast = $("[data-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function saveState() {
    storage.write("stackly_member_state", state);
    storage.write("stackly_member_booked_classes", state.bookedClasses);
    storage.write("stackly_member_completed_workouts", state.completedWorkouts);
    storage.write("stackly_member_favorites", state.favorites);
    storage.write("stackly_member_goals", state.goals);
  }

  function applyUser() {
    const name = user.name || "Stackly Member";
    const avatarInitials = initials(name);
    text("[data-user-name]", name);
    text("[data-user-first]", firstName(name));
    text("[data-user-email]", user.email || "member@stackly.fit");
    text("[data-user-tier]", user.tier || user.membership || "UNLIMITED");
    text("[data-user-join]", user.joinDate || "February 2024");
    text("[data-avatar-initials]", avatarInitials);
    text("[data-settings-initials]", avatarInitials);
    $$('[data-user-avatar], [data-settings-avatar]').forEach(image => {
      image.alt = `${name} avatar`;
      image.style.display = user.avatar ? "block" : "none";
      image.onerror = () => { image.style.display = "none"; };
      if (user.avatar && image.src !== user.avatar) image.src = user.avatar;
    });
    const avatarInput = $("[data-avatar-input]");
    if (avatarInput && avatarInput.value !== (user.avatar || "")) avatarInput.value = user.avatar || "";
    const nameInput = $("[data-profile-form] [name=name]");
    const emailInput = $("[data-profile-form] [name=email]");
    const goalsInput = $("[data-profile-form] [name=goals]");
    if (nameInput && document.activeElement !== nameInput) nameInput.value = name;
    if (emailInput && document.activeElement !== emailInput) emailInput.value = user.email || "";
    if (goalsInput && document.activeElement !== goalsInput) goalsInput.value = user.goals || "";
  }

  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const label = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    text("[data-clock]", time);
    text("[data-today-label]", label);
  }

  function animateCounter(element, value, suffix = "") {
    if (!element) return;
    const target = Number(value) || 0;
    if (reduceMotion) {
      element.textContent = `${formatNumber(target)}${suffix}`;
      return;
    }
    const started = performance.now();
    const duration = 800;
    const tick = now => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${formatNumber(Math.round(target * eased))}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function renderStats() {
    const stats = DATA.stats || {};
    animateCounter($('[data-stat-value="workouts"]'), stats.workouts);
    animateCounter($('[data-stat-value="calories"]'), stats.calories);
    animateCounter($('[data-stat-value="minutes"]'), stats.minutes);
    const streak = $('[data-stat-value="streak"]');
    if (streak) {
      if (reduceMotion) streak.innerHTML = `${formatNumber(stats.streak)}<span class="stat-unit"> days</span>`;
      else {
        const started = performance.now();
        const tick = now => {
          const progress = Math.min(1, (now - started) / 760);
          streak.innerHTML = `${String(Math.round((stats.streak || 0) * (1 - Math.pow(1 - progress, 3)))).padStart(2, "0")}<span class="stat-unit"> days</span>`;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }
  }

  function svgElement(name, attrs = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function chartPoints(values, width, height, padding, min = 0, max = Math.max(...values)) {
    const span = Math.max(1, max - min);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    return values.map((value, index) => ({
      value,
      x: padding.left + (values.length === 1 ? plotWidth / 2 : index * plotWidth / (values.length - 1)),
      y: padding.top + (max - value) / span * plotHeight
    }));
  }

  function pathFor(points) { return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" "); }

  function animateStroke(path) {
    if (!path || !path.getTotalLength) return;
    let length = 0;
    try { length = path.getTotalLength(); } catch (error) { return; }
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = reduceMotion ? 0 : length;
    if (!reduceMotion) requestAnimationFrame(() => { path.style.strokeDashoffset = 0; });
  }

  function showChartTooltip(shell, tooltip, svg, point, value, label, unit = "min", target) {
    if (!tooltip) return;
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    tooltip.innerHTML = `<strong>${esc(value)} ${esc(unit)}</strong><span>${esc(label)}</span>`;
    tooltip.style.left = `${point.x / viewBox.width * rect.width}px`;
    tooltip.style.top = `${point.y / viewBox.height * rect.height}px`;
    tooltip.classList.add("is-visible");
    target?.classList.add("is-hover");
  }

  function hideChartTooltip(tooltip, point) {
    tooltip?.classList.remove("is-visible");
    point?.classList.remove("is-hover");
  }

  function renderLineChart(svg, values, labels, unit, min = 0, max = Math.max(...values)) {
    if (!svg) return;
    const width = Number(svg.viewBox.baseVal.width) || 800;
    const height = Number(svg.viewBox.baseVal.height) || 290;
    const padding = { left: 37, right: 17, top: 18, bottom: 35 };
    const points = chartPoints(values, width, height, padding, min, max);
    const grid = $("[data-chart-grid]", svg);
    const pointsGroup = $("[data-chart-points]", svg);
    const labelsGroup = $("[data-chart-labels]", svg);
    const line = $("[data-chart-line]", svg);
    const area = $("[data-chart-area]", svg);
    if (!grid || !pointsGroup || !labelsGroup || !line || !area) return;
    grid.innerHTML = "";
    pointsGroup.innerHTML = "";
    labelsGroup.innerHTML = "";
    const gridSteps = 4;
    for (let index = 0; index <= gridSteps; index += 1) {
      const y = padding.top + index * (height - padding.top - padding.bottom) / gridSteps;
      const value = Math.round(max - (max - min) * index / gridSteps);
      grid.append(svgElement("line", { x1: padding.left, x2: width - padding.right, y1: y, y2: y }));
      const label = svgElement("text", { x: 0, y: y + 3 });
      label.textContent = value;
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
    if (!reduceMotion) requestAnimationFrame(() => { area.style.opacity = ".95"; });
    const shell = svg.closest("[data-chart-shell]");
    const tooltip = $("[data-chart-tooltip]", shell);
    points.forEach((point, index) => {
      const circle = svgElement("circle", { cx: point.x, cy: point.y, r: 4.5, tabindex: "0", class: "chart-point" });
      circle.addEventListener("mouseenter", () => showChartTooltip(shell, tooltip, svg, point, values[index], labels[index], unit, circle));
      circle.addEventListener("focus", () => showChartTooltip(shell, tooltip, svg, point, values[index], labels[index], unit, circle));
      circle.addEventListener("mouseleave", () => hideChartTooltip(tooltip, circle));
      circle.addEventListener("blur", () => hideChartTooltip(tooltip, circle));
      pointsGroup.append(circle);
    });
  }

  function renderBarChart(svg, records) {
    if (!svg) return;
    const width = Number(svg.viewBox.baseVal.width) || 500;
    const height = Number(svg.viewBox.baseVal.height) || 260;
    const padding = { left: 25, right: 15, top: 20, bottom: 38 };
    const max = Math.max(...records.map(record => record.value), 1) * 1.15;
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
    }
    const slot = plotWidth / records.length;
    records.forEach((record, index) => {
      const barWidth = slot * .55;
      const x = padding.left + index * slot + (slot - barWidth) / 2;
      const barHeight = record.value / max * plotHeight;
      const y = height - padding.bottom - barHeight;
      const rect = svgElement("rect", { x, y: reduceMotion ? y : height - padding.bottom, width: barWidth, height: reduceMotion ? barHeight : 0, rx: 1, class: "chart-bar" });
      const value = svgElement("text", { x: x + barWidth / 2, y: y - 8, class: "chart-value" });
      value.textContent = record.value;
      const label = svgElement("text", { x: x + barWidth / 2, y: height - 8, class: "chart-label" });
      label.textContent = record.label;
      rect.addEventListener("mouseenter", event => {
        const point = { x: x + barWidth / 2, y };
        showChartTooltip(svg.closest("[data-chart-shell]"), $("[data-chart-tooltip]", svg.closest("[data-chart-shell]")), svg, point, record.value, record.label, record.unit, event.currentTarget);
        event.currentTarget.classList.add("is-hover");
      });
      rect.addEventListener("mouseleave", event => {
        hideChartTooltip($("[data-chart-tooltip]", svg.closest("[data-chart-shell]")));
        event.currentTarget.classList.remove("is-hover");
      });
      bars.append(rect, value);
      labels.append(label);
      if (!reduceMotion) requestAnimationFrame(() => { rect.setAttribute("y", y); rect.setAttribute("height", barHeight); });
    });
  }

  function renderCharts() {
    const activity = DATA.activity || {};
    renderLineChart($("[data-chart=activity]"), activity.values || [], activity.labels || [], "min", 0, 100);
    const progress = DATA.progress || {};
    const weight = progress.weight || {};
    renderLineChart($("[data-chart=weight]"), weight.values || [], weight.labels || [], weight.unit || "kg", Math.floor(Math.min(...(weight.values || [0])) - 1), Math.ceil(Math.max(...(weight.values || [1])) + 1));
    renderBarChart($("[data-chart=prs]"), progress.prs || []);
    const donut = $("[data-donut-ring]");
    const percent = Number(activity.percent || 0);
    if (donut) {
      const radius = Number(donut.getAttribute("r"));
      const circumference = 2 * Math.PI * radius;
      donut.style.strokeDasharray = circumference;
      donut.style.strokeDashoffset = reduceMotion ? circumference * (1 - percent / 100) : circumference;
      if (!reduceMotion) requestAnimationFrame(() => { donut.style.strokeDashoffset = circumference * (1 - percent / 100); });
      const tooltip = $("[data-donut-tooltip]");
      const showDonutTooltip = () => {
        if (!tooltip) return;
        tooltip.innerHTML = `<strong>${percent}%</strong><span>${activity.complete || 0} of ${activity.goal || 0} sessions</span>`;
        tooltip.classList.add("is-visible");
      };
      const hideDonutTooltip = () => tooltip?.classList.remove("is-visible");
      donut.onmouseenter = showDonutTooltip;
      donut.onfocus = showDonutTooltip;
      donut.onmouseleave = hideDonutTooltip;
      donut.onblur = hideDonutTooltip;
    }
    text("[data-goal-value]", percent);
    text("[data-goal-complete]", activity.complete || 0);
    text("[data-goal-target]", activity.goal || 0);
  }

  function renderWorkouts() {
    const list = $("[data-workout-list]");
    if (!list) return;
    const query = workoutQuery.trim().toLowerCase();
    const items = (DATA.workouts || []).filter(workout => (workoutFilter === "All" || workout.type === workoutFilter) && (!query || `${workout.title} ${workout.type} ${workout.description}`.toLowerCase().includes(query)));
    list.innerHTML = items.map(workout => {
      const complete = state.completedWorkouts.includes(workout.id);
      const favorite = state.favorites.includes(workout.id);
      const progress = complete ? 100 : workout.progress;
      const circumference = 2 * Math.PI * 12;
      const intensity = Array.from({ length: 5 }, (_, index) => `<i class="${index < workout.intensity ? "is-on" : ""}"></i>`).join("");
      return `<article class="workout-card" data-workout-id="${esc(workout.id)}"><div class="workout-card-image"><img src="${esc(workout.image)}" alt="${esc(workout.title)} workout"><span class="workout-type">${esc(workout.type)}</span><button class="favorite-button ${favorite ? "is-favorite" : ""}" type="button" aria-label="${favorite ? "Remove from favorites" : "Add to favorites"}" aria-pressed="${favorite}" data-workout-favorite="${esc(workout.id)}">${icon("heart")}</button></div><div class="workout-card-copy"><h3>${esc(workout.title)}</h3><p>${esc(workout.description)}</p><div class="workout-card-meta"><span><b>${esc(workout.duration)}</b> min / <b>${esc(workout.calories)}</b> kcal</span><span>Intensity <span class="intensity">${intensity}</span></span></div><div class="workout-card-actions"><button class="complete-button ${complete ? "is-complete" : ""}" type="button" data-workout-complete="${esc(workout.id)}" aria-pressed="${complete}">${icon("check")} ${complete ? "Completed" : "Mark complete"}</button><span class="progress-ring" aria-label="${progress}% complete"><svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="12"></circle><circle style="stroke-dasharray:${circumference};stroke-dashoffset:${circumference * (1 - progress / 100)}" cx="15" cy="15" r="12"></circle></svg><span>${progress}%</span></span></div></div></article>`;
    }).join("");
    const empty = $("[data-workout-empty]");
    if (empty) empty.hidden = items.length > 0;
    text("[data-workout-result-count]", `${items.length} ${items.length === 1 ? "session" : "sessions"}`);
    text("[data-workout-complete-count]", state.completedWorkouts.length);
  }

  function parseTime(value) {
    const [hours, minutes] = String(value).split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  function startOfWeek(date = new Date()) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    const day = (result.getDay() + 6) % 7;
    result.setDate(result.getDate() - day);
    return result;
  }

  function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  }

  function dateKey(date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }

  function formatWeek(start) {
    const end = addDays(start, 6);
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    if (start.getMonth() === end.getMonth()) return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    return `${start.getDate()} ${startMonth}-${end.getDate()} ${endMonth} ${end.getFullYear()}`;
  }

  function renderCalendar() {
    const calendar = $("[data-calendar]");
    if (!calendar) return;
    const start = addDays(startOfWeek(), weekOffset * 7);
    text("[data-week-label]", formatWeek(start));
    const days = $("[data-calendar-days]");
    const timeColumn = $("[data-time-column]");
    const hourLines = $("[data-hour-lines]");
    const layer = $("[data-class-layer]");
    if (!days || !timeColumn || !hourLines || !layer) return;
    days.className = "calendar-days";
    days.innerHTML = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      const today = dateKey(date) === dateKey(new Date());
      return `<div class="calendar-day ${today ? "is-today" : ""}"><span>${date.toLocaleDateString("en-US", { weekday: "short" })}</span><strong>${String(date.getDate()).padStart(2, "0")}</strong></div>`;
    }).join("");
    timeColumn.innerHTML = Array.from({ length: 17 }, (_, index) => `<span class="time-label" style="top:${index * 74}px">${String(index + 6).padStart(2, "0")}:00</span>`).join("");
    hourLines.innerHTML = Array.from({ length: 17 }, () => "<i></i>").join("");
    layer.innerHTML = (DATA.classes || []).map(classItem => {
      const top = (parseTime(classItem.start) - 360) / 60 * 74 + 4;
      const height = classItem.duration / 60 * 74 - 8;
      const booked = state.bookedClasses.includes(classItem.id);
      const past = weekOffset === 0 && addDays(start, classItem.day).toDateString() === new Date().toDateString() && parseTime(classItem.start) < new Date().getHours() * 60 + new Date().getMinutes();
      return `<button class="calendar-class ${booked ? "is-booked" : ""} ${past ? "is-past" : ""}" type="button" data-class-id="${esc(classItem.id)}" aria-pressed="${booked}" aria-label="${esc(classItem.name)}, ${booked ? "booked, tap to cancel" : "available, tap to book"}" style="left:calc(${classItem.day * 14.2857}% + 4px);width:calc(14.2857% - 8px);top:${top}px;height:${height}px"><strong>${esc(classItem.name)}</strong><span>${esc(classItem.start)} / ${esc(classItem.coach)}</span><span class="class-state">${booked ? "Booked" : "Book"}</span></button>`;
    }).join("");
  }

  function getNextClass() {
    return (DATA.classes || []).find(classItem => classItem.id === "c8") || DATA.classes?.[0];
  }

  function renderNextClass() {
    const classItem = getNextClass();
    if (!classItem) return;
    const booked = state.bookedClasses.includes(classItem.id);
    const currentDay = (new Date().getDay() + 6) % 7;
    const offset = (classItem.day - currentDay + 7) % 7;
    const dayLabel = offset === 0 ? "Today" : new Date(Date.now() + offset * 86400000).toLocaleDateString("en-US", { weekday: "short" });
    text("[data-next-class-time]", `${dayLabel} / ${classItem.start}`);
    text("[data-next-class-name]", classItem.name);
    text("[data-next-class-details]", `${classItem.coach} / ${classItem.room} / ${classItem.duration} min`);
    text("[data-next-class-spots]", classItem.spots);
    const button = $("[data-next-class-action]");
    if (button) button.innerHTML = `${booked ? "Cancel booking" : "Book class"} ${icon("arrow")}`;
    button?.setAttribute("aria-pressed", booked);
  }

  function renderProgress() {
    const performance = DATA.progress?.performance || [];
    const bars = $("[data-performance-bars]");
    if (bars) {
      bars.innerHTML = performance.map(item => `<div class="performance-row"><span>${esc(item.label)}</span><span class="performance-track"><span style="width:${item.value}%"></span></span><strong>${item.value}</strong></div>`).join("");
      if (!reduceMotion) {
        $$(".performance-track > span", bars).forEach(bar => {
          const width = bar.style.width;
          bar.style.width = "0";
          requestAnimationFrame(() => { bar.style.width = width; });
        });
      }
    }
    const records = $("[data-record-list]");
    if (records) records.innerHTML = (DATA.progress?.records || []).map(record => `<div class="record-row"><span class="record-icon">${icon("award")}</span><span><strong>${esc(record.title)}</strong><small>${esc(record.detail)}</small></span><b class="record-value">${esc(record.value)}</b></div>`).join("");
  }

  function renderMembership() {
    const membership = DATA.membership || {};
    const percent = Math.round((membership.used || 0) / Math.max(1, membership.included || 1) * 100);
    text("[data-tier-badge]", user.tier || membership.plan || "UNLIMITED");
    text("[data-renewal-date]", membership.renewal || "04 October 2026");
    text("[data-usage-percent]", percent);
    text("[data-classes-used]", membership.used || 0);
    text("[data-classes-included]", membership.included || 0);
    const meter = $("[data-usage-bar]");
    if (meter) {
      meter.style.width = reduceMotion ? `${percent}%` : "0";
      if (!reduceMotion) requestAnimationFrame(() => { meter.style.width = `${percent}%`; });
    }
    const table = $("[data-invoices]");
    if (table) table.innerHTML = (membership.invoices || []).map(invoice => `<tr><td>${esc(invoice.date)}</td><td>${esc(invoice.ref)}</td><td><span class="status-pill">${esc(invoice.status)}</span></td><td>${esc(invoice.amount)}</td><td><button type="button" class="table-download" aria-label="Download ${esc(invoice.ref)}" data-download-invoice="${esc(invoice.ref)}">${icon("download")}</button></td></tr>`).join("");
  }

  function renderAchievements() {
    const achievements = DATA.achievements || [];
    const earned = achievements.filter(item => item.earned).length;
    text("[data-earned-count]", earned);
    text("[data-badge-progress]", earned);
    const grid = $("[data-badge-grid]");
    if (grid) grid.innerHTML = achievements.map(item => `<div class="badge ${item.earned ? "is-earned" : "is-locked"}" tabindex="0" title="${esc(item.detail)}"><span class="badge-medal">${item.earned ? icon(item.icon) : icon("lock")}</span><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small><span>${item.earned ? "Earned" : "Locked"}</span></div>`).join("");
    const board = (DATA.leaderboard || []).map(item => ({ ...item }));
    let current = board.find(item => item.name.toLowerCase() === String(user.name || "").toLowerCase());
    if (!current) {
      board.forEach(item => { item.current = false; });
      board[board.length - 1] = { name: user.name || "Stackly Member", initials: initials(user.name), score: 1080, current: true };
    } else board.forEach(item => { item.current = item === current; });
    const leaderboard = $("[data-leaderboard]");
    if (leaderboard) leaderboard.innerHTML = board.map((item, index) => `<div class="leader-row ${item.current ? "is-current" : ""}"><strong>${String(index + 1).padStart(2, "0")}</strong><span class="leader-avatar">${esc(item.initials)}</span><span>${esc(item.name)}</span><small>${formatNumber(item.score)} pts</small></div>`).join("");
  }

  function renderNotifications() {
    const list = $("[data-notification-list]");
    if (!list) return;
    list.innerHTML = (notifications || []).map(item => `<div class="notification-item ${item.read ? "is-read" : ""}"><i></i><p><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></p></div>`).join("");
    const unread = (notifications || []).some(item => !item.read);
    const dot = $(".notification-dot");
    if (dot) dot.hidden = !unread;
  }

  function renderPreferences() {
    $$('[data-notification-toggle]').forEach(input => { input.checked = Boolean(preferences[input.name]); });
  }

  function routeFromHash() {
    const route = window.location.hash.replace(/^#/, "").split("?")[0];
    return routes.includes(route) ? route : "overview";
  }

  function closePopovers() {
    const notificationButton = $("[data-notifications]");
    const profileButton = $("[data-profile-toggle]");
    const notificationPanel = $("[data-notification-panel]");
    const profilePanel = $("[data-profile-panel]");
    if (notificationPanel) notificationPanel.hidden = true;
    if (profilePanel) profilePanel.hidden = true;
    notificationButton?.setAttribute("aria-expanded", "false");
    profileButton?.setAttribute("aria-expanded", "false");
    $("[data-search-results]")?.setAttribute("hidden", "");
  }

  function closeDrawer() {
    document.body.classList.remove("drawer-open");
    $(".sidebar")?.classList.remove("is-open");
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
    $$('[data-route]').forEach(link => link.classList.toggle("is-active", link.dataset.route === route));
    text("[data-current-view]", route.toUpperCase());
    closePopovers();
    closeDrawer();
    if (route === "overview" || route === "progress") requestAnimationFrame(renderCharts);
    if (route === "progress") requestAnimationFrame(renderProgress);
  }

  function toggleClassBooking(id) {
    const classItem = (DATA.classes || []).find(item => item.id === id);
    if (!classItem) return;
    const booked = state.bookedClasses.includes(id);
    state.bookedClasses = booked ? state.bookedClasses.filter(item => item !== id) : [...state.bookedClasses, id];
    saveState();
    renderCalendar();
    renderNextClass();
    showToast(booked ? `${classItem.name} booking cancelled.` : `${classItem.name} is booked. See you in the room.`);
  }

  function toggleWorkout(id, kind) {
    const list = state[kind];
    if (!Array.isArray(list)) return;
    state[kind] = list.includes(id) ? list.filter(item => item !== id) : [...list, id];
    saveState();
    renderWorkouts();
    if (kind === "completedWorkouts") showToast(state[kind].includes(id) ? "Session marked complete." : "Session moved back to your library.");
  }

  function renderSearch(query) {
    const results = $("[data-search-results]");
    if (!results) return;
    const value = query.trim().toLowerCase();
    if (!value) { results.hidden = true; results.innerHTML = ""; return; }
    const matches = [
      ...(DATA.workouts || []).filter(item => `${item.title} ${item.type}`.toLowerCase().includes(value)).map(item => ({ title: item.title, detail: `${item.type} / ${item.duration} min`, route: "workouts", id: item.id })),
      ...(DATA.classes || []).filter(item => `${item.name} ${item.type} ${item.coach}`.toLowerCase().includes(value)).map(item => ({ title: item.name, detail: `${item.type} / ${item.start} / ${item.coach}`, route: "schedule", id: item.id })),
      ...(DATA.achievements || []).filter(item => `${item.title} ${item.detail}`.toLowerCase().includes(value)).map(item => ({ title: item.title, detail: item.detail, route: "achievements", id: item.id }))
    ].slice(0, 6);
    results.innerHTML = matches.length ? matches.map(item => `<button class="search-result" type="button" data-search-route="${item.route}" data-search-id="${esc(item.id)}"><span><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></span>${icon("arrow")}</button>`).join("") : `<div class="search-result"><span><strong>No matches</strong><small>Try a workout, class, or badge.</small></span></div>`;
    results.hidden = false;
  }

  function updateComparison(value) {
    const before = $("[data-before-image]");
    const handle = $(".comparison-handle > i");
    if (before) before.style.width = `${value}%`;
    if (handle) handle.style.left = `${value}%`;
  }

  function exportText(filename, content) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function logout() {
    storage.remove("stackly_user");
    window.location.href = "login.html";
  }

  applyUser();
  updateClock();
  setInterval(updateClock, 1000);
  renderStats();
  renderWorkouts();
  renderCalendar();
  renderNextClass();
  renderProgress();
  renderMembership();
  renderAchievements();
  renderNotifications();
  renderPreferences();
  renderRoute(routeFromHash());
  updateComparison(50);

  const sidebarCollapsed = storage.read("stackly_member_sidebar", false);
  if (sidebarCollapsed && window.innerWidth > 760) document.body.classList.add("sidebar-collapsed");
  setTimeout(() => $("[data-loading]")?.classList.add("is-hidden"), reduceMotion ? 60 : 480);

  window.addEventListener("hashchange", () => renderRoute(routeFromHash()));
  document.addEventListener("click", event => {
    const routeLink = event.target.closest("[data-route]");
    if (routeLink) {
      event.preventDefault();
      navigate(routeLink.dataset.route);
      return;
    }
    const filter = event.target.closest("[data-workout-filter]");
    if (filter) {
      workoutFilter = filter.dataset.workoutFilter;
      $$('[data-workout-filter]').forEach(button => { const active = button === filter; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); });
      renderWorkouts();
      return;
    }
    const completeButton = event.target.closest("[data-workout-complete]");
    if (completeButton) { toggleWorkout(completeButton.dataset.workoutComplete, "completedWorkouts"); return; }
    const favoriteButton = event.target.closest("[data-workout-favorite]");
    if (favoriteButton) { toggleWorkout(favoriteButton.dataset.workoutFavorite, "favorites"); return; }
    const classButton = event.target.closest("[data-class-id]");
    if (classButton) { toggleClassBooking(classButton.dataset.classId); return; }
    if (event.target.closest("[data-next-class-action]")) { toggleClassBooking(getNextClass()?.id); return; }
    const searchResult = event.target.closest("[data-search-route]");
    if (searchResult) {
      const route = searchResult.dataset.searchRoute;
      navigate(route);
      $("[data-global-search]").value = "";
      $("[data-search-results]").hidden = true;
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
      storage.write("stackly_member_notification_feed", notifications);
      renderNotifications();
      showToast("Notifications marked as read.");
      return;
    }
    if (event.target.closest("[data-drawer-open]")) {
      document.body.classList.add("drawer-open");
      $(".sidebar")?.classList.add("is-open");
      return;
    }
    if (event.target.closest("[data-drawer-close]")) { closeDrawer(); return; }
    if (event.target.closest("[data-sidebar-collapse]")) {
      document.body.classList.toggle("sidebar-collapsed");
      storage.write("stackly_member_sidebar", document.body.classList.contains("sidebar-collapsed"));
      return;
    }
    if (event.target.closest("[data-logout]")) { logout(); return; }
    if (event.target.closest("[data-featured-start]")) { navigate("workouts"); showToast("Power / 08 is ready when you are."); return; }
    if (event.target.closest("[data-week-today]")) { weekOffset = 0; renderCalendar(); return; }
    const weekShift = event.target.closest("[data-week-shift]");
    if (weekShift) { weekOffset += Number(weekShift.dataset.weekShift); renderCalendar(); return; }
    if (event.target.closest("[data-manage-plan]")) { showToast("Plan management is ready for your billing connection."); return; }
    const invoiceButton = event.target.closest("[data-download-invoice]");
    if (invoiceButton) { exportText(`${invoiceButton.dataset.downloadInvoice}.txt`, `STACKLY GYM & FITNESS STUDIO\nInvoice ${invoiceButton.dataset.downloadInvoice}\nMember: ${user.name}`); showToast("Invoice download started."); return; }
    if (event.target.closest("[data-download-invoices]")) { exportText("stackly-invoices.txt", (DATA.membership?.invoices || []).map(item => `${item.date} / ${item.ref} / ${item.status} / ${item.amount}`).join("\n")); showToast("Invoice history download started."); return; }
    if (event.target.closest("[data-export-progress]")) { exportText("stackly-progress.txt", `STACKLY PROGRESS / ${user.name}\nConsistency: 84%\nSessions this month: ${DATA.stats?.workouts || 0}\nLatest squat PR: 120 kg`); showToast("Progress export started."); return; }
    if (event.target.closest("[data-focus-avatar]")) { $("[data-avatar-input]")?.focus(); return; }
    if (!event.target.closest(".topbar-action-wrap, .global-search")) closePopovers();
  });

  $("[data-workout-search]")?.addEventListener("input", event => { workoutQuery = event.target.value; renderWorkouts(); });
  $("[data-global-search]")?.addEventListener("input", event => renderSearch(event.target.value));
  $("[data-global-search]")?.addEventListener("keydown", event => { if (event.key === "Escape") { event.currentTarget.value = ""; renderSearch(""); event.currentTarget.blur(); } });
  document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) { event.preventDefault(); $("[data-global-search]")?.focus(); }
    if (event.key === "Escape") { closePopovers(); closeDrawer(); }
  });

  $("[data-comparison-input]")?.addEventListener("input", event => updateComparison(event.target.value));
  $("[data-profile-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    user = { ...user, name: String(formData.get("name") || "").trim() || user.name, email: String(formData.get("email") || "").trim() || user.email, avatar: String(formData.get("avatar") || "").trim(), goals: String(formData.get("goals") || "").trim() };
    storage.write("stackly_member_profile", user);
    applyUser();
    const saveStateLabel = $("[data-save-state]");
    if (saveStateLabel) { saveStateLabel.classList.add("is-saving"); saveStateLabel.textContent = "Saving changes"; setTimeout(() => { saveStateLabel.classList.remove("is-saving"); saveStateLabel.textContent = "All changes saved"; }, 650); }
    text("[data-profile-updated]", "just now");
    showToast("Profile updated across your dashboard.");
  });
  $$('[data-notification-toggle]').forEach(input => input.addEventListener("change", event => {
    preferences[event.target.name] = event.target.checked;
    storage.write("stackly_member_preferences", preferences);
    showToast(`${event.target.checked ? "Enabled" : "Disabled"}: ${event.target.name.replace(/([A-Z])/g, " $1").toLowerCase()}.`);
  }));
})();
