import { NEIGHBOUR_PROFILES, PRESETS } from "../data/island-presets.data.js";
import { APP_ORIGIN } from "../router.js";
import { getRandomIntegerBetween } from "../utils/math.utils.js";


export let CURRENT_PRESET = {...PRESETS[0]};

// FULL IMG
const IMG_X_SIZE = 16;
const IMG_Y_SIZE = 16;
let FULL_IMG = {};

// CURRENT IMG
export let CURRENT_ZOOM = 1;
let CURRENT_VIEW_BOUNDS = {
  startX: 1,
  endX: IMG_X_SIZE,
  startY: 1,
  endY: IMG_Y_SIZE
};
let CURRENT_FISH = {
  img: {},
  main_color: 'hsl(0, 50%, 50%)',
  accent_color: 'hsl(0, 50%, 50%)',
}

function getCellKey(xCoord, yCoord) {
  return `${xCoord}-${yCoord}`;
}

function resetCurrentViewBounds() {
  CURRENT_VIEW_BOUNDS = {
    startX: 1,
    endX: IMG_X_SIZE,
    startY: 1,
    endY: IMG_Y_SIZE
  };
}

function setupGrid() {
  let x_coord = 0;
  let y_coord = 0;

  FULL_IMG = {};

  // Ligne
  for (let index = 0; index < IMG_Y_SIZE; index++) {
    x_coord = 0;
    y_coord += 1;

    // Colonne
    for (let index = 0; index < IMG_X_SIZE; index++) {
      x_coord += 1;

      FULL_IMG[`${x_coord}-${y_coord}`] = {
        x_coord,
        y_coord,
        isBody: false,
        isEye: false,
        isTail: false,
        isTopFin: false,
        isBottomFin: false,
        isMainColor: false,
        isAccentColor: false,
      };
    }
  }
}

function getCellNeighbourCells(xCoord, yCoord, type = 'full') {
  let topLeft = null;
  if (xCoord > 1 && yCoord > 1) {
    topLeft = FULL_IMG[getCellKey(xCoord - 1, yCoord - 1)];
  }

  let top = null;
  if (yCoord > 1) {
    top = FULL_IMG[getCellKey(xCoord, yCoord - 1)];
  }

  let topRight = null;
  if (xCoord < IMG_X_SIZE && yCoord > 1) {
    topRight = FULL_IMG[getCellKey(xCoord + 1, yCoord - 1)];
  }

  let left = null;
  if (xCoord > 1) {
    left = FULL_IMG[getCellKey(xCoord - 1, yCoord)];
  }

  let right = null;
  if (xCoord < IMG_X_SIZE) {
    right = FULL_IMG[getCellKey(xCoord + 1, yCoord)];
  }

  let bottomLeft = null;
  if (xCoord > 1 && yCoord < IMG_Y_SIZE) {
    bottomLeft = FULL_IMG[getCellKey(xCoord - 1, yCoord + 1)];
  }

  let bottom = null;
  if (yCoord < IMG_Y_SIZE) {
    bottom = FULL_IMG[getCellKey(xCoord, yCoord + 1)];
  }

  let bottomRight = null;
  if (xCoord < IMG_X_SIZE && yCoord < IMG_Y_SIZE) {
    bottomRight = FULL_IMG[getCellKey(xCoord + 1, yCoord + 1)];
  }

  let neighbours = [];

  switch (type) {
    case 'full':
      neighbours = [
        topLeft, top, topRight,
        left, right,
        bottomLeft, bottom, bottomRight,
      ];
      break;

    case 'plus':
      neighbours = [
        top,
        left, right,
        bottom,
      ];
      break;

    case 'cross':
      neighbours = [
        topLeft, topRight,
        bottomLeft, bottomRight,
      ];
      break;

    default:
      break;
  }

  return neighbours;
}

