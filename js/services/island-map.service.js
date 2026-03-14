import { NEIGHBOUR_PROFILES, PRESETS } from "../data/island-presets.data.js";
import { APP_ORIGIN } from "../router.js";
import { getRandomIntegerBetween } from "../utils/math.utils.js";


export let CURRENT_PRESET = {...PRESETS[0]};

// FULL MAP
const MAP_X_SIZE = 128;
const MAP_Y_SIZE = 128;
let FULL_MAP = {};

// CURRENT MAP
export let CURRENT_ZOOM = 1;
let CURRENT_VIEW_BOUNDS = {
  startX: 1,
  endX: MAP_X_SIZE,
  startY: 1,
  endY: MAP_Y_SIZE
};

function getCellKey(xCoord, yCoord) {
  return `${xCoord}-${yCoord}`;
}

function resetCurrentViewBounds() {
  CURRENT_VIEW_BOUNDS = {
    startX: 1,
    endX: MAP_X_SIZE,
    startY: 1,
    endY: MAP_Y_SIZE
  };
}

function setupGrid() {
  let x_coord = 0;
  let y_coord = 0;

  FULL_MAP = {};

  // Ligne
  for (let index = 0; index < MAP_Y_SIZE; index++) {
    x_coord = 0;
    y_coord += 1;

    // Colonne
    for (let index = 0; index < MAP_X_SIZE; index++) {
      x_coord += 1;

      FULL_MAP[`${x_coord}-${y_coord}`] = {
        x_coord,
        y_coord,
        isActive: false,
        terrain: null,
        isCentralPoint: false,
        isHiddenPoint: false
      };
    }
  }
}

