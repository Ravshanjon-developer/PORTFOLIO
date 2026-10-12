(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Scroll: progress bar + nav state ── */
  const bar = $('.progress__bar');
  const nav = $('#nav');
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    nav.classList.toggle('is-scrolled', scrollY > 24);
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ── Mobile menu ── */
  const burger = $('#burger');
  const links = $('#navLinks');
  const closeMenu = () => {
    links.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  };
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ── Active nav link ── */
  const navLinks = $$('a', links);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));

  /* ── Reveal on scroll ── */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      revealIO.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  /* ── Counters ── */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target;
      const to = Number(el.dataset.count);
      if (reduced) { el.textContent = to; return; }
      const t0 = performance.now();
      const dur = 1200;
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ── Typed text ── */
  const typed = $('#typed');
  if (typed && !reduced) {
    const words = typed.dataset.words.split('|');
    let w = 0, i = words[0].length, del = true;
    const tick = () => {
      const word = words[w];
      i += del ? -1 : 1;
      typed.textContent = word.slice(0, i);
      let delay = del ? 38 : 75;
      if (!del && i === word.length) { del = true; delay = 1900; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; delay = 320; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2200);
  }

  /* ── Marquee: duplicate for a seamless loop ── */
  const track = $('#marquee');
  if (track) track.innerHTML += track.innerHTML;

  /* ── Pointer effects ── */
  if (canHover && !reduced) {
    const glow = $('.cursor-glow');
    addEventListener('pointermove', (e) => {
      glow.classList.add('is-on');
      glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('is-on'));

    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .1s linear';
        el.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = '';
        el.style.transform = '';
      });
    });

    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ── Project filter ── */
  const filters = $$('.filter');
  const projects = $$('.project');
  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filters.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      projects.forEach((p) => {
        const show = f === 'all' || p.dataset.type === f;
        p.hidden = !show;
        p.classList.remove('is-entering');
        if (show) {
          p.classList.add('is-in');
          void p.offsetWidth;
          p.classList.add('is-entering');
        }
      });
    });
  });

  /* ── Lightbox ── */
  const lightbox = $('#lightbox');
  const lbImg = $('#lightboxImg');
  const lbCap = $('#lightboxCap');
  $$('.project__media').forEach((btn) => {
    btn.addEventListener('click', () => {
      lbImg.src = btn.dataset.full;
      lbImg.alt = btn.dataset.title;
      lbCap.textContent = btn.dataset.title;
      lightbox.showModal();
    });
  });
  $('#lightboxClose').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });

  /* ── Copy e-mail ── */
  const copyBtn = $('#copyMail');
  copyBtn.addEventListener('click', async () => {
    const label = copyBtn.textContent;
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.mail);
      copyBtn.textContent = 'Скопировано ✓';
    } catch {
      copyBtn.textContent = copyBtn.dataset.mail;
    }
    setTimeout(() => { copyBtn.textContent = label; }, 1800);
  });

  $('#year').textContent = new Date().getFullYear();

  /* ── Hero neural-network canvas ── */
  const canvas = $('#net');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    const LINK = 150;
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, dpr = 1, pts = [], raf = 0, visible = true;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.round((w * h) / 16000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        const near = md < 180;
        ctx.beginPath();
        ctx.arc(p.x, p.y, near ? p.r + 1 : p.r, 0, Math.PI * 2);
        ctx.fillStyle = near ? 'rgba(127,168,255,.95)' : 'rgba(127,168,255,.5)';
        ctx.fill();

        if (near) {
          ctx.strokeStyle = `rgba(0,76,255,${(1 - md / 180) * 0.7})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          ctx.strokeStyle = `rgba(61,123,255,${(1 - Math.sqrt(d2) / LINK) * 0.28})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
      if (visible) raf = requestAnimationFrame(draw);
    };

    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    }).observe(hero);

    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize();
  }
})();
