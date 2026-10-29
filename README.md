# Youthseiko — site du studio

Site statique HTML/CSS/JavaScript, publié par GitHub Pages depuis `main`.
Aucune dépendance de compilation ni compte visiteur.

## Icônes du site et de Google

`favicon.ico` (16 à 256 px), `favicon-96x96.png` et `apple-touch-icon.png` sont
les variantes de l’étoile rose du studio, sur fond prune. Le logo carré en 512 px
est aussi déclaré dans les données structurées. Le dessin source est
`assets/img/studio-mark.svg`. Pour régénérer : `python tools/generate_favicons.py`
(Pillow requis uniquement pour cet outil).

Conserver ces URL stables et accessibles à Googlebot/Googlebot-Image dans
`robots.txt`. Après une modification, demander éventuellement une indexation de
`https://youthseiko.github.io/` dans Search Console. La prise en compte dépend de
Google, peut demander plusieurs jours à plusieurs semaines et ne garantit pas
l’affichage. Référence : https://developers.google.com/search/docs/appearance/favicon-in-search

Le titre public du visual novel reste **PROJECT HEART**. Ne pas révéler son titre
interne ou ses retournements narratifs dans les images ou les textes du site.

## Modifier

### Langues du site

Les boutons de drapeaux **FR / EN / JP** dans l’en-tête changent le texte du site
sur place, y compris les noms accessibles, les métadonnées, les fiches, les
réactions de Yuki, les secrets et les archives. Les illustrations et les noms
publics des jeux restent les mêmes. Les voix préenregistrées de Yuki restent
japonaises ; en japonais, le texte reprend la transcription du catalogue vocal.

- Le français reste la version HTML de référence, utilisable sans JavaScript.
  Le choix est enregistré si possible dans `youthseiko.language` (`fr`, `en`, `ja`).
  Un stockage bloqué n’empêche pas de changer de langue pendant la visite.
- `?lang=en` ou `?lang=ja` ouvre directement une version. Ce paramètre prend
  priorité sur la préférence enregistrée et conserve les ancres. Les changements
  de langue ne rechargent pas la page et ne réinitialisent ni scènes ni fragments.
- `assets/i18n/catalogue.json` contient des entrées `[français, anglais, japonais]`.
  Conserver les apostrophes et ponctuations de la source ; les espaces sont normalisés.
  Une traduction peut être vide si la grammaire japonaise l’exige. Les traductions
  sont des textes, jamais du HTML. Aucun service de traduction distant n’est utilisé.
- Après modification : `python tools/build_i18n.py`. Le catalogue navigateur
  `assets/js/i18n-catalogue.js` est généré. `python tools/build_i18n.py --check`
  vérifie qu’il correspond à la source. Mettre à jour les paramètres `v=` concernés.
- `assets/js/i18n.js` observe les textes et attributs accessibles des composants
  existants, conserve leur source française, et traduit les nouveaux messages
  d’interface. Les messages avec nombres et identifiants utilisent des motifs
  explicites. Ajouter de nouveaux cas dans `patterns` si ces formats changent.
- `assets/css/i18n.css` gère les drapeaux SVG, le menu et la typographie japonaise.
  Les drapeaux fonctionnent sur Windows sans dépendre des emojis de pays.
- Le script de maintenance `tools/test_i18n.cjs` vérifie la couverture des textes,
  les trois langues, leur persistance, les URL, les menus mobiles et les quatre
  secrets. Il utilise Playwright et Edge comme la suite existante. Un dossier de
  captures peut être passé en argument ; le conserver hors dépôt.

Les versions anglaise et japonaise sont rendues dans le navigateur, avec `lang`,
titre et métadonnées adaptés. Il ne s’agit pas de pages HTML statiques séparées.
Un nouveau texte sans entrée conserve le français ; la vérification de couverture
le signale pour éviter un mélange de langues lors des prochaines mises à jour.
La relecture a porté sur les textes et rendus, sans validation par un réviseur
japonophone externe. Les scripts et crédits restent sous leur nom d’origine.

### Contenus et composants

- **Espace YU** : section `#yu` dans `index.html`, accessible depuis les deux menus.
  `#carnet-yu` contient trois premiers billets et leurs annotations éditoriales de
  Yuki ; `#yu-repond` contient deux questions utiles en accordéons HTML natifs, utilisables
  sans JavaScript. Textes de lancement écrits dans la voix du personnage public
  de YU ; ce ne sont pas des commentaires envoyés par des visiteurs.
  Garder les billets datés et les liens vers les projets. Ajouter les nouvelles
  entrées en tête du carnet avec un identifiant unique.
- **Derrière le masque** : emplacement de présentation en préparation. Attendre
  la vidéo YouTube fournie par YU avant d’ajouter un lecteur et son URL. Aucun
  portrait, entretien filmé ou lecteur factice n’a été créé.

- `index.html` : projets, fiches détaillées, actualités et informations publiques.
  Le repère **W1 — Wave 1 · Première salve · 2026–2027** au-dessus des quatre
  cartes identifie la première vague du studio : MIRAI, HEART, BABYLONE et CENTURY.
  Sur l’accueil, sa version compacte **W1 · Première salve · 4 jeux · 2026–2027**
  regroupe les raccourcis de ces quatre univers et mène à la section Projets.
  La période désigne cette vague de projets ; les états des fiches et l’absence
  de dates de sortie annoncées sont conservés.
- `assets/css/style.css` : identité pastel, cartes et adaptation mobile.
- `assets/js/main.js` : navigation, fenêtres de projets, galerie et mascotte.
- `assets/js/secrets.js` et `assets/css/secrets.css` : expériences facultatives,
  fragments et archives. Parcours, architecture et audit dans [REFONTE.md](REFONTE.md).
- **Version glitch** : l’Archive 000 révèle un bouton d’activation après les quatre
  fragments. Le même site utilise alors `assets/css/glitch.css` et la classe
  `body.is-glitched` : palette sombre, images désaturées, trame et décalages légers.
  Le bouton fixe **Revenir au site normal** restaure l’apparence habituelle.
  Aucun son supplémentaire ni clignotement rapide. Le thème ne se réactive pas
  automatiquement après rechargement ; les fragments restent acquis.
- **Actualités** : ajouter les annonces datées, de la plus récente à la plus ancienne,
  comme articles `.news-entry` dans `#latest-news`. Le script conserve les trois
  premières et déplace les suivantes dans `#anciennes-actualites`, sans changer leurs
  identifiants. Sans JavaScript, toutes restent lisibles. Une seule annonce existait
  lors de cette refonte ; les billets personnels de YU ne sont pas des annonces.
- **Yuki** est la mascotte tsundere gothique : carnet à croix, porte-clés chauve-souris.
  L’actualité du 28 octobre `#news-yuki-life` présente ses études 3D et son application
  desktop dans un atelier dépliable `#yuki-hors-ecran`. Le lien se trouve aussi dans
  la question « Et Yuki, elle fait quoi ici ? ». Les médias fournis par YU sont dans
  `assets/media/yuki/` (provenance et conversions dans son `README.md`). Aucun
  paquet d’application n’est inclus dans ces aperçus. L’annonce Halloween du 31 octobre
  propose séparément l’installation depuis Microsoft Store (voir ci-dessous).
  Les vidéos utilisent les contrôles natifs, sans autoplay et avec `preload="none"`.
  Elles se mettent en pause à la fermeture de l’atelier, au changement d’onglet et
  à l’ouverture d’une fenêtre ; leurs lectures et la voix de Yuki s’excluent.
  Ses 20 répliques françaises et japonaises sont dans `tools/yuki-lines.json`.
  Le catalogue navigateur `assets/js/yuki-lines.js` est généré à partir de ce fichier.
  Les 20 enregistrements sont conservés ; 17 alimentent le tirage aléatoire. Les trois
  répliques `burst`, `phonk`, `explore` sont écartées de ce tirage pour éviter les rappels
  de présentation. Une réplique française apparaît à chaque chargement.
  Les clics 1, 3, 5 et 7 déclenchent des réactions écrites, sans audio associé ; au
  septième, un bouton permet de feuilleter le carnet secret. Les autres clics tirent
  une réplique habituelle. Le bouton voix est désactivé pendant une réplique silencieuse.
  La bulle se ferme après 14 secondes (sauf survol, focus, lecture ou fenêtre ouverte),
  avec sa croix ou Échap hors fenêtre. Échap ferme d’abord la fenêtre au premier plan.
  Le dernier choix est mémorisé uniquement dans la session du navigateur pour éviter
  une répétition immédiate. Le site fonctionne aussi si ce stockage est bloqué.
  Le bouton **Voix : OFF** active le doublage japonais de la phrase affichée.
  Ensuite, une réplique habituelle change à la fois la voix et le sous-titre français.
  **Voix : ON** coupe le son. La préférence est enregistrée localement si possible.
  Au retour sur le site, le bouton **Écouter** attend un clic : aucun son imposé à
  l’ouverture, même si la voix était activée. Les sons s’arrêtent à la fermeture
  de la bulle, lors d’un changement d’onglet ou à l’ouverture d’une fiche projet.
  Une seule réplique est chargée au clic ; les voix ne se superposent pas.
  Le petit bouton **−** réduit Yuki à un bouton discret et coupe la réplique.
  Le bouton **Yuki ✦** la fait revenir ; cette réduction ne persiste pas au rechargement.
