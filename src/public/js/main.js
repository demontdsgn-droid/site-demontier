(function () {
  var $ = function (id) { return document.getElementById(id); };
  // abas: Início, Serviços e Sobre ficam no mesmo arquivo e trocam pelo endereço (#servicos, #sobre)
  var VIEWS = ['inicio', 'servicos', 'sobre', 'portfolio', 'privacidade'];
  var ANCHOR_VIEW = { projetos: 'portfolio' };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var panes = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var currentView = null;

  var SITE = 'https://www.demontdesign.com.br';
  var META = {
    inicio: ['Demont Design | Identidade visual e estratégia digital', 'Identidade visual e estratégia digital para marcas, por Rafaela Demontier, designer gráfica, com atendimento em São Paulo e no Vale do Paraíba.'],
    servicos: ['Serviços | Demont Design', 'Identidade visual, personalizados, estratégia digital e captação de conteúdo para a sua marca. Conheça os serviços da Demont.'],
    sobre: ['Sobre | Rafaela Demontier, designer gráfica | Demont Design', 'Rafaela Demontier é designer gráfica e atende São Paulo e o Vale do Paraíba, com identidade visual e presença de marcas nas redes sociais.'],
    privacidade: ['Política de privacidade | Demont Design', 'Como a Demont Design trata os dados de quem visita o site e entra em contato.'],
    portfolio: ['Portfólio | Demont Design', 'Projetos de identidade visual e redes sociais para o Negócio Lotado, a Aline Naves, a Free Tecnologia e a CB Projeto Estrutural.']
  };
  function urlFor(v) { return v === 'inicio' ? '/' : '/' + v + '/'; }
  function pathView() {
    var p = location.pathname.replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '');
    return p === '' ? 'inicio' : (VIEWS.indexOf(p) > -1 ? p : null);
  }
  function setMeta(v) {
    var m = META[v]; if (!m) return;
    document.title = m[0];
    var set = function (sel, attr, val) { var el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
    set('meta[name="description"]', 'content', m[1]);
    set('link[rel="canonical"]', 'href', SITE + urlFor(v));
    set('meta[property="og:title"]', 'content', m[0]);
    set('meta[property="og:description"]', 'content', m[1]);
    set('meta[property="og:url"]', 'content', SITE + urlFor(v));
  }
  function show(v) {
    currentView = v;
    panes.forEach(function (p) { p.hidden = p.getAttribute('data-view') !== v; });
    navLinks.forEach(function (a) {
      if (a.getAttribute('data-nav') === v) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    setMeta(v);
  }
  function apply() {
    var h = (location.hash || '').slice(1);
    var legacy = VIEWS.indexOf(h) > -1 ? h : ANCHOR_VIEW[h];
    var view = legacy || (currentView ? null : (pathView() || 'inicio'));
    if (legacy && history.replaceState) history.replaceState(null, '', urlFor(legacy));
    if (view) show(view);
    var target = legacy || !h ? null : document.getElementById(h);
    if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    else window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', apply);
  window.addEventListener('popstate', function () { show(pathView() || 'inicio'); window.scrollTo(0, 0); });
  // links entre as páginas (/servicos/, /sobre/...) trocam a aba sem recarregar; sem JS, abrem a página própria
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="/"]') : null;
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var m = /^\/(servicos|sobre|portfolio|privacidade)?\/?$/.exec(a.getAttribute('href'));
    if (!m || !history.pushState) return;
    e.preventDefault();
    var v = m[1] || 'inicio';
    if (pathView() !== v) history.pushState(null, '', urlFor(v));
    show(v);
    window.dispatchEvent(new Event('hashchange-close'));
    window.scrollTo(0, 0);
  });
  apply();


  // projetos dos clientes: cada um abre uma página com a galeria (adicione imagens em "imgs")
  (function () {
    var P = '/img/portfolio/';
    var CASES = {
      nl: { name: 'Negócio Lotado', niche: 'Marketing', imgs: [
        [P + 'negocio-lotado-identidade.jpg', 'Caneca, cartão, caderno e caneta do Negócio Lotado em laranja e preto', 'Brindes e papelaria'],
        [P + 'negocio-lotado-cartoes.jpg', 'Cartões de visita laranja e branco do Negócio Lotado sobre concreto', 'Cartão de visita'],
        [P + 'negocio-lotado-brindes.jpg', 'Garrafa térmica e boné bege com a logo do Negócio Lotado bordada em laranja', 'Garrafa e boné'],
        [P + 'negocio-lotado-cracha.jpg', 'Crachá preto com cordão estampado e a logo do Negócio Lotado em laranja', 'Crachá'],
        [P + 'negocio-lotado-instagram.jpg', 'Post do Instagram @negociolotado com o símbolo NL em branco sobre fundo laranja', 'Redes sociais'],
        [P + 'negocio-lotado.jpg', 'Papelaria laranja e branca com a logo do Negócio Lotado', 'Papelaria']] },
      aline: { name: 'Aline Naves', niche: 'Comportamento e alta performance', imgs: [
        [P + 'aline-naves-simbolo.jpg', 'Símbolo da Aline Naves em relevo dourado fosco sobre papel preto', 'Símbolo'],
        [P + 'aline-naves.jpg', 'Caneca de cerâmica bege e preta com a logo da Aline Naves', 'Brindes'],
        [P + 'aline-naves-papelaria.jpg', 'Papelaria da Aline Naves em preto e bege: caderno, pasta, cartões de visita e caneta', 'Papelaria'],
        [P + 'aline-naves-cartao.jpg', 'Cartão de visita preto da Aline Naves sobre uma superfície clara, ao lado de madeira', 'Cartão de visita'],
        [P + 'aline-naves-sacola.jpg', 'Sacola de tecido bege com a logo da Aline Naves, carregada por uma mulher de roupa preta', 'Sacola'],
        [P + 'aline-naves-instagram.jpg', 'Post do Instagram da Aline Naves em preto com o símbolo da marca em relevo', 'Redes sociais']] },
      free: { name: 'Free Tecnologia', niche: 'IA e engenharia de software', imgs: [
        [P + 'free-tecnologia-cartao.jpg', 'Cartão de visita da Free Tecnologia segurado em mãos, com logo em relevo azul', 'Cartão de visita'],
        [P + 'free-tecnologia-site.jpg', 'Notebook com o site da Free Tecnologia, IA e software sob medida, em tela azul escura', 'Site'],
        [P + 'free-tecnologia-caneca.jpg', 'Caneca branca com alça azul e a logo da Free Tecnologia', 'Caneca'],
        [P + 'free-tecnologia-copo.jpg', 'Copo térmico bege com tampa azul, logo e contatos da Free Tecnologia', 'Copo térmico'],
        [P + 'free-tecnologia-instagram.jpg', 'Post do Instagram @free_tecnologia com o símbolo da marca em azul sobre fundo preto', 'Redes sociais'],
        [P + 'free-tecnologia-perfil-card.jpg', 'Perfil do Instagram @free_tecnologia com bio, destaques e primeiros posts', 'Redes sociais'],
        [P + 'free-tecnologia-papel.jpg', 'Logo da Free Tecnologia impressa em papel texturizado', 'Papelaria']] },
      cb: { name: 'CB Projeto Estrutural', niche: 'Engenharia', imgs: [
        [P + 'cb-projeto-estrutural.jpg', 'Cartão de visita da CB Projeto Estrutural sobre uma pedra', 'Cartão de visita'],
        [P + 'cb-projeto-estrutural-instagram.jpg', 'Post do Instagram @cbprojetoestrutural com o símbolo CB em preto sobre fundo amarelo', 'Redes sociais'],
        [P + 'cb-projeto-estrutural-papelaria.jpg', 'Caderno de capa preta com elástico amarelo e caneta amarela com a logo da CB Projeto Estrutural', 'Caderno e caneta'],
        [P + 'cb-projeto-estrutural-capacete.jpg', 'Capacete de obra branco com a logo da CB Projeto Estrutural', 'Capacete']] }
    };
    Array.prototype.forEach.call(document.querySelectorAll('.case-card'), function (card) {
      var c = CASES[card.getAttribute('data-case')], n = c ? c.imgs.length : 0, el = card.querySelector('.count');
      if (el && n) el.textContent = n + (n === 1 ? ' peça' : ' peças');
    });
    var box = $('case'); if (!box) return;
    var main = $('case-img'), thumbs = $('case-thumbs'), gallery = $('case-gallery'), opener = null, cur = null, idx = 0;
    function pick(i) {
      idx = i; var im = cur.imgs[i];
      main.src = im[0]; main.alt = im[1]; $('case-tag').textContent = im[2];
      Array.prototype.forEach.call(thumbs.children, function (b, k) { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }
    function open(id, from) {
      cur = CASES[id]; if (!cur) return; opener = from;
      $('case-cat').textContent = cur.imgs.map(function (m) { return m[2]; }).filter(function (t, k, a) { return a.indexOf(t) === k; }).join(' \u00b7 '); $('case-name').textContent = cur.name; $('case-niche').textContent = cur.niche;
      thumbs.innerHTML = '';
      cur.imgs.forEach(function (im, k) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'case-thumb';
        b.setAttribute('aria-label', 'Ver imagem ' + (k + 1) + ' de ' + cur.imgs.length);
        var t = document.createElement('img'); t.src = im[0]; t.alt = ''; t.width = 300; t.height = 240; t.loading = 'lazy';
        b.appendChild(t); b.addEventListener('click', function () { pick(k); }); thumbs.appendChild(b);
      });
      gallery.hidden = cur.imgs.length < 2;
      pick(0); box.hidden = false; document.body.classList.add('case-open');
      box.querySelector('.case-close').focus();
    }
    function close() { box.hidden = true; document.body.classList.remove('case-open'); if (opener) opener.focus(); }
    document.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('[data-case]') : null;
      if (card) { open(card.getAttribute('data-case'), card); return; }
      if (e.target.closest && e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowRight' && cur.imgs.length > 1) pick((idx + 1) % cur.imgs.length);
      if (e.key === 'ArrowLeft' && cur.imgs.length > 1) pick((idx - 1 + cur.imgs.length) % cur.imgs.length);
      if (e.key === 'Tab') {
        var f = box.querySelectorAll('button:not([hidden])'); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    ['hashchange', 'popstate', 'hashchange-close'].forEach(function (ev) { window.addEventListener(ev, function () { if (!box.hidden) close(); }); });
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

  var servicoEscolhido = '';

  // aviso de cookies: a escolha fica no navegador; ferramentas de medição só devem iniciar depois do aceite
  (function () {
    var KEY = 'demont-cookies', box = $('consent');
    var read = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
    var save = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
    function decide(v) {
      save(v);
      box.hidden = true;
      window.dispatchEvent(new CustomEvent('demont-consent', { detail: v }));
    }
    $('consent-yes').addEventListener('click', function () { decide('aceito'); });
    $('consent-no').addEventListener('click', function () { decide('recusado'); });
    $('cookies-reopen').addEventListener('click', function () { box.hidden = false; $('consent-yes').focus(); });
    if (!read()) box.hidden = false;
  })();

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-servico]') : null;
    if (!a) return;
    servicoEscolhido = a.getAttribute('data-servico');
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
    openWhats('Olá, Rafaela! Vi o seu site e quero conversar sobre ' + (servicoEscolhido ? 'o serviço de ' + servicoEscolhido + '.' : 'um projeto.'), $('wa-note'));
  });
})();
