import { APP_NAME } from "../../../app-properties.js";
import { getSvgIcon } from "../../services/icons.service.js";
import { updateMenuDom } from "../../services/menu.service.js";
import { getUser, setUser } from "../../services/storage.service.js";
import { isLaptopOrUp, isPhone, isTablet } from "../../utils/breakpoints.js";
import { getFishDom } from "../../services/fish-generation.service.js";
import { downloadFishFile } from "../../services/fish-trade.service.js";

// VARIABLES //////////////////////////////////////////////////////////////////////////////////////
const HEADER_ICON_CONTAINER = document.getElementById('headerIconContainer');
const HEADER_TITLE = document.getElementById('headerTitle');
const MAIN = document.getElementById('main');
const FOOTER = document.getElementById('footer');

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////

export function render() {
  // Set HEADER layout
  if (isPhone || isTablet) {
    HEADER_TITLE.innerHTML = 'Galerie';
  }
  if (isLaptopOrUp) {
    HEADER_TITLE.innerHTML = APP_NAME;
  }


  // Set MAIN layout
  MAIN.innerHTML = `
  <div class="page-container gallery-page">
    <div id="savedFishesContainer" class="saved-fishes-container">${getSavedFishesDom()}</div>
  </div>
  <div id="fishPopupContainer" class="pop-up-container hidden">
    <div id="fishPopup" class="pop-up fish-pop-up">
    </div>
  </div>
  `;

  updateMenuDom('gallery');

}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getSavedFishesDom() {
  let user = getUser();
  let reversed = [...user.SAVED_FISHES.reverse()]
  let str = '';
  for (let fish of user.SAVED_FISHES) {
    str += `
      <div onclick="onFishContainerClick(${fish.id})" class="saved-fish-container">
        <div class="fish-img-container">
          ${getFishDom(fish)}
        </div>
        
        <span class="fish-id">#${fish.id}</span>
        <span class="fish-name">${ fish.name != '' ? `"${fish.name}"` : '' }</span>
        <span class="fish-info">${new Date(fish.id).toLocaleDateString()} ${formatTime(fish.id)}</span>
        <span class="fish-creator">${fish.creator}</span>
        <!-- <span>${fish.main_color}</span>
        <span>${fish.accent_color}</span> -->
      </div>`;
  }
  return str;
}

function onFishContainerClick(fishId) {
  //console.log(fishId);
  let user = getUser();
  let fish = user.SAVED_FISHES.find((e) => e.id == fishId);
  if (fish == undefined) return;

  document.getElementById('fishPopupContainer').classList.remove('hidden');
  document.getElementById('fishPopup').innerHTML = `
    <button onclick="hideFishPopup()" class="lzr-button lzr-round lzr-outlined close-button">${getSvgIcon('xmark')}</button>
    <div class="fish-img-container">
      ${getFishDom(fish)}
    </div>
    
    <span class="fish-id">#${fish.id}</span>
    <span class="fish-name">${ fish.name != '' ? `"${fish.name}"` : '' }</span>
    <span class="fish-info">${new Date(fish.id).toLocaleDateString()} ${formatTime(fish.id)}</span>
    <span class="fish-creator">${fish.creator}</span>

    ${fish.creator == user.NAME ? `<button onclick="onReleaseFishClick(${fish.id})" class="lzr-button lzr-solid">Relacher</button>` : ''}
  `;
}
window.onFishContainerClick = onFishContainerClick;

function hideFishPopup() {
  document.getElementById('fishPopupContainer').classList.add('hidden');
}
window.hideFishPopup = hideFishPopup;









function onReleaseFishClick(fishId) {
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
  
  hideFishPopup();

  document.getElementById('savedFishesContainer').innerHTML = getSavedFishesDom();
}
window.onReleaseFishClick = onReleaseFishClick;