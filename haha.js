(() => {
  "use strict";

  const KEY = "taskly.tasks.v1";
  const $ = (id) => document.getElementById(id);

  const PAGES = {
    dashboard: { crumb: "Dashboard", title: "Hari ini, bikin berarti.", sub: "Nggak harus semua. Mulai dari yang paling penting.", list: "Tugas terbaru" },
    all: { crumb: "All Tasks", title: "Semua tugas", sub: "Semua yang perlu kamu kerjakan, di satu tempat.", list: "Tugas saya" },
    pending: { crumb: "Pending", title: "Belum selesai", sub: "Tugas yang masih menunggu kamu.", list: "Belum selesai" },
    completed: { crumb: "Completed", title: "Sudah selesai", sub: "Semua yang sudah berhasil kamu tuntaskan.", list: "Sudah selesai" },
  };
  const WEIGHT = { high: 3, medium: 2, low: 1 };
  const LABEL = { high: "High", medium: "Medium", low: "Low" };

  const ICON = {
    check: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/></svg>',
  };

  let tasks = load();
  let page = "dashboard";
  let tab = "all";
  let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let editingId = null;
  let deletingId = null;

  /* ---------- Storage ---------- */
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(tasks));
    } catch {
      toast("Gagal menyimpan data ke browser", "danger");
    }
  }

  /* ---------- Helpers ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function parseDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function shortDate(s) {
    return parseDate(s).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }
  function longDate(s) {
    return parseDate(s).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function toast(msg, type = "info") {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    $("toasts").appendChild(el);
    setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 300);
    }, 2500);
  }

  /* ---------- Data view ---------- */
  function visible() {
    const q = $("searchInput").value.trim().toLowerCase();
    const status = page === "pending" ? "pending" : page === "completed" ? "completed" : page === "all" ? tab : "all";
    let list = tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (status === "pending") return !t.done;
      if (status === "completed") return t.done;
      return true;
    });
    const sort = page === "dashboard" ? "newest" : $("sortBy").value;
    list.sort((a, b) => {
      if (sort === "deadline") return a.deadline.localeCompare(b.deadline);
      if (sort === "priority") return WEIGHT[b.priority] - WEIGHT[a.priority] || a.deadline.localeCompare(b.deadline);
      return b.createdAt - a.createdAt;
    });
    if (page === "dashboard" && !q) list = list.slice(0, 5);
    return list;
  }

  function focusTask() {
    return tasks
      .filter((t) => !t.done)
      .sort((a, b) => WEIGHT[b.priority] - WEIGHT[a.priority] || a.deadline.localeCompare(b.deadline))[0];
  }

  /* ---------- Render ---------- */
  function rowHtml(t) {
    const today = todayStr();
    let due = `<span class="due">${ICON.clock}${shortDate(t.deadline)}</span>`;
    if (!t.done && t.deadline < today) due = `<span class="due late">${ICON.clock}Lewat · ${shortDate(t.deadline)}</span>`;
    else if (!t.done && t.deadline === today) due = `<span class="due today">${ICON.clock}Hari ini</span>`;
    return `
      <article class="row ${t.done ? "done" : ""}" data-id="${t.id}">
        <button class="cb" data-action="toggle" aria-label="${t.done ? "Batalkan selesai" : "Tandai selesai"}" title="${t.done ? "Batalkan selesai" : "Tandai selesai"}">${ICON.check}</button>
        <div class="row-main">
          <div class="row-title">${esc(t.title)}</div>
          ${t.desc ? `<div class="row-desc">${esc(t.desc)}</div>` : ""}
        </div>
        ${due}
        <span class="pill ${t.priority}">${LABEL[t.priority]}</span>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" aria-label="Edit tugas" title="Edit">${ICON.edit}</button>
          <button class="icon-btn del" data-action="delete" aria-label="Hapus tugas" title="Hapus">${ICON.trash}</button>
        </div>
      </article>`;
  }

  function renderStats() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const pending = total - done;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const late = tasks.filter((t) => !t.done && t.deadline < todayStr()).length;
    $("sTotal").textContent = total;
    $("sDone").textContent = done;
    $("sPending").textContent = pending;
    $("sPercent").textContent = pct + "%";
    $("sBar").style.width = pct + "%";
    $("sDoneNote").textContent = done ? "Kerja bagus!" : "Belum ada";
    $("sPendingNote").textContent = late ? `${late} lewat deadline` : "Aman, tidak ada yang telat";
    $("cAll").textContent = total;
    $("cPending").textContent = pending;
    $("cDone").textContent = done;
  }

  function renderTabs() {
    const el = $("tabs");
    el.hidden = page !== "all";
    if (page !== "all") return;
    const done = tasks.filter((t) => t.done).length;
    const c = { all: tasks.length, pending: tasks.length - done, completed: done };
    el.innerHTML = [["all", "Semua"], ["pending", "Belum"], ["completed", "Selesai"]]
      .map(([k, l]) => `<button class="tab ${tab === k ? "active" : ""}" data-tab="${k}">${l}<em>${c[k]}</em></button>`)
      .join("");
  }

  function renderList() {
    const cfg = PAGES[page];
    const list = visible();
    $("listTitle").textContent = cfg.list;
    $("seeAll").hidden = page !== "dashboard";
    $("sortBy").hidden = page === "dashboard";
    $("quick").hidden = page === "completed";
    $("taskList").innerHTML = list.map(rowHtml).join("");

    const empty = $("empty");
    empty.hidden = list.length > 0;
    if (!list.length) {
      const searching = $("searchInput").value.trim() !== "";
      empty.querySelector("h4").textContent = searching ? "Tugas tidak ditemukan" : "Belum ada tugas";
      empty.querySelector("p").textContent = searching
        ? "Coba kata kunci lain."
        : page === "completed" || (page === "all" && tab === "completed")
        ? "Belum ada tugas yang selesai."
        : 'Klik "Tambah tugas" untuk mulai mengatur harimu.';
    }
  }

  function renderHead() {
    const cfg = PAGES[page];
    $("crumb").textContent = cfg.crumb;
    $("pageTitle").textContent = cfg.title;
    $("eyebrow").textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    if (page === "dashboard") {
      const h = new Date().getHours();
      const g = h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
      const pending = tasks.filter((t) => !t.done).length;
      $("pageSub").textContent = pending
        ? `${g}! Ada ${pending} tugas yang menunggu kamu.`
        : tasks.length
        ? `${g}! Semua tugas sudah beres. Kerja bagus!`
        : `${g}! Yuk catat tugas pertama kamu.`;
    } else {
      $("pageSub").textContent = cfg.sub;
    }
    const dash = page === "dashboard";
    $("stats").hidden = !dash;
    $("sideCol").hidden = !dash;
    $("layout").classList.toggle("single", !dash);
  }

  function renderFocus() {
    const t = focusTask();
    $("focusTask").textContent = t ? t.title : "Belum ada tugas aktif";
  }

  function renderCalendar() {
    const y = calMonth.getFullYear();
    const m = calMonth.getMonth();
    $("calTitle").textContent = calMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const offset = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const due = new Set(tasks.filter((t) => !t.done).map((t) => t.deadline));
    const today = todayStr();
    let html = ["S", "S", "R", "K", "J", "S", "M"].map((d) => `<span class="dow">${d}</span>`).join("");
    for (let i = 0; i < offset; i++) html += "<span></span>";
    for (let d = 1; d <= days; d++) {
      const s = `${y}-${pad(m + 1)}-${pad(d)}`;
      html += `<span class="day ${s === today ? "today" : ""} ${due.has(s) ? "has" : ""}">${d}</span>`;
    }
    $("calGrid").innerHTML = html;

    const next = tasks
      .filter((t) => !t.done && t.deadline >= today)
      .sort((a, b) => a.deadline.localeCompare(b.deadline) || WEIGHT[b.priority] - WEIGHT[a.priority])[0];
    $("nextTask").innerHTML = next
      ? `<div class="next-item"><b>${esc(next.title)}</b><span>${longDate(next.deadline)}</span></div>`
      : '<p class="muted">Belum ada deadline mendatang.</p>';
  }

  function refresh() {
    renderHead();
    renderStats();
    renderTabs();
    renderList();
    renderFocus();
    renderCalendar();
  }

  /* ---------- Navigation ---------- */
  function go(p) {
    page = p;
    if (p !== "all") tab = "all";
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.page === p));
    closeSidebar();
    refresh();
  }
  const openSidebar = () => { $("sidebar").classList.add("open"); $("overlay").classList.add("show"); };
  function closeSidebar() { $("sidebar").classList.remove("open"); $("overlay").classList.remove("show"); }

  /* ---------- Modal ---------- */
  function openModal(id = null) {
    editingId = id;
    $("errTitle").textContent = "";
    $("errDate").textContent = "";
    if (id) {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      $("modalTitle").textContent = "Edit tugas";
      $("fTitle").value = t.title;
      $("fDesc").value = t.desc || "";
      $("fDate").value = t.deadline;
      $("fPriority").value = t.priority;
    } else {
      $("modalTitle").textContent = "Tambah tugas";
      $("taskForm").reset();
      $("fDate").value = todayStr();
      $("fPriority").value = "medium";
    }
    $("modal").hidden = false;
    setTimeout(() => $("fTitle").focus(), 30);
  }
  function closeModal() { $("modal").hidden = true; editingId = null; }

  function submitForm(e) {
    e.preventDefault();
    const title = $("fTitle").value.trim();
    const deadline = $("fDate").value;
    $("errTitle").textContent = title ? "" : "Judul tugas wajib diisi.";
    $("errDate").textContent = deadline ? "" : "Deadline wajib diisi.";
    if (!title || !deadline) return;

    const data = { title, desc: $("fDesc").value.trim(), deadline, priority: $("fPriority").value };
    if (editingId) {
      const t = tasks.find((x) => x.id === editingId);
      if (t) Object.assign(t, data);
      toast("Tugas berhasil diperbarui");
    } else {
      tasks.push({ id: uid(), done: false, createdAt: Date.now(), ...data });
      toast("Tugas berhasil ditambahkan", "success");
    }
    save();
    closeModal();
    refresh();
  }

  function quickAdd(e) {
    if (e.key !== "Enter") return;
    const title = e.target.value.trim();
    if (!title) return;
    tasks.push({ id: uid(), done: false, createdAt: Date.now(), title, desc: "", deadline: todayStr(), priority: "medium" });
    e.target.value = "";
    save();
    refresh();
    toast("Tugas berhasil ditambahkan", "success");
  }

  /* ---------- Delete & toggle ---------- */
  function askDelete(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    deletingId = id;
    $("confirmText").textContent = `"${t.title}" akan dihapus permanen.`;
    $("confirmModal").hidden = false;
  }
  function closeConfirm() { $("confirmModal").hidden = true; deletingId = null; }
  function confirmDelete() {
    tasks = tasks.filter((t) => t.id !== deletingId);
    save();
    closeConfirm();
    refresh();
    toast("Tugas berhasil dihapus", "danger");
  }
  function toggle(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    save();
    refresh();
    toast(t.done ? "Tugas ditandai selesai" : "Status selesai dibatalkan");
  }

  /* ---------- Pomodoro ---------- */
  const FOCUS_SECONDS = 25 * 60;
  let remain = FOCUS_SECONDS;
  let ticking = null;
  let sessionsDone = 0;
  const mmss = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

  function paintTimer() {
    $("timerText").textContent = mmss(remain);
    $("focusSession").textContent = `POMODORO · SESI ${(sessionsDone % 4) + 1} DARI 4`;
    $("focusBtn").textContent = ticking ? "Jeda" : remain < FOCUS_SECONDS ? "Lanjutkan" : "Mulai fokus";
    document.title = ticking ? `${mmss(remain)} · Taskly` : "Taskly — Organize Your Day, One Task at a Time";
  }
  function toggleTimer() {
    if (ticking) {
      clearInterval(ticking);
      ticking = null;
    } else {
      ticking = setInterval(() => {
        remain--;
        if (remain <= 0) {
          clearInterval(ticking);
          ticking = null;
          remain = FOCUS_SECONDS;
          sessionsDone++;
          toast("Sesi fokus selesai. Istirahat sebentar ya!", "success");
        }
        paintTimer();
      }, 1000);
    }
    paintTimer();
  }
  function resetTimer() {
    clearInterval(ticking);
    ticking = null;
    remain = FOCUS_SECONDS;
    paintTimer();
  }

  /* ---------- Events ---------- */
  document.querySelectorAll(".nav-item").forEach((b) => b.addEventListener("click", () => go(b.dataset.page)));
  $("menuBtn").addEventListener("click", openSidebar);
  $("overlay").addEventListener("click", closeSidebar);
  $("addBtn").addEventListener("click", () => openModal());
  $("sideAdd").addEventListener("click", () => { closeSidebar(); openModal(); });
  $("seeAll").addEventListener("click", () => go("all"));
  $("closeModal").addEventListener("click", closeModal);
  $("cancelBtn").addEventListener("click", closeModal);
  $("taskForm").addEventListener("submit", submitForm);
  $("confirmNo").addEventListener("click", closeConfirm);
  $("confirmYes").addEventListener("click", confirmDelete);
  $("modal").addEventListener("click", (e) => { if (e.target === $("modal")) closeModal(); });
  $("confirmModal").addEventListener("click", (e) => { if (e.target === $("confirmModal")) closeConfirm(); });
  $("searchInput").addEventListener("input", renderList);
  $("sortBy").addEventListener("change", renderList);
  $("quickInput").addEventListener("keydown", quickAdd);
  $("focusBtn").addEventListener("click", toggleTimer);
  $("focusReset").addEventListener("click", resetTimer);
  $("calPrev").addEventListener("click", () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCalendar(); });
  $("calNext").addEventListener("click", () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCalendar(); });

  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab;
    renderTabs();
    renderList();
  });

  $("taskList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.closest(".row").dataset.id;
    if (btn.dataset.action === "toggle") toggle(id);
    else if (btn.dataset.action === "edit") openModal(id);
    else if (btn.dataset.action === "delete") askDelete(id);
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      $("searchInput").focus();
    }
    if (e.key === "Escape") {
      if (!$("modal").hidden) closeModal();
      if (!$("confirmModal").hidden) closeConfirm();
      closeSidebar();
    }
  });

  paintTimer();
  refresh();
})();