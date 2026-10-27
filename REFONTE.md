# Refonte éditoriale et découvertes — 27 octobre 2026

Travail local sur `feat/editorial-secrets`, à partir de `cd3d686`.
Le dépôt était propre au démarrage. Aucun envoi sur `main`, aucune publication.

## Audit et décisions éditoriales

| Section | Répétition constatée | Modification |
| --- | --- | --- |
| Accueil | Le texte et le sous-titre projets reformulaient les mêmes univers et états | Présentation raccourcie, accès aux quatre jeux ; les deux illustrations restent en place |
| Cartes projets | Accroche, description, puis détails répétés dans les fiches | Une accroche, les genres et l’état restent sur chaque carte ; descriptions détaillées conservées dans les quatre fiches |
| Studio | Liste des quatre univers déjà présentés et long paragraphe reformulant les valeurs | Introduction courte, quatre valeurs et leurs icônes conservées avec des textes plus directs |
| Carnet de YU | Présentation de YU répétée ; MIRAI reprenait l’annonce Android et les fonctionnalités ; HEART résumait sa fiche | Trois billets conservés, recentrés sur les idées en attente, le confort tactile et les questions d’écriture ; illustrations, dates, liens, annotations de Yuki et identifiants conservés |
| FAQ | Identité déjà dans le profil, différences de genres déjà dans Studio ; démos et sorties proches | Deux questions : disponibilité/dates fusionnées, rôle de Yuki conservé |
| Actualités | Introduction promotionnelle et liste de contenus futurs ; une seule annonce datée réelle | Annonce Android raccourcie, suppression du catalogue de promesses ; maximum trois annonces visibles puis accordéon d’historique |
| Contact / soutien | Deux paragraphes sur le studio et un second bloc répétant le même appel | Un seul espace avec contact, nouvelles et Ko-fi ; doublon Ko-fi du pied de page supprimé |
| Yuki | Trois lignes rappelaient les projets déjà présentés | Filtrage de ces trois lignes au tirage ; 20 fichiers audio préservés, 17 répliques habituelles utilisées et quatre nouvelles réactions écrites |

Les textes de fiches, la galerie HEART, l’OST, les illustrations officielles,
les compositions CSS, les animations existantes, les favicons, le crédit vocal,
les métadonnées et les anciennes ancres sont conservés. Les ancres
`project-babylone` et `project-century` ont été ajoutées.

La page mesurée dans Edge avec ressources externes bloquées passe de 10 198 à
8 681 pixels à 1 440 px de large (environ −15 %), et de 13 890 à 11 117 pixels
à 390 px (environ −20 %). Mesures comparatives de test, sensibles aux polices et
aux éléments ouverts ; ce ne sont pas des mesures universelles de tous les appareils.

À la demande de YU, les symboles sont rétablis directement dans les titres des
cartes et des fiches : 💉 MIRAI, 💗 HEART, 🧊 BABYLONE, 🌼 CENTURY. Les raccourcis
d’accueil et les vignettes illustrées reprennent ces repères. La seringue est aussi
ajoutée au décor flottant de l’accueil et devient le symbole du fragment MIRAI.
Dans la carte, elle sert de déclencheur au terminal ; un symbole de remplacement
reste visible sans JavaScript. Les étoiles décoratives du studio sont conservées.

## Parcours des secrets

Ces solutions sont documentées pour la maintenance. Les expériences sont des
fantaisies du studio, hors récit canonique ; aucun document de jeu interne n’est utilisé.

1. **HEART — le carnet à croix.** Cliquer ou activer au clavier l’avatar de Yuki
   sept fois. Réactions aux clics 1, 3, 5 et 7. Le bouton de carnet apparaît dans
   sa bulle. Tourner deux pages, puis garder le fragment dans la reliure. Dessin
   de chauve-souris, notes manuscrites, lignes effacées, bord arraché et cœur
   inachevé sont réalisés en HTML/CSS/SVG. La visite du carnet seule ne suffit pas.
2. **MIRAI — le signal médical.** La seringue dans le titre de la carte.
   Ouvrir le dossier V-04, comparer les deux relevés puis isoler le fragment.
   Protocoles, Vectrices et données corrompues sont fictifs, sans identité cachée
   ni révélation sur les antagonistes. Aucun terminal réel ni saisie de commande.
3. **BABYLONE — la pièce blanche.** Cube à côté de la devise de curiosité du
   studio. Lire l’inscription, voir l’autre côté, examiner le cube, prendre le
   fragment. Examiner d’abord l’objet donne un indice sans accorder de récompense.
4. **CENTURY — les messages oubliés.** Une notification apparaît dans la carte
   quand elle entre dans le champ de lecture. Elle se masque et ne revient pas
   pendant cette visite ; l’enveloppe permet de rouvrir la conversation. Lire
   quatre messages supplémentaires, examiner `32 / 13 / 0000`, puis conserver
   le fragment. Aucune réponse utilisateur, aucun texte saisi, aucun minuteur.
5. **ARCHIVES — YOUTHSEIKO.** Accès discret dans le pied de page et à la fin de
   chaque expérience. Quatre emplacements, état de progression et indices
   facultatifs. L’Archive 000 nécessite les quatre fragments puis une activation
   explicite. Son message et son sceau abstrait sont un contenu expérimental,
   clairement présenté comme pouvant évoluer.

