// Cloudflare Worker: repassa as mensagens do site ao assistente Dora (Chat-IA).
// A chave de API fica só aqui, como "secret" do Worker. Nunca vai para o site.
//
// Única variável a configurar (Configurações > Variáveis e segredos, tipo Segredo):
//   CHATIA_API_KEY  chave gerada no Portal Chat-IA
// O ID do assistente e o endereço da API não são secretos e já estão abaixo.

const PROFILE_ID = '30580099-33a3-4738-af60-b5371492173e';
const BASE_URL = 'https://app-chatia.freetecnologia.com.br/services-api';

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
    return json({ answer: String(dados.answer || ''), sessionId: dados.sessionId || null }, 200, origem);
  },
};
