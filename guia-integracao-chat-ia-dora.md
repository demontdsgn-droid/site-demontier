# Guia de integração — Dora (54.350.279 RAFAELA DA COSTA SANTANA)

> Este arquivo ensina a ligar o seu sistema ao assistente **Dora** do Chat-IA.
> **Ele não contém a sua chave de API.** A chave você gera no Portal e guarda só no servidor do seu sistema.

Duas partes:

1. **Prompt para a sua IA de programação** (Claude Code, Cursor, Copilot…): cole o prompt abaixo e ela monta o chat no seu sistema.
2. **Referência da API**: o que a IA (ou você) precisa para chamar o assistente.

---

## Parte 1 — Prompt para colar na sua IA de programação

```text
Você vai integrar o chat do assistente "Dora" da empresa "54.350.279 RAFAELA DA COSTA SANTANA" ao meu sistema.
Use a "Parte 2 — Referência da API" deste arquivo como única fonte sobre a API.

ANTES DE ESCREVER QUALQUER CÓDIGO, me peça estes dados, um de cada vez, e espere eu responder:

  1. A CHAVE DE API do Chat-IA.
     Onde pegar: Portal > Assistente > aba "Canais e API" > cartão "Chave de API".
     (Se a API estiver desligada, ligue no mesmo cartão.) Nunca me peça para colar a chave na conversa se
     houver outro jeito: prefira que eu a coloque eu mesmo no arquivo .env.
  2. O ID DO ASSISTENTE (profileId). Valor sugerido: 30580099-33a3-4738-af60-b5371492173e — confirme comigo antes de usar.
  3. O ENDEREÇO DA API (URL base). Valor sugerido: https://app-chatia.freetecnologia.com.br/services-api — confirme comigo antes de usar.

ANTES DE CRIAR QUALQUER ARQUIVO, EXAMINE O MEU PROJETO (somente leitura) e me conte o que achou:
  - a tecnologia e a estrutura (framework, pastas, como o servidor e o front-end falam entre si);
  - se já existe um chat, um widget, uma rota de API, um cliente HTTP, um arquivo .env ou um padrão de erro/log/autenticação;
  - se já existe alguma chamada ao Chat-IA (procure por "chat/message", "X-API-Key", "CHATIA").
Depois diga o que REAPROVEITAR, o que MUDAR e o que CRIAR. Faça o menor conjunto de mudanças: siga o estilo, os nomes e as
bibliotecas que o projeto já usa, não troque nada que funciona e não sobrescreva arquivo existente sem me mostrar a diferença.
Se já houver um chat funcionando, ADAPTE-O (ligue ao Chat-IA, trate quickReply e mídia) em vez de criar outro.

Pergunte também onde o chat deve aparecer (página inteira, botão flutuante no canto, ou dentro de uma tela existente)
e em QUAL CANAL ele vai rodar: site ou aplicativo próprio (esta API), WhatsApp, Telegram, Instagram ou Messenger.
  - Site ou aplicativo próprio: siga as Partes 2 e 3.
  - WhatsApp, Telegram, Instagram e Messenger: NÃO escreva código de chat; esses canais se ligam no Portal (Parte 4).
    Só ajude no que for do meu lado (webhook, página de política de privacidade, textos).

Pergunte também QUAIS FUNÇÕES quero no chat, uma de cada vez (só as que existem na "Parte 3"):
  - Agenda (marcar, remarcar, cancelar): o chat mostra os dias e horários como botões.
  - Enviar foto para o assistente ler.
  - Enviar áudio (mensagem de voz).
Implemente SOMENTE o que eu escolher, seguindo a seção correspondente da "Parte 3".

REGRAS QUE VOCÊ NÃO PODE QUEBRAR:

  - Guarde a chave só em variável de ambiente no SERVIDOR (ex.: CHATIA_API_KEY no arquivo .env).
    Nunca escreva a chave no código, no front-end, no Git, em log ou em mensagem de erro.
  - O navegador NUNCA chama o Chat-IA direto (a chave ficaria visível para qualquer visitante).
    Crie uma rota no meu servidor (ex.: POST /api/chat) que recebe a mensagem, acrescenta o cabeçalho
    X-API-Key e repassa ao Chat-IA. O front-end só fala com essa rota.
  - Guarde o sessionId por pessoa (cookie ou sessão do meu sistema). Nunca use um sessionId fixo nem
    compartilhado: juntaria todos os meus clientes na mesma conversa.
  - Mostre a resposta (answer) como TEXTO, nunca como HTML.
  - Trate os erros da seção "Erros comuns" com mensagens humanas na tela, sem mostrar detalhe técnico.

O QUE ENTREGAR (adaptando ao que já existe no meu projeto; só crie o que faltar):

  1. A rota do servidor que repassa a mensagem (ou o ajuste na rota que eu já tenha).
  2. A tela de chat: lista de mensagens, campo de texto, botão Enviar (e Enter), indicador "digitando…",
     rolagem automática, funcionando bem no celular. Se já existir tela de chat, ajuste-a em vez de criar outra.
  3. As variáveis CHATIA_API_KEY, CHATIA_PROFILE_ID e CHATIA_BASE_URL no .env.example (sem valores reais) e o
     .env no .gitignore, seguindo o jeito que o projeto já guarda configuração.
  4. As funções que eu escolher da "Parte 3" (agenda com botões, foto, áudio, documento), e SÓ elas.
  5. Um teste simples: enviar "Olá" e mostrar a resposta. Rode o que o projeto já tem de testes antes e depois.

Quando terminar, me diga como rodar e testar.
```

