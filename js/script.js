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

  /* ---- Code-lines background (highlights around the cursor) ---- */
  const codeBg = document.getElementById("codeBg");
  const codeBase = document.getElementById("codeBase");
  const codeGlow = document.getElementById("codeGlow");
  const codeHlLine = document.getElementById("codeHlLine");

  if (codeBg && codeBase && codeGlow) {
    // Decorative code built from the stack on the CV (lines kept short so they fit a column)
    const BLOCKS = [
      [
        '// Abdallah Assem · Cairo, Egypt',
        'var abdallah = new Developer',
        '{',
        '    Name = "Abdallah Assem",',
        '    Role = "Full-Stack Developer",',
        '    Stack = new[]',
        '    {',
        '        "C#", "ASP.NET Core", "Angular", "SQL Server"',
        '    },',
        '    Current = new Job',
        '    {',
        '        Title = "Back-End Developer",',
        '        Company = "Travel Solutions Egypt",',
        '        Since = "02/2026"',
        '    },',
        '    Education = "BSc. Computers & AI, Helwan University",',
        '    Projects = new[]',
        '    {',
        '        "ITOMS", "Accounting Tool", "The Broker",',
        '        "Be Fit", "Marvel Tracker", "Limian Law"',
        '    },',
        '    OpenToWork = true',
        '};'
      ],
      [
        '// Program.cs',
        'var builder = WebApplication.CreateBuilder(args);',
        '',
        'builder.Services.AddDbContext<AppDbContext>(o =>',
        '    o.UseSqlServer(connectionString));',
        '',
        'builder.Services',
        '    .AddIdentity<AppUser, IdentityRole>()',
        '    .AddEntityFrameworkStores<AppDbContext>();',
        '',
        'builder.Services.AddHangfire(c =>',
        '    c.UseSqlServerStorage(connectionString));',
        'builder.Services.AddHangfireServer();',
        'builder.Services.AddSignalR();',
        'builder.Services.AddControllersWithViews();',
        '',
        'var app = builder.Build();',
        '',
        'app.UseAuthentication();',
        'app.UseAuthorization();',
        'app.MapHub<ChatHub>("/chat");',
        'app.MapDefaultControllerRoute();',
        'app.Run();'
      ],
      [
        '// ReservationService.cs',
        'public async Task<List<ReservationDto>> GetPendingAsync()',
        '{',
        '    return await _db.Reservations',
        '        .Where(r => r.Status == Status.Pending)',
        '        .OrderBy(r => r.TravelDate)',
        '        .Select(r => new ReservationDto(r))',
        '        .ToListAsync();',
        '}',
        '',
        'public async Task SettleAsync(int id, decimal amount)',
        '{',
        '    var advance = await _db.CashAdvances.FindAsync(id);',
        '    advance.Settled += amount;',
        '    await _db.SaveChangesAsync();',
        '}'
      ],
      [
        '// projects.component.ts',
        '@Component({',
        '  selector: "app-projects",',
        '  standalone: true,',
        '  templateUrl: "./projects.component.html"',
        '})',
        'export class ProjectsComponent implements OnInit {',
        '  projects = signal<Project[]>([]);',
        '',
        '  constructor(private api: ProjectService) {}',
        '',
        '  ngOnInit() {',
        '    this.api.getAll().subscribe(data =>',
        '      this.projects.set(data));',
        '  }',
        '}'
      ]
    ];

    const KEYWORDS = "using|var|new|public|private|class|return|await|async|static|if|else|true|false|null|this|void|int|decimal|string|export|implements|constructor|const|let|standalone";
    const TOKEN = new RegExp('("[^"]*")|(\\b(?:' + KEYWORDS + ')\\b)|(\\b[A-Z][A-Za-z0-9_]*\\b)|(\\b\\d+(?:\\.\\d+)?\\b)', 'g');
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    function highlight(line) {
      const ci = line.indexOf("//");
      const code = ci >= 0 ? line.slice(0, ci) : line;
      const comment = ci >= 0 ? line.slice(ci) : "";
      const html = esc(code).replace(TOKEN, (m, str, kw, type, num) => {
        if (str)  return '<span class="tk-s">' + str + '</span>';
        if (kw)   return '<span class="tk-k">' + kw + '</span>';
        if (type) return '<span class="tk-t">' + type + '</span>';
        return '<span class="tk-n">' + num + '</span>';
      });
      return html + (comment ? '<span class="tk-c">' + esc(comment) + '</span>' : "");
    }

    let lineH = 22.75, padTop = 24;

    function buildCode() {
      const cs = getComputedStyle(codeBase);
      lineH = parseFloat(cs.lineHeight) || 22.75;
      padTop = parseFloat(cs.paddingTop) || 24;
      codeHlLine.style.height = lineH + "px";

      const rows = Math.ceil(window.innerHeight / lineH) + 2;
      const cols = Math.max(1, Math.floor((window.innerWidth + 48) / (560 + 48)));
      const total = rows * (cols + 1);

      const lines = [];
      let b = 0;
      while (lines.length < total) {
        lines.push(...BLOCKS[b % BLOCKS.length], "");
        b++;
      }
      const html = lines.slice(0, total).map(highlight).join("\n");
      codeBase.innerHTML = html;
      codeGlow.innerHTML = html;
    }

    buildCode();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildCode, 200);
    });

    // Follow the pointer (mouse, pen or touch) — one update per animation frame
    let px = 0, py = 0, frame = null;
    function paintHighlight() {
      frame = null;
      codeBg.style.setProperty("--cx", px + "px");
      codeBg.style.setProperty("--cy", py + "px");
      const row = Math.max(0, Math.floor((py - padTop) / lineH));
      codeBg.style.setProperty("--hl-y", (padTop + row * lineH) + "px");
    }
    function onPointer(e) {
      px = e.clientX; py = e.clientY;
      codeBg.classList.add("is-active");
      if (!frame) frame = requestAnimationFrame(paintHighlight);
    }
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    document.addEventListener("pointerleave", () => codeBg.classList.remove("is-active"));
    document.documentElement.addEventListener("mouseleave", () => codeBg.classList.remove("is-active"));
    window.addEventListener("pointerup", (e) => {
      if (e.pointerType === "touch") codeBg.classList.remove("is-active");
    }, { passive: true });
    window.addEventListener("blur", () => codeBg.classList.remove("is-active"));
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
