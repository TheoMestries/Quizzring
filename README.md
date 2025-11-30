# Quizzring

Page d'accueil statique très épurée pour héberger tes épreuves de quiz.

## Utilisation
- Ouvre `index.html` dans ton navigateur (double-clic) : aucun serveur n'est nécessaire.
- Chaque bloc "Bouton" est un emplacement prêt à remplacer par ton propre lien ou script.
- Duplique les blocs dans le HTML si tu as besoin de plus d'emplacements.

## Personnalisation rapide
- Remplace les libellés des blocs dans la grille pour nommer tes épreuves.
- Ajoute des `<a>` ou `<button>` dans chaque bloc pour relier tes jeux ou pages externes.
- Ajuste les couleurs de base dans `styles.css` (variables CSS en haut du fichier) si besoin.

## Mode multijoueur (prototype local)
- `player.html` : salle d'attente pour les joueurs. Ils saisissent leur pseudo Discord (et l'URL d'avatar) puis restent sur la page.
- `admin.html` : interface hôte pour lancer une épreuve et visualiser la liste des joueurs connectés.
- Les états sont synchronisés entre les onglets du même navigateur grâce au stockage local et à `BroadcastChannel` (idéal pour une démo sans serveur).
