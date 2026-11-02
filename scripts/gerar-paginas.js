// Gera /servicos, /sobre e /portfolio a partir do src/public/index.html (a página inicial).
// Rode depois de editar o index.html:  node scripts/gerar-paginas.js
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.demontdesign.com.br';
const PUBLIC = path.join(__dirname, '..', 'src', 'public');
const home = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');

const PAGES = {
  servicos: ['Serviços | Demont Design', 'Identidade visual, personalizados, estratégia digital e captação de conteúdo para a sua marca. Conheça os serviços da Demont.'],
  sobre: ['Sobre | Rafaela Demontier, designer gráfica | Demont Design', 'Rafaela Demontier é designer gráfica e atende São Paulo e o Vale do Paraíba, com identidade visual e presença de marcas nas redes sociais.'],
  privacidade: ['Política de privacidade | Demont Design', 'Como a Demont Design trata os dados de quem visita o site e entra em contato.'],
  portfolio: ['Portfólio | Demont Design', 'Projetos de identidade visual e redes sociais para o Negócio Lotado, a Aline Naves, a Free Tecnologia e a CB Projeto Estrutural.']
};

function troca(html, regex, novo) {
  if (!regex.test(html)) throw new Error('Não achei no index.html: ' + regex);
  return html.replace(regex, novo);
}

for (const [slug, [title, desc]] of Object.entries(PAGES)) {
  const url = SITE + '/' + slug + '/';
  let h = home;
  h = troca(h, /<title>[^<]*<\/title>/, '<title>' + title + '</title>');
  h = troca(h, /<meta name="description" content="[^"]*">/, '<meta name="description" content="' + desc + '">');
  h = troca(h, /<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + url + '">');
  h = troca(h, /<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + title + '">');
  h = troca(h, /<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + desc + '">');
  h = troca(h, /<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + url + '">');
  fs.mkdirSync(path.join(PUBLIC, slug), { recursive: true });
  fs.writeFileSync(path.join(PUBLIC, slug, 'index.html'), h);
}

const hoje = new Date().toISOString().slice(0, 10);
const urls = ['/', '/servicos/', '/portfolio/', '/sobre/', '/privacidade/'];
fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => '  <url><loc>' + SITE + u + '</loc><lastmod>' + hoje + '</lastmod></url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(PUBLIC, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n');
console.log('Páginas geradas:', Object.keys(PAGES).join(', '), '+ sitemap.xml + robots.txt');