function pickNeighbourType(weights) {
  if (!weights) return 'plus';

  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  if (entries.length === 0) return 'plus';

  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const roll = getRandomIntegerBetween(1, totalWeight);

  let cumulative = 0;

  for (const [type, weight] of entries) {
    cumulative += weight;
    if (roll <= cumulative) {
      return type;
    }
  }

  return 'plus';
}

function generateImgObject() {
  let isEyeGenerated = false;

  // UNAVAILABLE
  let UNAVAILABLE_CELLS = [
    // Diag Nord Ouest
    { x: 3, y: 1 },
    { x: 4, y: 2 },
    { x: 5, y: 3 },
    { x: 6, y: 4 },
    { x: 7, y: 5 },
    // Diag Nord Est
    { x: 16, y: 3 },
    { x: 15, y: 4 },
    { x: 14, y: 5 },
    // Diag Sud Ouest
    { x: 7, y: 12 },
    { x: 6, y: 13 },
    { x: 5, y: 14 },
    { x: 4, y: 15 },
    { x: 3, y: 16 },
    // Diag Sud Est
    { x: 14, y: 12 },
    { x: 15, y: 13 },
    { x: 16, y: 14 },
  ];
  let allImgCells = Object.values(FULL_IMG);
  for (let cell of allImgCells) {
    let isUnavailable = UNAVAILABLE_CELLS.find((e) => e.x == cell.x_coord && e.y === cell.y_coord) != undefined;
    if (isUnavailable) {
      cell.isUnavailable = true;
    }
  }
  
  // BODY
  let BODY_BOUNDS = { min_x:  8, min_y:  6, max_x: 13, max_y: 11 };
  allImgCells = Object.values(FULL_IMG);
  for (let cell of allImgCells) {
    let isInXBounds = cell.x_coord >= BODY_BOUNDS.min_x && cell.x_coord <= BODY_BOUNDS.max_x;
    let isInYBounds = cell.y_coord >= BODY_BOUNDS.min_y && cell.y_coord <= BODY_BOUNDS.max_y;
    if (isInXBounds && isInYBounds) {
      cell.isBody = true;
    }
  }

  // EYES
  let EYES_BOUNDS = { min_x:  12, min_y:  7, max_x: 13, max_y: 9 };
  allImgCells = Object.values(FULL_IMG);
  for (let cell of allImgCells) {
    let isInXBounds = cell.x_coord >= EYES_BOUNDS.min_x && cell.x_coord <= EYES_BOUNDS.max_x;
    let isInYBounds = cell.y_coord >= EYES_BOUNDS.min_y && cell.y_coord <= EYES_BOUNDS.max_y;
    if (isInXBounds && isInYBounds) {
      if (!isEyeGenerated) {
        let rnd = getRandomIntegerBetween(0, 100);
        if (rnd <= 25) {
          cell.isEye = true;
          isEyeGenerated = true;
        }
        if (cell.x_coord == EYES_BOUNDS.max_x && cell.y_coord == EYES_BOUNDS.max_y && !isEyeGenerated) {
          cell.isEye = true;
          isEyeGenerated = true;
        }
      }
    }
  }

  // TAIL /////////////////////////////////////////////////////////////////////

  let TAIL_AVAILABLE__CELLS = [
    // ligne 1
    { x:  1, y:  1 }, { x:  2, y:  1 },
    { x:  1, y:  2 }, { x:  2, y:  2 }, { x:  3, y:  2 },
    { x:  1, y:  3 }, { x:  2, y:  3 }, { x:  3, y:  3 }, { x:  4, y:  3 },
    { x:  1, y:  4 }, { x:  2, y:  4 }, { x:  3, y:  4 }, { x:  4, y:  4 }, { x:  5, y:  4 },
    { x:  1, y:  5 }, { x:  2, y:  5 }, { x:  3, y:  5 }, { x:  4, y:  5 }, { x:  5, y:  5 }, { x:  6, y:  5 },
    { x:  1, y:  6 }, { x:  2, y:  6 }, { x:  3, y:  6 }, { x:  4, y:  6 }, { x:  5, y:  6 }, { x:  6, y:  6 }, { x:  7, y:  6 },
    { x:  1, y:  7 }, { x:  2, y:  7 }, { x:  3, y:  7 }, { x:  4, y:  7 }, { x:  5, y:  7 }, { x:  6, y:  7 }, { x:  7, y:  7 },
    { x:  1, y:  8 }, { x:  2, y:  8 }, { x:  3, y:  8 }, { x:  4, y:  8 }, { x:  5, y:  8 }, { x:  6, y:  8 }, { x:  7, y:  8 },
    { x:  1, y:  9 }, { x:  2, y:  9 }, { x:  3, y:  9 }, { x:  4, y:  9 }, { x:  5, y:  9 }, { x:  6, y:  9 }, { x:  7, y:  9 },
    { x:  1, y: 10 }, { x:  2, y: 10 }, { x:  3, y: 10 }, { x:  4, y: 10 }, { x:  5, y: 10 }, { x:  6, y: 10 }, { x:  7, y: 10 },
    { x:  1, y: 11 }, { x:  2, y: 11 }, { x:  3, y: 11 }, { x:  4, y: 11 }, { x:  5, y: 11 }, { x:  6, y: 11 }, { x:  7, y: 11 },
    { x:  1, y: 12 }, { x:  2, y: 12 }, { x:  3, y: 12 }, { x:  4, y: 12 }, { x:  5, y: 12 }, { x:  6, y: 12 },
    { x:  1, y: 13 }, { x:  2, y: 13 }, { x:  3, y: 13 }, { x:  4, y: 13 }, { x:  5, y: 13 },
    { x:  1, y: 14 }, { x:  2, y: 14 }, { x:  3, y: 14 }, { x:  4, y: 14 },
    { x:  1, y: 15 }, { x:  2, y: 15 }, { x:  3, y: 15 },
    { x:  1, y: 16 }, { x:  2, y: 16 },
  ];
  allImgCells = Object.values(FULL_IMG);

  // EXPANSION DEPUIS BODY ================================

  // Tail CENTER ORIGIN
  for (let cell of allImgCells) {
    let isAvailable = TAIL_AVAILABLE__CELLS.find((e) => e.x == cell.x_coord && e.y === cell.y_coord) != undefined;
    if (isAvailable && cell.x_coord == 7) {
        if (cell.y_coord == 8 || cell.y_coord == 9) {
          cell.isTail = true;
        }
    }
  }

  // Expansion verticale
  let rnd = getRandomIntegerBetween(0, 100);
  if (rnd <= 66) {
    for (let cell of allImgCells) {
      let isAvailable = TAIL_AVAILABLE__CELLS.find((e) => e.x == cell.x_coord && e.y === cell.y_coord) != undefined;
      if (isAvailable && cell.x_coord == 7) {
        if (cell.y_coord == 7 || cell.y_coord == 10) {
          cell.isTail = true;
        }
      }
    }
  }
  

  // EXPANSION 2 ==========================================

  // Tail CENTER ORIGIN
  for (let cell of allImgCells) {
    let isAvailable = TAIL_AVAILABLE__CELLS.find((e) => e.x == cell.x_coord && e.y === cell.y_coord) != undefined;
    if (isAvailable && cell.x_coord == 6) {
      if (cell.y_coord == 8 || cell.y_coord == 9) {
        cell.isTail = true;
      }
    }
  }

  // Expansion verticale
  for (let cell of allImgCells) {
    let isAvailable = TAIL_AVAILABLE__CELLS.find((e) => e.x == cell.x_coord && e.y === cell.y_coord) != undefined;
    if (isAvailable && cell.x_coord == 6) {
      if (cell.y_coord == 7 && FULL_IMG[getCellKey(cell.x_coord, cell.y_coord + 1)].isTail) {
        let rnd = getRandomIntegerBetween(0, 100);
        if (rnd <= 50) {
          cell.isTail = true;
        }
      }
      if (cell.y_coord == 10 && FULL_IMG[getCellKey(cell.x_coord, cell.y_coord - 1)].isTail) {
        let rnd = getRandomIntegerBetween(0, 100);
        if (rnd <= 50) {
          cell.isTail = true;
        }
      }
    }
  }

  // EXPANSION 3 ==========================================

  // récupérer les cellules précédentes
  let previousCells = Object.values(FULL_IMG).filter((e) => e.x_coord == 6 && e.isTail);

  // mise en place de la couche
  for (let previousCell of previousCells) {
    let cell = FULL_IMG[getCellKey(previousCell.x_coord - 1, previousCell.y_coord)];
    cell.isTail = true;
  }

  let currentCells = Object.values(FULL_IMG).filter((e) => e.x_coord == 5 && e.isTail);

  // Expansion verticale
  let rnd2 = getRandomIntegerBetween(0, 100);
  if (rnd2 <= 50) {
    let topCell = FULL_IMG[getCellKey(currentCells[0].x_coord, currentCells[0].y_coord - 1)];
    let bottomCell = FULL_IMG[getCellKey(currentCells[currentCells.length - 1].x_coord, currentCells[currentCells.length - 1].y_coord + 1)];

    topCell.isTail = true;
    bottomCell.isTail = true;
  }

  // Echancrure
  if (currentCells.length == 2) {
  } else if (currentCells.length == 3) {
    let rnd = getRandomIntegerBetween(0, 100);
    if (rnd <= 50) {
      currentCells[1].isTail = false;
    }
  } else if (currentCells.length == 4) {
    let rnd = getRandomIntegerBetween(0, 100);
    if (rnd <= 50) {
      currentCells[1].isTail = false;
    }
    rnd = getRandomIntegerBetween(0, 100);
    if (rnd <= 50) {
      currentCells[2].isTail = false;
    }
  }

  // EXPANSION 4 ==========================================

  // récupérer les cellules précédentes
  let types = ['full', 'left'];
  previousCells = Object.values(FULL_IMG).filter((e) => e.x_coord == 5 && e.isTail);

  if (previousCells[0].y_coord > 6 && previousCells[previousCells.length - 1].y_coord < 11) {
    types.push('diag');
  }

  let type = types[getRandomIntegerBetween(0, types.length - 1)];
  switch (type) {
    case 'full':
      for (let previousCell of previousCells) {
        let leftCell = FULL_IMG[getCellKey(previousCell.x_coord - 1, previousCell.y_coord)];
        let rnd = getRandomIntegerBetween(0, 100);
        if (rnd <= 75) {
          leftCell.isTail = true;
        }
      }
      break;
    case 'left':
      let topCell = FULL_IMG[getCellKey(previousCells[0].x_coord - 1, previousCells[0].y_coord)];
      let bottomCell = FULL_IMG[getCellKey(previousCells[previousCells.length - 1].x_coord - 1, previousCells[previousCells.length - 1].y_coord)];
      topCell.isTail = true;
      bottomCell.isTail = true;
      break;
    case 'diag':
      let topLeftCell = FULL_IMG[getCellKey(previousCells[0].x_coord - 1, previousCells[0].y_coord - 1)];
      let bottomLeftCell = FULL_IMG[getCellKey(previousCells[previousCells.length - 1].x_coord - 1, previousCells[previousCells.length - 1].y_coord + 1)];
      topLeftCell.isTail = true;
      bottomLeftCell.isTail = true;
    default:
      break;
  }

  // TOP FIN

  // First line
  let topFinFirstLineCore = FULL_IMG[getCellKey(12, 5)];
  let topFinCoreRnd = getRandomIntegerBetween(0, 100);
  if (topFinCoreRnd <= 50) {
    topFinFirstLineCore.isTopFin = true;
  }

  let topFinLength = getRandomIntegerBetween(2, 4);

  for (let index = 0; index < topFinLength; index++) {
    let leftCell = FULL_IMG[getCellKey(12 - (index + 1), 5)];
    leftCell.isTopFin = true;
  }

  // Second line
  let topFinSecondLineRnd = getRandomIntegerBetween(0, 100);
  if (topFinSecondLineRnd <= 60) {
    previousCells = Object.values(FULL_IMG).filter((e) => (e.isTopFin));
    for (let previousCell of previousCells) {
      let topLeftCell = FULL_IMG[getCellKey(previousCell.x_coord - 1, previousCell.y_coord - 1)];
      let rnd = getRandomIntegerBetween(0, 100);
      if (rnd <= 50 && topLeftCell.x_coord > 7) {
        topLeftCell.isTopFin = true;
      }
    }
  }

  // Third line
  let topFinThirdLineRnd = getRandomIntegerBetween(0, 100);
  if (topFinThirdLineRnd <= 60) {
    previousCells = Object.values(FULL_IMG).filter((e) => (e.isTopFin && e.y_coord == 4));
    for (let previousCell of previousCells) {
      let typeRnd = getRandomIntegerBetween(0, 100);
      if (typeRnd <= 50) {
        // Diag type
        let topLeftCell = FULL_IMG[getCellKey(previousCell.x_coord - 1, previousCell.y_coord - 1)];
        let rnd = getRandomIntegerBetween(0, 100);
        if (rnd <= 50 && topLeftCell.x_coord > 7) {
          topLeftCell.isTopFin = true;
        }
      } else {
        // Top type
        let topCell = FULL_IMG[getCellKey(previousCell.x_coord, previousCell.y_coord - 1)];
        let rnd = getRandomIntegerBetween(0, 100);
        if (rnd <= 50) {
          topCell.isTopFin = true;
        }
      }
    }
  }

  // BOTTOM FIN

  // First line
  let bottomFinFirstLineCore = FULL_IMG[getCellKey(12, 12)];
  bottomFinFirstLineCore.isBottomFin = true;

  let finLength = getRandomIntegerBetween(2, 3);

  for (let index = 0; index < finLength; index++) {
    let leftCell = FULL_IMG[getCellKey(12 - (index + 1), 12)];
    leftCell.isBottomFin = true;
  }

  // Second line
  let bottomFinSecondLineRnd = getRandomIntegerBetween(0, 100);
  if (bottomFinSecondLineRnd <= 50) {
    previousCells = Object.values(FULL_IMG).filter((e) => (e.isBottomFin));
    for (let previousCell of previousCells) {
      let bottomLeftCell = FULL_IMG[getCellKey(previousCell.x_coord - 1, previousCell.y_coord + 1)];
      let rnd = getRandomIntegerBetween(0, 100);
      if (rnd <= 50 && bottomLeftCell.x_coord > 7) {
        bottomLeftCell.isBottomFin = true;
      }
    }
  }

  // Third line
  let bottomFinThirdLineRnd = getRandomIntegerBetween(0, 100);
  if (bottomFinThirdLineRnd <= 50) {
    previousCells = Object.values(FULL_IMG).filter((e) => (e.isBottomFin && e.y_coord == 13));
    for (let previousCell of previousCells) {
      let typeRnd = getRandomIntegerBetween(0, 100);
      if (typeRnd <= 50) {
        // Diag type
        let bottomLeftCell = FULL_IMG[getCellKey(previousCell.x_coord - 1, previousCell.y_coord + 1)];
        let rnd = getRandomIntegerBetween(0, 100);
        if (rnd <= 50 && bottomLeftCell.x_coord > 7) {
          bottomLeftCell.isBottomFin = true;
        }
      } else {
        // Bottom type
        let bottomCell = FULL_IMG[getCellKey(previousCell.x_coord, previousCell.y_coord + 1)];
        let rnd = getRandomIntegerBetween(0, 100);
        if (rnd <= 50) {
          bottomCell.isBottomFin = true;
        }
      }
    }
  }









  // COLORS
  previousCells = Object.values(FULL_IMG).filter((e) => (e.isBody || e.isTail || e.isTopFin || e.isBottomFin) && !e.isEye);
  for (let previousCell of previousCells) {
    let cell = FULL_IMG[getCellKey(previousCell.x_coord, previousCell.y_coord)];
    let rnd = getRandomIntegerBetween(0, 100);
    if (rnd <= 50) {
      cell.isMainColor = true;
    } else {
      cell.isAccentColor = true;
    }
  }



}


