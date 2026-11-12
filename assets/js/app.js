/* =========================================================
   Fancy Look · PRINT163 — типография в Самаре
   Калькуляторы, проверка макета, заявки, мессенджеры, цели Метрики
   © 2026 Полунин Лев. Все права защищены.
   ========================================================= */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  /* ---------------- Настройки ---------------- */
  var CONFIG = {
    endpoint: 'send.php',                 // обработчик заявок (PHP). Путь от корня сайта
    metrikaId: null,                      // ← вставьте номер счётчика Яндекс Метрики, например 98765432
    phone: '+78462254546',
    phoneView: '+7 (846) 225-45-46',
    telegram: 'https://t.me/+79276923690',
    vk: 'https://vk.me/print163ru',
    email: 'FL163@mail.ru',
    maxFileMb: 25
  };
  var ROOT = document.body.getAttribute('data-root') || '';

  /* ---------------- Утилиты ---------------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' '); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var saveData = navigator.connection && navigator.connection.saveData;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toast(msg) {
    var t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('is-on'); }, 3200);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
    legacyCopy(text); return Promise.resolve();
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }

  /* ---------------- Яндекс Метрика ---------------- */
  if (CONFIG.metrikaId) {
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a); })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(CONFIG.metrikaId, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }
  var sentGoals = {};
  function goal(name, params, once) {
    if (once && sentGoals[name]) return; sentGoals[name] = 1;
    try { if (CONFIG.metrikaId && window.ym) window.ym(CONFIG.metrikaId, 'reachGoal', name, params || {}); } catch (e) {}
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    if (h.indexOf('tel:') === 0) goal('click_phone');
    else if (h.indexOf('t.me') > -1) goal('click_telegram');
    else if (h.indexOf('vk.') > -1) goal('click_vk');
    else if (h.indexOf('mailto:') === 0) goal('click_email');
    else if (/\.pdf$/i.test(h)) goal('download_price');
  });

  /* ---------------- Шапка, меню ---------------- */
  var header = $('.header'), fab = $('.fab');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (fab) fab.classList.toggle('is-on', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var burger = $('.burger'), mnav = $('.mnav');
  function closeMenu() { if (!burger) return; burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('is-open'); document.body.classList.remove('no-scroll'); }
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open)); mnav.classList.toggle('is-open', open); document.body.classList.toggle('no-scroll', open);
    });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  /* Открыто/закрыто по времени Самары (UTC+4) */
  (function () {
    var el = $$('[data-open-status]'); if (!el.length) return;
    var now = new Date(); var h = (now.getUTCHours() + 4) % 24 + now.getUTCMinutes() / 60;
    var open = h >= 10 && h < 20;
    el.forEach(function (n) {
      n.innerHTML = '<span class="dot-live' + (open ? '' : ' is-closed') + '"></span>' + (open ? 'Сейчас открыто · до 20:00' : 'Сейчас закрыто · откроемся в 10:00');
    });
  })();

  /* ---------------- Появление блоков ---------------- */
  if ('IntersectionObserver' in window && !reduced) {
    var rio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); rio.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(function (n) { rio.observe(n); });
  } else { $$('.rv').forEach(function (n) { n.classList.add('is-in'); }); }

  /* ---------------- Видео: играть только в зоне видимости ---------------- */
  var vids = $$('video[data-auto]');
  if ('IntersectionObserver' in window && !saveData && !reduced) {
    var vio = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        var v = x.target;
        if (x.isIntersecting) {
          if (!v.src && v.dataset.src) { v.src = v.dataset.src; }
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else { v.pause(); }
      });
    }, { threshold: 0.35 });
    vids.forEach(function (v) { vio.observe(v); });
  } else {
    vids.forEach(function (v) {
      v.setAttribute('controls', ''); v.preload = 'none';
      if (v.dataset.src && !v.src) v.src = v.dataset.src;
    });
  }

  /* ---------------- Модальные окна ---------------- */
  var lastFocus = null;
  function openModal(id) {
    var m = document.getElementById(id); if (!m) return;
    lastFocus = document.activeElement; closeMenu();
    m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll');
    var f = m.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea,button:not(.modal__x)');
    setTimeout(function () { if (f && window.innerWidth > 640) f.focus(); else m.querySelector('.modal__box').focus(); }, 60);
  }
  function closeModal(m) {
    m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true');
    if (!$('.modal.is-open')) document.body.classList.remove('no-scroll');
    if (lastFocus) try { lastFocus.focus(); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-close]'); if (c) { closeModal(c.closest('.modal')); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var m = $('.modal.is-open'); if (m) closeModal(m); else closeMenu(); }
    if (e.key === 'Tab') {
      var mo = $('.modal.is-open'); if (!mo) return;
      var f = $$('a[href],button:not([disabled]),input:not([type=hidden]),select,textarea', mo).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* =========================================================
     ПРАЙС И КАЛЬКУЛЯТОРЫ (цены — по прайсу «Памятка клиента»)
     ========================================================= */
  var FAST = 'от 20 минут до 1 рабочего дня*';
  var DAY12 = '1–2 рабочих дня*';
  var A = { A6: [105, 148], A5: [148, 210], A4: [210, 297], A3: [297, 420], A2: [420, 594], A1: [594, 841], A0: [841, 1189] };

  var PRODUCTS = {
    tshirt: {
      name: 'Футболка с печатью', ready: FAST, preview: 'tshirt', minQty: 1, unit: 'шт',
      groups: [
        { id: 'v', label: 'Вариант', opts: [
          { v: 'a4-1', t: 'Наша футболка + печать A4', s: 'одна сторона', p: 1500, mm: A.A4 },
          { v: 'a4-2', t: 'Наша футболка + печать A4', s: 'две стороны', p: 1940, mm: A.A4 },
          { v: 'a3-1', t: 'Наша футболка + печать A3', s: 'одна сторона', p: 1740, mm: A.A3 },
          { v: 'a3-2', t: 'Наша футболка + печать A3', s: 'две стороны', p: 2140, mm: A.A3 },
          { v: 'own-a4', t: 'На вашей одежде, A4', s: 'термотрансфер', p: 900, mm: A.A4 },
          { v: 'own-a3', t: 'На вашей одежде, A3', s: 'термотрансфер, от', p: 1200, mm: A.A3, from: true }
        ] },
        { id: 'color', label: 'Цвет футболки', type: 'color', opts: [
          { v: 'white', t: 'Белая', sw: '#ffffff' }, { v: 'black', t: 'Чёрная', sw: '#1d1f22' },
          { v: 'green', t: 'Зелёная', sw: '#2f6f55' }, { v: 'blue', t: 'Синяя', sw: '#2b4c9b' }, { v: 'other', t: 'Другой', sw: 'conic-gradient(#ec008c,#ffe600,#00aeef,#ec008c)' }
        ] },
        { id: 'size', label: 'Размер', opts: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(function (x) { return { v: x, t: x }; }), def: 'L' }
      ],
      qtyHint: 'Тираж от 10 шт. — индивидуальная скидка',
      calc: function (s, q) { return s.v.p * q; }
    },
    mug: {
      name: 'Кружка с фото', ready: FAST, preview: 'mug', minQty: 1, unit: 'шт',
      groups: [
        { id: 'v', label: 'Кружка', opts: [
          { v: 'white', t: 'Белая', s: 'классика 330 мл', p: 600, mm: [200, 90] },
          { v: 'color', t: 'Цветная', s: 'цветная ручка и внутри', p: 850, mm: [200, 90] }
        ] },
        { id: 'inner', label: 'Цвет внутри (для цветной)', type: 'color', opts: [
          { v: 'red', t: 'Красный', sw: '#e5484d' }, { v: 'blue', t: 'Синий', sw: '#2b6fd6' }, { v: 'black', t: 'Чёрный', sw: '#1d1f22' },
          { v: 'green', t: 'Зелёный', sw: '#19a463' }, { v: 'pink', t: 'Розовый', sw: '#f28ab2' }, { v: 'yellow', t: 'Жёлтый', sw: '#f2c94c' }
        ], showIf: function (s) { return s.v.v === 'color'; } }
      ],
      qtyHint: 'Цена без разработки дизайна. Дизайн — от 300 ₽',
      calc: function (s, q) { return s.v.p * q; }
    },
    canvas: {
      name: 'Печать на холсте', ready: DAY12, preview: 'canvas', minQty: 1, unit: 'шт',
      groups: [
        { id: 'f', label: 'Формат', opts: [
          { v: 'A3', t: 'A3', s: '30 × 42 см', mm: A.A3 }, { v: 'A2', t: 'A2', s: '42 × 59 см', mm: A.A2 },
          { v: 'A1', t: 'A1', s: '59 × 84 см', mm: A.A1 }, { v: 'A0', t: 'A0', s: '84 × 119 см', mm: A.A0 }
        ], def: 'A2' },
        { id: 'st', label: 'Натяжка на подрамник', opts: [
          { v: 'std', t: 'Обычная', s: 'края изображения на торцах' }, { v: 'gal', t: 'Галерейная', s: 'изображение «заворачивается» на торцы' }
        ] }
      ],
      extras: [{ id: 'baguette', t: 'Оформить в багет (от 500 ₽, 500+ образцов)', p: 500, from: true }],
      table: { std: { A3: 2000, A2: 2800, A1: 3600, A0: 5300 }, gal: { A3: 2200, A2: 3400, A1: 4150, A0: 6100 } },
      dpi: [100, 70],
      qtyHint: 'Холст + подрамник + печать. Багет — дополнительно',
      calc: function (s, q, x) { return (this.table[s.st.v][s.f.v] + (x.baguette ? 500 : 0)) * q; },
      mm: function (s) { return s.f.mm; }
    },
    cards: {
      name: 'Визитки', ready: DAY12, minQty: 1, unit: 'шт', noQty: true,
      groups: [
        { id: 't', label: 'Печать', opts: [
          { v: 'c1', t: 'Цветные', s: 'одна сторона' }, { v: 'c2', t: 'Цветные', s: 'две стороны' },
          { v: 'b1', t: 'Ч/б', s: 'одна сторона' }, { v: 'b2', t: 'Ч/б', s: 'две стороны' }
        ] },
        { id: 'n', label: 'Тираж', opts: [50, 100, 200, 500, 1000].map(function (x) { return { v: x, t: x + ' шт' }; }), def: 100 }
      ],
      table: {
        b1: { 50: 4.7, 100: 4.2, 200: 3.7, 500: 3.5, 1000: 3.2 },
        c1: { 50: 5.7, 100: 5.2, 200: 4.7, 500: 4.4, 1000: 3.9 },
        b2: { 50: 6.2, 100: 5.7, 200: 5.2, 500: 4.7, 1000: 4.4 },
        c2: { 50: 8.2, 100: 7.7, 200: 7.2, 500: 6.4, 1000: 5.9 }
      },
      qtyHint: 'Белая мелованная бумага 300 г/м² включена. Дизайнерский картон 70–350 г — по запросу',
      calc: function (s) { return this.table[s.t.v][s.n.v] * s.n.v; },
      unitPrice: function (s) { return this.table[s.t.v][s.n.v]; },
      mm: function () { return [90, 50]; }, bleed: true, dpi: [300, 200]
    },
    stickers: {
      name: 'Наклейки', ready: DAY12, minQty: 1, unit: 'лист',
      groups: [
        { id: 'm', label: 'Материал', opts: [
          { v: 'pa4', t: 'Самоклеящаяся бумага A4', s: '60 ₽ / лист', p: 60, mm: A.A4 },
          { v: 'pa3', t: 'Самоклеящаяся бумага A3', s: '120 ₽ / лист', p: 120, mm: A.A3 },
          { v: 'f1', t: 'Плёнка до A1', s: 'мат / глянец / прозрачная', p: 1000, mm: A.A1 },
          { v: 'f0', t: 'Плёнка A0', s: 'мат / глянец / прозрачная', p: 1400, mm: A.A0 }
        ] }
      ],
      extras: [{ id: 'cut', t: 'Плоттерная резка по контуру (от 500 ₽)', p: 500, from: true }, { id: 'lam', t: 'Ламинация (стойкость к воде и царапинам)', p: 0, ask: true }],
      qtyHint: 'Минимальный чек печати — 50 ₽',
      calc: function (s, q, x) { return Math.max(50, s.m.p * q) + (x.cut ? 500 : 0); },
      bleed: true, dpi: [300, 150]
    },
    banner: {
      name: 'Баннер', ready: DAY12, minQty: 1, unit: 'шт', dims: true,
      groups: [
        { id: 'm', label: 'Баннерная ткань', opts: [
          { v: 'raw', t: 'Без обработки', s: '800 ₽ / м²', p: 800 },
          { v: 'proc', t: 'С обработкой', s: 'проклейка, люверсы — 1 100 ₽ / м²', p: 1100 }
        ], def: 'proc' }
      ],
      qtyHint: 'Минимальный заказ — 1 000 ₽',
      calc: function (s, q, x, d) { var area = Math.max(0.1, d.w * d.h); return Math.max(1000, area * s.m.p * q); },
      mm: function (s, d) { return [d.w * 1000, d.h * 1000]; }, dpi: [72, 40]
    },
    poster: {
      name: 'Широкоформатная печать', ready: DAY12, minQty: 1, unit: 'шт',
      groups: [
        { id: 'm', label: 'Материал', opts: [
          { v: 'matte', t: 'Матовая фотобумага' }, { v: 'gloss', t: 'Глянцевая фотобумага' }, { v: 'plain', t: 'Обычная бумага 120 г', s: 'от A2' }
        ] },
        { id: 'f', label: 'Формат', opts: [
          { v: 'A3', t: 'A3', s: '3 шт. в комплекте', mm: A.A3 }, { v: 'A2', t: 'A2', mm: A.A2 }, { v: 'A1', t: 'A1', mm: A.A1 }, { v: 'A0', t: 'A0', mm: A.A0 }
        ], def: 'A1' }
      ],
      table: { matte: { A3: 450, A2: 650, A1: 800, A0: 1200 }, gloss: { A3: 450, A2: 650, A1: 800, A0: 1200 }, plain: { A2: 350, A1: 400, A0: 600 } },
      qtyHint: 'Плакаты, постеры, афиши, чертежи. A3 — комплект из 3 листов',
      calc: function (s, q) { var p = this.table[s.m.v][s.f.v]; if (!p) return null; return p * q; },
      mm: function (s) { return s.f.mm; }, dpi: [150, 90]
    },
    photo: {
      name: 'Печать фотографий', ready: FAST, minQty: 1, unit: 'фото',
      groups: [
        { id: 'f', label: 'Размер', opts: [
          { v: '10x15', t: '10 × 15', mm: [102, 152] }, { v: '15x20', t: '15 × 20', mm: [152, 203] }, { v: '20x30', t: '20 × 30', mm: [203, 305] }
        ] },
        { id: 'pp', label: 'Фотобумага', opts: [{ v: 'gl', t: 'Глянец' }, { v: 'sat', t: 'Сатин (мат.)' }, { v: 'sg', t: 'Полуглянец' }] }
      ],
      table: { gl: { '10x15': 10, '15x20': 25, '20x30': 50 }, sat: { '10x15': 25, '15x20': 45, '20x30': 85 }, sg: { '10x15': 25, '15x20': 45, '20x30': 80 } },
      qtyHint: 'Минимальный чек печати — 50 ₽',
      calc: function (s, q) { return Math.max(50, this.table[s.pp.v][s.f.v] * q); },
      unitPrice: function (s) { return this.table[s.pp.v][s.f.v]; },
      mm: function (s) { return s.f.mm; }, dpi: [250, 150], multi: true
    },
    calendar: {
      name: 'Календари 2027', ready: DAY12, minQty: 1, unit: 'шт',
      groups: [
        { id: 'v', label: 'Вид календаря', opts: [
          { v: 'wall4', t: 'Перекидной настенный A4', s: 'дизайн + изготовление', p: 1450, mm: A.A4 },
          { v: 'wall3', t: 'Перекидной настенный A3', s: 'дизайн + изготовление', p: 1900, mm: A.A3 },
          { v: 'one4', t: 'Одностраничный A4', s: 'от', p: 300, mm: A.A4, from: true },
          { v: 'one3', t: 'Одностраничный A3', s: 'от', p: 500, mm: A.A3, from: true },
          { v: 'house', t: 'Календарь-домик', s: 'настольный, от', p: 600, mm: [200, 100], from: true },
          { v: 'pocket', t: 'Карманный', s: 'от 15 шт., от', p: 30, mm: [70, 100], from: true, min: 15 }
        ] }
      ],
      qtyHint: 'Корпоративные календари с логотипом — скидка на тираж',
      calc: function (s, q) { return s.v.p * q; }
    }
  };
  var READY_URGENT = 'сегодня — по согласованию*';

  function optLabel(o) { return o.t + (o.s ? ' (' + o.s + ')' : ''); }

  /* --------- Проверка макета --------- */
  var OK_EXT = ['jpg', 'jpeg', 'png', 'pdf', 'psd', 'cdr', 'tif', 'tiff', 'ai', 'eps', 'svg', 'heic', 'webp', 'doc', 'docx'];
  function checkFile(file, mm, dpi, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var res = [], ext = (file.name.split('.').pop() || '').toLowerCase(), mb = file.size / 1048576;
      if (OK_EXT.indexOf(ext) === -1) res.push(['bad', 'Формат .' + ext + ' не подходит. Принимаем JPG, PNG, PDF, PSD, CDR, TIFF, AI/EPS']);
      else res.push(['ok', 'Формат ' + ext.toUpperCase() + ' подходит']);
      if (mb > CONFIG.maxFileMb) res.push(['warn', 'Файл ' + mb.toFixed(1) + ' МБ — большой. Пришлите его на ' + CONFIG.email + ' или в Telegram']);
      else res.push(['ok', 'Размер файла ' + (mb < 1 ? Math.round(mb * 1024) + ' КБ' : mb.toFixed(1) + ' МБ') + ' — подходит']);
      if (ext === 'heic') res.push(['warn', 'HEIC — формат iPhone. Примем, но для точной проверки лучше JPG']);
      if (/^(pdf|psd|cdr|ai|eps|svg|tif|tiff)$/.test(ext)) res.push(['info', 'Многослойный/векторный файл — дизайнер проверит его перед печатью бесплатно']);
      if (/^docx?$/.test(ext)) res.push(['info', 'Для печати текста лучше PDF: так сохранятся поля, шрифты и нумерация']);
      if (opts.bleed) res.push(['info', 'Для резки добавьте вылеты по 2 мм с каждой стороны. Нет вылетов — дизайнер поправит']);
      if (!/^(jpe?g|png|webp)$/.test(ext) || !mm) { resolve({ list: res, url: /^(jpe?g|png|webp|svg)$/.test(ext) ? URL.createObjectURL(file) : null }); return; }
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var longPx = Math.max(w, h), shortPx = Math.min(w, h), longMm = Math.max(mm[0], mm[1]), shortMm = Math.min(mm[0], mm[1]);
        var d = Math.min(longPx / (longMm / 25.4), shortPx / (shortMm / 25.4));
        var good = (dpi || [150, 100])[0], okv = (dpi || [150, 100])[1];
        var size = w + '×' + h + ' px';
        if (d >= good) res.push(['ok', 'Разрешение ' + size + ' (≈' + Math.round(d) + ' dpi) — отлично для выбранного формата']);
        else if (d >= okv) res.push(['warn', 'Разрешение ' + size + ' (≈' + Math.round(d) + ' dpi) — допустимо, но лучше файл покрупнее']);
        else res.push(['bad', 'Разрешение ' + size + ' (≈' + Math.round(d) + ' dpi) — мало для этого формата. Возьмите оригинал или выберите формат меньше. Дизайнер может улучшить изображение — от 300 ₽']);
        var r1 = longPx / shortPx, r2 = longMm / shortMm;
        if (Math.abs(r1 - r2) / r2 > 0.12) res.push(['info', 'Пропорции фото отличаются от формата — часть изображения уйдёт в обрез. Согласуем кадрирование с вами']);
        resolve({ list: res, url: url, w: w, h: h, dpi: d });
      };
      img.onerror = function () { resolve({ list: res, url: null }); };
      img.src = url;
    });
  }
  function renderCheck(box, file, r) {
    box.classList.add('is-on');
    var ext = (file.name.split('.').pop() || '').toUpperCase();
    box.innerHTML = '<div class="fcheck__file"><div class="fcheck__thumb"' + (r.url ? ' style="background-image:url(' + r.url + ')"' : '') + '>' + (r.url ? '' : esc(ext)) + '</div><div><div class="fcheck__name">' + esc(file.name) + '</div><div class="fcheck__size">Проверка файла</div></div><button type="button" class="fcheck__rm" aria-label="Удалить файл">×</button></div><ul>' +
      r.list.map(function (x) { return '<li class="is-' + x[0] + '">' + esc(x[1]) + '</li>'; }).join('') + '</ul>';
  }

  /* --------- Мокапы для предпросмотра --------- */
  var TEE = 'M150 40 L205 22 Q250 52 295 22 L350 40 L440 96 L404 168 L360 146 L360 452 Q250 466 140 452 L140 146 L96 168 L60 96 Z';
  function svgTee(color, back) {
    var dark = color === '#1d1f22' || color === '#2b4c9b' || color === '#2f6f55';
    var stroke = dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.14)';
    var neck = back ? '<path d="M205 22 Q250 36 295 22" fill="none" stroke="' + stroke + '" stroke-width="3"/>' : '<path d="M205 22 Q250 70 295 22" fill="none" stroke="' + stroke + '" stroke-width="4"/>';
    return '<svg viewBox="0 0 500 500" aria-hidden="true"><rect width="500" height="500" fill="#F5F6F7"/><path d="' + TEE + '" fill="' + color + '" stroke="' + stroke + '" stroke-width="2"/>' + neck +
      '<path d="M140 146 L140 200 M360 146 L360 200" stroke="' + stroke + '" stroke-width="1.5"/><rect x="172" y="120" width="156" height="210" fill="none" stroke="' + (dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.12)') + '" stroke-dasharray="6 6" rx="4"/></svg>';
  }
  function svgMug(inner) {
    return '<svg viewBox="0 0 500 500" aria-hidden="true"><rect width="500" height="500" fill="#F5F6F7"/><ellipse cx="235" cy="408" rx="150" ry="18" fill="rgba(0,0,0,.08)"/>' +
      '<path d="M372 170 q70 0 70 75 q0 75 -70 75" fill="none" stroke="' + (inner || '#ffffff') + '" stroke-width="26"/><path d="M372 170 q70 0 70 75 q0 75 -70 75" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="26" stroke-dasharray="0"/>' +
      '<rect x="90" y="110" width="290" height="300" rx="18" fill="#fff" stroke="rgba(0,0,0,.1)" stroke-width="2"/><ellipse cx="235" cy="112" rx="145" ry="18" fill="' + (inner || '#eceef0') + '" stroke="rgba(0,0,0,.1)" stroke-width="2"/>' +
      '<rect x="90" y="110" width="40" height="300" fill="url(#g)" opacity=".5"/><defs><linearGradient id="g"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs></svg>';
  }
  function svgCanvas(ratio) {
    var maxW = 330, maxH = 380, w = maxW, h = maxW * ratio; if (h > maxH) { h = maxH; w = h / ratio; }
    var x = (500 - w) / 2, y = (500 - h) / 2 - 10;
    return { svg: '<svg viewBox="0 0 500 500" aria-hidden="true"><rect width="500" height="500" fill="#EDE8E1"/><rect x="0" y="420" width="500" height="80" fill="#E2DBD1"/><rect x="' + (x + 10) + '" y="' + (y + 12) + '" width="' + w + '" height="' + h + '" fill="rgba(0,0,0,.18)" filter="blur(6px)"/><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#fff" stroke="rgba(0,0,0,.08)"/></svg>', box: [x, y, w, h] };
  }

  /* --------- Калькулятор --------- */
  function Calc(root) {
    var self = this;
    this.root = root;
    var list = (root.getAttribute('data-products') || Object.keys(PRODUCTS).join(',')).split(',');
    this.list = list.filter(function (k) { return PRODUCTS[k]; });
    this.key = root.getAttribute('data-default') || this.list[0];
    this.qty = 1; this.file = null; this.check = null; this.urgent = false; this.dims = { w: 3, h: 1 }; this.side = 'front';
    this.tabs = $('.calc__tabs', root);
    this.body = $('.calc__body', root);
    this.sum = $('.summary', root);
    if (this.list.length < 2) this.tabs.hidden = true;
    this.tabs.innerHTML = this.list.map(function (k) {
      var p = PRODUCTS[k]; return '<button type="button" class="calc__tab" role="tab" data-k="' + k + '" aria-selected="false"><span aria-hidden="true">' + p.icon + '</span>' + p.name + '</button>';
    }).join('');
    this.tabs.addEventListener('click', function (e) { var b = e.target.closest('.calc__tab'); if (b) { self.select(b.dataset.k); goal('view_product', { product: b.dataset.k }); } });
    root.addEventListener('change', function () { goal('calculator_start', null, true); self.update(); });
    root.addEventListener('input', function (e) { if (e.target.matches('.dims input,.qty input')) self.update(); });
    root.addEventListener('click', function (e) {
      var q = e.target.closest('[data-q]');
      if (q) { goal('calculator_start', null, true); self.qty = Math.max(1, (parseInt($('.qty input', root).value, 10) || 1) + parseInt(q.dataset.q, 10)); $('.qty input', root).value = self.qty; self.update(); }
      var rm = e.target.closest('.fcheck__rm'); if (rm) { self.setFile(null); }
      var pv = e.target.closest('[data-side]'); if (pv) { self.side = pv.dataset.side; self.renderPreview(); }
      if (e.target.closest('[data-calc-order]')) { goal('calculator_complete', { product: self.key, price: self.total }); openOrder(self.summaryText(), self.file, PRODUCTS[self.key].name); }
      if (e.target.closest('[data-calc-msgr]')) { goal('calculator_complete', { product: self.key, channel: 'messenger' }); openMsgr(self.summaryText()); }
      var dz = e.target.closest('[data-design]'); if (dz) openOrder('Нужна помощь дизайнера с макетом.\n' + self.summaryText(), self.file, 'Дизайн макета');
    });
    this.select(this.key);
    // мобильная панель с ценой
    var bar = document.createElement('div'); bar.className = 'cbar'; bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<div class="cbar__p"><b></b><span></span></div><button type="button" class="btn btn--primary" tabindex="-1">Заказать</button>';
    document.body.appendChild(bar); this.bar = bar;
    this.update();
    bar.querySelector('button').addEventListener('click', function () { goal('calculator_complete', { product: self.key, price: self.total }); openOrder(self.summaryText(), self.file, PRODUCTS[self.key].name); });
    if ('IntersectionObserver' in window) {
      var inMain = false, inSum = false;
      var sync = function () { bar.classList.toggle('is-on', inMain && !inSum && window.innerWidth < 1024); };
      new IntersectionObserver(function (en) { inMain = en[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe($('.calc__main', root));
      new IntersectionObserver(function (en) { inSum = en[0].isIntersecting; sync(); }, { threshold: 0.25 }).observe($('.summary__total', root));
    }
  }
  Calc.prototype.select = function (k) {
    var self = this, p = PRODUCTS[k]; this.key = k; this.qty = Math.max(1, p.minQty || 1);
    $$('.calc__tab', this.tabs).forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.k === k)); });
    var h = '';
    p.groups.forEach(function (g, gi) {
      h += '<fieldset class="calc__step" data-g="' + g.id + '" style="border:0;padding:0;margin-inline:0"><legend class="calc__label">' + (gi + 1) + '. ' + g.label + '</legend><div class="opts">';
      g.opts.forEach(function (o, i) {
        var checked = g.def != null ? String(o.v) === String(g.def) : i === 0;
        h += '<label class="opt' + (g.type === 'color' ? ' opt--color' : '') + '"><input type="radio" name="' + k + '_' + g.id + '" value="' + o.v + '"' + (checked ? ' checked' : '') + '><span' + (o.sw ? ' style="--sw:' + o.sw + '"' : '') + '>' + o.t + (o.s && g.type !== 'color' ? '<small>' + o.s + '</small>' : '') + '</span></label>';
      });
      h += '</div></fieldset>';
    });
    var n = p.groups.length + 1;
    if (p.dims) {
      h += '<div class="calc__step"><div class="calc__label">' + (n++) + '. Размер, м</div><div class="dims"><label>Ширина<input type="number" inputmode="decimal" min="0.1" step="0.1" name="w" value="' + this.dims.w + '"></label><label>Высота<input type="number" inputmode="decimal" min="0.1" step="0.1" name="h" value="' + this.dims.h + '"></label></div></div>';
    }
    if (!p.noQty) {
      h += '<div class="calc__step"><div class="calc__label">' + (n++) + '. Количество, ' + p.unit + '</div><div class="qty-row"><div class="qty"><button type="button" data-q="-1" aria-label="Меньше">−</button><input type="number" inputmode="numeric" min="1" value="' + this.qty + '" aria-label="Количество"><button type="button" data-q="1" aria-label="Больше">+</button></div><span class="qty-hint">' + (p.qtyHint || '') + '</span></div></div>';
    } else if (p.qtyHint) {
      h += '<p class="qty-hint" style="margin-top:12px">' + p.qtyHint + '</p>';
    }
    if (p.extras) {
      h += '<div class="calc__step"><div class="calc__label">' + (n++) + '. Дополнительно</div><div class="calc__extra">' + p.extras.map(function (x) { return '<label class="check"><input type="checkbox" name="x_' + x.id + '">' + x.t + '</label>'; }).join('') + '</div></div>';
    }
    h += '<div class="calc__step"><div class="calc__label">' + (n++) + '. Срок</div><div class="opts"><label class="opt"><input type="radio" name="' + k + '_urg" value="0" checked><span>Стандартный<small>' + p.ready.replace('*', '') + '</small></span></label><label class="opt"><input type="radio" name="' + k + '_urg" value="1"><span>Срочно<small>сегодня, если позволяет загрузка</small></span></label></div></div>';
    h += '<div class="calc__step"><div class="calc__label">' + (n++) + '. Макет или фото <em>необязательно</em></div><label class="drop"><input type="file" accept=".jpg,.jpeg,.png,.pdf,.psd,.cdr,.tif,.tiff,.ai,.eps,.svg,.heic,.webp"><b>Загрузите файл или перетащите сюда</b><small>JPG, PNG, PDF, PSD, CDR · до ' + CONFIG.maxFileMb + ' МБ · проверим разрешение сразу</small></label><div class="fcheck" aria-live="polite"></div><div class="calc__help">Нет макета? <button type="button" data-design>Поможем с дизайном — от 300 ₽</button></div></div>';
    this.body.innerHTML = h;
    var drop = $('.drop', this.body), input = $('input[type=file]', drop);
    input.addEventListener('change', function () { if (input.files[0]) self.setFile(input.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; if (f) self.setFile(f); });
    if (this.file) this.setFile(this.file); else this.update();
  };
  Calc.prototype.state = function () {
    var p = PRODUCTS[this.key], s = {}, root = this.body, k = this.key;
    p.groups.forEach(function (g) {
      var inp = $('input[name="' + k + '_' + g.id + '"]:checked', root);
      var val = inp ? inp.value : g.opts[0].v;
      s[g.id] = g.opts.filter(function (o) { return String(o.v) === String(val); })[0] || g.opts[0];
      var fs = $('[data-g="' + g.id + '"]', root); if (fs && g.showIf) fs.hidden = !g.showIf(s);
    });
    var x = {}; (p.extras || []).forEach(function (e) { var c = $('input[name="x_' + e.id + '"]', root); x[e.id] = c && c.checked; });
    var qi = $('.qty input', root); if (qi) this.qty = Math.max(1, Math.min(100000, parseInt(qi.value, 10) || 1));
    var w = $('.dims input[name=w]', root), hh = $('.dims input[name=h]', root);
    if (w) this.dims = { w: Math.max(0.1, parseFloat(String(w.value).replace(',', '.')) || 0.1), h: Math.max(0.1, parseFloat(String(hh.value).replace(',', '.')) || 0.1) };
    var u = $('input[name="' + k + '_urg"]:checked', root); this.urgent = !!(u && u.value === '1');
    return { s: s, x: x };
  };
  Calc.prototype.mm = function (st) {
    var p = PRODUCTS[this.key];
    if (p.mm) return p.mm(st.s, this.dims);
    var g = p.groups[0]; var o = st.s[g.id]; return o && o.mm;
  };
  Calc.prototype.setFile = function (f) {
    var self = this, box = $('.fcheck', this.body);
    this.file = f;
    if (!f) { this.check = null; box.classList.remove('is-on'); box.innerHTML = ''; var i = $('input[type=file]', this.body); if (i) i.value = ''; this.update(); return; }
    goal('upload_file', { product: this.key });
    var st = this.state(), p = PRODUCTS[this.key];
    checkFile(f, this.mm(st), p.dpi, { bleed: p.bleed }).then(function (r) { self.check = r; renderCheck(box, f, r); self.update(); });
  };
  Calc.prototype.update = function () {
    var p = PRODUCTS[this.key], st = this.state(), s = st.s;
    var minQ = (s.v && s.v.min) || p.minQty || 1;
    if (this.qty < minQ) { this.qty = minQ; var qi = $('.qty input', this.body); if (qi) qi.value = minQ; }
    var total = p.calc.call(p, s, this.qty, st.x, this.dims);
    var from = Object.keys(s).some(function (k) { return s[k].from; }) || (p.extras || []).some(function (e) { return e.from && st.x[e.id]; });
    this.total = total;
    var rows = [];
    p.groups.forEach(function (g) { var fs = g.showIf ? g.showIf(s) : true; if (fs) rows.push([g.label, optLabel(s[g.id])]); });
    if (p.dims) rows.push(['Размер', String(this.dims.w).replace('.', ',') + ' × ' + String(this.dims.h).replace('.', ',') + ' м (' + (this.dims.w * this.dims.h).toFixed(2).replace('.', ',') + ' м²)']);
    if (!p.noQty) rows.push(['Количество', this.qty + ' ' + p.unit]);
    (p.extras || []).forEach(function (e) { if (st.x[e.id]) rows.push(['Доп.', e.t]); });
    rows.push(['Срок', this.urgent ? 'Срочно' : 'Стандартный']);
    if (this.file) rows.push(['Файл', this.file.name.length > 22 ? this.file.name.slice(0, 20) + '…' : this.file.name]);
    this.rows = rows;
    var unit = p.unitPrice ? p.unitPrice(s) : (total && !p.noQty && this.qty > 1 ? total / this.qty : null);
    var priceHtml = total == null ? '<span style="font-size:24px">Цена по запросу</span>' : (from ? '<small>от </small>' : '≈ ') + fmt(total) + ' <small>₽</small>';
    var sum = this.sum;
    $('.summary__name', sum).textContent = p.name;
    $('dl', sum).innerHTML = rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
    $('.summary__price', sum).innerHTML = priceHtml;
    $('.summary__unit', sum).textContent = unit ? '≈ ' + (unit % 1 ? unit.toFixed(1).replace('.', ',') : fmt(unit)) + ' ₽ за ' + (p.unit === 'шт' ? 'штуку' : p.unit) : '';
    $('.ready', sum).textContent = 'Готовность: ' + (this.urgent ? READY_URGENT : p.ready);
    if (this.bar) { $('b', this.bar).innerHTML = priceHtml.replace(/<small>|<\/small>/g, ''); $('span', this.bar).textContent = p.name + ' · ' + (this.urgent ? 'срочно' : p.ready.replace('*', '')); }
    this.renderPreview();
  };
  Calc.prototype.renderPreview = function () {
    var p = PRODUCTS[this.key], box = $('.preview', this.sum);
    if (!p.preview) { box.classList.remove('is-on'); box.innerHTML = ''; return; }
    box.classList.add('is-on');
    var st = this.state(), s = st.s, url = this.check && this.check.url, html = '', pos;
    if (p.preview === 'tshirt') {
      var color = (s.color && s.color.sw) || '#fff'; if (color.indexOf('gradient') > -1) color = '#d9d4cc';
      html = svgTee(color, this.side === 'back');
      var big = s.v && /a3/.test(s.v.v);
      pos = big ? [32, 22, 36, 46] : [36, 25, 28, 36];
      html += '<div class="preview__tabs" role="group" aria-label="Сторона"><button type="button" data-side="front" aria-pressed="' + (this.side === 'front') + '">Перед</button><button type="button" data-side="back" aria-pressed="' + (this.side === 'back') + '">Спина</button></div>';
      if (this.side === 'back' && s.v && /-1$/.test(s.v.v)) url = null;
    } else if (p.preview === 'mug') {
      html = svgMug(s.v && s.v.v === 'color' && s.inner ? s.inner.sw : null);
      pos = [24, 30, 46, 46];
    } else if (p.preview === 'canvas') {
      var r = s.f.mm[1] / s.f.mm[0];
      if (this.check && this.check.w) { r = this.check.h > this.check.w ? Math.max(r, 1 / r) : Math.min(r, 1 / r); }
      var c = svgCanvas(r); html = c.svg; pos = [c.box[0] / 5, c.box[1] / 5, c.box[2] / 5, c.box[3] / 5];
    }
    if (url) {
      var fit = p.preview === 'canvas' ? 'cover' : 'contain';
      html += '<img class="preview__img" alt="" src="' + url + '" style="left:' + pos[0] + '%;top:' + pos[1] + '%;width:' + pos[2] + '%;height:' + pos[3] + '%;object-fit:' + fit + (p.preview === 'tshirt' ? ';mix-blend-mode:multiply' : '') + '">';
      html += '<span class="preview__cap">Так будет выглядеть ваш заказ</span>';
    } else html += '<span class="preview__cap">Загрузите фото — покажем на изделии</span>';
    if (p.preview === 'tshirt' && s.color && s.color.v !== 'white') html = html.replace('mix-blend-mode:multiply', '');
    box.innerHTML = html;
  };
  Calc.prototype.summaryText = function () {
    var p = PRODUCTS[this.key], t = p.name + '\n';
    (this.rows || []).forEach(function (r) { t += r[0] + ': ' + r[1] + '\n'; });
    t += 'Предварительно: ' + (this.total == null ? 'по запросу' : fmt(this.total) + ' ₽');
    return t;
  };
  var calcs = $$('[data-calc]').map(function (n) { return new Calc(n); });
  if (fab && calcs[0] && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { fab.style.visibility = en[0].isIntersecting ? 'hidden' : ''; }, { threshold: 0.1 }).observe(calcs[0].root);
  }

  /* Кнопки «Рассчитать» в карточках → калькулятор с нужным товаром */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-calc-open]'); if (!b) return;
    var c = calcs[0];
    if (!c) return;
    e.preventDefault();
    var k = b.getAttribute('data-calc-open');
    if (k && PRODUCTS[k] && c.list.indexOf(k) > -1) c.select(k);
    c.root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    goal('view_product', { product: k });
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-upload]'); if (!b) return;
    var c = calcs[0]; if (!c) { e.preventDefault(); openOrder('', null, 'Загрузка макета'); return; }
    e.preventDefault();
    c.root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () { var i = $('.drop input', c.root); if (i) i.click(); }, reduced ? 0 : 500);
  });

  /* =========================================================
     ЗАЯВКА
     ========================================================= */
  var orderModal = $('#order'), orderFile = null;
  function openOrder(summary, file, title) {
    if (!orderModal) return;
    var form = $('form', orderModal);
    $('.order-form', orderModal).hidden = false; $('.order-done', orderModal).hidden = true;
    $('.osum', orderModal).textContent = summary || '';
    form.elements.summary.value = summary || '';
    form.elements.product.value = title || '';
    $('h2', orderModal).textContent = title ? 'Заявка: ' + title : 'Оформить заявку';
    orderFile = file || null;
    var fl = $('.order-file', orderModal);
    fl.hidden = !!file;
    if (file) $('.order-attached', orderModal).textContent = 'Прикреплён файл: ' + file.name; else $('.order-attached', orderModal).textContent = '';
    openModal('order');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]'); if (!b) return; e.preventDefault();
    openOrder(b.getAttribute('data-summary') || '', null, b.getAttribute('data-order') || '');
  });

  function maskPhone(inp) {
    inp.addEventListener('input', function () {
      var d = inp.value.replace(/\D/g, '');
      if (!d) { inp.value = ''; return; }
      if (d[0] === '8') d = '7' + d.slice(1); if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var r = '+7';
      if (d.length > 1) r += ' (' + d.slice(1, 4);
      if (d.length >= 4) r += ')';
      if (d.length > 4) r += ' ' + d.slice(4, 7);
      if (d.length > 7) r += '-' + d.slice(7, 9);
      if (d.length > 9) r += '-' + d.slice(9, 11);
      inp.value = r;
    });
  }
  $$('input[type=tel]').forEach(maskPhone);

  function orderNo() { return '163-' + String(Date.now()).slice(-5); }

  function submitForm(form, extraFile) {
    var name = form.elements.name, phone = form.elements.phone, ok = true;
    [name, phone].forEach(function (i) { if (i) i.classList.remove('is-err'); });
    if (name && name.value.trim().length < 2) { name.classList.add('is-err'); ok = false; }
    if (phone && phone.value.replace(/\D/g, '').length < 11) { phone.classList.add('is-err'); ok = false; }
    var cons = form.elements.consent; if (cons && !cons.checked) { ok = false; toast('Подтвердите согласие на обработку данных'); }
    if (!ok) { if (name && name.classList.contains('is-err')) name.focus(); else if (phone) phone.focus(); return Promise.reject('invalid'); }
    if (form.elements.website && form.elements.website.value) return Promise.resolve({ ok: true, num: orderNo() }); // honeypot
    var fd = new FormData(form);
    if (extraFile) fd.append('files[]', extraFile, extraFile.name);
    fd.append('page', location.href);
    fd.append('ref', document.referrer || '');
    var num = orderNo(); fd.append('order_no', num);
    var btn = form.querySelector('[type=submit]'); if (btn) { btn.disabled = true; btn._t = btn.textContent; btn.textContent = 'Отправляем…'; }
    goal('form_submit', { form: form.getAttribute('data-form') || 'order' });
    return fetch(ROOT + CONFIG.endpoint, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'fetch' } })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error('bad'); goal('order_created'); return { ok: true, num: j.num || num }; })
      .catch(function () { return { ok: false, num: num, text: formText(form, num) }; })
      .then(function (res) { if (btn) { btn.disabled = false; btn.textContent = btn._t; } return res; });
  }
  function formText(form, num) {
    var f = form.elements, t = 'Здравствуйте! Заявка с сайта №' + num + '\n';
    if (f.product && f.product.value) t += f.product.value + '\n';
    if (f.summary && f.summary.value) t += f.summary.value + '\n';
    if (f.name) t += 'Имя: ' + f.name.value + '\n';
    if (f.phone) t += 'Телефон: ' + f.phone.value + '\n';
    if (f.channel) { var c = form.querySelector('[name=channel]:checked'); if (c) t += 'Связаться: ' + c.value + '\n'; }
    if (f.comment && f.comment.value) t += 'Комментарий: ' + f.comment.value + '\n';
    return t;
  }
  function showDone(container, res) {
    var fallback = !res.ok;
    container.innerHTML = '<div class="done"><div class="done__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
      (fallback
        ? '<h2>Почти готово</h2><p class="modal__lead">Сервер заявок временно недоступен. Мы скопировали текст заявки — отправьте его нам в удобный мессенджер, ответим в рабочее время.</p><span class="done__num">№ ' + res.num + '</span><div class="msgr__go" style="margin-top:18px"><a class="btn btn--primary" target="_blank" rel="noopener" href="' + CONFIG.telegram + '">Telegram</a><a class="btn btn--ghost" href="mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Заявка №' + res.num) + '&body=' + encodeURIComponent(res.text) + '">E-mail</a></div><a class="btn btn--ghost btn--block" style="margin-top:10px" href="tel:' + CONFIG.phone + '">Позвонить ' + CONFIG.phoneView + '</a>'
        : '<h2>Заявка получена</h2><span class="done__num">№ ' + res.num + '</span><p class="modal__lead" style="margin-top:14px">Специалист проверит макет и подтвердит:</p><ul><li>стоимость</li><li>срок изготовления</li><li>возможность печати</li></ul><p class="modal__lead" style="margin-top:14px">Ответим в выбранном канале связи в рабочее время: ежедневно 10:00–20:00.</p><button type="button" class="btn btn--dark btn--block" style="margin-top:20px" data-close>Хорошо</button>') + '</div>';
    if (fallback) copy(res.text);
  }
  $$('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var isOrder = form.closest('#order');
      submitForm(form, isOrder ? orderFile : null).then(function (res) {
        if (isOrder) { $('.order-form', orderModal).hidden = true; var d = $('.order-done', orderModal); d.hidden = false; showDone(d, res); }
        else { var box = form.parentNode; showDone(box, res); box.querySelector('.done').style.color = 'inherit'; }
        form.reset();
      }, function () {});
    });
  });

  /* =========================================================
     МЕССЕНДЖЕРЫ: «Здравствуйте! Хочу заказать…»
     ========================================================= */
  var msgr = $('#msgr');
  function openMsgr(preset) {
    if (!msgr) return;
    msgr._preset = preset || '';
    $$('input[name=want]', msgr).forEach(function (i) { i.checked = false; });
    updateMsgr(); openModal('msgr');
  }
  function msgrText() {
    var w = $$('input[name=want]:checked', msgr).map(function (i) { return i.value; });
    var t = 'Здравствуйте! ';
    if (msgr._preset) t += 'Хочу заказать:\n' + msgr._preset;
    else t += w.length ? 'Хочу заказать: ' + w.join(', ').toLowerCase() + '.' : 'Хочу сделать заказ.';
    t += '\n(с сайта print163.ru)';
    return t;
  }
  function updateMsgr() { var p = $('.osum', msgr); if (p) p.textContent = msgrText(); }
  if (msgr) {
    msgr.addEventListener('change', updateMsgr);
    msgr.addEventListener('click', function (e) {
      var a = e.target.closest('[data-go]'); if (!a) return;
      var text = msgrText(), go = a.getAttribute('data-go');
      if (go === 'mail') { a.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Заказ с сайта') + '&body=' + encodeURIComponent(text); return; }
      copy(text); toast('Текст скопирован — вставьте его в чат. Файл можно приложить там же');
    });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-msgr]'); if (b) { e.preventDefault(); openMsgr(''); } });

  /* =========================================================
     ПОДБОР ПОДАРКА
     ========================================================= */
  var GIFTS = [
    ['Кружка с фото', 600, 'love parents colleagues friend kid', 'mug'],
    ['Цветная кружка с фото', 850, 'love friend kid', 'mug'],
    ['Виниловый магнит с фото A4', 400, 'parents love friend', ''],
    ['Акриловый магнит', 200, 'colleagues friend kid', ''],
    ['Пазл «Сердце» с фото', 550, 'love parents', ''],
    ['Пазл картонный с фото', 600, 'kid parents friend', ''],
    ['Магнитный пазл A4', 700, 'kid love', ''],
    ['Календарь-домик с фото', 600, 'colleagues parents', 'calendar'],
    ['Перекидной календарь A4 с вашими фото', 1450, 'parents colleagues love', 'calendar'],
    ['Подушка бархат с фото', 1400, 'love kid parents', ''],
    ['Инстаподушка', 1490, 'love friend kid', ''],
    ['Футболка с принтом', 1500, 'love friend kid colleagues', 'tshirt'],
    ['Холст A3 с вашей фотографией', 2000, 'parents love', 'canvas'],
    ['Холст A2 на подрамнике', 2800, 'parents love', 'canvas'],
    ['Холст A1 — семейный портрет', 3600, 'parents love', 'canvas'],
    ['Фотокнига', 400, 'love parents kid', ''],
    ['Бизнес-сувениры с логотипом', 150, 'colleagues', ''],
    ['Значки и брелоки с УФ-печатью', 500, 'colleagues kid friend', '']
  ];
  var picker = $('[data-picker]');
  if (picker) {
    var upd = function () {
      var b = ($('input[name=budget]:checked', picker) || {}).value || '1000';
      var who = ($('input[name=who]:checked', picker) || {}).value || 'love';
      var lo = b === '1000' ? 0 : b === '2000' ? 0 : 2000, hi = b === '1000' ? 1000 : b === '2000' ? 2000 : 99999;
      var list = GIFTS.filter(function (g) { return g[1] >= lo && g[1] <= hi && g[2].indexOf(who) > -1; })
        .sort(function (a, c) { return b === '1000' ? c[1] - a[1] : (b === '2000' ? c[1] - a[1] : a[1] - c[1]); }).slice(0, 5);
      var res = $('.picker__res', picker);
      res.innerHTML = '<b>Подойдут:</b><ul>' + (list.length ? list.map(function (g) { return '<li><span>' + g[0] + '</span><b>' + (g[1] < 500 ? 'от ' : '') + fmt(g[1]) + ' ₽</b></li>'; }).join('') : '<li>Подберём индивидуально — напишите нам</li>') + '</ul>' +
        '<button type="button" class="btn btn--primary btn--block" style="margin-top:14px" data-order="Подбор подарка" data-summary="Подарок: ' + esc(($('input[name=who]:checked', picker) || {}).dataset ? $('input[name=who]:checked', picker).dataset.t : '') + ', бюджет ' + esc(($('input[name=budget]:checked', picker) || {}).dataset ? $('input[name=budget]:checked', picker).dataset.t : '') + '">Заказать подарок</button>';
    };
    picker.addEventListener('change', upd); upd();
  }

  /* =========================================================
     ПРИМЕРЫ РАБОТ: фильтр и просмотр
     ========================================================= */
  var filters = $('.filters');
  if (filters) {
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.filter'); if (!b) return;
      $$('.filter', filters).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var c = b.dataset.f;
      $$('.work').forEach(function (w) { w.hidden = c !== 'all' && (w.dataset.cat || '').indexOf(c) === -1; });
    });
  }
  var lb = $('#lightbox');
  document.addEventListener('click', function (e) {
    var w = e.target.closest('.work'); if (!w || !lb) return;
    var img = $('img', w);
    $('img', lb).src = img.currentSrc || img.src; $('img', lb).alt = img.alt;
    $('p', lb).textContent = ($('figcaption', w) || {}).textContent || '';
    openModal('lightbox');
  });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('work')) { e.preventDefault(); e.target.click(); } });

  /* =========================================================
     КАРТА (ленивая загрузка)
     ========================================================= */
  var map = $('[data-map]');
  if (map) {
    var load = function () {
      if (map._l) return; map._l = 1;
      var f = document.createElement('iframe');
      f.src = 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent('Самара, улица Ново-Вокзальная, 146А') + '&z=17';
      f.title = 'Fancy Look на карте: Самара, Ново-Вокзальная 146А'; f.loading = 'lazy'; f.allowFullscreen = true;
      map.innerHTML = ''; map.appendChild(f);
    };
    map.addEventListener('click', load);
    if ('IntersectionObserver' in window && !saveData) {
      var mio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { load(); mio.disconnect(); } }, { rootMargin: '200px' });
      mio.observe(map);
    }
  }

  /* Посадочная: цель просмотра товара */
  var pv = document.body.getAttribute('data-product');
  if (pv) goal('view_product', { product: pv }, true);

  window.PRINT163 = { goal: goal, openOrder: openOrder, CONFIG: CONFIG };
})();
