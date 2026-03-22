# Mini jeu en réalité augmenté codé en Three.js + TypeScript où le joueur doit reconnaître des Pokémon 3D.


Une Version web est disponible avec le lien https://julienmrs.github.io/webxrapp/
--
##  Pour lancer le projet en local

### Prérequis

- Node.js (https://nodejs.org)
- npm (installé avec Node)

Vérifier l’installation :

```bash
node -v
npm -v
```
### Installation du projet
Dans le dossier du projet (après avoir cloné ou téléchargé le dépôt), installez les dépendances :
```bash
npm install
```

Lors du premier lancement, lancez la commande :
```bash
npm run build; npm run dev
```

Ensuite, pour les lancements suivants:
```bash
npm run dev
```

## Déroulement d'une partie
Au lancement on est accueilli par une phrase nous invitant à appuyer sur l'écran pour lancer le jeu, une fois cela fait la première manche commence.
Le principe du jeu est de reconnaitre les pokemons (noms en anglais) à l'aide de leur modèles 3D, certains ont des modèles en couleurs normales, d'autre ont des couleurs alternatives (tadmorv) et d'autre sont en noir.
Les différents modèle sont placés dans une sphère tout autour du joueur, pour valider une tentative, il faut regarder un pokémon et toucher son écran.
Si le modèle correspond avec le nom demandé, le modèle disparait et on passe au prochain pokemon de la manche.
Il y a initialement 3 vies au lancement du jeu, à chaque erreur on perd une vie, la partie s'arrète quand le nombre de vies atteint 0. 
Pour finir une manche il faut réussir à associer correctement tous les pokémons environnant à leur nom, en faisant cela on remporte une vie supplémentaire et on peut lancer une nouvelle manche.  
Chaque nouvelle manche contient deux modèles supplémentaire à la manche précédente, le jeu commence à 5 modèles
La partie se déroule en plusieurs manches avec une difficulté croissante, il y a de plus en plus de pokemons à trouver soit plus de chance de se tromper, le but étant de faire le score le plus haut s'en perdre la partie.


## Exemple d'interraction:
  
  #### Gameplay normal on regarde le modèle qu'on pense correspondre avec le nom demandé:
  <img width="351" height="330" alt="image" src="https://github.com/user-attachments/assets/52ae3c35-f653-4471-a0bf-15880c0e96d4" /> \
  Puis on touche l'écran pour valider il y a alors deux possibiltés :          
 Bonne réponse le modèle disparaît et on remporte 1 point     
 <img width="319" height="244" alt="image" src="https://github.com/user-attachments/assets/39b0a3c0-121f-4865-9ae2-f0f31c38bad8" />    

Mauvaise réponse on perd une vie, s'il reste des vies on continue à essayer de chercher le bon pokémon    
<img width="303" height="331" alt="image" src="https://github.com/user-attachments/assets/47a824a7-8b20-4d40-9f43-f53c96ab0de1" />
    

Sinon c'est la Fin du jeu et le score s'affiche.   
<img width="253" height="297" alt="image" src="https://github.com/user-attachments/assets/ff2b3c8f-10c0-4a5a-9d30-8e127bd68b14" />


