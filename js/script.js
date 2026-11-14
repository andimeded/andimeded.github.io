/* ==========================================================
   Andi Mededovic | Portfolio interactions
   - Mobile menu toggle
   - Header shadow on scroll
   - Active nav link highlighting
   - Scroll-in reveal animations
   - Image viewer for project galleries
   - Footer year
   ========================================================== */

// Lets CSS know JS is running (so content stays visible if JS fails)
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const navLinks = nav.querySelectorAll("a[href^='#']");

  /* ---------- Mobile menu ---------- */
  const setMenu = (open) => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Close after choosing a link
  navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

  // Close with Escape or a click outside the header
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("open") && !header.contains(e.target)) setMenu(false);
  });

  // Reset the menu when resizing up to desktop
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Header shadow + label swap ("Engineering Portfolio" -> name once scrolling starts) ---------- */
  const onScroll = () => {
    const scrolled = window.scrollY > 8;
    header.classList.toggle("scrolled", scrolled);
    header.classList.toggle("show-name", scrolled);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Active nav link ---------- */
  const sections = [...navLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
  };

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      // A section counts as "current" when it crosses the upper-middle of the screen
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((section) => sectionObserver.observe(section));

    // Clear highlight while in the hero
    const hero = document.getElementById("hero");
    new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(""); },
      { rootMargin: "-40% 0px -55% 0px" }
    ).observe(hero);
  }

  /* ---------- Scroll-in reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // animate once
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Gallery image viewer ---------- */
  // Opens a photo full size. Arrows, arrow keys, or a swipe step
  // through the other photos from the same project or gallery.
  const lightbox = document.getElementById("lightbox");

  if (lightbox && typeof lightbox.showModal === "function") {
    const lbImg = lightbox.querySelector(".lightbox-stage img");
    const lbCaption = lightbox.querySelector(".lightbox-caption");
    const lbDots = lightbox.querySelector(".lightbox-dots");
    const prevBtn = lightbox.querySelector(".lightbox-prev");
    const nextBtn = lightbox.querySelector(".lightbox-next");
    let group = []; // images in the gallery that was clicked
    let index = 0;

    const show = (i) => {
      index = i;
      const img = group[index];
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCaption.textContent = img.alt;

      // Hide the arrows at the ends, like a photo carousel
      prevBtn.hidden = index === 0;
      nextBtn.hidden = index === group.length - 1;

      // One dot per photo, current one highlighted
      lbDots.innerHTML = group.length > 1 ? group.map(() => "<span></span>").join("") : "";
      if (lbDots.children[index]) lbDots.children[index].classList.add("active");
    };

    const step = (dir) => {
      const next = index + dir;
      if (next >= 0 && next < group.length) show(next);
    };

    // Photos that belong together: a project's main photo plus its gallery,
    // or the photos in one gallery elsewhere on the page
    const groupFor = (img) => {
      const card = img.closest(".project-card");
      const imgs = card
        ? [card.querySelector(".project-media img"), ...card.querySelectorAll(".gallery-item img")]
        : [...(img.closest(".gallery, .about-photos") || img.parentNode).querySelectorAll(".gallery-item img")];
      const seen = new Set();
      return imgs.filter((el) => el && !seen.has(el.src) && seen.add(el.src));
    };

    const open = (img) => {
      group = groupFor(img);
      show(Math.max(0, group.findIndex((el) => el.src === img.src)));
      lightbox.showModal();
    };

    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("click", () => open(item.querySelector("img")));
    });

    // The main photo on each project card opens full screen too
    document.querySelectorAll(".project-media img").forEach((img) => {
      img.classList.add("zoomable");
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.addEventListener("click", () => open(img));
      img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(img);
        }
      });
    });

    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));
    lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());

    lightbox.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });

    // Swipe left/right on touch screens
    let touchX = null;
    lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
      touchX = null;
    });

    // Click on the dark backdrop closes it
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) lightbox.close();
    });
  }

  /* ---------- Footer scene: two fighters walk in, trade hits, and one gets knocked out ---------- */
  const scene = document.querySelector(".footer-scene");
  const hero = document.querySelector(".footer-hero");
  const foe = document.querySelector(".footer-foe");
  if (scene && hero && foe) {
    const HERO = { frames: 10, walk: [0, 1, 2, 3], stance: [4, 5, 6, 5], jab: 7, guard: 8, kick: 9 };
    const FOE = { frames: 8, walk: [0, 1, 2, 3], stance: 4, hurt: 5, fall: 6, down: 7 };
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const frame = (el, total, i) => { el.style.backgroundPositionX = (i / (total - 1)) * 100 + "%"; };
    const moveTo = (el, x, ms = 0) => {
      el.style.transition = ms ? `transform ${ms}ms linear` : "none";
      el.style.transform = `translateX(${Math.round(x)}px)`;
    };
    // Cycle through a list of frames until the returned stop function is called
    // Optional bob: a list of vertical offsets (in sprite pixels) applied per frame for a choppier, NES-style step
    const loop = (el, total, list, ms, bob) => {
      let i = 0;
      const px = el.offsetHeight / 45; // one sprite pixel at the current display size
      const show = () => {
        frame(el, total, list[i]);
        if (bob) el.style.translate = `0 ${bob[i] * px}px`;
      };
      show();
      const id = setInterval(() => { i = (i + 1) % list.length; show(); }, ms);
      return () => { clearInterval(id); el.style.translate = ""; };
    };
    // Where the hero ends up: a bit left of center, with the foe just within reach
    const heroSpot = () => scene.clientWidth * 0.5 - hero.offsetWidth * 0.75;
    let stopStance = null;
    const settle = () => {
      moveTo(hero, heroSpot());
      if (!stopStance) stopStance = loop(hero, HERO.frames, HERO.stance, 220);
    };

    const fight = async () => {
      const width = scene.clientWidth;
      const heroX = heroSpot();
      const foeX = heroX + hero.offsetWidth * 0.35;
      moveTo(hero, -hero.offsetWidth * 1.1);
      moveTo(foe, width + 10);
      foe.style.visibility = "visible";
      void scene.offsetWidth; // apply the start positions before animating

      // 1. Both walk in and meet
      const speed = hero.offsetWidth * 1.3; // pixels per second
      const walkMs = (Math.max(heroX + hero.offsetWidth * 1.1, width - foeX) / speed) * 1000;
      const stopHeroWalk = loop(hero, HERO.frames, HERO.walk, 150);
      const stopFoeWalk = loop(foe, FOE.frames, FOE.walk, 200, [-1, 1, -1, 1]); // up on the narrow step, down on the stride
      moveTo(hero, heroX, walkMs);
      moveTo(foe, foeX, walkMs);
      await wait(walkMs);
      stopHeroWalk();
      stopFoeWalk();
      frame(hero, HERO.frames, HERO.stance[0]);
      frame(foe, FOE.frames, FOE.stance);
      await wait(500);

      // 2. Jab, jab, then a kick that sends the foe down
      for (let i = 0; i < 2; i++) {
        frame(hero, HERO.frames, HERO.jab);
        frame(foe, FOE.frames, FOE.hurt);
        await wait(220);
        frame(hero, HERO.frames, HERO.guard);
        frame(foe, FOE.frames, FOE.stance);
        await wait(260);
      }
      frame(hero, HERO.frames, HERO.kick);
      frame(foe, FOE.frames, FOE.fall);
      moveTo(foe, foeX + hero.offsetWidth * 0.35, 350);
      await wait(350);
      frame(foe, FOE.frames, FOE.down);
      await wait(250);
      frame(hero, HERO.frames, HERO.stance[0]);
      await wait(500);

      // 3. Knocked-out foe blinks and disappears, like in the old arcade games
      for (let i = 0; i < 8; i++) {
        foe.style.visibility = i % 2 ? "visible" : "hidden";
        await wait(110);
      }
      foe.style.visibility = "hidden";
      settle();
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      // No animation: the hero just stands in place
      moveTo(hero, heroSpot());
      frame(hero, HERO.frames, HERO.stance[0]);
    } else {
      const observer = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        fight();
      }, { threshold: 0.4 });
      observer.observe(scene);
    }
    window.addEventListener("resize", () => { if (stopStance || reduceMotion) moveTo(hero, heroSpot()); });
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

/* ---------- Direct project links (e.g. andimeded.github.io/#stm32) ----------
   Browsers try to jump to the linked card before the page has finished laying out,
   which can leave the visitor at the top. Once everything has loaded, jump there again. */
window.addEventListener("load", () => {
  const id = decodeURIComponent(window.location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
});
