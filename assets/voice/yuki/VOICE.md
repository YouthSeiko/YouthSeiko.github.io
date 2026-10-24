# Yuki — voix japonaise du site

Crédit : **VOICEVOX:春日部つむぎ** (Kasukabe Tsumugi, style ノーマル, id 8).
Génération locale avec le même moteur VOICEVOX 0.26.0 que pour Akari.
Le personnage représenté reste **Yuki**, la mascotte originale du studio.

20 répliques japonaises, avec adaptations françaises affichées dans les bulles.
Direction : tsundere gothique, réparties boudeuses mais bienveillantes ; carnet à
croix et porte-clés chauve-souris. Débit 1,08 ; hauteur -0,015 ; intonation 1,28.
Ce réglage ne remplace pas le jeu d’une comédienne. Une relecture par une personne
japonophone et la validation artistique du studio restent souhaitables.

MP3 mono 24 kHz / 64 kbit/s, normalisation -19 LUFS, limite -3 dBTP.
Textes et réglages : `tools/yuki-lines.json`. Catalogue navigateur généré :
`assets/js/yuki-lines.js`. Empreintes : `generation.json`.
Les WAV et requêtes intermédiaires restent hors dépôt, dans `yuki-voice-source-v1`.

Reproduire : lancer le moteur local puis `python tools/generate_yuki.py`.
Python standard et FFmpeg suffisent. Les fichiers dont le texte japonais et les
réglages n’ont pas changé sont conservés. Aucun moteur n’est distribué sur le site.

- https://voicevox.hiroshiba.jp/product/kasukabe_tsumugi/
- https://tsumugi-official.studio.site/rule
- https://voicevox.hiroshiba.jp/term/
