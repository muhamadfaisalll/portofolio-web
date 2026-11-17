// Tahun di footer
document.getElementById("year").textContent = new Date().getFullYear();

// Kalau foto.jpg belum ada, tampilkan huruf inisial
const photo = document.getElementById("photo");
const photoImg = document.getElementById("photoImg");
function showFallback() { photo.classList.add("no-img"); photoImg.style.display = "none"; }
photoImg.addEventListener("error", showFallback);
if (photoImg.complete && photoImg.naturalWidth === 0) showFallback();

// Elemen muncul halus saat di-scroll (hanya satu kali)
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

// Tandai menu yang sedang aktif di dock bawah
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

// Form kontak: membuka aplikasi email dengan isi pesan.
// Ganti alamat email di bawah dengan emailmu.
const EMAIL_TUJUAN = "emailkamu@gmail.com";
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