La fermeture, Échap, le retour de focus, les déplacements Tab/Maj+Tab et le
verrouillage du défilement sont partagés avec les fiches. Les archives peuvent
s’ouvrir au-dessus d’une expérience et la rendre à nouveau active à leur fermeture.
Toutes les interfaces ont un bouton de fermeture. Les nouvelles réactions écrites
de Yuki interrompent la voix précédente : aucun doublage non concordant ni son automatique.

## Architecture et évolution

- `index.html` : déclencheurs et fenêtres natives `<dialog>`. Le contenu expérimental
  reste séparé du contenu de présentation ; les contrôles secrets sont cachés tant
  que leur module n’a pas démarré.
- `assets/css/secrets.css` : styles propres aux quatre expériences et aux archives,
  adaptations aux petits écrans et réduction des mouvements.
- `assets/js/main.js` : navigation, fenêtres, audio, distribution des annonces.
  Émet `youthseiko:dialog-open` et l’événement annulable `youthseiko:yuki-interaction`.
- `assets/js/secrets.js` : registres `FRAGMENTS` et `ARCHIVES`, conditions `canClaim`,
  progression de chaque scène, persistance et événements de récompense.
- `youthseiko:fragment-found` : détail `{ id, count }`, point d’extension pour un
  effet cosmétique local ultérieur. Aucune récompense additionnelle inventée ici.

Pour ajouter un fragment : ajouter une entrée dans `FRAGMENTS`, une scène avec
`data-claim`, une condition dans `canClaim`, un emplacement `data-feedback`, puis
son déclencheur. Les slots et le compteur sont générés depuis le registre.
Pour ajouter une archive : ajouter son bouton et son document HTML, puis son entrée
dans `ARCHIVES` avec ses prérequis. Les prérequis de 000 restent explicitement les
quatre fragments initiaux, même si un cinquième est ajouté.
Un easter egg temporaire peut réutiliser ces mécanismes ; ajouter des bornes de
date explicites lors de sa création, sans invalider les fragments déjà acquis.
Les indices se modifient dans le registre, indépendamment des scènes.

Sauvegarde : clé `youthseiko.fragments.v1`, objet
`{ "version": 1, "fragments": ["HEART", "MIRAI"] }`.
Seuls les identifiants connus sont acceptés, les doublons sont éliminés. Une
sauvegarde mal formée n’interrompt pas la page ; elle est remplacée à la prochaine
découverte. Un stockage interdit ou plein conserve la progression de la visite
en mémoire et indique la limite à l’utilisateur. Les découvertes d’autres onglets
sont prises en compte ; les acquisitions relisent la sauvegarde avant écriture.
Ce stockage local d’un site statique sert à l’exploration, pas à protéger un contenu
confidentiel. Aucun contenu réellement secret ne doit être ajouté aux fichiers publics.

## Vérifications

`tools/test_site.cjs` : 17 scénarios d’intégration passés dans Edge sans fenêtre,
profil temporaire et serveur HTTP local ; aucune erreur JavaScript observée.

- Identifiants uniques, ancres, noms accessibles des fenêtres et ressources locales.
- Absence d’octroi à l’arrivée, à l’ouverture d’une scène ou par activation prématurée.
- Quatre parcours complets, verrouillage de 000, rechargement, reprise des acquis.
- Notification masquée, carnet paginé, ordre des actions et indices de la pièce.
- Fenêtres imbriquées, Échap, retour de focus et boucle de tabulation.
- Quatre fiches existantes, galerie/lightbox HEART, FAQ, voix activée au clic,
  coupure à la réaction écrite et à l’ouverture d’une fenêtre, absence d’autoplay au retour.
- Rendus à 320, 390 et 760 px, absence de débordement horizontal dans les fenêtres,
  menu mobile ; parcours complet avec événements tactiles simulés à 320 px.
- `prefers-reduced-motion`, stockage bloqué, quota dépassé, sauvegarde mal formée,
  filtrage des IDs inconnus, synchronisation entre onglets.
- Répartition de cinq actualités fictives de test : trois visibles, deux dans l’historique.
  Ces données de test ne sont jamais écrites dans le site.
- Présentation, projets, actualité et FAQ utilisables sans JavaScript.

Syntaxe JavaScript vérifiée avec `node --check`. Le dépôt n’a ni lint ni build
configurés : HTML/CSS/JS servis directement, chemins compatibles avec GitHub Pages,
aucune dépendance ajoutée pour les visiteurs. Playwright est un outil de test uniquement.
Captures de contrôle enregistrées hors dépôt dans `studio-site-preview/editorial-secrets`.

## Validation éditoriale avant publication

- Relire les trois billets reformulés dans la voix de YU : ce sont des propositions
  éditoriales, pas le récit inventé de nouvelles sessions de développement.
- Valider les textes expérimentaux de Yuki, du terminal, des messages et de 000.
  La date impossible n’est ni une date de sortie ni une information de lore.
- Les décors et dessins des secrets sont des représentations simples, provisoires.
  Ils peuvent être remplacés par des assets officiels approuvés ; aucun asset ne
  manque pour utiliser les interactions. Ne pas remplacer les illustrations publiques
  par des visuels génériques.
- Les quatre nouvelles réactions de Yuki n’ont pas de doublage : une génération
  japonaise assortie pourra être ajoutée ultérieurement si souhaitée.
- La vidéo « Derrière le masque » attend toujours l’URL fournie par YU.
- Essais réalisés sur navigateur Windows et simulations mobiles, pas sur téléphones
  physiques ni avec lecteur d’écran réel. YouTube et les polices distantes sont
  exclus de la suite locale. Le résultat publié et GitHub Pages devront être
  vérifiés après une autorisation de publication distincte.
