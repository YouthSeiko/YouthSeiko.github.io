# Youthseiko — site du studio

Site statique HTML/CSS/JavaScript, publié par GitHub Pages depuis `main`.
Aucune dépendance de compilation ni compte visiteur.

## Modifier

- `index.html` : projets, fiches détaillées, actualités et informations publiques.
- `assets/css/style.css` : identité pastel, cartes et adaptation mobile.
- `assets/js/main.js` : navigation, fenêtres de projets, galerie et mascotte.
- **Yuki** est la mascotte tsundere gothique : carnet à croix, porte-clés chauve-souris.
  Ses 20 répliques françaises et japonaises sont dans `tools/yuki-lines.json`.
  Le catalogue navigateur `assets/js/yuki-lines.js` est généré à partir de ce fichier.
  Une réplique française apparaît à chaque chargement ; cliquer sur Yuki en tire une autre.
  La bulle se ferme après 14 secondes (sauf survol ou focus), avec sa croix ou Échap.
  Le dernier choix est mémorisé uniquement dans la session du navigateur pour éviter
  une répétition immédiate. Le site fonctionne aussi si ce stockage est bloqué.
  Le bouton **Voix : OFF** active le doublage japonais de la phrase affichée.
  Ensuite, cliquer sur Yuki change à la fois la voix et le sous-titre français.
  **Voix : ON** coupe le son. La préférence est enregistrée localement si possible.
  Au retour sur le site, le bouton **Écouter** attend un clic : aucun son imposé à
  l’ouverture, même si la voix était activée. Les sons s’arrêtent à la fermeture
  de la bulle, lors d’un changement d’onglet ou à l’ouverture d’une fiche projet.
  Une seule réplique est chargée au clic ; les voix ne se superposent pas.
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

## Vérifier avant publication

Lancer `python -m http.server 8000 --bind 127.0.0.1`, puis ouvrir
`http://127.0.0.1:8000/`. Contrôler l’accueil, les quatre fiches projets, le menu
mobile, les bulles et leur fermeture au clavier. Tester aussi un écran étroit
(320–390 px), la navigation au clavier et le réglage de réduction des animations.
Vérifier aussi le premier clic d’activation audio, les clics successifs, le retour
sur le site sans lecture automatique, la coupure du son et le changement d’onglet.

Une modification envoyée sur `main` déclenche la publication GitHub Pages.
Lors d’une mise à jour CSS ou JavaScript, changer aussi leur paramètre `v=` dans
`index.html` pour que les visiteurs récupèrent ces fichiers sans ancien cache.
Les APK de développement et la documentation interne de MIRAI ne sont pas publiés
sur ce site. Ne pas ajouter de lien de téléchargement avant une décision de diffusion.
