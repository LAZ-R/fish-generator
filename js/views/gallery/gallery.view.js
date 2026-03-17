import { APP_NAME } from "../../../app-properties.js";
import { getSvgIcon } from "../../services/icons.service.js";
import { updateMenuDom } from "../../services/menu.service.js";
import { getUser, setUser } from "../../services/storage.service.js";
import { isLaptopOrUp, isPhone, isTablet } from "../../utils/breakpoints.js";
import { getFishDom } from "../../services/fish-generation.service.js";
import { downloadFishFile } from "../../services/fish-trade.service.js";
import { toExternalPath } from "../../router.js";

// VARIABLES //////////////////////////////////////////////////////////////////////////////////////
const HEADER_ICON_CONTAINER = document.getElementById('headerIconContainer');
const HEADER_TITLE = document.getElementById('headerTitle');
const MAIN = document.getElementById('main');
const FOOTER = document.getElementById('footer');

let CURRENT_MODE = 'all';

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////

function onGalleryFilterSelectChange(event) {
  //console.log(event.target.value);
  CURRENT_MODE = event.target.value;
  document.getElementById('savedFishesContainer').innerHTML = getSavedFishesDom(CURRENT_MODE);
}
window.onGalleryFilterSelectChange = onGalleryFilterSelectChange;

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
    <div class="top-bar">
      <select id="select" class="lzr-select lzr-margin-bottom" onchange="onGalleryFilterSelectChange(event)">
        <button id=custombutton>
          <selectedcontent></selectedcontent>
        </button>
        <option value="all">Tous</option>
        <option value="liked">Favoris</option>
        <option value="user">Vos poissons</option>
        <option value="trade">Échanges</option>
        <option value="albino">Albinos</option>
        <option value="melanistic">Mélanistiques</option>
        <option value="legendary">Légendaires</option>
    </select>
    </div>
    <div id="savedFishesContainer" class="saved-fishes-container">${getSavedFishesDom('all')}</div>
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

function getSavedFishesDom(mode) {
  let user = getUser();
  let reversed = [...user.SAVED_FISHES.reverse()];


  let POOL = [];

  switch (mode) {
    case 'all':        POOL = user.SAVED_FISHES; break;
    case 'user':       POOL = user.SAVED_FISHES.filter((e) => e.creator == user.NAME); break;
    case 'trade':      POOL = user.SAVED_FISHES.filter((e) => e.creator != user.NAME); break;
    case 'albino':     POOL = user.SAVED_FISHES.filter((e) => e.isAlbino); break;
    case 'melanistic': POOL = user.SAVED_FISHES.filter((e) => e.isMelanistic); break;
    case 'legendary':  POOL = user.SAVED_FISHES.filter((e) => e.isLegendary); break;
    case 'liked':      POOL = user.SAVED_FISHES.filter((e) => e.isLiked); break;
    default: break;
  }
  
  let str = '';
  for (let fish of POOL) {
    str += `
    <div id="${fish.creator}_${fish.id}" onclick="onFishContainerClick(${fish.id})" class="saved-fish-container ${fish.isLiked ? 'liked' : ''}">
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
    <button onclick="hideFishPopup()" class="lzr-button lzr-square lzr-outlined close-button">${getSvgIcon('xmark')}</button>
    <div class="fish-img-container">
      ${getFishDom(fish)}
    </div>
    
    <span class="fish-id">#${fish.id}</span>
    <span class="fish-name">${ fish.name != '' ? `"${fish.name}"` : '' }</span>
    <span class="fish-info">${new Date(fish.id).toLocaleDateString()} ${formatTime(fish.id)}</span>
    <span class="fish-creator">${fish.creator}</span>

    ${fish.creator == user.NAME ? `<a class="lzr-button lzr-solid" href="${toExternalPath(`/trade?fish=${fish.id}`)}">Échanger</a>` : ''}
    <button id="likeButton" class="lzr-button lzr-square lzr-flat inverted" onclick="onLikeClick(${fishId})">${fish.isLiked ? getSvgIcon('heart', 'l') :  getSvgIcon('heart-empty', 'l')}</button>

  `;
}
window.onFishContainerClick = onFishContainerClick;

function onLikeClick(fishId) {
  let user = getUser();
  let fish = user.SAVED_FISHES.find((e) => e.id == fishId);
  if (fish == undefined) return;

  fish.isLiked = !fish.isLiked;
  setUser(user);

  //document.getElementById('likeButton').classList.toggle('', fish.isLiked);
  document.getElementById('likeButton').innerHTML = `${fish.isLiked ? getSvgIcon('heart', 'l') :  getSvgIcon('heart-empty', 'l')}`;
  document.getElementById(`${fish.creator}_${fish.id}`).classList.toggle('liked', fish.isLiked);
}
window.onLikeClick = onLikeClick;

function hideFishPopup() {
  document.getElementById('fishPopupContainer').classList.add('hidden');
}
window.hideFishPopup = hideFishPopup;
