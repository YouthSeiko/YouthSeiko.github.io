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

## Raccordement réel — état du 17/11/2026

Projet dédié youthseiko-site, lvauatwuqhevzvjdbuan, région eu-west-1, Free/Nano.
Migration player_profiles appliquée, RLS réelle vérifiée avec deux identités synthétiques
et rollback ; lecture anonyme REST refusée (401/42501). OTP reçu par l'adresse studio,
connexion réelle réussie, profil YU/Hana sauvegardé et conservé au rechargement.
SMTP Brevo enregistré avec une clé dédiée, expéditeur vérifié youthseiko@gmail.com ;
ce domaine Gmail n'est pas un domaine propre au studio. Limites observées : Auth 30/h,
Brevo 300/jour partagés. Modèles OTP FR/EN/JA dans supabase/templates/email-otp.html.
Ne jamais publier de secret SMTP/admin/API dans le site.

Fonction delete-player déployée : validation explicite du JWT par Auth, origine exacte,
identité cible issue du token ; clé serveur moderne ou héritée seulement côté Supabase.
Vérifications réelles des requêtes sans JWT/invalide/origine étrangère et prévol passent.
Aucune suppression réelle du compte YU. ALLOWED_ORIGINS : site public et 127.0.0.1:8769 ;
ajouter localhost:8769 pour les prochains essais protégés. Tests Node auth, suppression,
welcome et navigation passent ; correction des réponses concurrentes d'avatar testée en VM,
à recontrôler visuellement. Rendu mobile 390px non attesté (viewport ignoré auparavant).

Quatre widgets Turnstile créés après accord explicite : Site Auth et Newsletter FR/EN/JA.
Protection HEART existante intacte. Auth enregistrée dans Supabase, clé publique seule
intégrée au client. Hôtes Auth : youthseiko.github.io et localhost ; utiliser localhost,
127.0.0.1 n'étant pas accepté dans la liste Cloudflare. Parcours OTP réel protégé réussi le 17/11 via localhost. Clés privées conservées uniquement dans les services/runtime de transfert.

Brevo : formulaire FR id 6afad1cf1e8207dca056a832, conception et consentement requis
préparés ; Turnstile FR renseigné, sauvegarde/étapes listes, double opt-in et URL à vérifier.
Formulaires EN/JA et leurs protections pas encore raccordés. Les trois newsletterUrls restent
vides. Adresse postale studio, informations exactes de confidentialité et essai DOI/
désinscription à terminer avant ouverture. Aucun abonnement ou campagne envoyé.
Le retrait initial du CAPTCHA a été refusé par l'auto-review ; bloc conservé, voie sûre
Turnstile choisie et autorisée. Ne pas contourner ce refus.

Nouveau mail de bienvenue demandé le 17/11 : image générée, hébergée Brevo, modèles FR/EN/JA,
migration et tests SQL réels réussis, fonction activée dans l’aperçu : une bienvenue studio marquée Délivré par Brevo,
rechargements sans doublon vérifiés. Voir BIENVENUE_2026-11-17.md pour la validation.
Aucune nouvelle publication du site. Travail isolé dans studio-site-community,
branche feat/community-20261116 ; HEART et autres copies préservés.

Sources officielles consultées le 16/11 :
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://help.brevo.com/hc/en-us/articles/208771869-Create-a-sign-up-form-in-Brevo
- https://help.brevo.com/hc/en-us/articles/209553645-Insert-a-custom-unsubscribe-link-in-your-emails
- https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC
