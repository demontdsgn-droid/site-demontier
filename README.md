# Demont Designer — site

## Rodar

```bash
npm install
npm start
```

Abra http://localhost:3000 (porta alterável com `PORT=4000 npm start`).

## Estrutura

Todo o site fica em `src/`: `server.js` (Express) e `public/` (`index.html`, `css/style.css`, `js/main.js`, `img/`).

## Como trocar

- **Projetos (espaços "Exemplo")**: em `src/public/index.html`, no carrossel (`#car-track`) e na grade do portfólio (`#port-grid`), troque cada `<article class="tile ...">` por uma imagem do projeto (coloque o arquivo em `src/public/img/`), mantenha `data-cat` (`identidade`, `personalizados` ou `redes`) no portfólio e remova a etiqueta `Exemplo`.
- **Mockups dos serviços**: na aba Serviços, substitua cada `<div class="shot ...">` (legenda "Espaço para o seu mockup") por `<img src="img/seu-mockup.jpg" alt="...">`. O mesmo vale para o espaço "Espaço para uma foto ou mockup" na home.
- **Número do WhatsApp**: em `src/public/js/main.js`, altere a constante `WHATSAPP` (só dígitos, com país e DDD, ex.: `5511994164585`). Altere também os links `wa.me` em `index.html` (aba Sobre e rodapé).