---

## Parte 2 — Referência da API

### 2.1 Autenticação

Toda chamada leva o cabeçalho:

```
X-API-Key: SUA_CHAVE_DE_API
```

| Item | Valor |
|---|---|
| Endereço base | `https://app-chatia.freetecnologia.com.br/services-api` |
| ID do assistente (`profileId`) | `30580099-33a3-4738-af60-b5371492173e` |
| ID da empresa (Client ID) | `21f9ce91-089b-4395-bfbf-98cb8764c1ce` |

Como obter ou trocar a chave: Portal › Assistente › aba **Canais e API** › **Chave de API**.
Gerar uma nova chave desconecta a antiga na hora: atualize o `.env` do seu sistema logo em seguida.

### 2.2 Enviar uma mensagem

`POST https://app-chatia.freetecnologia.com.br/services-api/api/chat/message`

Corpo (JSON):

| Campo | Obrigatório | O que é |
|---|---|---|
| `message` | sim | O texto da pessoa (até 8.000 caracteres). |
| `profileId` | sim | O ID do assistente (acima). |
| `sessionId` | não na 1ª mensagem | Vazio na primeira; depois, o valor devolvido na resposta anterior (até 200 caracteres). |
| `userName` | não | Nome da pessoa, se o seu sistema já souber. |
| `messageId` | não | Código único da mensagem no seu sistema. Se repetir, o servidor não processa duas vezes e devolve `answer` vazio. |

Resposta (os campos que importam):

| Campo | O que é |
|---|---|
| `answer` | O texto que o assistente respondeu. É isto que aparece na tela. |
| `sessionId` | Guarde e envie nas próximas mensagens da mesma pessoa. |

### 2.3 Exemplos

**1ª mensagem (sem `sessionId`)**

```bash
curl --location 'https://app-chatia.freetecnologia.com.br/services-api/api/chat/message' \
  --header 'Content-Type: application/json' \
  --header 'X-API-Key: SUA_CHAVE_DE_API' \
  --data '{ "profileId": "30580099-33a3-4738-af60-b5371492173e", "message": "Olá, vocês abrem aos sábados?" }'
```

**Mensagens seguintes (com o `sessionId` da resposta anterior)**

```bash
# SESSION_ID: o valor de "sessionId" da resposta anterior
curl --location 'https://app-chatia.freetecnologia.com.br/services-api/api/chat/message' \
  --header 'Content-Type: application/json' \
  --header 'X-API-Key: SUA_CHAVE_DE_API' \
  --data '{ "sessionId": "'"$SESSION_ID"'", "profileId": "30580099-33a3-4738-af60-b5371492173e", "message": "E que horas?" }'
```

