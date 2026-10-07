document.addEventListener("DOMContentLoaded", () => {

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prefersFinePointer   = window.matchMedia("(pointer: fine)").matches;

  /* ---- Footer year + live Cairo clock ---- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const clockEl = document.getElementById("liveClock");
  function updateClock() {
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Cairo",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
      });
      if (clockEl) clockEl.textContent = fmt.format(now);
    } catch (e) { /* fallback silent */ }
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ---- Theme Toggle Logic with View Transition API ---- */
  const themeToggle = document.getElementById("themeToggle");
  const mobileThemeToggle = document.getElementById("mobileThemeToggle");

  function updateThemeIcon() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const iconClass = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    if(themeToggle) themeToggle.querySelector('i').className = iconClass;
    if(mobileThemeToggle) mobileThemeToggle.querySelector('i').className = iconClass;
  }

  function applyTheme(newTheme) {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
  }

  function toggleTheme(event) {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Get coordinates for the circular expand animation
    const x = event.clientX;
    const y = event.clientY;
    
    // Calculate the distance to the furthest corner
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    
    // Check if View Transitions API is supported AND user doesn't prefer reduced motion
    if (document.startViewTransition && !prefersReducedMotion) {
      const transition = document.startViewTransition(() => {
        applyTheme(newTheme);
      });
      
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 500,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });
    } else {
      // Fallback for unsupported browsers or reduced motion
      applyTheme(newTheme);
    }
  }

  updateThemeIcon();
  if(themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if(mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);

  /* ---- Top-nav background on scroll ---- */
  const topNav = document.getElementById("topNav");
  const backToTop = document.getElementById("backToTop");

  function onScrollNav() {
    const scrolled = window.scrollY > 30;
    if (topNav) topNav.classList.toggle("scrolled", scrolled);
    backToTop.classList.toggle("show", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* ---- Scroll progress bar ---- */
  const scrollProgress = document.getElementById("scrollProgress");
  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + "%";
  }
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();

  /* ---- Active nav state (top nav + mobile bottom nav) ---- */
  const navAnchors = document.querySelectorAll(".nav-link[data-nav]");
  const mobileTabs = document.querySelectorAll(".mobile-tab[data-nav]");
  const sections = document.querySelectorAll("main section[id], header#top");

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute("id");
      navAnchors.forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
      });
      mobileTabs.forEach(t => {
        t.classList.toggle("active", t.getAttribute("data-nav-target") === id);
      });
    });
  }, { threshold: 0.35, rootMargin: "-80px 0px -45% 0px" });

  sections.forEach(sec => navObserver.observe(sec));

  /* ---- Smooth scroll for nav clicks (respect reduced motion) ---- */
  document.querySelectorAll("[data-nav]").forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });

  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`;
    revealObserver.observe(el);
  });

  /* ---- Animated stat counters ---- */
  const statEls = document.querySelectorAll(".stat-num[data-count]");
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      statObserver.unobserve(el);
      const target = parseInt(el.getAttribute("data-count"), 10);
      if (isNaN(target) || prefersReducedMotion) { el.textContent = target; return; }
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  statEls.forEach(el => statObserver.observe(el));

  /* ---- Magnetic buttons (desktop / fine pointer) ---- */
  if (prefersFinePointer && !prefersReducedMotion) {
    document.querySelectorAll(".magnetic").forEach(btn => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top  - rect.height / 2;
        btn.style.setProperty("--mx", `${x * 0.25}px`);
        btn.style.setProperty("--my", `${y * 0.4}px`);
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.setProperty("--mx", "0px");
        btn.style.setProperty("--my", "0px");
      });
    });
  }

  /* ---- Card spotlight (desktop / fine pointer) ---- */
  if (prefersFinePointer) {
    document.querySelectorAll(".proj-card, .skill-card").forEach(card => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top)  / rect.height) * 100;
        card.style.setProperty("--spot-x", xPct + "%");
        card.style.setProperty("--spot-y", yPct + "%");
      });
    });
  }

  /* ---- Parallax orbs on scroll (desktop) ---- */
  if (!prefersReducedMotion) {
    const orbs = document.querySelectorAll(".orb");
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        orbs.forEach((orb, i) => {
          const factor = (i + 1) * 0.08;
          orb.style.transform = `translateY(${y * factor * -0.3}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  /* ---- Interactive Particle Background Canvas ---- */
  const canvas = document.getElementById('bgCanvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    function getAccentRGB() {
      const style = getComputedStyle(document.documentElement);
      const accent = style.getPropertyValue('--accent-rgb').trim();
      return accent || '100, 255, 218';
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw(rgb) {
        ctx.fillStyle = `rgba(${rgb}, 0.8)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      const numParticles = (canvas.width * canvas.height) / 15000;
      for (let i = 0; i < numParticles; i++) particles.push(new Particle());
    }

    function connectParticles(rgb) {
      let opacity = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            opacity = 1 - (dist / 120);
            ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
        // Mouse interaction
        if (mouse.x !== null) {
          const dxm = particles[a].x - mouse.x;
          const dym = particles[a].y - mouse.y;
          const distM = Math.sqrt(dxm * dxm + dym * dym);
          if (distM < 180) {
            opacity = 1 - (distM / 180);
            ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.8})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
    }

    function animateCanvas() {
      const rgb = getAccentRGB();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(rgb); });
      connectParticles(rgb);
      requestAnimationFrame(animateCanvas);
    }
    
    window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
    
    resizeCanvas();
    initParticles();
    animateCanvas();
  }

  /* ---- YouTube demo embeds (click-to-play facade) ---- */
  document.querySelectorAll(".proj-media[data-yt-id]").forEach(mediaEl => {
    const ytId = mediaEl.getAttribute("data-yt-id");
    if (!ytId) return; // leave "coming soon" placeholder

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
    setTimeout(() => { certModalBody.innerHTML = ""; }, 350);
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

});
