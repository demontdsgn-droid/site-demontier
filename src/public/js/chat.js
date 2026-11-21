// Chat flutuante com a assistente Dora.
// O navegador fala só com o Worker (CHAT_URL); a chave de API fica lá, nunca aqui.
(function () {
  // Endereço do Worker da Cloudflare. Vazio = o chat fica escondido.
  var CHAT_URL = 'https://demont-chat.demontdsgn.workers.dev';
  if (!CHAT_URL) return;

  var KEY = 'demont-chat-sessao';
  var sessionId = null;
  try { sessionId = sessionStorage.getItem(KEY); } catch (e) {}

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt) n.textContent = txt;
    return n;
  }

  var btn = el('button', 'chat-fab');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Abrir chat com a Dora');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg viewBox="0 0 512 512" width="32" height="32" fill="none" stroke="currentColor" stroke-width="20" stroke-linejoin="round" aria-hidden="true"><path d="M133 428C158 396 168 376 168 358C108 336 76 290 76 232C76 140 160 84 257 84C355 84 440 140 440 232C440 318 372 378 258 378L245 378C225 406 190 426 150 428Z"/></svg>';

  var panel = el('section', 'chat-panel');
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat com a Dora');

  var head = el('header', 'chat-head');
  var title = el('div', 'chat-title');
  title.appendChild(el('strong', '', 'Dora'));
  title.appendChild(el('span', '', 'Assistente da Demont Design'));
  var close = el('button', 'chat-close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Fechar chat');
  head.appendChild(title);
  head.appendChild(close);

  var list = el('div', 'chat-msgs');
  list.setAttribute('aria-live', 'polite');

  var form = el('form', 'chat-form');
  var input = el('input', 'chat-input');
  input.type = 'text';
  input.placeholder = 'Digite sua mensagem';
  input.maxLength = 1000;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Sua mensagem');
  var send = el('button', 'chat-send', 'Enviar');
  send.type = 'submit';
  form.appendChild(input);
  form.appendChild(send);

  var note = el('p', 'chat-note', 'Assistente virtual. Para falar com a Rafaela, use o WhatsApp.');

  panel.appendChild(head);
  panel.appendChild(list);
  panel.appendChild(form);
  panel.appendChild(note);
  document.body.appendChild(panel);
  document.body.appendChild(btn);

  function add(who, text) {
    var m = el('p', 'chat-msg ' + who, text); // textContent: nunca HTML
    list.appendChild(m);
    list.scrollTop = list.scrollHeight;
    return m;
  }

  // Botões de resposta rápida. Ficam no fim da conversa e somem quando a pessoa escolhe (ou digita).
  var opts = null;
  function limparOpcoes() { if (opts && opts.parentNode) opts.parentNode.removeChild(opts); opts = null; }
  function mostrarOpcoes(lista) {
    limparOpcoes();
    if (!lista.length) return;
    opts = el('div', 'chat-opts');
    lista.slice(0, 4).forEach(function (t) {
      var b = el('button', 'chat-opt', t);
      b.type = 'button';
      b.addEventListener('click', function () { enviar(t); });
      opts.appendChild(b);
    });
    list.appendChild(opts);
    list.scrollTop = list.scrollHeight;
  }
  // a Dora termina perguntas de escolha com uma última linha: "Opções: Sim | Não"
  function separarOpcoes(texto) {
    var m = /(?:^|\n)[ \t]*Op[çc][õo]es:[ \t]*(.+?)[ \t]*$/i.exec(texto || '');
    if (!m) return { texto: texto, opcoes: [] };
    var ops = m[1].split('|').map(function (x) { return x.replace(/[`*_]/g, '').trim(); }).filter(function (x) { return x && x.length <= 40; });
    return { texto: texto.slice(0, m.index).trim() || texto, opcoes: ops };
  }

  var started = false;
  function toggle(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!started) {
        started = true;
        add('bot', 'Oi! Eu sou a Dora, assistente da Demont Design. Como posso ajudar?');
        mostrarOpcoes(['Pedir orçamento', 'Marcar reunião', 'Ver serviços']);
      }
      input.focus();
    } else {
      btn.focus();
    }
  }
  btn.addEventListener('click', function () { toggle(panel.hidden); });
  close.addEventListener('click', function () { toggle(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) toggle(false); });

  var busy = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    enviar(input.value);
  });
  function enviar(bruto) {
    var text = String(bruto || '').trim();
    if (!text || busy) return;
    input.value = '';
    limparOpcoes();
    add('me', text);
    busy = true; send.disabled = true;
    var typing = add('bot typing', 'Digitando…');

    fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId, message: text })
    })
      .then(function (r) {
        if (r.status === 429) throw new Error('muitas');
        if (!r.ok) throw new Error('erro');
        return r.json();
      })
      .then(function (d) {
        if (d.sessionId) {
          sessionId = d.sessionId;
          try { sessionStorage.setItem(KEY, sessionId); } catch (e2) {}
        }
        var sp = separarOpcoes(d.answer || '');
        typing.className = 'chat-msg bot';
        typing.textContent = sp.texto || 'Pode repetir, por favor?';
        mostrarOpcoes(sp.opcoes);
      })
      .catch(function (err) {
        typing.className = 'chat-msg bot';
        typing.textContent = err.message === 'muitas'
          ? 'Muitas mensagens em pouco tempo. Aguarde um instante e tente de novo.'
          : 'Não consegui responder agora. Tente de novo em instantes ou fale pelo WhatsApp.';
      })
      .then(function () {
        busy = false; send.disabled = false;
        list.scrollTop = list.scrollHeight;
        input.focus();
      });
  }
})();
