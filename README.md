# Youthseiko — site du studio

Site statique HTML/CSS/JavaScript, publié par GitHub Pages depuis `main`.
Aucune dépendance de compilation ni compte visiteur.

## Modifier

- `index.html` : projets, fiches détaillées, actualités et informations publiques.
- `assets/css/style.css` : identité pastel, cartes et adaptation mobile.
- `assets/js/main.js` : navigation, fenêtres de projets, galerie et mascotte.
- Les répliques de la mascotte sont dans le tableau `lines` en fin de `main.js`.
  Une réplique apparaît à chaque chargement ; cliquer sur la mascotte en tire une autre.
  La bulle se ferme après 14 secondes (sauf survol ou focus), avec sa croix ou Échap.
  Le dernier choix est mémorisé uniquement dans la session du navigateur pour éviter
  une répétition immédiate. Le site fonctionne aussi si ce stockage est bloqué.
- `assets/img/studio-mascot.jpg` : image fournie par le studio, conservée telle quelle.
- `assets/img/project-mirai-keyart.png` : illustration d’accueil du prototype MIRAI.

## Vérifier avant publication

Lancer `python -m http.server 8000 --bind 127.0.0.1`, puis ouvrir
`http://127.0.0.1:8000/`. Contrôler l’accueil, les quatre fiches projets, le menu
mobile, les bulles et leur fermeture au clavier. Tester aussi un écran étroit
(320–390 px), la navigation au clavier et le réglage de réduction des animations.

Une modification envoyée sur `main` déclenche la publication GitHub Pages.
Lors d’une mise à jour CSS ou JavaScript, changer aussi leur paramètre `v=` dans
`index.html` pour que les visiteurs récupèrent ces fichiers sans ancien cache.
Les APK de développement et la documentation interne de MIRAI ne sont pas publiés
sur ce site. Ne pas ajouter de lien de téléchargement avant une décision de diffusion.
