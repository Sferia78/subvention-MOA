/* Veille automatisée — Simulateur Subventions MOA
   Exécuté par GitHub Actions (cron hebdo). Télécharge les pages sources,
   en extrait le texte, l'écrit dans snapshots/. Si le texte a changé depuis
   le dernier commit, l'Action ouvre automatiquement une Pull Request avec le diff.
   Aucun serveur, aucune IA, aucune intervention : juste Git. */

const fs = require('fs');
const path = require('path');

const SOURCES = [
  { id: 'eco-pls-bdt', url: 'https://www.banquedesterritoires.fr/produits-services/prets-long-terme/pret-eco-pret' },
  { id: 'seconde-vie', url: 'https://www.financement-logement-social.logement.gouv.fr/dispositif-seconde-vie-a2270.html' },
  { id: 'eco-pls-ministere', url: 'https://www.ecologie.gouv.fr/politiques-publiques/eco-pret-logement-social' },
  { id: 'cee-ministere', url: 'https://www.ecologie.gouv.fr/politiques-publiques/certificats-economies-denergie' },
  { id: 'financement-accueil', url: 'https://www.financement-logement-social.logement.gouv.fr/' },
  { id: 'fonds-chaleur', url: 'https://fondschaleur.ademe.fr/' },
];

const OUT = path.join(__dirname, 'snapshots');

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è').replace(/&agrave;/g, 'à').replace(/&#\d+;/g, ' ')
    .split('\n').map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 40)            // ignore le bruit (menus, dates volatiles)
    .join('\n');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let okCount = 0;
  for (const s of SOURCES) {
    try {
      const r = await fetch(s.url, { headers: { 'User-Agent': 'veille-subventions-moa (github.com/Sferia78/subvention-MOA)' }, redirect: 'follow' });
      if (!r.ok) { console.log(`[WARN] ${s.id}: HTTP ${r.status} — snapshot conservé`); continue; }
      const text = extractText(await r.text());
      if (text.length < 500) { console.log(`[WARN] ${s.id}: contenu trop court — snapshot conservé`); continue; }
      fs.writeFileSync(path.join(OUT, s.id + '.txt'), text + '\n');
      okCount++;
      console.log(`[OK] ${s.id}: ${text.length} caractères`);
    } catch (e) {
      console.log(`[WARN] ${s.id}: ${e.message} — snapshot conservé`);
    }
  }
  console.log(`\n${okCount}/${SOURCES.length} sources rafraîchies. Le diff Git décide de la suite.`);
})();
