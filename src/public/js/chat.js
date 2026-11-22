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

  // ---------- botões de resposta rápida ----------
  // lista: textos simples, ou {label, description, ...} (mostra o rótulo e a descrição pequena)
  var opts = null;
  function limparOpcoes() { if (opts && opts.parentNode) opts.parentNode.removeChild(opts); opts = null; }
  function mostrarOpcoes(lista) {
    limparOpcoes();
    if (!lista.length) return;
    opts = el('div', 'chat-opts');
    lista.slice(0, 14).forEach(function (o) {
      var simples = typeof o === 'string';
      var b = el('button', 'chat-opt', simples ? o : o.label);
      if (!simples && o.description) b.appendChild(el('small', 'chat-opt-d', o.description));
      b.type = 'button';
      b.addEventListener('click', function () { escolher(simples ? o : o.label, simples ? o : o.valor); });
      opts.appendChild(b);
    });
    list.appendChild(opts);
    list.scrollTop = list.scrollHeight;
  }

  // ---------- roteiro da conversa ----------
  // etapas: nome -> menu -> (servico) -> zap -> email -> dia -> hora -> fim; "duvida" fala com a Dora (IA)
  var etapa = 'nome', nome = '', servico = '', acao = '', zap = '', email = '', diaEsc = '', dias = [], negocio = '', situacao = '';
  var DIAS_SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  function rotuloDia(iso) {
    var p = iso.split('-'), d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return DIAS_SEM[d.getDay()] + ' ' + p[2] + '/' + p[1];
  }
  function chamaNome() { return nome ? ', ' + nome : ''; }
  function placeholder(txt, modo) { input.placeholder = txt; input.setAttribute('inputmode', modo || 'text'); }
  var MENU = ['Identidade visual', 'Estratégia digital', 'Site', 'Papelaria'];
  var PROXIMO = ['Marcar uma conversa', 'Pedir orçamento'];

  function bot(texto, botoes, depoisMs) {
    var m = add('bot', texto);
    mostrarOpcoes(botoes || []);
    return m;
  }

  function inicio() {
    etapa = 'nome'; nome = ''; servico = ''; acao = ''; negocio = ''; situacao = '';
    placeholder('Digite o seu nome');
    bot('Oi! Eu sou a Dora, assistente da Demont Design. Como posso te chamar?');
  }
  function menu(texto) {
    etapa = 'menu';
    placeholder('Escolha uma opção acima');
    bot(texto, MENU);
  }

  // aviso de "digitando…" enquanto fala com o servidor
  function comEspera(fn) {
    busy = true; send.disabled = true;
    var t = add('bot typing', 'Digitando…');
    fn(function () { if (t.parentNode) t.parentNode.removeChild(t); busy = false; send.disabled = false; input.focus(); });
  }

  function post(rota, corpo) {
    return fetch(CHAT_URL + rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo || {}) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { d.__status = r.status; d.__ok = r.ok; return d; }); });
  }
  var ERRO_REDE = 'Não consegui falar com o sistema agora. Tente de novo em instantes ou fale pelo WhatsApp.';

  // antes de pedir o contato, a Dora conhece o projeto (o que a pessoa faz e como está a marca/redes hoje)
  function resumoProjeto() {
    var r = [];
    if (negocio) r.push('Negócio: ' + negocio);
    if (situacao) r.push((servico === 'Identidade visual' ? 'Marca: ' : servico === 'Estratégia digital' ? 'Redes: ' : servico === 'Site' ? 'Site: ' : 'Pedido: ') + situacao);
    return r.join(' | ').slice(0, 480);
  }
  // quem já passou WhatsApp e e-mail não é perguntado de novo (ex.: pediu orçamento e depois quer marcar uma conversa)
  function seguirComContato() {
    if (acao === 'orcamento') enviarOrcamento();
    else mostrarDias('Claro' + chamaNome() + '! Estes são os dias com vaga para conversar com a Rafaela:');
  }
  function pedirNegocio() {
    if (zap && email) { seguirComContato(); return; }
    etapa = 'negocio'; negocio = ''; situacao = '';
    placeholder('Conte em poucas palavras');
    bot('Antes de eu pegar o seu contato' + chamaNome() + ', me conta: qual é o ramo da sua empresa?');
  }
  function pedirSituacao() {
    if (servico === 'Identidade visual') {
      etapa = 'situacao';
      placeholder('Ou escreva aqui');
      bot('Entendi! E sobre a marca: você já tem logotipo hoje?', ['Ainda não tenho', 'Tenho e quero renovar']);
    } else if (servico === 'Estratégia digital') {
      etapa = 'situacao';
      placeholder('Escreva aqui');
      bot('Boa! Em quais redes sociais você está ou quer estar? Se já tiver perfil, me passa o @ também.', ['Ainda não tenho redes']);
    } else if (servico === 'Site') {
      etapa = 'situacao';
      placeholder('Ou escreva aqui');
      bot('Boa! E você já tem um site hoje?', ['Ainda não tenho', 'Tenho e quero refazer']);
    } else if (servico === 'Papelaria') {
      etapa = 'situacao';
      placeholder('Escreva aqui');
      bot('Que legal! Quais itens você precisa? Pode contar um montão.', ['Ainda não sei']);
    } else { pedirZap(); }
  }
  function pedirZap() {
    etapa = 'zap';
    placeholder('Seu WhatsApp, com DDD', 'tel');
    bot('Perfeito' + chamaNome() + '! Qual é o seu WhatsApp, com DDD?');
  }
  function pedirEmail() {
    etapa = 'email';
    placeholder('Seu e-mail', 'email');
    bot('E o seu e-mail?');
  }

  function mostrarDias(intro) {
    comEspera(function (fim) {
      post('/horarios').then(function (d) {
        fim();
        if (!d.__ok || !d.dias || !d.dias.length) {
          etapa = 'fim';
          bot('Não encontrei horários livres agora. A Rafaela vai te chamar no WhatsApp para combinar o melhor dia.', ['Começar de novo']);
          return;
        }
        dias = d.dias; etapa = 'dia';
        placeholder('Escolha um dia nos botões');
        bot(intro, d.dias.slice(0, 8).map(function (x) {
          return { label: rotuloDia(x.data), valor: x.data, description: x.horarios.length + (x.horarios.length === 1 ? ' horário' : ' horários') };
        }));
      }).catch(function () { fim(); etapa = 'fim'; bot(ERRO_REDE, ['Começar de novo']); });
    });
  }
  function mostrarHoras(iso) {
    var d = dias.filter(function (x) { return x.data === iso; })[0];
    if (!d) { mostrarDias('Escolha um dia para a nossa conversa:'); return; }
    diaEsc = iso; etapa = 'hora';
    bot('Qual horário prefere em ' + rotuloDia(iso) + '?', d.horarios.concat(['Escolher outro dia']));
  }
  function marcar(hora) {
    comEspera(function (fim) {
      post('/agendar', { nome: nome || 'Visitante do site', email: email, whatsapp: zap, servico: servico, resumo: resumoProjeto(), data: diaEsc, hora: hora }).then(function (d) {
        fim();
        if (d.__status === 409) { mostrarDias('Esse horário acabou de ser ocupado. Estes são os que continuam livres:'); return; }
        if (!d.__ok) { etapa = 'fim'; bot('Não consegui marcar agora. A Rafaela vai te chamar no WhatsApp para combinar o horário.', ['Começar de novo']); return; }
        etapa = 'fim';
        bot('Combinado' + chamaNome() + '! Sua conversa com a Rafaela está marcada para ' + rotuloDia(diaEsc) + ' às ' + hora + '. O convite com o link do Google Meet chega no seu e-mail, e ela também te chama no WhatsApp para confirmar. Vai ser um prazer conversar com você. Até lá! ✨');
        placeholder('Escreva se tiver mais alguma dúvida');
      }).catch(function () { fim(); etapa = 'fim'; bot(ERRO_REDE, ['Começar de novo']); });
    });
  }
  function enviarOrcamento() {
    comEspera(function (fim) {
      post('/contato', { nome: nome || 'Visitante do site', email: email, whatsapp: zap, servico: servico, resumo: resumoProjeto(), tipo: 'orcamento' }).then(function (d) {
        fim();
        if (!d.__ok) { etapa = 'fim'; bot('Não consegui registrar agora. Tente de novo em instantes ou fale pelo WhatsApp.', ['Começar de novo']); return; }
        etapa = 'fim';
        bot('Tudo certo' + chamaNome() + '! Já passei o que você me contou para a Rafaela. Ela vai olhar com carinho e te chama no WhatsApp para uma conversa mais detalhada sobre o seu projeto. Foi um prazer conversar com você. Até mais! ✨');
        placeholder('Escreva se tiver mais alguma dúvida');
      }).catch(function () { fim(); etapa = 'fim'; bot(ERRO_REDE, ['Começar de novo']); });
    });
  }

  function iniciarDuvida(texto) {
    etapa = 'duvida';
    placeholder('Escreva a sua dúvida');
    bot(texto || ('Pode perguntar' + chamaNome() + '! Escreva a sua dúvida aqui embaixo.'));
    input.focus();
  }

  // toque em um botão
  function escolher(rotulo, valor) {
    if (busy) return;
    limparOpcoes();
    add('me', rotulo);
    if (rotulo === 'Começar de novo') { nome = nome; menu('O que você precisa hoje' + chamaNome() + '?'); return; }
    if (etapa === 'nome') {
      nome = rotulo === 'Prefiro não dizer' ? '' : rotulo;
      menu(nome ? 'Prazer, ' + nome + '! O que você precisa hoje?' : 'Tudo bem! O que você precisa hoje?');
      return;
    }
    if (rotulo === 'Identidade visual') { servico = 'Identidade visual'; etapa = 'servico'; bot((nome ? 'Que legal, ' + nome + '! ' : 'Que legal! ') + 'Na identidade visual, nós criamos a marca do seu negócio, a essência que faz as pessoas reconhecerem e lembrarem de você. Cada projeto é montado sob medida. Como você quer seguir?', PROXIMO); return; }
    if (rotulo === 'Estratégia digital') { servico = 'Estratégia digital'; etapa = 'servico'; bot((nome ? 'Boa, ' + nome + '! ' : 'Boa! ') + 'Na estratégia digital, nós cuidamos das suas redes sociais, do planejamento do que postar até as artes, para o seu negócio, produto ou serviço ser visto por quem importa. Cada projeto é montado sob medida. Como você quer seguir?', PROXIMO); return; }
    if (rotulo === 'Site') { servico = 'Site'; etapa = 'servico'; bot((nome ? 'Show, ' + nome + '! ' : 'Show! ') + 'No site, nós criamos a página do seu negócio na internet, para os clientes te encontrarem, conhecerem o seu trabalho e entrarem em contato. Cada projeto é montado sob medida. Como você quer seguir?', PROXIMO); return; }
    if (rotulo === 'Papelaria') { servico = 'Papelaria'; etapa = 'servico'; bot((nome ? 'Adorei, ' + nome + '! ' : 'Adorei! ') + 'Na papelaria, nós criamos os materiais do seu negócio, como cartão de visita, adesivos e embalagens. Cada projeto é montado sob medida. Como você quer seguir?', PROXIMO); return; }
    if (rotulo === 'Tirar dúvidas' || rotulo === 'Tirar outra dúvida') { iniciarDuvida(); return; }
    if (etapa === 'negocio') { negocio = ''; pedirSituacao(); return; }
    if (etapa === 'situacao') { situacao = rotulo; pedirZap(); return; }
    if (rotulo === 'Marcar uma conversa') { acao = 'reuniao'; pedirNegocio(); return; }
    if (rotulo === 'Pedir orçamento') { acao = 'orcamento'; pedirNegocio(); return; }
    if (etapa === 'dia') { mostrarHoras(valor || rotulo); return; }
    if (etapa === 'hora') { if (rotulo === 'Escolher outro dia') { mostrarDias('Escolha um dia para a nossa conversa:'); return; } marcar(rotulo); return; }
  }

  // texto digitado
  function ehPergunta(t) { return /\?/.test(t) || /^(qual|quais|quanto|quanta|como|quando|quem|onde|por ?que|voc[eê]s?|vcs)\b/i.test(t) || /\b(pre[çc]os?|valor(es)?|desconto|prazo|custa|rob[ôo]|promo[çc][ãa]o)\b/i.test(t); }
  function digitou(texto) {
    var t = String(texto || '').trim();
    if (!t || busy) return;
    limparOpcoes();
    add('me', t);
    if (etapa === 'nome') {
      nome = t.replace(/\s+/g, ' ').slice(0, 40).replace(/(^|\s)([a-zà-ú])/g, function (m, a, b) { return a + b.toUpperCase(); });
      menu('Prazer, ' + nome + '! O que você precisa hoje?');
      return;
    }
    if (etapa === 'negocio' && ehPergunta(t)) { perguntarDora(t, function () { etapa = 'negocio'; bot('Voltando ao seu projeto' + chamaNome() + ': qual é o ramo da sua empresa?'); }); return; }
    if (etapa === 'situacao' && ehPergunta(t)) { perguntarDora(t, function () { pedirSituacao(); }); return; }
    if (etapa === 'negocio') { negocio = t.slice(0, 200); pedirSituacao(); return; }
    if (etapa === 'situacao') { situacao = t.slice(0, 200); pedirZap(); return; }
    if (etapa === 'zap') {
      var n = t.replace(/\D/g, '');
      if (/[a-zà-ú]{3,}/i.test(t)) { perguntarDora(t, function () { etapa = 'zap'; bot('Voltando ao seu contato' + chamaNome() + ': qual é o seu WhatsApp, com DDD?'); }); return; }
      if (n.length < 10 || n.length > 13) { bot('Não consegui entender esse número. Pode digitar com DDD, assim: 11 99999-9999?'); return; }
      zap = n; pedirEmail(); return;
    }
    if (etapa === 'email') {
      var e = t.toLowerCase();
      if (e.indexOf('@') < 0 && (/\?/.test(t) || t.split(/\s+/).length >= 3)) { perguntarDora(t, function () { etapa = 'email'; bot('Voltando ao seu contato' + chamaNome() + ': qual é o seu e-mail?'); }); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { bot('Esse e-mail parece incompleto. Pode conferir? Exemplo: nome@email.com'); return; }
      email = e;
      if (acao === 'orcamento') enviarOrcamento(); else mostrarDias('Obrigada! Estes são os dias com vaga para conversar com a Rafaela:');
      return;
    }
    if (etapa === 'dia' || etapa === 'hora') { bot('Toque em uma das opções abaixo, por favor.', null); mostrarOpcoes(etapa === 'dia' ? dias.slice(0, 8).map(function (x) { return { label: rotuloDia(x.data), valor: x.data, description: x.horarios.length + ' horários' }; }) : (dias.filter(function (x) { return x.data === diaEsc; })[0] || { horarios: [] }).horarios.concat(['Escolher outro dia'])); return; }
    if (etapa === 'menu' && ehPergunta(t)) { perguntarDora(t, function () { etapa = 'menu'; mostrarOpcoes(MENU); }); return; }
    if (etapa === 'servico' && ehPergunta(t)) { perguntarDora(t, function () { etapa = 'servico'; mostrarOpcoes(PROXIMO); }); return; }
    if (etapa === 'menu') { bot('Escolha uma das opções abaixo, tá?'); mostrarOpcoes(MENU); return; }
    if (etapa === 'servico') { bot('Escolha uma das opções abaixo, tá?'); mostrarOpcoes(PROXIMO); return; }
    // qualquer outro texto (fim ou dúvida): é uma dúvida para a Dora
    if (/agendar|marcar|reuni[aã]o|conversa com a rafa/i.test(t) && etapa !== 'duvida') { acao = 'reuniao'; pedirNegocio(); return; }
    etapa = 'duvida';
    perguntarDora(t);
  }

  // ---------- Dora (IA): só para dúvidas abertas ----------
  function perguntarDora(text, retomar) {
    busy = true; send.disabled = true;
    var typing = add('bot typing', 'Digitando…');
    function chamar(sid) {
      return fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, message: text })
      }).then(function (r) {
        if (r.status === 429) throw new Error('muitas');
        // código de conversa velho ou inválido: começa uma conversa nova e tenta de novo, uma vez só
        if (!r.ok && sid) {
          sessionId = null;
          try { sessionStorage.removeItem(KEY); } catch (e3) {}
          return chamar(null);
        }
        if (!r.ok) throw new Error('erro');
        return r.json();
      });
    }
    chamar(sessionId)
      .then(function (d) {
        if (d.sessionId) {
          sessionId = d.sessionId;
          try { sessionStorage.setItem(KEY, sessionId); } catch (e2) {}
        }
        // a agenda e as opções ficam por conta do roteiro; aqui só o texto da resposta
        var resp = String(d.answer || '').replace(/(?:^|\n)[ \t]*Op[çc][õo]es:[ \t]*.+$/i, '').trim();
        typing.className = 'chat-msg bot';
        typing.textContent = resp || 'Pode repetir, por favor?';
        if (retomar) retomar();
        else if (zap && email) placeholder('Escreva se tiver mais alguma dúvida');
        else mostrarOpcoes(['Marcar uma conversa', 'Pedir orçamento']);
      })
      .catch(function (err) {
        typing.className = 'chat-msg bot';
        typing.textContent = err.message === 'muitas'
          ? 'Muitas mensagens em pouco tempo. Aguarde um instante e tente de novo.'
          : 'Não consegui responder agora. Tente de novo em instantes ou fale pelo WhatsApp.';
        if (retomar) retomar(); else if (!(zap && email)) mostrarOpcoes(['Marcar uma conversa', 'Pedir orçamento']);
      })
      .then(function () {
        busy = false; send.disabled = false;
        list.scrollTop = list.scrollHeight;
        input.focus();
      });
  }

  // ---------- abrir, fechar, enviar ----------
  var started = false, busy = false;
  function toggle(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!started) { started = true; inicio(); }
      input.focus();
    } else {
      btn.focus();
    }
  }
  btn.addEventListener('click', function () { toggle(panel.hidden); });
  close.addEventListener('click', function () { toggle(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = input.value;
    input.value = '';
    digitou(t);
  });
})();