function getCellNeighbourCells(xCoord, yCoord, type = 'full') {
  let topLeft = null;
  if (xCoord > 1 && yCoord > 1) {
    topLeft = FULL_MAP[getCellKey(xCoord - 1, yCoord - 1)];
  }

  let top = null;
  if (yCoord > 1) {
    top = FULL_MAP[getCellKey(xCoord, yCoord - 1)];
  }

  let topRight = null;
  if (xCoord < MAP_X_SIZE && yCoord > 1) {
    topRight = FULL_MAP[getCellKey(xCoord + 1, yCoord - 1)];
  }

  let left = null;
  if (xCoord > 1) {
    left = FULL_MAP[getCellKey(xCoord - 1, yCoord)];
  }

  let right = null;
  if (xCoord < MAP_X_SIZE) {
    right = FULL_MAP[getCellKey(xCoord + 1, yCoord)];
  }

  let bottomLeft = null;
  if (xCoord > 1 && yCoord < MAP_Y_SIZE) {
    bottomLeft = FULL_MAP[getCellKey(xCoord - 1, yCoord + 1)];
  }

  let bottom = null;
  if (yCoord < MAP_Y_SIZE) {
    bottom = FULL_MAP[getCellKey(xCoord, yCoord + 1)];
  }

  let bottomRight = null;
  if (xCoord < MAP_X_SIZE && yCoord < MAP_Y_SIZE) {
    bottomRight = FULL_MAP[getCellKey(xCoord + 1, yCoord + 1)];
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

function generateMapObject() {
  // ISLANDS CENTAL POINTS ********************************************************************************************
  for (let index = 0; index < CURRENT_PRESET.seedsCount; index++) {
    // Centre de l'île 0
    let rndX = getRandomIntegerBetween(Math.round(MAP_X_SIZE * .15), Math.round(MAP_X_SIZE * .85));
    let rndY = getRandomIntegerBetween(Math.round(MAP_Y_SIZE * .15), Math.round(MAP_Y_SIZE * .85));
  
    let rndCell = FULL_MAP[getCellKey(rndX, rndY)];
  
    rndCell.terrain = 'mainland';
    rndCell.isCentralPoint = true;
    rndCell.isActive = true;
  }

  // ISLAND CENTRAL BASE **********************************************************************************************
  
  for (let index = 0; index < CURRENT_PRESET.coreIterations; index++) {
    let islandsCentralCores = Object.values(FULL_MAP).filter((cell) => cell.terrain === 'mainland' && cell.isActive);

    for (let cell of islandsCentralCores) {
    let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES["Default"]));
      for (let cellNeighbour of cellNeighbours) {
        if (cellNeighbour != null) {
          let rnd = getRandomIntegerBetween(0, 100);
          const individualProbabilityCeiling = getRandomIntegerBetween(CURRENT_PRESET.coreProbaMin, CURRENT_PRESET.coreProbaMax);
          if (rnd < individualProbabilityCeiling) {
            cellNeighbour.terrain = 'mainland';
            cellNeighbour.isActive = true;
          }
        }
      }
      cell.isActive = false;
    }
  }

  // SPREAD -------------------------------------------------------------------
  if (!CURRENT_PRESET.mainlandWaveSpread) {
    for (let index = 0; index < CURRENT_PRESET.mainlandSpread; index++) {
      let islandsCentralCores = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'mainland');

      for (let cell of islandsCentralCores) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.mainlandNeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland') {
              let rnd = getRandomIntegerBetween(0, 100);
              if (rnd < CURRENT_PRESET.mainlandSpreadProbability) {
                cellNeighbour.terrain = 'mainland';
              }
            }
          }
        }
      }
    }
  } else {
    for (let index = 0; index < CURRENT_PRESET.mainlandSpread; index++) {
      let islandsCentralCores = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'mainland' && cell.isActive);

      for (let cell of islandsCentralCores) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.mainlandNeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland') {
              let rnd = getRandomIntegerBetween(0, 100);
              let rnd2 = getRandomIntegerBetween(0, 100);
              if (rnd < (CURRENT_PRESET.mainlandSpreadProbability * (rnd2 / 100))) {
                cellNeighbour.terrain = 'mainland';
                cellNeighbour.isActive = true;
              }
            }
          }
        }
        cell.isActive = false;
      }
    }
  }

  // ISLAND SURROUNDINGS **********************************************************************************************

  // Island Surroundings batch 1

  let islandsCentralSpread = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'mainland');
  for (let cell of islandsCentralSpread) {
    let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, 'plus');
    for (let cellNeighbour of cellNeighbours) {
      if (cellNeighbour != null) {
        if (cellNeighbour.terrain != 'mainland' 
          && cellNeighbour.terrain != 'coast') {
          cellNeighbour.terrain = 'coast';
          cellNeighbour.isActive = true;
        }
      }
    }
  }

  // SPREAD -------------------------------------------------------------------
  if (!CURRENT_PRESET.coastWaveSpread) {
    for (let index = 0; index < CURRENT_PRESET.coastSpread; index++) {
      let islandsSurroundingsBatch1 = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'coast');

      for (let cell of islandsSurroundingsBatch1) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.coastNeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland'
              && cellNeighbour.terrain != 'coast') {
              let rnd = getRandomIntegerBetween(0, 100);
              if (rnd < CURRENT_PRESET.coastSpreadProbability) {
                cellNeighbour.terrain = 'coast';
              }
            }
          }
        }
      }
    }
  } else {
    for (let index = 0; index < CURRENT_PRESET.coastSpread; index++) {
      let islandsSurroundingsBatch1 = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'coast' && cell.isActive);

      for (let cell of islandsSurroundingsBatch1) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.coastNeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland'
              && cellNeighbour.terrain != 'coast') {
              let rnd = getRandomIntegerBetween(0, 100);
              let rnd2 = getRandomIntegerBetween(0, 100);
              if (rnd < (CURRENT_PRESET.coastSpreadProbability * (rnd2 / 100))) {
                cellNeighbour.terrain = 'coast';
                cellNeighbour.isActive = true;
              }
            }
          }
        }
        cell.isActive = false;
      }
    }
  }

  // ISLAND BEACHES ***************************************************************************************************

  // Island Beach batch 1

  let islandsSurroundingsSpread = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'coast');
  for (let cell of islandsSurroundingsSpread) {
    let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, 'plus');
    for (let cellNeighbour of cellNeighbours) {
      if (cellNeighbour != null) {
        if (cellNeighbour.terrain != 'mainland' 
          && cellNeighbour.terrain != 'coast'
          && cellNeighbour.terrain != 'beach') {
          cellNeighbour.terrain = 'beach';
          cellNeighbour.isActive = true;
        }
      }
    }
  }

  // SPREAD -------------------------------------------------------------------

  if (!CURRENT_PRESET.beachWaveSpread) {
    for (let index = 0; index < CURRENT_PRESET.beachSpread; index++) {
      let islandsBeachesBatch1 = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'beach');
  
      for (let cell of islandsBeachesBatch1) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.beachNeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland'
              && cellNeighbour.terrain != 'coast'
              && cellNeighbour.terrain != 'beach') {
              let rnd = getRandomIntegerBetween(0, 100);
              if (rnd < CURRENT_PRESET.beachSpreadProbability) {
                cellNeighbour.terrain = 'beach';
              }
            }
          }
        }
      }
    }
  } else {
    for (let index = 0; index < CURRENT_PRESET.beachSpread; index++) {
      let islandsBeachesBatch1 = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'beach' && cell.isActive);
  
      for (let cell of islandsBeachesBatch1) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.beachNeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland'
              && cellNeighbour.terrain != 'coast'
              && cellNeighbour.terrain != 'beach') {
              let rnd = getRandomIntegerBetween(0, 100);
              let rnd2 = getRandomIntegerBetween(0, 100);
              if (rnd < (CURRENT_PRESET.beachSpreadProbability * (rnd2 / 100))) {
                cellNeighbour.terrain = 'beach';
                cellNeighbour.isActive = true;
              }
            }
          }
        }
        cell.isActive = false;
      }
    }
  }


  // ISLAND WATER 1 ***************************************************************************************************

  // Island Water 1 batch 1

  let islandsBeachesSpread = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'beach');
  for (let cell of islandsBeachesSpread) {
    let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, 'plus');
    for (let cellNeighbour of cellNeighbours) {
      if (cellNeighbour != null) {
        if (cellNeighbour.terrain != 'mainland' 
          && cellNeighbour.terrain != 'coast'
          && cellNeighbour.terrain != 'beach'
          && cellNeighbour.terrain != 'water1') {
          cellNeighbour.terrain = 'water1';
          cellNeighbour.isActive = true;
        }
      }
    }
  }

  // SPREAD -------------------------------------------------------------------
  if (!CURRENT_PRESET.water1WaveSpread) {
    for (let index = 0; index < CURRENT_PRESET.water1Spread; index++) {
      let islandsWater1Batch1 = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'water1');

      for (let cell of islandsWater1Batch1) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.water1NeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland'
              && cellNeighbour.terrain != 'coast'
              && cellNeighbour.terrain != 'beach'
              && cellNeighbour.terrain != 'water1') {
              let rnd = getRandomIntegerBetween(0, 100);
              if (rnd < CURRENT_PRESET.water1SpreadProbability) {
                cellNeighbour.terrain = 'water1';
              }
            }
          }
        }
      }
    }
  } else {
    for (let index = 0; index < CURRENT_PRESET.water1Spread; index++) {
      let islandsWater1Batch1 = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'water1' && cell.isActive);

      for (let cell of islandsWater1Batch1) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.water1NeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland'
              && cellNeighbour.terrain != 'coast'
              && cellNeighbour.terrain != 'beach'
              && cellNeighbour.terrain != 'water1') {
              let rnd = getRandomIntegerBetween(0, 100);
              let rnd2 = getRandomIntegerBetween(0, 100);
              if (rnd < (CURRENT_PRESET.water1SpreadProbability * (rnd2 / 100))) {
                cellNeighbour.terrain = 'water1';
                cellNeighbour.isActive = true;
              }
            }
          }
        }
        cell.isActive = false;
      }
    }
  }

  // ISLAND WATER 2 ***************************************************************************************************

  // Island Water 2 batch 1

  let islandsWater1Spread = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'water1');
  for (let cell of islandsWater1Spread) {
    let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, 'plus');
    for (let cellNeighbour of cellNeighbours) {
      if (cellNeighbour != null) {
        if (cellNeighbour.terrain != 'mainland' 
          && cellNeighbour.terrain != 'coast'
          && cellNeighbour.terrain != 'beach'
          && cellNeighbour.terrain != 'water1'
          && cellNeighbour.terrain != 'water2') {
          cellNeighbour.terrain = 'water2';
          cellNeighbour.isActive = true;
        }
      }
    }
  }

  // SPREAD -------------------------------------------------------------------
  if (!CURRENT_PRESET.water2WaveSpread) {
    for (let index = 0; index < CURRENT_PRESET.water2Spread; index++) {
      let islandsWater2Batch1 = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'water2');

      for (let cell of islandsWater2Batch1) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.water2NeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland'
              && cellNeighbour.terrain != 'coast'
              && cellNeighbour.terrain != 'beach'
              && cellNeighbour.terrain != 'water1'
              && cellNeighbour.terrain != 'water2') {
              let rnd = getRandomIntegerBetween(0, 100);
              if (rnd < CURRENT_PRESET.water2SpreadProbability) {
                cellNeighbour.terrain = 'water2';
              }
            }
          }
        }
      }
    }
  } else {
    for (let index = 0; index < CURRENT_PRESET.water2Spread; index++) {
      let islandsWater2Batch1 = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'water2' && cell.isActive);

      for (let cell of islandsWater2Batch1) {
        let cellNeighbours = getCellNeighbourCells(cell.x_coord, cell.y_coord, pickNeighbourType(NEIGHBOUR_PROFILES[CURRENT_PRESET.water2NeighbourProfile]));
        for (let cellNeighbour of cellNeighbours) {
          if (cellNeighbour != null) {
            if (cellNeighbour.terrain != 'mainland'
              && cellNeighbour.terrain != 'coast'
              && cellNeighbour.terrain != 'beach'
              && cellNeighbour.terrain != 'water1'
              && cellNeighbour.terrain != 'water2') {
              let rnd = getRandomIntegerBetween(0, 100);
              let rnd2 = getRandomIntegerBetween(0, 100);
              if (rnd < (CURRENT_PRESET.water2SpreadProbability * (rnd2 / 100))) {
                cellNeighbour.terrain = 'water2';
                cellNeighbour.isActive = true;
              }
            }
          }
        }
        cell.isActive = false;
      }
    }
  }
}

