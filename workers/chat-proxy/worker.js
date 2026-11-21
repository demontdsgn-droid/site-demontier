// Cloudflare Worker: repassa as mensagens do site ao assistente Dora (Chat-IA).
// A chave de API fica só aqui, como "secret" do Worker. Nunca vai para o site.
//
// Única variável a configurar (Configurações > Variáveis e segredos, tipo Segredo):
//   CHATIA_API_KEY  chave gerada no Portal Chat-IA
// O ID do assistente e o endereço da API não são secretos e já estão abaixo.

const PROFILE_ID = '30580099-33a3-4738-af60-b5371492173e';
const BASE_URL = 'https://app-chatia.freetecnologia.com.br/services-api';

const PORTAL = 'https://portal.demontdesign.com.br';

const ORIGENS = [
  'https://www.demontdesign.com.br',
  'https://demontdesign.com.br',
  'http://localhost:3000',
];

const json = (corpo, status, origem) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origem,
      'Vary': 'Origin',
      'Cache-Control': 'no-store',
    },
  });

export default {
  async fetch(request, env) {
    const origem = request.headers.get('Origin') || '';
    if (!ORIGENS.includes(origem)) return new Response('Forbidden', { status: 403 });

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origem,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      });
    }
    if (request.method !== 'POST') return json({ erro: 'metodo' }, 405, origem);

    // Roteiro do chat: horários livres, reunião e orçamento passam pelo sistema da Demont (chave só aqui no Worker).
    const caminho = new URL(request.url).pathname;
    if (caminho === '/horarios' || caminho === '/agendar' || caminho === '/contato') {
      if (!env.DORA_KEY) return json({ erro: 'indisponivel' }, 503, origem);
      let b = {};
      if (caminho !== '/horarios') { try { b = await request.json(); } catch { return json({ erro: 'corpo' }, 400, origem); } }
      const txt = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
      let rota, init;
      if (caminho === '/horarios') { rota = '/api/dora/horarios'; init = { method: 'GET' }; }
      else if (caminho === '/agendar') {
        rota = '/api/dora/agendar';
        init = { method: 'POST', body: JSON.stringify({ nome: txt(b.nome, 80), email: txt(b.email, 120), whatsapp: txt(b.whatsapp, 20), servico: txt(b.servico, 80), data: txt(b.data, 10), hora: txt(b.hora, 5) }) };
      } else {
        rota = '/api/dora/contato';
        init = { method: 'POST', body: JSON.stringify({ nome: txt(b.nome, 80), email: txt(b.email, 120), whatsapp: txt(b.whatsapp, 20), servico: txt(b.servico, 80), tipo: b.tipo === 'orcamento' ? 'orcamento' : '' }) };
      }
      let pr;
      try {
        pr = await fetch(PORTAL + rota, { ...init, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.DORA_KEY } });
      } catch { return json({ erro: 'indisponivel' }, 502, origem); }
      const dados = await pr.json().catch(() => ({}));
      if (!pr.ok) return json({ erro: String(dados.erro || 'falha').slice(0, 200) }, pr.status === 409 || pr.status === 400 || pr.status === 429 ? pr.status : 502, origem);
      if (caminho === '/horarios') return json({ dias: (dados.dias || []).slice(0, 10).map((d) => ({ data: d.data, horarios: (d.horarios || []).slice(0, 12) })) }, 200, origem);
      if (caminho === '/agendar') return json({ ok: true, data: dados.data, hora: dados.hora, link: dados.link || '' }, 200, origem);
      return json({ ok: true }, 200, origem);
    }

    let corpo;
    try { corpo = await request.json(); } catch { return json({ erro: 'corpo' }, 400, origem); }

    const message = typeof corpo.message === 'string' ? corpo.message.trim() : '';
    const sessionId = typeof corpo.sessionId === 'string' ? corpo.sessionId.slice(0, 200) : undefined;
    if (!message || message.length > 1000) return json({ erro: 'mensagem' }, 400, origem);

    let r;
    try {
      r = await fetch(`${BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': env.CHATIA_API_KEY },
        body: JSON.stringify({ profileId: PROFILE_ID, sessionId, message }),
      });
    } catch {
      return json({ erro: 'indisponivel' }, 502, origem);
    }
    if (!r.ok) return json({ erro: 'upstream', status: r.status }, r.status === 429 ? 429 : 502, origem);

    const dados = await r.json();
    // Agenda: o Chat-IA manda os dias e horários em quickReply.options (id, label, description).
    // Repassamos só esses campos, como texto e com limite de tamanho.
    let quickReply = null;
    const q = dados.quickReply;
    if (q && Array.isArray(q.options) && q.options.length) {
      quickReply = {
        options: q.options.slice(0, 20).map((o) => ({
          id: String(o.id || '').slice(0, 300),
          label: String(o.label || '').slice(0, 80),
          description: String(o.description || '').slice(0, 120),
        })).filter((o) => o.id && o.label),
      };
      if (!quickReply.options.length) quickReply = null;
    }
    return json({ answer: String(dados.answer || ''), sessionId: dados.sessionId || null, quickReply }, 200, origem);
  },
};
