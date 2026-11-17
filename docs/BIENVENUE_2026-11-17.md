# Bienvenue après la première connexion — 17/11/2026

Illustration générée à la demande de YU : Yuki, Hana, Rei, Mio et Masaru de dos,
confettis et pancarte « Welcome ». Original assets/media/community/welcome-five-v1.png
(1536×1024). Hébergement Brevo autorisé pour les emails :
https://img.mailinblue.com/12627388/images/content_library/original/6afc4cae492ee872f8d06ea1.png
Aperçus FR/EN/JA : docs/newsletter/welcome-{fr,en,ja}.html ; aperçu local FR
http://127.0.0.1:8769/docs/newsletter/welcome-fr.html.

## Réalisé

- Modèle transactionnel trilingue, destinataire issu exclusivement de Supabase Auth
  vérifié ; nom échappé, langue du profil, aucun abonnement newsletter automatique.
- Migration 202611170001_welcome_email.sql appliquée dans youthseiko-site uniquement.
  Réservation atomique par compte, rôle serveur seulement, identifiant stable par envoi.
  Tests SQL réels welcome_email.sql réussis puis rollback de tous les comptes synthétiques.
- Fonction welcome-player déployée et activée serveur/aperçu local uniquement. Clé
  Brevo dédiée restreinte aux Emails transactionnels transférée dans Supabase après
  accord et code saisi par utilisateur. Aucun secret dans Git.
- Filtre JWT historique OFF autorisé après refus automatique initial ; chaque JWT
  est vérifié auprès d'Auth. Sans JWT401, origine étrangère403, prévol localhost204.
- Connexion réelle protégée Turnstile réussie sur localhost, profil YU/Hana conservé.
  Premier503 corrigé : service_role sans SELECT sur player_profiles. La lecture utilise
  désormais le JWT vérifié du joueur et ses règles RLS, sans élargir les droits admin.
  Test Node spécifique ajouté et réussi.
- 17/11 à 14:02 Paris : une bienvenue envoyée à l'adresse studio, marquée Délivré par
  Brevo. Registre accepted / attempts1 / deliveries1. Rechargements et POST200 suivants
  sans second envoi, même état en base. Réception inbox non attestée directement.
  Captures welcome-delivered.jpg, welcome-deduplication.jpg, welcome-email-preview.jpg
  dans le scratch utilisateur.
- Tests Node client et serveur passent : appels concurrents, destinataire vérifié,
  reconnexion, trois langues, échappement et erreurs fournisseur (services simulés).

## Suite communauté

Aucun push/publication. Newsletter FR/EN/JA terminée et inscriptions réelles confirmées,
désinscription isolée vérifiée : voir newsletter/VALIDATION_2026-11-17.md. Bienvenue
fonctionnelle dans l'aperçu ; elle n'abonne pas à la newsletter. Livraison réelle FR seulement.

Le premier message est envoyé à la première connexion observée après activation
pour un compte sans livraison déjà enregistrée (y compris compte de test existant).
Un succès Brevo est une acceptation fournisseur, pas une preuve de réception en boîte.
En cas d'issue réseau ambiguë, état review sans réessai automatique afin d'éviter les
messages en double ; contrôle opérateur requis. Les 429 explicitement refusés peuvent
être réessayés après 5 minutes, jusqu'à trois tentatives, sur une nouvelle invocation.
Pas de tâche planifiée de relance. Les autres échecs sont conservés pour diagnostic.

Sources : documentation officielle Supabase Edge Functions (ports 25/587 bloqués),
Brevo Send transactional email, idempotencyKey et permissions API ; consultées 17/11.
