/* =====================================================================
   Washington Machado · Arquitetura
   script.js — vanilla ES6+, zero dependências
   ===================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------
     1. HEADER — adiciona .scrolled após 80px
  ---------------------------------------------------------------- */
  const header = document.getElementById('siteHeader');

  const onScrollHeader = () => {
    if (window.scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  /* ----------------------------------------------------------------
     2. SCROLL INDICATOR — some após começar a rolar
  ---------------------------------------------------------------- */
  const scrollIndicator = document.querySelector('.scroll-indicator');

  const onScrollIndicator = () => {
    if (!scrollIndicator) return;
    scrollIndicator.classList.toggle('hidden', window.scrollY > 120);
  };

  /* ----------------------------------------------------------------
     Scroll listener único (passivo, com rAF throttle)
  ---------------------------------------------------------------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollHeader();
      onScrollIndicator();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // estado inicial

  /* ----------------------------------------------------------------
     3. SCROLL REVEAL — IntersectionObserver
  ---------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal, .line-grow');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px'
    });

    revealEls.forEach((el) => io.observe(el));
  } else {
    // Sem suporte ou movimento reduzido: mostra tudo
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ----------------------------------------------------------------
     4. CURSOR PERSONALIZADO (desktop com ponteiro fino) — lerp suave
  ---------------------------------------------------------------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cursor = document.querySelector('.cursor-dot');

  if (finePointer && cursor && !prefersReducedMotion) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    const ease = 0.18;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.classList.add('active');
    }, { passive: true });

    document.addEventListener('mouseleave', () => cursor.classList.remove('active'));

    const render = () => {
      curX += (mouseX - curX) * ease;
      curY += (mouseY - curY) * ease;
      cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      requestAnimationFrame(render);
    };
    render();

    // Expandir ao passar por elementos interativos
    const interactive = document.querySelectorAll('a, button, .slide');
    interactive.forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('grow'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('grow'));
    });
  }

  /* ----------------------------------------------------------------
     5. VÍDEO HERO — autoplay + loop infinito garantido no background
  ---------------------------------------------------------------- */
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    // Reforça atributos exigidos para autoplay silencioso em background
    heroVideo.muted = true;
    heroVideo.loop = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.setAttribute('playsinline', '');

    // Reprodução mais lenta — efeito cinematográfico no background
    const PLAYBACK_RATE = 0.7;
    heroVideo.playbackRate = PLAYBACK_RATE;
    heroVideo.addEventListener('loadedmetadata', () => {
      heroVideo.playbackRate = PLAYBACK_RATE;
    });

    const startPlayback = () => {
      const tryPlay = heroVideo.play();
      if (tryPlay && typeof tryPlay.catch === 'function') {
        tryPlay.catch(() => {
          // Autoplay bloqueado: o poster permanece como background estático.
        });
      }
    };

    startPlayback();

    // Fallback de loop: alguns navegadores/encodings ignoram o atributo `loop`.
    heroVideo.addEventListener('ended', () => {
      heroVideo.currentTime = 0;
      startPlayback();
    });

    // Retoma o vídeo ao voltar para a aba (browsers pausam ao perder foco).
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && heroVideo.paused) startPlayback();
    });
  }

  /* ----------------------------------------------------------------
     6. META PIXEL — dispara evento Lead ao clicar em qualquer CTA WhatsApp
     Segura o redirecionamento ~700ms para garantir o envio do evento.
  ---------------------------------------------------------------- */
  const WA_SELECTOR =
    'a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="web.whatsapp.com"]';

  document.addEventListener('click', (e) => {
    const link = e.target.closest(WA_SELECTOR);
    if (!link) return;

    // Evita disparar duas vezes caso o redirecionamento já tenha sido agendado.
    if (link.dataset.leadFired === '1') return;

    // Sem o pixel carregado (ex.: bloqueador), deixa o clique seguir normalmente.
    if (typeof window.fbq !== 'function') return;

    e.preventDefault();
    link.dataset.leadFired = '1';

    const href = link.href;
    const target = link.target;

    window.fbq('track', 'Lead', {
      content_name: 'Clique no WhatsApp',
      origem: 'landing_page'
    });

    setTimeout(() => {
      if (target === '_blank') {
        window.open(href, '_blank', 'noopener');
      } else {
        window.location.href = href;
      }
    }, 700);
  });
})();
