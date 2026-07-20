# Simulateur Subventions MOA

Séquencement des financements pour opérations de logement social. En production : https://simulateur-subventions-moa.netlify.app

## Architecture (100 % gratuite, zéro serveur, zéro IA dans la boucle)

```
index.html        # Application complète (moteur + interface)
dispositifs.js    # LA base de dispositifs — seul fichier métier à maintenir
veille.js         # Script de veille : snapshot du texte des pages sources
.github/workflows/veille.yml  # Cron hebdo : exécute veille.js, ouvre une PR si diff
snapshots/        # Texte extrait des sources (référence du diff, créé au 1er run)
```

## Le pipeline d'auto-mise à jour

1. **Chaque lundi 6h UTC**, GitHub Actions télécharge les pages officielles (Banque des Territoires, ministère, ADEME…) et en extrait le texte.
2. **Si rien n'a changé** : aucun bruit, rien ne se passe.
3. **Si une source a changé** : une Pull Request s'ouvre automatiquement avec le diff exact. Un mainteneur (n'importe qui avec accès au repo, depuis un téléphone) vérifie en 2 minutes : bruit → merge ; vrai changement → il corrige la fiche dans `dispositifs.js` dans la même PR, puis merge.
4. **Le merge déclenche le déploiement Netlify** (repo lié) : tous les utilisateurs de l'URL ont la nouvelle base instantanément, sans rien installer.

L'application, elle, tourne en continu quoi qu'il arrive — le pipeline ne concerne que la fraîcheur des données, et chaque fiche affiche sa date « vérifié le ».

## Maintenir la base

Modifier uniquement `dispositifs.js` : fiche = critères d'éligibilité, règles de jalons, montants indicatifs, cumuls, source, `verifiedAt`. Incrémenter `meta.version` et `meta.updated` à chaque changement.

## Lancer la veille à la main

Onglet **Actions** → « Veille subventions » → *Run workflow*.

---
Auteur : Jean-Laurore Dominique · 2026 · Outil d'aide à la décision, ne remplace ni les textes ni l'instruction des financeurs.
