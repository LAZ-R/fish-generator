import { APP_NAME, APP_VERSION } from "../../../app-properties.js";
import { playMusic } from "../../services/music.service.js";
import { ICONS } from "../../data/svgIcons.data.js";
import { APP_BASE_PATH, APP_ORIGIN, toExternalPath } from "../../router.js";
import { getSvgIcon } from "../../services/icons.service.js";
import { updateMenuDom } from "../../services/menu.service.js";
import { getUser } from "../../services/storage.service.js";
import { showToast } from "../../services/toast.service.js";
import { isLaptopOrUp, isPhone, isTablet } from "../../utils/breakpoints.js";
import { getRandomIntegerBetween } from "../../utils/math.utils.js";
import { CURRENT_PRESET, CURRENT_ZOOM, getQuarterBounds, initNewMap, isHiddenPointInBounds, setPreset, zoomToQuarter } from "../../services/island-map.service.js";
import { NEIGHBOUR_PROFILES, PRESETS } from "../../data/island-presets.data.js";
import { initNewImg } from "../../services/fish-generation.service.js";

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
    HEADER_TITLE.innerHTML = '';
  }
  if (isLaptopOrUp) {
    HEADER_TITLE.innerHTML = APP_NAME;
  }


  // Set MAIN layout
  MAIN.innerHTML = `
  <div class="top-container" style="margin-top: auto;">
    <div class="main-container">
      <div id="imgContainer" class="img-container"></div>
      <div id="screenContainer" class="screen-container"></div>
    </div>
  </div>

  <div class="page-container" style="margin-bottom: auto;">
    <button class="lzr-button lzr-solid" style="margin: 16px auto 0 auto; width: 100%;" onclick="onGenerateClick()">Generate</button>
  </div>
  `;

  updateMenuDom('homepage');

  setTimeout(() => {
    initNewImg();
    //onGenerateClick();
  }, 300);

}

function getKeyFromValue(object, value) {
  return Object.entries(object)
    .find(([key, val]) => val === value)?.[0];
}

function onGenerateClick() {
  initNewImg();
}
window.onGenerateClick = onGenerateClick;
