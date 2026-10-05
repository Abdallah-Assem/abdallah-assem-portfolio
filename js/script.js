document.addEventListener("DOMContentLoaded", () => {

  /* ---- Footer year ---- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Mobile nav toggle ---- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen);
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---- Certificate lightbox ---- */
  const certModal = document.getElementById("certModal");
  const certModalBody = document.getElementById("certModalBody");
  const certModalTitle = document.getElementById("certModalTitle");
  const certModalDownload = document.getElementById("certModalDownload");

  function openCertModal(src, type, title) {
    certModalBody.innerHTML = type === "pdf"
      ? `<iframe src="${src}" title="${title}"></iframe>`
      : `<img src="${src}" alt="${title}">`;
    certModalTitle.textContent = title || "Certificate";
    certModalDownload.href = src;
    certModal.classList.add("open");
    certModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeCertModal() {
    certModal.classList.remove("open");
    certModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(() => { certModalBody.innerHTML = ""; }, 300);
  }

  document.querySelectorAll("[data-cert-src]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openCertModal(
        link.getAttribute("data-cert-src"),
        link.getAttribute("data-cert-type"),
        link.getAttribute("data-cert-title")
      );
    });
  });

  certModal.querySelectorAll("[data-cert-close]").forEach(el => {
    el.addEventListener("click", closeCertModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && certModal.classList.contains("open")) closeCertModal();
  });

  /* ---- YouTube demo embeds (click-to-play facade) ---- */
  document.querySelectorAll(".proj-media[data-yt-id]").forEach(mediaEl => {
    const ytId = mediaEl.getAttribute("data-yt-id");
    if (!ytId) return; // no video yet — leave the "coming soon" placeholder

    mediaEl.innerHTML = `
      <button class="yt-facade" aria-label="Play project demo video"
        style="background-image:url('https://img.youtube.com/vi/${ytId}/hqdefault.jpg')">
        <span class="yt-play-btn"><i class="fa-solid fa-play"></i></span>
      </button>
    `;

    mediaEl.querySelector(".yt-facade").addEventListener("click", function () {
      const iframe = document.createElement("iframe");
      iframe.className = "proj-video";
      iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
      iframe.title = "Project demo video";
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      mediaEl.innerHTML = "";
      mediaEl.appendChild(iframe);
    });
  });

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
    revealObserver.observe(el);
  });

  /* ---- Active nav link on scroll ---- */
  const sections = document.querySelectorAll("main section[id], header#top");
  const navAnchors = document.querySelectorAll(".nav-link[data-nav]");

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navAnchors.forEach(a => {
          a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
        });
      }
    });
  }, { threshold: 0.4, rootMargin: "-80px 0px -40% 0px" });

  sections.forEach(sec => navObserver.observe(sec));

  /* ---- Nav background on scroll ---- */
  const siteNav = document.getElementById("siteNav");
  const backToTop = document.getElementById("backToTop");

  window.addEventListener("scroll", () => {
    const scrolled = window.scrollY > 40;
    siteNav.style.borderBottomColor = scrolled ? "rgba(212,167,61,0.25)" : "rgba(255,255,255,0.08)";
    backToTop.classList.toggle("show", window.scrollY > 600);
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

});