**JavaScript (Node, rodando no SERVIDOR — nunca no navegador)**

```js
const resposta = await fetch(`${process.env.CHATIA_BASE_URL}/api/chat/message`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.CHATIA_API_KEY },
  body: JSON.stringify({ profileId: process.env.CHATIA_PROFILE_ID, sessionId, message }),
});
if (!resposta.ok) throw new Error(`Chat-IA respondeu ${resposta.status}`);
const { answer, sessionId: novaSessao } = await resposta.json();
```

**Python (no servidor)**

```python
import os, requests

r = requests.post(
    f"{os.environ['CHATIA_BASE_URL']}/api/chat/message",
    headers={"X-API-Key": os.environ["CHATIA_API_KEY"]},
    json={"profileId": os.environ["CHATIA_PROFILE_ID"], "sessionId": session_id, "message": mensagem},
    timeout=30,
)
r.raise_for_status()
dados = r.json()
resposta, session_id = dados["answer"], dados["sessionId"]
```

### 2.4 Tela de chat de exemplo (HTML + JavaScript)

O navegador fala só com a **sua** rota (`/api/chat`), que repassa ao Chat-IA com a chave.

```html
<div id="chat" style="max-width:420px;font-family:sans-serif">
  <div id="msgs" style="height:320px;overflow:auto;border:1px solid #ddd;padding:8px"></div>
  <form id="f" style="display:flex;gap:6px;margin-top:6px">
    <input id="t" placeholder="Digite sua mensagem" style="flex:1;padding:8px" autocomplete="off">
    <button>Enviar</button>
  </form>
</div>
<script>
  let sessionId = null;
  const msgs = document.getElementById('msgs');
  const add = (quem, texto) => {
    const p = document.createElement('p');
    p.textContent = quem + ': ' + texto;          // textContent: nunca innerHTML com texto de terceiros
    msgs.appendChild(p); msgs.scrollTop = msgs.scrollHeight;
  };
  document.getElementById('f').onsubmit = async e => {
    e.preventDefault();
    const t = document.getElementById('t');
    const texto = t.value.trim(); if (!texto) return;
    t.value = ''; add('Você', texto);
    try {
      const r = await fetch('/api/chat', {          // rota do SEU servidor
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: texto }),
      });
      if (!r.ok) throw new Error(r.status);
      const d = await r.json(); sessionId = d.sessionId; add('Assistente', d.answer);
    } catch { add('Assistente', 'Não consegui responder agora. Tente de novo em instantes.'); }
  };
</script>
```

### 2.5 Erros comuns

| Código | O que significa | O que fazer |
|---|---|---|
| 400 | Faltou `message` ou `profileId`, ou o texto passou do limite. | Corrigir o corpo; na tela, pedir "Escreva sua mensagem". |
| 401 ou 403 | Chave ausente, errada, trocada, ou API desligada. | Conferir `CHATIA_API_KEY`; ver o cartão "Chave de API" no Portal. |
| 429 | Muitas mensagens em pouco tempo. | Esperar um pouco e tentar de novo. |
| 5xx | Instabilidade do Chat-IA. | Mostrar uma mensagem amigável e tentar mais tarde. |

### 2.7 Segurança — resumo

- A chave fica só no servidor. Quem a tiver fala como a sua empresa.
- Um `sessionId` por pessoa; nunca fixo.
- Mostre o `answer` como texto (nunca como HTML).
- Não registre a chave em log.

---

## Parte 3 — Funções que o seu assistente tem

### 3.1 Agenda (botões de dias, horários e confirmação)

Quando a conversa é de agenda, a resposta traz, além do `answer`, o campo `quickReply` com as opções que a pessoa pode tocar:

```json
{
  "answer": "Estes são os dias com vaga em novembro. Qual prefere?",
  "sessionId": "…",
  "quickReply": {
    "bodyText": "Estes são os dias com vaga…",
    "options": [
      { "id": "agenda:…", "label": "seg 24/11", "description": "3 horários" },
      { "id": "agenda:…", "label": "ter 25/11", "description": "2 horários" }
    ]
  }
}
```

