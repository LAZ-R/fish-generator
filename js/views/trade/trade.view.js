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
import { getFishDom, initNewFish } from "../../services/fish-generation.service.js";
import { downloadFishFile, onImportFishFileClick } from "../../services/fish-trade.service.js";

// VARIABLES //////////////////////////////////////////////////////////////////////////////////////
const HEADER_ICON_CONTAINER = document.getElementById('headerIconContainer');
const HEADER_TITLE = document.getElementById('headerTitle');
const MAIN = document.getElementById('main');
const FOOTER = document.getElementById('footer');

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////

export function render() {
  // Set HEADER layout
  if (isPhone || isTablet) {
    HEADER_TITLE.innerHTML = 'Échanges';
  }
  if (isLaptopOrUp) {
    HEADER_TITLE.innerHTML = APP_NAME;
  }

  let fishId = new URLSearchParams(window.location.search).get('fish');
  if (fishId == undefined) console.log('page normale');
  
  // Set MAIN layout
  MAIN.innerHTML = `
  <div class="page-container import-page">
    <div class="page-block">
      <span class="title">Exporter un fishier</span>

      <div class="fish-block">
        <div id="fishPreview" class="fish-img-container"></div>

        <div class="fish-info-block">
          <div class="fish-id-block">
            <div>ID du poisson : </div>
            <div id="inputContainer" class="input-container">
              #<input id="fishIdInput" type="text" maxlength="13" class="lzr-input" oninput="onExportFishInputChange(event)" ${fishId == undefined ? '' :  `value="${fishId}"`}" />
            </div>
          </div>
          <span id="errorMessage" class="error-message"></span>
        </div>
      </div>

      <div class="tips">
        Attention :<br>
        - il est uniquement possible d'exporter un poisson que <strong>vous</strong> avez généré.<br>
        - ce poisson sera <strong>supprimé</strong> de votre collection, et il vous sera <strong>impossible de le réimporter</strong> !
      </div>

      <div id="exportButtonContainer"></div>
    </div>
    <div class="page-block">
      <span class="title">Importer un fishier</span>

      <div class="tips">
        Attention :<br>
        - il est impossible d'importer un poisson que <strong>vous</strong> avez généré.<br>
        - il est impossible d'importer un poisson déjà présent dans votre collection.
      </div>

      <input type="file" class="lzr-button lzr-solid" onchange="onImportFishFileClick(event)" accept=".fish" />
    </div>
  </div>

  <div id="confirmTradePopupContainer" class="pop-up-container hidden">
    <div class="pop-up">
      <span>Etes vous sur de vouloir échanger ce poisson ?</span>
      <div class="buttons-container">
        <button onclick="onCancelTradeClick()" class="lzr-button lzr-outlined lzr-error">Annuler</button>
        <button onclick="onConfirmTradeClick()" class="lzr-button lzr-solid lzr-success">Échanger</button>
      </div>
    </div>
  </div>
  `;

  updateMenuDom('trade');

  if (fishId != undefined) {
    let user = getUser();
    const inputContainer = document.getElementById('inputContainer');
    const errorMessage = document.getElementById('errorMessage');
    let fish = user.SAVED_FISHES.find((e) => e.id == fishId);
  
    if (fish == undefined) {
      // Poisson non trouvé
      inputContainer.classList.remove('success');
      inputContainer.classList.add('error');
      errorMessage.innerHTML = `Le poisson n'a pas été trouvé dans votre collection.`;
      document.getElementById('fishPreview').innerHTML = '';
      document.getElementById('exportButtonContainer').innerHTML = '';
    } else if (fish.creator != user.NAME) {
      // Poisson non généré par l'utilisateur
      inputContainer.classList.remove('success');
      inputContainer.classList.add('error');
      errorMessage.innerHTML = `Le poisson n'a pas été créé par vous.`;
      document.getElementById('fishPreview').innerHTML = '';
      document.getElementById('exportButtonContainer').innerHTML = '';
    } else {
      inputContainer.classList.remove('error');
      inputContainer.classList.add('success');
      errorMessage.innerHTML = ``;
      document.getElementById('fishPreview').innerHTML = getFishDom(fish);
      document.getElementById('exportButtonContainer').innerHTML = '<button onclick="onExportFishClick()" class="lzr-button lzr-solid">Exporter poisson</button>';
    }
  }
}

function onExportFishInputChange(event) {
  const inputContainer = document.getElementById('inputContainer');
  const errorMessage = document.getElementById('errorMessage');
  const value = event.target.value;
  console.log(value.length);
  if (value.length < 13) {
    // Pas assez long
    inputContainer.classList.remove('success');
    inputContainer.classList.add('error');
    errorMessage.innerHTML = `L'ID du poisson doit faire 13 caractères.`;
    document.getElementById('fishPreview').innerHTML = '';
    document.getElementById('exportButtonContainer').innerHTML = '';
  } else {
    let user = getUser();
    let fish = user.SAVED_FISHES.find((e) => e.id == value);
  
    if (fish == undefined) {
      // Poisson non trouvé
      inputContainer.classList.remove('success');
      inputContainer.classList.add('error');
      errorMessage.innerHTML = `Le poisson n'a pas été trouvé dans votre collection.`;
      document.getElementById('fishPreview').innerHTML = '';
      document.getElementById('exportButtonContainer').innerHTML = '';
    } else if (fish.creator != user.NAME) {
      // Poisson non généré par l'utilisateur
      inputContainer.classList.remove('success');
      inputContainer.classList.add('error');
      errorMessage.innerHTML = `Le poisson n'a pas été créé par vous.`;
      document.getElementById('fishPreview').innerHTML = '';
      document.getElementById('exportButtonContainer').innerHTML = '';
    } else {
      inputContainer.classList.remove('error');
      inputContainer.classList.add('success');
      errorMessage.innerHTML = ``;
      document.getElementById('fishPreview').innerHTML = getFishDom(fish);
      document.getElementById('exportButtonContainer').innerHTML = '<button onclick="onExportFishClick()" class="lzr-button lzr-solid">Exporter poisson</button>';
    }
  }

}
window.onExportFishInputChange = onExportFishInputChange;

function onExportFishClick() {
  showTradePopup();
}
window.onExportFishClick = onExportFishClick;

function showTradePopup() {
  document.getElementById('confirmTradePopupContainer').classList.remove('hidden');
}
window.showTradePopup = showTradePopup;
function hideTradePopup() {
  document.getElementById('confirmTradePopupContainer').classList.add('hidden');
}

function onCancelTradeClick() {
  hideTradePopup()
}
window.onCancelTradeClick = onCancelTradeClick;

function onConfirmTradeClick() {
  const inputContainer = document.getElementById('inputContainer');
  const fishId = document.getElementById('fishIdInput').value;
  console.log(fishId)
  let user = getUser();
  let fish = user.SAVED_FISHES.find((e) => e.id == fishId);
  if (fish == undefined) return;

  // File download
  downloadFishFile(fish);

  // Ajout à la ban list
  user.BAN_LIST.push(fish);

  // Suppression des user.SAVED_FISHES
  user.SAVED_FISHES.splice(user.SAVED_FISHES.indexOf(fish), 1);
  setUser(user);

  inputContainer.classList.remove('error');
  inputContainer.classList.remove('success');
  document.getElementById('errorMessage').innerHTML = ``;
  document.getElementById('fishPreview').innerHTML = '';
  document.getElementById('exportButtonContainer').innerHTML = '';
  document.getElementById('fishIdInput').value = '';

  hideTradePopup();

  showToast('lzr-success', 'Fishier généré !');
}
window.onConfirmTradeClick = onConfirmTradeClick;