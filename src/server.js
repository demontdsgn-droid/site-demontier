const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, file) {
    if (/\.(jpg|png)$/i.test(file)) res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

app.use((req, res) => res.status(404).send('Página não encontrada'));

app.listen(PORT, () => console.log('Demont rodando em http://localhost:' + PORT));