- Voix préenregistrées : `assets/voice/yuki/*.mp3`, environ 810 Kio au total.
  Crédit affiché dans le pied de page : **VOICEVOX:春日部つむぎ**, même bibliothèque
  qu’Akari, avec un réglage plus posé. Le site n’utilise aucun service de synthèse
  à distance, microphone ou compte visiteur. Conditions et réglages dans
  `assets/voice/yuki/VOICE.md`.
- Pour régénérer, lancer le moteur VOICEVOX local puis
  `python tools/generate_yuki.py` (Python et FFmpeg). Le moteur et les WAV bruts
  restent hors dépôt ; les clips inchangés sont conservés.
- `assets/img/studio-mascot.jpg` : image fournie par le studio, conservée telle quelle.
- `assets/img/project-mirai-keyart.png` : illustration d’accueil du prototype MIRAI.
- Les PNG sources des deux projets sont conservés. Le site affiche leurs variantes
  WebP en 600 et 1200 pixels pour charger moins de données sur mobile. Conversion
  avec FFmpeg, `-vf scale=600:600 -c:v libwebp -quality 85` pour MIRAI ; 600:400
  pour HEART. Même principe en 1200 pixels. Ne pas employer l’ancienne illustration
  comportant le titre interne de HEART.
- L’accueil donne accès aux quatre univers et illustre les deux prototypes. Les visuels de BABYLONE et
  CENTURY sont des compositions CSS, sans nouvelles images ni dépendances.

## Vérifier avant publication

### Lancement Halloween de Yuki Desktop 2D

L’annonce `#news-yuki-halloween` et la barre au-dessus de la navigation sont préparées
pour le **31 octobre 2026 à 00 h 00, Europe/Paris**. Leur publication est programmée
dans le chat ; aucun changement d’état n’est caché derrière l’horloge du navigateur.
Le contenu reste hors de `main` jusqu’à cette échéance. L’application est gratuite,
sans achats intégrés, et la fiche Store porte l’identifiant `9NXR6J4HHC0K`.

Le composant officiel `ms-store-badge` est chargé à l’approche de la zone d’installation,
en `window-mode="direct"`. Il récupère l’installateur Microsoft à la demande du visiteur.
Aucun binaire n’est copié dans le site et aucun téléchargement ne démarre à l’arrivée.
Le lien web de secours reste visible, y compris sans JavaScript ou si le badge ne charge
pas. Sa langue, celle du badge et son contraste suivent les réglages du site.
Le visiteur doit ouvrir l’installateur téléchargé et suivre les étapes de Windows.

Sources, contrôle de la fiche et consignes de publication :
[`docs/YUKI_HALLOWEEN_2026.md`](docs/YUKI_HALLOWEEN_2026.md).

### Vérifications habituelles

Lancer `python -m http.server 8000 --bind 127.0.0.1`, puis ouvrir
`http://127.0.0.1:8000/`. Contrôler l’accueil, les quatre fiches projets, le menu
mobile, les bulles et leur fermeture au clavier. Tester aussi un écran étroit
(320–390 px), la navigation au clavier et le réglage de réduction des animations.
Vérifier aussi le premier clic d’activation audio, les clics successifs, le retour
sur le site sans lecture automatique, la coupure du son et le changement d’onglet.

Le site n’a pas de commande de build ni de lint configurée. Vérification de syntaxe :
`node --check assets/js/main.js` et `node --check assets/js/secrets.js`.
Avec Playwright disponible dans l’environnement de développement et Edge installé,
`node tools/test_site.cjs` lance la suite d’intégration avec son propre serveur local
et un profil de navigateur temporaire. Un argument optionnel désigne le dossier de
captures (hors dépôt). `NODE_PATH` peut désigner les modules fournis par l’environnement ;
`BROWSER_CHANNEL=chrome` permet d’utiliser Chrome. Le test compare aussi la hauteur
de page au commit `cd3d686`, qui doit être présent dans l’historique local.
Les services externes (polices distantes et YouTube inclus) sont bloqués pendant ces
tests ; leur disponibilité publique n’est pas validée par cette suite.

Les secrets stockent uniquement la liste des fragments dans
`youthseiko.fragments.v1`. Si le stockage échoue, la progression continue en mémoire
et un message indique qu’elle ne sera pas forcément conservée au rechargement.
Ni compte, ni collecte, ni appel réseau supplémentaire pour les secrets.

Une modification envoyée sur `main` déclenche la publication GitHub Pages.
Lors d’une mise à jour CSS ou JavaScript, changer aussi leur paramètre `v=` dans
`index.html` pour que les visiteurs récupèrent ces fichiers sans ancien cache.
Les APK de développement et la documentation interne de MIRAI ne sont pas publiés
sur ce site. Ne pas ajouter de lien de téléchargement avant une décision de diffusion.