function setHiddenPoint() {
  let eligibleCells = Object.values(FULL_MAP).filter((cell) => cell.terrain == 'mainland' || cell.terrain == 'coast' || cell.terrain == 'beach');
  let randomCell = eligibleCells[getRandomIntegerBetween(0, eligibleCells.length - 1)];

  randomCell.isHiddenPoint = true;
}

function renderCurrentView() {
  renderMapFromBounds(CURRENT_VIEW_BOUNDS);
}

function renderMapFromBounds(bounds) {
  let mapContainer = document.getElementById('mapContainer');
  mapContainer.innerHTML = '';

  // A. calculer la taille logique de la vue
  const visibleWidth = bounds.endX - bounds.startX + 1;
  const visibleHeight = bounds.endY - bounds.startY + 1;

  mapContainer.style.setProperty( '--x-size', visibleWidth);

  //B. injecter dans le conteneur les cellules de cette zone seulement
  let htmlString = '';

  for (let y = bounds.startY; y <= bounds.endY; y++) {
    for (let x = bounds.startX; x <= bounds.endX; x++) {
      const cell = FULL_MAP[getCellKey(x, y)];
      const cellHtml = `
        <div 
          id="${cell.x_coord}-${cell.y_coord}" 
          class="grid-cell ${cell.terrain == null ? '' : cell.terrain} ${cell.isCentralPoint ? 'central-point' : ''} ${cell.isHiddenPoint ? 'hidden-point' : ''}"
          >
          ${CURRENT_ZOOM >= 8 && cell.terrain == 'mainland' ? `<img class="sprite zoom-${CURRENT_ZOOM}" src="${APP_ORIGIN}assets/medias/images/${CURRENT_PRESET.id}-mainland.png" />` : ''}
          ${CURRENT_ZOOM >= 8 && cell.terrain == 'coast' ? `<img class="sprite zoom-${CURRENT_ZOOM}" src="${APP_ORIGIN}assets/medias/images/${CURRENT_PRESET.id}-coast.png" />` : ''}
          ${CURRENT_ZOOM >= 8 && cell.terrain == 'beach' ? `<img class="sprite zoom-${CURRENT_ZOOM}" src="${APP_ORIGIN}assets/medias/images/${CURRENT_PRESET.id}-beach.png" />` : ''}

          ${CURRENT_ZOOM >= 8 && (cell.terrain == null || cell.terrain == 'water1' || cell.terrain == 'water2') ? `<img class="sprite zoom-${CURRENT_ZOOM}" src="${APP_ORIGIN}assets/medias/images/water.gif" />` : ''}
          ${CURRENT_ZOOM == 128 ? `<img class="sprite final" src="${APP_ORIGIN}assets/medias/images/win.png" />` : ''}
        </div>`;
      htmlString += cellHtml;
    }
  }

  mapContainer.innerHTML = htmlString;
}

