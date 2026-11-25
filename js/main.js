/* =========================================================
   CHAMPIONSHIP CHAINS - main.js (vanilla, no dependencies)
   ========================================================= */
(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: scrollBehavior });

  /* ---------- Announcement marquee ---------- */
  function initAnnouncement() {
    $$('[data-marquee]').forEach(marquee => {
      const [track, ...extraTracks] = $$('.marquee__track', marquee);
      if (!track) return;

      extraTracks.forEach(extra => extra.remove());

      const originals = [...track.children];
      const speed = parseFloat(marquee.dataset.speed) || 40; // px per second
      let lastWidth = 0;
      let timer;

      const makeCopy = element => {
        const copy = element.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.setAttribute('data-copy', '');
        $$('a', copy).forEach(link => { link.tabIndex = -1; });
        return copy;
      };

      function build() {
        track.replaceChildren(...originals);
        lastWidth = marquee.clientWidth;
        if (reduceMotion) return;

        const setWidth = track.scrollWidth;
        if (!setWidth) return;

        // Fill the screen width, then double it for a seamless loop
        const repeat = Math.max(1, Math.ceil(lastWidth / setWidth));
        for (let i = 1; i < repeat; i++) {
          originals.forEach(element => track.append(makeCopy(element)));
        }
        [...track.children].forEach(element => track.append(makeCopy(element)));

        track.style.setProperty('--time', `${(setWidth * repeat) / speed}s`);
      }

      build();
      if (document.fonts) document.fonts.ready.then(build);

      window.addEventListener('resize', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (marquee.clientWidth !== lastWidth) build();
        }, 200);
      });
    });
  }

  /* ---------- Header and back to top ---------- */
  function initHeader() {
    const header = $('#header');
    const toTop = $('#toTop');
    let ticking = false;

    function onScroll() {
      const y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 20);
      if (toTop) toTop.classList.toggle('is-visible', y > 900);
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    }, { passive: true });

    if (toTop) toTop.addEventListener('click', scrollToTop);
    onScroll();
  }

  /* ---------- Desktop dropdown menus ---------- */
  function initDropdowns() {
    const items = $$('.has-mega');
    if (!items.length) return;

    function setOpen(item, open) {
      item.classList.toggle('is-open', open);
      $('.nav__link', item).setAttribute('aria-expanded', String(open));
    }

    const closeAll = except => {
      items.forEach(item => { if (item !== except) setOpen(item, false); });
    };

    items.forEach(item => {
      setOpen(item, false);
      $('.nav__link', item).addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        closeAll(item);
        setOpen(item, open);
      });
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('.has-mega')) closeAll();
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      closeAll();
      if (document.activeElement.closest('.has-mega')) document.activeElement.blur();
    });
  }

  /* ---------- Full-screen mobile menu ---------- */
  function initMenu() {
    const menu = $('#menu');
    const openButton = $('#menuOpen');
    const closeButton = $('#menuClose');
    if (!menu || !openButton || !closeButton) return;

    function open() {
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      openButton.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeButton.focus(), 400);
    }

    function close() {
      if (!menu.classList.contains('is-open')) return;
      openButton.focus({ preventScroll: true });
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      openButton.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    openButton.addEventListener('click', open);
    closeButton.addEventListener('click', close);
    $$('a', menu).forEach(link => link.addEventListener('click', close));

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) close();
    });
  }

  /* ---------- Search ---------- */
  function initSearch() {
    const search = $('#search');
    const openButton = $('#searchOpen');
    const closeButton = $('#searchClose');
    const input = $('#q');
    if (!search || !openButton) return;

    function open() {
      search.hidden = false;
      document.body.style.overflow = 'hidden';
      if (input) input.focus();
    }

    function close() {
      if (search.hidden) return;
      search.hidden = true;
      document.body.style.overflow = '';
      openButton.focus({ preventScroll: true });
    }

    openButton.addEventListener('click', open);
    if (closeButton) closeButton.addEventListener('click', close);

    search.addEventListener('click', event => {
      if (event.target === search) close();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });
  }

  /* ---------- Brand logos: two rows, opposite directions ---------- */
  function initBrands() {
    const panel = $('.brands__panel');
    if (!panel || reduceMotion) return;

    const firstRow = $('.brands__row', panel);
    if (!firstRow) return;

    const secondRow = firstRow.cloneNode(true);
    secondRow.classList.add('brands__row--reverse');
    secondRow.setAttribute('aria-hidden', 'true');

    const secondTrack = $('.brands__track', secondRow);
    secondTrack.append(...[...secondTrack.children].reverse());
    panel.append(secondRow);

    $$('.brands__track', panel).forEach(track => {
      const items = [...track.children];
      for (let i = 0; i < 3; i++) {
        items.forEach(item => {
          const copy = item.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          track.append(copy);
        });
      }
    });
  }

  /* ---------- Process timeline ---------- */
  function initRoad() {
    const list = $('.road__list');
    if (!list) return;

    const steps = $$('.road__step', list);

    const reach = index => {
      steps[index].classList.add('is-reached');
      if (index > 0) steps[index - 1].classList.add('is-filled');
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
      steps.forEach((step, i) => reach(i));
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      steps.forEach((step, i) => setTimeout(() => reach(i), i * 400));
    }, { threshold: 0.15 });

    observer.observe(list);
  }

  /* ---------- Product filter and slider ---------- */
  function initShop() {
    const shop = $('.shop');
    if (!shop) return;

    const track = $('.shop__track', shop);
    const items = $$('.shop__item', shop);
    const filters = $$('[data-filter]', shop);
    const arrows = $('.shop__arrows', shop);
    const prev = $('.shop__prev', shop);
    const next = $('.shop__next', shop);

    function updateArrows() {
      const maxScroll = track.scrollWidth - track.clientWidth;
      arrows.hidden = maxScroll <= 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= maxScroll - 2;
    }

    function move(direction) {
      const card = items.find(item => !item.hidden);
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: scrollBehavior });
    }

    filters.forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.filter;
        filters.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        items.forEach(item => {
          item.hidden = type !== 'all' && item.dataset.finish !== type;
        });
        track.scrollLeft = 0;
        updateArrows();
      });
    });

    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    window.addEventListener('load', updateArrows);
    updateArrows();
  }

  /* ---------- Chain of the month ---------- */
  function initMonth() {
    const section = $('.month');
    if (!section) return;

    const date = $('.month__date', section);
    if (date) {
      date.textContent = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    }

    const stage = $('.month__stage', section);
    const image = stage && $('img', stage);
    if (!image || reduceMotion || !hasMouse) return;

    stage.addEventListener('mousemove', event => {
      const box = stage.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      image.style.setProperty('--ry', `${x * 20}deg`);
      image.style.setProperty('--rx', `${-y * 20}deg`);
    });

    stage.addEventListener('mouseleave', () => {
      image.style.setProperty('--ry', '0deg');
      image.style.setProperty('--rx', '0deg');
    });
  }

  /* ---------- Comparison switch ---------- */
  function initVersus() {
    const section = $('.versus');
    if (!section) return;

    const buttons = $$('[data-view]', section);
    const rows = $$('.versus__list li', section);
    const ring = $('.versus__ring', section);
    const score = $('.versus__score', section);

    rows.forEach(row => { row.dataset.ours = $('p', row).textContent; });

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const others = button.dataset.view === 'others';

        buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        section.classList.toggle('is-others', others);

        rows.forEach(row => {
          const status = row.dataset.status;
          $('p', row).textContent = others ? row.dataset.others : row.dataset.ours;
          $('span', row).textContent = others ? status : 'Yes';
          $('b', row).textContent = !others ? '✓' : status === 'no' ? '✕' : '–';
        });

        score.textContent = others ? '0/5' : '5/5';
        ring.style.setProperty('--score', others ? '0%' : '100%');
      });
    });
  }

  /* ---------- Review card stack ---------- */
  function initDeck() {
    const section = $('.deck');
    if (!section) return;

    const cards = $$('.deck__card', section);
    const count = $('.deck__count', section);
    if (!cards.length) return;

    let current = 0;

    function update() {
      cards.forEach((card, i) => {
        const position = (i - current + cards.length) % cards.length;
        const video = $('video', card);

        card.style.setProperty('--pos', Math.min(position, 2));
        card.style.visibility = position > 2 ? 'hidden' : 'visible';
        card.inert = position !== 0;
        if (video && position !== 0) video.pause();
      });
      count.textContent = `${current + 1} / ${cards.length}`;
    }

    function move(step) {
      current = (current + step + cards.length) % cards.length;
      update();
    }

    $('.deck__prev', section).addEventListener('click', () => move(-1));
    $('.deck__next', section).addEventListener('click', () => move(1));
    update();
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    const section = $('.faq');
    if (!section) return;

    const buttons = $$('.faq__questions button', section);
    const answers = $$('.faq__answer', section);
    const panel = $('.faq__panel', section);

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        answers.forEach(answer => {
          answer.hidden = answer.id !== button.getAttribute('aria-controls');
        });

        if (window.matchMedia('(max-width: 900px)').matches) {
          panel.scrollIntoView({ behavior: scrollBehavior, block: 'nearest' });
        }
      });
    });
  }

  /* ---------- Footer ---------- */
  function initFooter() {
    const footer = $('.foot');
    if (!footer) return;

    const year = $('.foot__year', footer);
    const top = $('.foot__top', footer);

    if (year) year.textContent = new Date().getFullYear();
    if (top) {
      top.addEventListener('click', event => {
        event.preventDefault();
        scrollToTop();
      });
    }
  }

  /* ---------- Floating animation ---------- */
  function initFloating() {
    if (reduceMotion || !Element.prototype.animate) return;

    // distance = px moved, duration = one full up/down cycle, offset = start point
    const floatItems = [
      { selector: '.hero__arch',      distance: 14, duration: 6000, offset: 0 },
      { selector: '.seal',            distance: 10, duration: 4500, offset: 1200 },
      { selector: '.rating',          distance: 12, duration: 3800, offset: 2000 },
      { selector: '.why__circle',     distance: 12, duration: 6500, offset: 0 },
      { selector: '.why__note',       distance: 10, duration: 4200, offset: 1500 },
      { selector: '.month__stage img', distance: 18, duration: 5000, offset: 0 },
      { selector: '.cta__photo',      distance: 12, duration: 5200, offset: 0 }
    ];

    const animations = new Map();

    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(entries => {
          entries.forEach(entry => {
            const animation = animations.get(entry.target);
            if (entry.isIntersecting) animation.play();
            else animation.pause();
          });
        })
      : null;

    floatItems.forEach(({ selector, distance, duration, offset }) => {
      $$(selector).forEach((element, i) => {
        // "translate" works alongside existing CSS "transform" effects
        const animation = element.animate(
          [{ translate: '0 0' }, { translate: `0 -${distance}px` }],
          {
            duration: duration / 2,
            delay: -(offset + i * 1300),
            direction: 'alternate',
            iterations: Infinity,
            easing: 'ease-in-out'
          }
        );

        animations.set(element, animation);
        if (observer) observer.observe(element);
      });
    });
  }

  /* ---------- Hero mouse parallax ---------- */
  function initParallax() {
    const visual = $('.hero__visual');
    if (!visual || reduceMotion || !hasMouse) return;

    const layers = [
      { element: $('.hero__arch', visual), depth: 8 },
      { element: $('.seal', visual), depth: -18 },
      { element: $('.rating', visual), depth: 20 }
    ].filter(layer => layer.element);

    layers.forEach(({ element }) => {
      element.style.transition = 'transform .3s ease-out';
    });

    visual.addEventListener('mousemove', event => {
      const box = visual.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;

      layers.forEach(({ element, depth }) => {
        element.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
      });
    });

    visual.addEventListener('mouseleave', () => {
      layers.forEach(({ element }) => { element.style.transform = ''; });
    });
  }

  /* ---------- Start: one error will not stop the rest ---------- */
  function init() {
    [
      initAnnouncement, initHeader, initDropdowns, initMenu, initSearch,
      initBrands, initRoad, initShop, initMonth, initVersus,
      initDeck, initFaq, initFooter, initFloating, initParallax
    ].forEach(start => {
      try {
        start();
      } catch (error) {
        console.error(`[main.js] ${start.name} failed:`, error);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();