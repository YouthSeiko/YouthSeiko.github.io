# Fiche Les EX personnalisée — 14 novembre 2026

Suite de la préparation SEO, publiée après autorisation de YU le 14/11/2026. Branche `feat/seo-pages-20261114`, copie `studio-site-seo` uniquement. Page : `/fr/jeux/les-ex-de-lhaut-dela/`, équivalents EN/JA.

## Résultat

- Identité propre au visual novel : cour d’Aozora, titre typographique, quatre héroïnes en pied, pétales et mouvements discrets. Choix d’un personnage par les boutons de noms, réaction visuelle et courte note éditoriale sans révélation. Boutons fixes ; seuls les personnages bougent.
- Trois trailers locaux FR/EN/JA retrouvés dans la livraison validée du 7 novembre. Version de langue choisie par défaut selon la page, choix indépendant sous le lecteur, contrôles natifs, pas d’autoplay ni chargement MP4 à l’arrivée. Pause au changement de langue, à l’agrandissement d’une capture et au masquage/départ de la page.
- Cinq captures fournies et légendes exactes : Les héroïnes, Hana, Le défi de Rei, La boutique, Le mystère. Note 0.2.13-dev visible, distincte de la démo Store. Aperçus WebP ; originaux PNG identiques par SHA256, sans retouche.
- Galerie plein écran accessible : précédent/suivant, flèches clavier, Échap et retour du focus. Sans JS, liens directs vers les originaux. Les anciennes captures sont aussi remplacées dans la modale de l’accueil et dans le kit presse (14 entrées : 6 logos/visuels, 5 captures, 3 fiches).
- MIRAI, BABYLONE et CENTURY ont chacun une ambiance graphique séparée (clinique cyan, géométrie/papier, quotidien végétal) sans inventer d’assets de personnages ou de contenu narratif.
- Réduction des animations selon le système et bouton de pause des mouvements sur la fiche. Les lecteurs restent à la demande ; aucun nouveau suivi/compte.

## Sources de maintenance

`assets/i18n/heart-page.json` : textes de la fiche et légendes FR/EN/JA.
`tools/heart_page.py` : rendu de la fiche appelée par build_seo.
`assets/css/game-pages.css` et `assets/js/heart-page.js` : identité et interactions.
`assets/media/les-ex/README.md` et `provenance.json` : origine et intégrité des médias.
`index.html` et catalogue habituel : galerie de la modale historique.

Après une modification, exécuter les deux générateurs habituels. Aucun fichier généré n’est la source principale. Les sources du jeu, livraisons et autres worktrees sont préservés. Pas de hausse de version de la démo publique.

## Contrôles

19 scénarios historiques et 9 scénarios de langues ; contrôles SEO des 48 pages et du kit presse ; Edge parcourt les 48 avec/sans JavaScript. Cas spécifiques : aucune requête MP4 à l’arrivée, changement de langue sans lecture, sélection de personnage, arrêt des mouvements, galerie au clavier et focus ; mobile japonais et bureau français inspectés. Trois MP4 entièrement décodés, codecs et durée 90 s vérifiés, moov avant mdat ; cinq originaux PNG contrôlés par empreinte. Pas d’installation ni de diffusion lancée.


Encart Yuki Desktop 2D : petit bloc avant la conclusion, chibi existant cliquable et
texte FR/EN/JA, gratuit sans achats intégrés. Destination de la même langue :
`/fr/actualites/yuki-desktop-halloween/` (et EN/JA), présentation existante contenant
le lien Microsoft Store. L’encart ne lance pas d’installation. Source visuelle
`assets/media/yuki/chibi-wave.png`, copie du sprite existant wave1, sans modification
aux sources de l’application ou au pack OBS. Ancre `#yuki-desktop` sur la fiche.