**O `answer` sozinho não lista os dias.** As opções estão em `quickReply.options`. Há duas formas de usar, escolha uma:

1. **Botões (recomendado).** Desenhe um botão por opção, mostrando `label` (e `description` em letra menor). Quando a pessoa tocar, envie ao `POST /api/chat/message` o `id` da opção como se fosse a mensagem (`"message": "<id da opção>"`), com o mesmo `sessionId`. Se não houver `quickReply`, mostre só o `answer` e o campo de texto.
2. **Só texto.** Mande `"quickReplyAsText": true` no corpo. O `answer` passa a trazer a lista escrita (`• seg 24/11 (3 horários)`) e a pessoa responde digitando o dia, por exemplo `sex 21/11`. Não precisa ler o `quickReply`.

O mesmo vale para horários, confirmação e cancelamento: tudo chega como `quickReply` (ou escrito, com `quickReplyAsText`). Nunca invente dias nem horários: mostre só o que a resposta trouxe.

### 3.2 Foto (a pessoa envia uma imagem)

`POST https://app-chatia.freetecnologia.com.br/services-api/api/chat/image-message` — formulário `multipart/form-data` (não é JSON).

| Campo | Obrigatório | O que é |
|---|---|---|
| `image` | sim | O arquivo: foto JPG, PNG ou WebP (até 10 MB) ou PDF (até 15 MB). |
| `sessionId` | sim | O da conversa. |
| `profileId` | sim | 30580099-33a3-4738-af60-b5371492173e |
| `message` | não | Texto que acompanha a foto. |

Mesmo cabeçalho `X-API-Key` e mesma resposta (`answer`, `sessionId`, `quickReply`). Erro `400` com `code` `IMAGE_NOT_ENTITLED`, `IMAGE_PAUSED` ou `IMAGE_PROFILE_DISABLED` quer dizer que a função não está ligada: avise a pessoa com uma frase humana.

### 3.3 Áudio (mensagem de voz)

`POST https://app-chatia.freetecnologia.com.br/services-api/api/chat/audio-message` — formulário `multipart/form-data`.

| Campo | Obrigatório | O que é |
|---|---|---|
| `audio` | sim | O arquivo de áudio (mp3, m4a/mp4, wav, webm ou ogg; até 16 MB). Outro formato volta `400`: grave num destes. |
| `sessionId` | sim | O da conversa. |
| `profileId` | sim | 30580099-33a3-4738-af60-b5371492173e |
| `message` | não | Texto que acompanha o áudio. |

O assistente transcreve e responde no mesmo formato (`answer`, `sessionId`, `quickReply`). Erro `400` com `code` quer dizer que a função não está ligada: avise a pessoa.

### Não habilitado agora

Não implemente o que está nesta lista; ele só passa a valer quando for ligado no Portal:

- Documento: está desligado neste assistente

---

## Parte 4 — Outros canais

O contrato é o mesmo em todos: `answer` (texto), `sessionId` e `quickReply` (opções). Muda só quem desenha as opções.

| Canal | Como as mensagens entram | Opções (`quickReply`) |
|---|---|---|
| Site ou app próprio (esta API) | Seu servidor chama `POST /api/chat/message` | Você desenha os botões, ou usa `quickReplyAsText` |
| WhatsApp | Ligado pelo Portal (aba Canais) | O próprio canal as mostra (botões ou lista) |
| Telegram | Ligado pelo Portal (aba Canais) | O próprio canal as mostra (teclado) |
| Instagram e Messenger | Ligados pelo Portal (aba Canais) | O próprio canal as mostra |

Para esses canais você não precisa escrever código: ligue no Portal e veja ali o que cada um aceita. Use esta API só quando o chat for no **seu** site ou aplicativo. Foto, áudio e documento por esta API estão na Parte 3, quando ligados.

---

*Gerado pelo Portal Chat-IA em 21/11/2026. Este arquivo não contém nenhuma chave.*