function renderCurrentView() {
  renderImgFromBounds(CURRENT_VIEW_BOUNDS);
}

function renderImgFromBounds(bounds) {
  let imgContainer = document.getElementById('imgContainer');
  imgContainer.innerHTML = '';

  // A. calculer la taille logique de la vue
  const visibleWidth = bounds.endX - bounds.startX + 1;
  const visibleHeight = bounds.endY - bounds.startY + 1;

  imgContainer.style.setProperty( '--x-size', visibleWidth);
  imgContainer.style.setProperty( '--main-color', CURRENT_FISH.main_color);
  imgContainer.style.setProperty( '--accent-color', CURRENT_FISH.accent_color);

  //B. injecter dans le conteneur les cellules de cette zone seulement
  let htmlString = '';

  for (let y = bounds.startY; y <= bounds.endY; y++) {
    for (let x = bounds.startX; x <= bounds.endX; x++) {
      const cell = FULL_IMG[getCellKey(x, y)];
      let cellCssStr = '';
      if (cell.isUnavailable) cellCssStr += ' unavailable';
      if (cell.isBody) cellCssStr += ' body';
      if (cell.isEye) cellCssStr += ' eye';
      if (cell.isTail) cellCssStr += ' tail';
      if (cell.isTopFin) cellCssStr += ' top-fin';
      if (cell.isBottomFin) cellCssStr += ' bottom-fin';
      const cellHtml = `
        <div 
          id="${cell.x_coord}-${cell.y_coord}" 
          class="grid-cell ${cellCssStr} ${cell.isMainColor ? 'main-color' : ''} ${cell.isAccentColor ? 'accent-color' : ''} ${cell.isTail && cell.x_coord == 7 ? 'shadow-left' : ''} ${cell.isBottomFin && cell.y_coord == 12 ? 'shadow-bottom' : ''} ${cell.isTopFin && cell.y_coord == 5 ? 'shadow-top' : ''}">
        </div>`;
      htmlString += cellHtml;
    }
  }

  imgContainer.innerHTML = htmlString;
}

