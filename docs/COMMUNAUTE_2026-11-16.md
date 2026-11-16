# Newsletter et espace joueur — préparation du 16/11/2026

Branche isolée feat/community-20261116, copie studio-site-community depuis main 7205026.
Pas de publication ni de configuration distante appliquée. Sources HEART préservées.
Aperçu local : http://127.0.0.1:8769/fr/communaute/ (également en/ja).

## Choix préparés

Supabase Auth + Postgres pour les comptes ; Brevo pour les newsletters illustrées.
Inscription newsletter possible sans compte, via un formulaire hébergé Brevo par langue,
avec confirmation par mail, CAPTCHA et désinscription gérés dans Brevo. Aucun email de
newsletter copié dans le site, aucun abonnement automatique lors de la création de compte.
Les comptes utilisent un code reçu par mail, pas de mot de passe du joueur stocké par le site.
Session gérée par le SDK officiel Supabase 2.119.0, bundle UMD local intact avec licence MIT.
Profil privé : pseudo de 2–32 caractères, avatar autorisé Yuki/Hana/Rei/Mio, langue.
Entrées dans la navigation et le contact, avatar de session affiché après raccordement.
Pas de téléversement d’image ni annuaire public. Les trois pages de compte sont noindex
et ne sont pas ajoutées au sitemap public (48 pages éditoriales restent indexables).

Sources : tools/build_community.py, assets/i18n/community.json, assets/js/community.js,
community-config.js, community-nav.js, assets/css/community.css. Après toute modification :
python tools/build_community.py ; pour le site existant : build_i18n.py puis build_seo.py.

## Raccordement restant — comptes du studio requis

1. Se connecter à Supabase et Brevo. Les deux onglets sont ouverts à l’écran de connexion.
   Ne pas envoyer de mot de passe, clé de service ou secret SMTP dans le chat ou le dépôt.
2. Choisir un projet Supabase dédié au site, distinct des jeux, idéalement région UE.
   Réviser puis appliquer supabase/migrations/202611160001_player_profiles.sql. RLS par
   auth.uid(), droits limités, suppression en cascade liée au compte. À tester réellement
   avec deux identités : A ne lit/modifie pas B ; visiteur anonyme sans accès au profil.
3. Auth : autoriser l’origine publique et les retours utiles, conserver la confirmation
   email. Modèle de mail OTP avec {{ .Token }}. Configurer un SMTP de production : le
   SMTP Supabase par défaut ne convient pas à une ouverture générale aux joueurs.
   Vérifier l’expéditeur et son domaine ; ne pas présenter gmail.com comme domaine du studio.
   Vérifier limites SMTP, quotas et protection anti-abus avant ouverture publique.
4. Déployer la fonction delete-player, qui valide elle-même le bearer token auprès de
   Supabase Auth avant suppression de cette identité vérifiée. SUPABASE_SERVICE_ROLE_KEY
   reste uniquement dans l’environnement serveur. CORS limité au site ; ajouter localhost
   explicitement via ALLOWED_ORIGINS pour un essai de développement si nécessaire.
5. Créer trois formulaires Brevo FR/EN/JA : double opt-in, CAPTCHA, choix de langue/liste,
   information de confidentialité exacte et lien de désinscription. Renseigner leurs URL
   HTTPS dans newsletterUrls. Brouillons de mails illustrés : docs/newsletter/ (3 langues),
   footer {{ unsubscribe }} Brevo ; renseigner la véritable adresse du studio dans le
   paramètre STUDIO_POSTAL_ADDRESS et contrôler le rendu dans l’éditeur avant tout envoi.
   Aucun envoi automatique après une nouvelle GitHub Pages n’est configuré.
6. Dans assets/js/community-config.js : seulement supabaseUrl et clé publique moderne
   sb_publishable_… ; aucune clé admin/service/SMTP/API Brevo. Sans cette configuration,
   la connexion reste désactivée et l’aperçu des avatars ne crée aucun compte.
7. Ajouter les informations exactes du studio sur le traitement des données avant
   activation (prestataires, usages, conservation et exercice des droits) ; ne pas publier
   une politique inventée. Export de profil prévu, suppression de compte avec confirmation ;
   désinscription newsletter indépendante rappelée dans l’interface.
8. Essai réel complet avec l’adresse de test autorisée du studio : réception code,
   connexion/reconnexion, avatar dans l’en-tête, RLS entre deux comptes, export, suppression,
   inscription confirmée newsletter et désinscription. Vérifier coûts/quotas des offres.
   N’ouvrir au public qu’après ces contrôles et accord sur la version prête.

## Vérifications et limites

Tests Node isolés : test_community.cjs (SDK simulé), test_community_delete.cjs (serveur
simulé, TypeScript transformé par Node), syntaxe JS ; générateurs communauté/i18n/SEO et
4 groupes SEO sur 48 pages. Ils n’attestent pas une réception email ou un déploiement Supabase.
Parcours local FR/EN/JA et sélection d’avatar inspectés dans le navigateur, images chargées.
Le réglage de viewport navigateur n’a pas pris la largeur mobile demandée : le rendu 390px
n’est donc pas encore validé par ce contrôle. Aucun secret, profil réel ou contact collecté.

Sources officielles consultées le 16/11 :
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://help.brevo.com/hc/en-us/articles/208771869-Create-a-sign-up-form-in-Brevo
- https://help.brevo.com/hc/en-us/articles/209553645-Insert-a-custom-unsubscribe-link-in-your-emails
- https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC
