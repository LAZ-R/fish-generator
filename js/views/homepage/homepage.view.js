import { APP_NAME, APP_VERSION } from "../../../app-properties.js";
import { playMusic } from "../../services/music.service.js";
import { ICONS } from "../../data/svgIcons.data.js";
import { APP_BASE_PATH, APP_ORIGIN, toExternalPath } from "../../router.js";
import { getSvgIcon } from "../../services/icons.service.js";
import { updateMenuDom } from "../../services/menu.service.js";
import { getUser, setUser } from "../../services/storage.service.js";
import { showToast } from "../../services/toast.service.js";
import { isLaptopOrUp, isPhone, isTablet } from "../../utils/breakpoints.js";
import { getRandomIntegerBetween } from "../../utils/math.utils.js";
import { CURRENT_PRESET, CURRENT_ZOOM, getQuarterBounds, initNewMap, isHiddenPointInBounds, setPreset, zoomToQuarter } from "../../services/island-map.service.js";
import { NEIGHBOUR_PROFILES, PRESETS } from "../../data/island-presets.data.js";
import { initNewFish } from "../../services/fish-generation.service.js";

// VARIABLES //////////////////////////////////////////////////////////////////////////////////////
const HEADER_ICON_CONTAINER = document.getElementById('headerIconContainer');
const HEADER_TITLE = document.getElementById('headerTitle');
const MAIN = document.getElementById('main');
const FOOTER = document.getElementById('footer');

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////

export function render() {
  // Set HEADER layout
  if (isPhone || isTablet) {
    HEADER_TITLE.innerHTML = '';
  }
  if (isLaptopOrUp) {
    HEADER_TITLE.innerHTML = APP_NAME;
  }

  // Set MAIN layout
  MAIN.innerHTML = `
  <div class="page-container homepage">
    <h1>Bienvenue sur FISH GENERATOR</h1>

    <hr>

    <h2>Fonctionnement</h2>

    <h3>Génération</h3>
    <p>
      Chaque poisson est généré procéduralement sur une grille de <strong>16 x 16 pixels</strong>, à partir d'un corps fixe et de plusieurs éléments variables : 
      position de l'oeil, queue, nageoire dorsale, nageoire ventrale, motif bicolore et couleurs.
    </p>

    <hr>

    <h2>Chiffres clés</h2>

    <h3>Diversité morphologique</h3>

    <span>Le générateur produit :</span>
    <ul>
      <li><strong>6</strong> positions d'oeil possibles</li>
      <li><strong>286</strong> formes de queue</li>
      <li><strong>362</strong> formes de nageoire dorsale</li>
      <li><strong>164</strong> formes de nageoire ventrale</li>
    </ul>
    <p class="lzr-margin-bottom">
      En combinant uniquement ces éléments de silhouette, on obtient :<br>
      <strong>101 875 488 morphologies différentes</strong>
    </p>
    <p class="lzr-margin-bottom">
      Selon la génération, un poisson occupe entre <strong>47 et 81 pixels</strong>, avec une moyenne d'environ <strong>58 pixels</strong>.<br>
      Cela garantit une silhouette cohérente tout en conservant des variations de volume et de présence visuelle.
    </p>

    <h3>Motif bicolore</h3>
      
    <p>
      Chaque cellule colorable du poisson reçoit indépendamment une couleur principale ou une couleur secondaire.
    </p>
    <ul>
      <li>Couleur principale : <strong>50,495 %</strong></li>
      <li>Couleur secondaire : <strong>49,505 %</strong></li>
    </ul>
    <p>
      Un poisson possède entre <strong>46 et 80 cellules colorables</strong> (le corps fixe compte 36 cellules et l'oeil n'est pas recoloré).<br>
      Pour un poisson donné avec N cellules colorables, il existe <strong>2<sup>N</sup> motifs possibles</strong>.
    </p>

    <ul>
      <li>Minimum : <strong>2<sup>46</sup></strong></li>
      <li>Maximum : <strong>2<sup>80</sup></strong></li>
    </ul>

    <h3>Combinaisons sans les couleurs</h3>

    <p>En combinant :</p>
    <ul style="margin-bottom: 0;">
      <li>la morphologie</li>
      <li>le motif bicolore</li>
    </ul>
    <p class="lzr-margin-bottom">
      On obtient :<br>
      <strong>31 227 846 418 508 111 455 023 267 840</strong><br>
      (soit environ <strong>3,123 x 10<sup>28</sup></strong>) combinaisons différentes.
    </p>

    <p class="lzr-margin-bottom">
      Même sans les couleurs, l'espace combinatoire est déjà extrêmement vaste.
    </p>

    <h3>Couleurs</h3>

    <h4>Rareté</h4>

    <p>
      Certaines combinaisons uniques de 2 couleurs sont plus rares que d'autres, et suivent les probabilités suivantes :
    </p>
    <ul>
      <li>Normal : <strong>98,9110 %</strong></li>
      <li>
        Shiny (total) : <strong>0,9891 %</strong> soit environ <strong>1 sur 101,1</strong>
        <ul style="margin-bottom: 0;">
          <li>Albinos : <strong>0,7345 %</strong> soit environ <strong>1 sur 136,1</strong></li>
          <li>Mélanistique : <strong>0,2546 %</strong> soit environ <strong>1 sur 392,7</strong></li>
        </ul>
      </li>
      <li>Légendaire : <strong>1 sur 1001</strong> soit environ <strong>0,0999 %</strong></li>
    </ul>

    <h4>Combinaisons</h4>

    <ul>
      <li>Normal : <strong>1 472 147 849 041</strong> combinaisons distinctes</li>
      <li>Albinos : <strong>2016</strong> combinaisons distinctes</li>
      <li>Mélanistique : <strong>396</strong> combinaisons distinctes</li>
      <li>Légendaire : <strong>1</strong> combinaison unique</li>
    </ul>
    
    <h3>Nombre total de poissons possibles</h3>

    <p>En combinant :</p>
    <ul style="margin-bottom: 0;">
      <li>la morphologie</li>
      <li>le motif bicolore</li>
      <li>les couleurs</li>
    </ul>
    <p>
      Le nombre total de poissons distincts est estimé à :<br>
      <strong>45 972 007 010 542 205 178 583 669 506 233 975 439 360</strong><br>
      Soit environ <strong>4,597 x 10<sup>40</sup></strong>.
    </p>
    <p class="lzr-margin-bottom">
      En clair, ce générateur ne produit pas “beaucoup” de poissons.<br>
      Il produit un nombre <strong>astronomique</strong> de poissons possibles.
    </p>

    <p>
      Même en générant <strong>1 milliard de poissons par seconde</strong> depuis le Big Bang,
      on serait encore très loin d'épuiser toutes les combinaisons théoriques du générateur.
    </p>

    <p>
      Pour chaque grain de sable sur Terre (≈ 10<sup>18</sup>), on pourrait avoir environ
      <strong>45 972 milliards de milliards de poissons différents</strong>.
    </p>

    <p>
      Pour chaque étoile dans l'univers observable (≈ 10<sup>23</sup>), on pourrait avoir environ
      <strong>459 millions de milliards de poissons différents</strong>.
    </p>
  </div>

  <div id="usernamePopupContainer" class="pop-up-container hidden">
    <div class="pop-up">
      <span>Nom d'utilisateur</span>
      <input id="usernameInput" type="text" class="lzr-input" />
      <button onclick="onStartClick()" class="lzr-button lzr-solid lzr-success">Démarrer</button>
    </div>
  </div>
  `;

  updateMenuDom('homepage');

  let user = getUser();
  if (user.NAME == null) {
    document.getElementById('usernamePopupContainer').classList.remove('hidden');
  }
}

function onStartClick() {
  let username = document.getElementById('usernameInput').value;
  let user = getUser();
  user.NAME = username;
  setUser(user);
  document.getElementById('usernamePopupContainer').classList.add('hidden');
}
window.onStartClick = onStartClick;