export function initNewImg() {
  // Img generation
  setupGrid();
  generateImgObject();
  CURRENT_FISH.img = FULL_IMG;
  // Colors
  // Main
  let rnd1 = getRandomIntegerBetween(0, 100);
  let rnd2 = getRandomIntegerBetween(0, 100);
  let isMainBright = rnd1 <= 50;
  let isMainSaturated = rnd2 <= 50;
  let mainBrightness = getRandomIntegerBetween(isMainBright ? 50 : 10, isMainBright ? 90 : 50);
  let mainSaturation = getRandomIntegerBetween(isMainSaturated ? 50 : 10, isMainSaturated ? 90 : 50);
  let accentBrightness = getRandomIntegerBetween(isMainBright ? 10 : 50, isMainBright ? 50 : 90);
  let accentSaturation = getRandomIntegerBetween(isMainSaturated ? 10 : 50, isMainSaturated ? 50 : 90);
  CURRENT_FISH.main_color = `hsl(${getRandomIntegerBetween(0, 360)}, ${mainSaturation}%, ${mainBrightness}%)`;
  CURRENT_FISH.accent_color = `hsl(${getRandomIntegerBetween(0, 360)}, ${accentSaturation}%, ${accentBrightness}%)`;
  //setHiddenPoint();

  // Render
  CURRENT_ZOOM = 1;
  resetCurrentViewBounds();
  renderCurrentView();
}