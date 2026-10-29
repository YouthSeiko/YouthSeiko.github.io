# Yuki Desktop 2D — annonce Halloween

Préparation du 29 octobre 2026. Publication demandée pour le **31 octobre à 00 h 00,
heure de Paris** (30 octobre à 23 h 00 UTC). La fiche Microsoft Store est déjà accessible ;
la date vise la campagne sur le site, sans modifier la disponibilité Store de l’application.

## Contenu préparé

- Barre Halloween au-dessus de la navigation, lien vers l’actualité d’installation.
- Actualité `#news-yuki-halloween` datée du 31 octobre, placée en tête des nouvelles.
- Mention « PC Windows · Gratuit · Sans achats intégrés », traduite FR/EN/JA.
- Visuel desktop existant, distinct des études 3D. Pas de nouvelle image générique.
- Badge Microsoft officiel en mode direct, avec lien web de secours permanent.
- Fichiers : `index.html`, `assets/css/yuki-launch.css`, `assets/js/yuki-launch.js`,
  catalogue de langues et tests. Les modifications HEART restent hors de cette copie.

## Parcours d’installation

Fiche : https://apps.microsoft.com/detail/9NXR6J4HHC0K

Le badge charge le composant officiel Microsoft uniquement lorsque la zone d’installation
approche de l’écran. Il utilise `productid="9NXR6J4HHC0K"`,
`productname="Yuki Desktop 2D"`, `window-mode="direct"`, sans code de campagne ajouté.
Au clic sur Windows compatible, Microsoft fournit son petit installateur officiel.
Le visiteur l’ouvre et suit les confirmations de Windows. Ce n’est pas une installation
silencieuse. Microsoft décide de l’éligibilité et peut renvoyer vers la fiche Store.
Sur les autres plateformes, le composant utilise la fiche web. Le lien de secours du
site reste accessible si le script Microsoft est bloqué ou JavaScript désactivé.

Ne pas remplacer le composant par un lien `mode=mini` : Microsoft indique que ce mode
ouvre désormais la fiche normale. Ne pas inventer une URL de paquet ni redistribuer un
MSIX/EXE interne pour contourner le Store.

## Sources et contrôles

Consultés le 29 octobre 2026 :

- [Documentation Microsoft de l’installateur web](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-use-store-web-installer-for-distribution).
- [Badge officiel et paramètres](https://github.com/microsoft/app-store-badge/blob/main/README.md).
- [Protocoles Store](https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-store-app).
- Fiche Store publique : données structurées `SoftwareApplication`, nom
  « Yuki Desktop 2D », offre à prix 0, système déclaré « Windows 10 » ; description des
  promenades, cœurs gratuits, lettres et langues FR/EN/JA. Le site indique seulement
  « PC Windows » pour laisser Microsoft vérifier l’appareil. L’absence d’achats intégrés
  a été explicitement confirmée par YU dans sa demande.

Contrôles locaux : 19 scénarios généraux et 9 scénarios de langues/intégration.
Le test Store utilise un substitut pour ne provoquer ni téléchargement ni installation.
Le vrai composant Microsoft a également été chargé dans Edge : badge français affiché,
bon identifiant, mode direct, image officielle complète de 215 px, zéro téléchargement
déclenché. Captures inspectées sur ordinateur et à 320 px ; FR/EN/JA et thème glitch
vérifiés. Aucune installation réelle ni certification Microsoft nouvelle n’a été exécutée.
La comparaison de hauteur avec l’ancienne page reste diagnostique : les actualités
datées peuvent allonger le site, sans invalider les vérifications responsive.

## Exécution programmée

À l’échéance, publier uniquement le commit de cette annonce sur `origin/main`, depuis
une copie propre. Relire les instructions applicables et vérifier l’état distant.
Si `main` a avancé, intégrer le commit au dernier `origin/main` dans une copie isolée,
sans forcer le push ni écraser un contenu récent. Ne pas inclure automatiquement les
modifications HEART de `studio-site/`, ni changer sa branche ou ses fichiers.

Vérifier la réussite GitHub Pages, les fichiers publics, la date, le badge et les trois
langues avant d’annoncer la mise en ligne. Le déploiement prend un délai après le push :
00 h 00 est l’heure demandée pour lancer la publication, pas une garantie à la seconde.
Ne pas installer l’application pour vérifier le site. Signaler un échec ou un besoin
d’action ; ne pas prétendre que la publication a réussi si le contrôle public échoue.

La programmation locale nécessite le PC allumé, connecté et l’application ouverte.
Sans cela, l’exécution à l’heure prévue n’est pas garantie.
