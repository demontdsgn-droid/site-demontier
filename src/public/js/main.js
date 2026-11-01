(function () {
  var $ = function (id) { return document.getElementById(id); };
  // abas: Início, Serviços e Sobre ficam no mesmo arquivo e trocam pelo endereço (#servicos, #sobre)
  var VIEWS = ['inicio', 'servicos', 'sobre', 'portfolio'];
  var ANCHOR_VIEW = { projetos: 'portfolio' };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var panes = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var currentView = null;

  function show(v) {
    currentView = v;
    panes.forEach(function (p) { p.hidden = p.getAttribute('data-view') !== v; });
    navLinks.forEach(function (a) {
      if (a.getAttribute('data-nav') === v) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  function apply() {
    var h = (location.hash || '').slice(1);
    var view = VIEWS.indexOf(h) > -1 ? h : ANCHOR_VIEW[h];
    if (view) show(view);
    else if (!currentView) show('inicio');
    var target = VIEWS.indexOf(h) > -1 || !h ? null : document.getElementById(h);
    if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    else window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', apply);
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (a && a.getAttribute('href') === (location.hash || '#inicio')) { e.preventDefault(); apply(); }
  });
  apply();

  // filtros do portfólio
  (function () {
    var btns = document.querySelectorAll('.filter'), tiles = document.querySelectorAll('#port-grid .tile'), empty = $('port-empty');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter'), n = 0;
        Array.prototype.forEach.call(btns, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        Array.prototype.forEach.call(tiles, function (t) { var ok = f === 'todos' || t.getAttribute('data-cat') === f; t.hidden = !ok; if (ok) n++; });
        empty.hidden = n > 0;
      });
    });
  })();

  // carrossel da home
  (function () {
    var track = $('car-track'); if (!track) return;
    var slides = track.querySelectorAll('.slide'), count = $('car-count');
    var timer = null, paused = false;
    function step() { var g = parseFloat(getComputedStyle(track).columnGap) || 16; return slides[0].getBoundingClientRect().width + g; }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function update() {
      var i = Math.min(slides.length - 1, Math.round(track.scrollLeft / step()));
      count.textContent = pad(i + 1) + ' / ' + pad(slides.length);
    }
    function atEnd() { return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; }
    function go(dir) {
      var b = reduce ? 'auto' : 'smooth';
      if (dir > 0) { if (atEnd()) track.scrollTo({ left: 0, behavior: b }); else track.scrollBy({ left: step(), behavior: b }); }
      else { if (track.scrollLeft < 4) track.scrollTo({ left: track.scrollWidth, behavior: b }); else track.scrollBy({ left: -step(), behavior: b }); }
    }
    $('car-next').addEventListener('click', function () { go(1); });
    $('car-prev').addEventListener('click', function () { go(-1); });
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { track.addEventListener(ev, function () { paused = false; }); });
    if (!reduce) timer = setInterval(function () { if (!paused && currentView === 'inicio' && !document.hidden) go(1); }, 4500);
    update();
  })();

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-servico]') : null;
    if (!a) return;
    var sel = $('f-tipo'), nome = a.getAttribute('data-servico');
    for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].text === nome) { sel.selectedIndex = i; break; } }
  });
  var header = $('header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  $('year').textContent = '© ' + new Date().getFullYear() + ' Demont. Todos os direitos reservados.';

  function copyText(text, el, done) {
    function fallback() {
      try { el.focus(); el.select(); } catch (e) {}
      done(false);
    }
    try {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } catch (e) { fallback(); }
  }

  var copyBtn = $('copy-email');
  copyBtn.addEventListener('click', function () {
    var range = document.createRange();
    range.selectNodeContents($('email-text'));
    copyText($('email-text').textContent, { focus: function(){}, select: function () {
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    } }, function (ok) {
      var ico = $('copy-email-ico'), label = $('copy-email-label'), iconCopy = ico.innerHTML;
      label.textContent = ok ? 'E-mail copiado' : 'Selecionado, copie com Ctrl+C';
      if (ok) ico.innerHTML = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
      setTimeout(function () { label.textContent = 'Copiar e-mail'; ico.innerHTML = iconCopy; }, 2500);
    });
  });

  $('brief').addEventListener('submit', function (e) {
    e.preventDefault();
    var nome = $('f-nome').value.trim();
    var tipo = $('f-tipo').value;
    var texto = 'Olá, Rafaela! ' + (nome ? 'Meu nome é ' + nome + '. ' : '') +
      'Tenho interesse em: ' + tipo + '.' +
      '\n\nPode me passar um orçamento?';
    $('out').value = texto;
    $('result').hidden = false;
    $('status').textContent = '';
    $('out').focus();
  });

  // Coloque o número com país e DDD, só dígitos. Exemplo: '5511999999999'
  var WHATSAPP = '5511994164585';

  function openWhats(text, noteEl) {
    if (!WHATSAPP) {
      noteEl.textContent = 'O número do WhatsApp ainda não foi configurado neste site.';
      return;
    }
    noteEl.textContent = '';
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
  $('wa-open').addEventListener('click', function () {
    openWhats('Olá, Rafaela! Vi o seu site e quero conversar sobre um projeto.', $('wa-note'));
  });
  $('wa-send').addEventListener('click', function () {
    openWhats($('out').value, $('status'));
  });

  $('copy-msg').addEventListener('click', function () {
    copyText($('out').value, $('out'), function (ok) {
      $('status').textContent = ok ? 'Mensagem copiada.' : 'Não foi possível copiar sozinho. O texto está selecionado, use Ctrl+C.';
    });
  });
})();