export function getQuarterBounds(vertical, horizontal) {
  const visibleWidth = CURRENT_VIEW_BOUNDS.endX - CURRENT_VIEW_BOUNDS.startX + 1;
  const visibleHeight = CURRENT_VIEW_BOUNDS.endY - CURRENT_VIEW_BOUNDS.startY + 1;

  const halfWidth = visibleWidth / 2;
  const halfHeight = visibleHeight / 2;

  let startX;
  let endX;
  let startY;
  let endY;

  if (horizontal === 'left') {
    startX = CURRENT_VIEW_BOUNDS.startX;
    endX = CURRENT_VIEW_BOUNDS.startX + halfWidth - 1;
  } else {
    startX = CURRENT_VIEW_BOUNDS.startX + halfWidth;
    endX = CURRENT_VIEW_BOUNDS.endX;
  }

  if (vertical === 'top') {
    startY = CURRENT_VIEW_BOUNDS.startY;
    endY = CURRENT_VIEW_BOUNDS.startY + halfHeight - 1;
  } else {
    startY = CURRENT_VIEW_BOUNDS.startY + halfHeight;
    endY = CURRENT_VIEW_BOUNDS.endY;
  }

  return { startX, endX, startY, endY };
}

export function isHiddenPointInBounds(bounds) {
  for (let y = bounds.startY; y <= bounds.endY; y++) {
    for (let x = bounds.startX; x <= bounds.endX; x++) {
      const cell = FULL_MAP[getCellKey(x, y)];
      if (cell.isHiddenPoint) {
        return true;
      }
    }
  }

  return false;
}

export function zoomToQuarter(vertical, horizontal) {
  const quarterBounds = getQuarterBounds(vertical, horizontal);

  CURRENT_VIEW_BOUNDS = quarterBounds;
  CURRENT_ZOOM *= 2;

  renderCurrentView();
}

export function setPreset(preset) {
  CURRENT_PRESET = preset;
}

export function initNewMap() {
  // Map generation
  setupGrid();
  generateMapObject();
  setHiddenPoint();

  // Render
  CURRENT_ZOOM = 1;
  resetCurrentViewBounds();
  renderCurrentView();
}