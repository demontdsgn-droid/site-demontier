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
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>';

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

  var started = false;
  function toggle(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!started) { started = true; add('bot', 'Oi! Eu sou a Dora, assistente da Demont Design. Como posso ajudar?'); }
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
    var text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
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
        typing.className = 'chat-msg bot';
        typing.textContent = d.answer || 'Pode repetir, por favor?';
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
  });
})();
