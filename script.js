// ---------- Loading screen ----------
const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loaderBar");

let progressLoad = 0;
const timer = setInterval(() => {
  progressLoad += Math.random() * 12;
  if (progressLoad >= 100) {
    progressLoad = 100;
    clearInterval(timer);
    setTimeout(() => {
      loader.classList.add("done");
      document.body.classList.remove("loading");
    }, 350);
  }
  loaderBar.style.width = progressLoad + "%";
}, 120);

// ---------- Tahun di footer ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Tema terang / gelap ----------
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("tema", next); } catch (e) {}
});

// ---------- Kalau foto belum ada, tampilkan huruf inisial ----------
const photo = document.getElementById("photo");
const photoImg = document.getElementById("photoImg");
function showFallback() { photo.classList.add("no-img"); photoImg.style.display = "none"; }
photoImg.addEventListener("error", showFallback);
if (photoImg.complete && photoImg.naturalWidth === 0) showFallback();

// ---------- Elemen muncul halus saat di-scroll (hanya satu kali) ----------
const revealTargets = document.querySelectorAll(".about-grid, .skills, .project, .contact-grid");
revealTargets.forEach(el => el.classList.add("reveal"));

const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealTargets.forEach(el => revealObserver.observe(el));

// ---------- Tandai menu yang sedang aktif di dock bawah ----------
const links = document.querySelectorAll("[data-link]");
const sections = ["beranda", "tentang", "skill", "proyek", "kontak"]
  .map(id => document.getElementById(id));

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(a => a.classList.toggle("active", a.dataset.link === entry.target.id));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach(s => s && navObserver.observe(s));

// ---------- Garis progress scroll ----------
const progressBar = document.getElementById("progress");
function updateProgress() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  progressBar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
}
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

// ---------- Form kontak: membuka aplikasi email dengan isi pesan ----------
// Ganti alamat email di bawah dengan emailmu.
const EMAIL_TUJUAN = "muhamad11isal12@gmail.com";
const form = document.getElementById("contactForm");
const note = document.getElementById("formNote");

form.addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(form);
  const subject = encodeURIComponent("Pesan dari portofolio: " + data.get("nama"));
  const body = encodeURIComponent(
    data.get("pesan") + "\n\n— " + data.get("nama") + " (" + data.get("email") + ")"
  );
  window.location.href = `mailto:${EMAIL_TUJUAN}?subject=${subject}&body=${body}`;
  note.textContent = "Membuka aplikasi emailmu…";
});