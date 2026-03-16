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
import { CURRENT_FISH, getFishDom, initNewFish } from "../../services/fish-generation.service.js";

// VARIABLES //////////////////////////////////////////////////////////////////////////////////////
const HEADER_ICON_CONTAINER = document.getElementById('headerIconContainer');
const HEADER_TITLE = document.getElementById('headerTitle');
const MAIN = document.getElementById('main');
const FOOTER = document.getElementById('footer');

let CURRENT_SELECTED_QUARTER = null;
let FAILED_QUARTERS = 0;

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////

export function render() {
  // Set HEADER layout
  if (isPhone || isTablet) {
    HEADER_TITLE.innerHTML = 'Génération de poisson';
  }
  if (isLaptopOrUp) {
    HEADER_TITLE.innerHTML = APP_NAME;
  }


  // Set MAIN layout
  MAIN.innerHTML = `
  <div id="imgBlock" class="fish-img-container"></div>

  <div id="generatorButtonsContainer" class="page-container generator-page">
    <button class="lzr-button lzr-solid" style="margin: 0 auto; width: 100%;" onclick="onGenerateClick()">Générer</button>
  </div>

  <div id="nicknamePopupContainer" class="pop-up-container hidden">
    <div class="pop-up">
      <span>Nommez votre poisson</span>
      <input id="nicknameInput" type="text" class="lzr-input" />
      <div class="buttons-container">
        <button onclick="onCancelClick()" class="lzr-button lzr-outlined lzr-error">Annuler</button>
        <button onclick="onConfirmClick()" class="lzr-button lzr-solid lzr-success">Sauvegarder</button>
      </div>
    </div>
  </div>
  `;

  updateMenuDom('generator');

  /* setTimeout(() => {
    initNewFish();
  }, 300); */

}

function showNicknamePopup() {
  document.getElementById('nicknamePopupContainer').classList.remove('hidden');
  document.getElementById('nicknameInput').value = '';
}
window.showNicknamePopup = showNicknamePopup;
function hideNicknamePopup() {
  document.getElementById('nicknamePopupContainer').classList.add('hidden');
}

function onCancelClick() {
  document.getElementById('nicknamePopupContainer').classList.add('hidden');
  document.getElementById('nicknameInput').value = '';
}
window.onCancelClick = onCancelClick;

function onConfirmClick() {
  saveCurrentFish();
  document.getElementById('nicknamePopupContainer').classList.add('hidden');
  document.getElementById('nicknameInput').value = '';
}
window.onConfirmClick = onConfirmClick;

function getKeyFromValue(object, value) {
  return Object.entries(object)
    .find(([key, val]) => val === value)?.[0];
}

function onGenerateClick() {
  initNewFish();
  document.getElementById('imgBlock').innerHTML = getFishDom(CURRENT_FISH);
  document.getElementById('generatorButtonsContainer').innerHTML = `
    <button class="lzr-button lzr-solid" style="margin: 0 auto 0; width: 100%;" onclick="onGenerateClick()">Générer</button>
    <button class="lzr-button lzr-solid" style="margin: 0 auto 0; width: 100%;" onclick="onSaveClick()">Sauvegarder</button>
  `;
}
window.onGenerateClick = onGenerateClick;

function onSaveClick() {
  //console.log(CURRENT_FISH);
  showNicknamePopup();
}


window.onSaveClick = onSaveClick;

function saveCurrentFish() {
  let name = document.getElementById('nicknameInput').value;
  let user = getUser();
  let fish = {
    ...CURRENT_FISH,
    name: name,
  }
  user.SAVED_FISHES.push(fish);
  setUser(user);
  showToast('lzr-success', 'Poisson sauvegardé');
  document.getElementById('generatorButtonsContainer').innerHTML = `
    <button class="lzr-button lzr-solid" style="margin: 0 auto 0; width: 100%;" onclick="onGenerateClick()">Générer</button>
  `;
}