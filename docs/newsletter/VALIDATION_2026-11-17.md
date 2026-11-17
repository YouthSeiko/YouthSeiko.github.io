# Newsletter FR / EN / JA — validation du 17/11/2026

Les trois formulaires Brevo hébergés sont configurés et raccordés dans l'aperçu local.
Le site public reste inchangé ; aucune campagne marketing n'a été envoyée.

| Langue | Formulaire | Liste | Modèle DOI |
| --- | --- | --- | --- |
| FR | 6afad1cf1e8207dca056a832 | Youthseiko Newsletter FR #5 | Youthseiko DOI FR #5 |
| EN | 6afc52e50cb5eca1c3eec16d | Youthseiko Newsletter EN #6 | Youthseiko DOI EN #6 |
| JA | 6afc547e21a255498551e063 | Youthseiko Newsletter JA #7 | Youthseiko DOI JA #7 |

URL publiques : public-forms.json. Copies éditoriales : form-copy.json. Modèles de mails :
double-optin-{fr,en,ja}.html, activation vérifiée dans Brevo. Le lien obligatoire est
{{ doubleoptin }} ; consentement identique au formulaire, aucun contenu promotionnel.
Expéditeur vérifié youthseiko@gmail.com ; Brevo utilise son domaine de remplacement
pour la délivrabilité. Aucun domaine propre au studio n'est revendiqué.

## Contrôles réalisés

- Consentement requis, initialement décoché ; un essai FR sans accord est refusé avec
  le message de champ obligatoire. Champ email requis. CAPTCHA Turnstile distinct par
  formulaire, hôte sibforms.com ; clés privées uniquement transférées dans Brevo.
- Double confirmation sélectionnée sur chaque formulaire, modèle de la même langue,
  une seule liste correspondante. Les listes historiques et la protection HEART sont intactes.
- Soumissions réelles à l'adresse studio : trois messages de confirmation localisés
  déclenchés et marqués Délivré par Brevo ; utilisateur confirme les trois liens.
  Vérification réelle : adresse studio présente dans les listes #5, #6 et #7.
- Textes des formulaires publics contrôlés après enregistrement/rechargement, dont
  libellé email et aide japonais. L'éditeur Brevo requiert des événements clavier pour
  certains contenteditables : fill/paste seuls pouvaient montrer un texte sans le sauver.
- Trois boutons newsletter locaux FR/EN/JA inspectés : chaque href correspond exactement
  à l'URL de sa langue ; newsletter non liée automatiquement à un compte joueur.
- Test de désinscription isolé : youthseiko+newsletter-test@gmail.com, sans toucher à
  l'adresse principale. Historique Brevo atteste double opt-in cliqué et abonnement,
  puis désinscription par formulaire. Préférences : campagnes/automatisations Blocklisté,
  emails transactionnels Abonné. Le contact reste dans la liste pour conserver l'historique,
  ce qui ne signifie pas qu'il reçoit encore les campagnes. Aucun contact supprimé.
- Page de désinscription dédiée (titre et messages trilingues), formulaire
  6afc562c21a255498551e0e5 ; URL publique dans verification-2026-11-17.json. Les désinscriptions
  Brevo bloquent les campagnes marketing du compte ; le test a donc utilisé un alias isolé.
  Aucun réglage global d'une campagne HEART existante n'a été modifié.

Preuves JPEG dans le scratch utilisateur : newsletter-three-confirmed.jpg,
newsletter-unsubscribe-success.jpg, newsletter-unsubscribe-status.jpg,
newsletter-community-ready.jpg. Les preuves d'écran ne remplacent pas le statut serveur.
Test Node communauté et syntaxe configuration passent. Aucun push effectué.

## Avant la première vraie campagne

Les brouillons premiere-lettre-* restent des brouillons, sans envoi automatique après
publication du site. Renseigner l'adresse postale réelle du studio dans leur paramètre
STUDIO_POSTAL_ADDRESS (ne pas publier une adresse privée sans accord), conserver le lien
Brevo {{ unsubscribe }}, sélectionner la liste de la langue et vérifier le rendu. Le test
ci-dessus valide le formulaire de désinscription ; aucun lien personnalisé d'une campagne
réelle de masse n'a été envoyé/testé. Aucun abonnement public autre que les essais studio.

Sources officielles consultées :
- https://help.brevo.com/hc/en-us/articles/208771869-Create-a-sign-up-form-in-Brevo
- https://help.brevo.com/hc/en-us/articles/360019540880-Create-a-custom-double-opt-in-DOI-email-template-for-a-sign-up-form-created-in-Brevo
