export const NEIGHBOUR_PROFILES = {
  'Default':           { full: 1, plus: 2, cross: 2 }, // hybride, un peu anguleux, un peu diagonal, pas trop blob. Ça marche bien comme base.

  'Light orthogonal':  { full: 1, plus: 3, cross: 2 }, // orientation "+", mais garde de la souplesse
  'Light diagonal':    { full: 1, plus: 2, cross: 3 }, // orientation "X", mais garde de la souplesse

  'Orthogonal':        { full: 0, plus: 2, cross: 1 }, // orientation "+"
  'Diagonal':          { full: 0, plus: 1, cross: 2 }, // orientation "X"

  'Strict orthogonal': { full: 0, plus: 1, cross: 0 }, // orientation strictement "+", très "grille"
  'Strict diagonal':   { full: 0, plus: 0, cross: 1 }, // orientation strictement "X", très "damier"
};

export const PRESETS = [
  // DEFAULT PRESET ///////////////////////////////////////////////////////////
  {
    id: 'default',
    name: 'Default',
    // ISLAND CORE ========================================
    seedsCount: 6,      // Nombre de points de croissance initiaux
    coreIterations: 64, // Nombre d'itérations initiales d'étalement (en vague) à partir du point de croissance, pour former le "coeur" de l'île
    coreProbaMin: 15,   // Borne basse du seuil de probabilité aléatoire. Pour chaque tentative d'étalement du coeur, la probabilité réelle est tirée aléatoirement entre coreProbaMin et coreProbaMax
    coreProbaMax: 40,   // Borne haute du seuil de probabilité aléatoire. Pour chaque tentative d'étalement du coeur, la probabilité réelle est tirée aléatoirement entre coreProbaMin et coreProbaMax
    // SEEDS EXPANSION ====================================
    // Main land ----------------------
    mainlandWaveSpread: false,                    // Étalement en vague (avec cycle de vie) ou non (chaque cellule garde son potentiel d'étalement toute sa vie)
    mainlandNeighbourProfile: 'Light orthogonal', // Profil pondéré de sélection des voisins pour l'étalement
    mainlandSpread: 12,                           // Nombre d'itérations d'étalement du terrain principal à partir du "coeur" de l'île
    mainlandSpreadProbability: 20,                // Probabilité de conversion d'une cellule voisine à chaque tentative d'étalement
    // Coast --------------------------
    coastWaveSpread: true,                        // Étalement en vague (avec cycle de vie) ou non (chaque cellule garde son potentiel d'étalement toute sa vie)
    coastNeighbourProfile: 'Light orthogonal',    // Profil pondéré de sélection des voisins pour l'étalement
    coastSpread: 6,                               // Nombre d'itérations d'étalement de la côte à partir du terrain principal de l'île
    coastSpreadProbability: 20,                   // Probabilité de conversion d'une cellule voisine à chaque tentative d'étalement
    // Beach --------------------------
    beachWaveSpread: false,                       // Étalement en vague (avec cycle de vie) ou non (chaque cellule garde son potentiel d'étalement toute sa vie)
    beachNeighbourProfile: 'Light orthogonal',    // Profil pondéré de sélection des voisins pour l'étalement
    beachSpread: 5,                               // Nombre d'itérations d'étalement de la plage à partir de la côte de l'île
    beachSpreadProbability: 5,                    // Probabilité de conversion d'une cellule voisine à chaque tentative d'étalement
    // Water 1 ------------------------
    water1WaveSpread: false,                      // Étalement en vague (avec cycle de vie) ou non (chaque cellule garde son potentiel d'étalement toute sa vie)
    water1NeighbourProfile: 'Default',            // Profil pondéré de sélection des voisins pour l'étalement
    water1Spread: 8,                              // Nombre d'itérations d'étalement de l'eau 1 à partir de la plage de l'île
    water1SpreadProbability: 16,                  // Probabilité de conversion d'une cellule voisine à chaque tentative d'étalement
    // Water 2 ------------------------
    water2WaveSpread: false,                      // Étalement en vague (avec cycle de vie) ou non (chaque cellule garde son potentiel d'étalement toute sa vie)
    water2NeighbourProfile: 'Light orthogonal',   // Profil pondéré de sélection des voisins pour l'étalement
    water2Spread: 16,                             // Nombre d'itérations d'étalement de l'eau 2 à partir de l'eau 1 de l'île
    water2SpreadProbability: 12,                  // Probabilité de conversion d'une cellule voisine à chaque tentative d'étalement
  },

  // REALISTIC ARCHIPELAGO ////////////////////////////////////////////////////
  {
    id: 'realistic',
    name: 'Realistic',
    // ISLAND CORE ========================================
    seedsCount: 4,
    coreIterations: 12,
    coreProbaMin: 20, 
    coreProbaMax: 50,
    // SEEDS EXPANSION ====================================
    // Main land ----------------------
    mainlandWaveSpread: false,
    mainlandNeighbourProfile: 'Light orthogonal',
    mainlandSpread: 48,
    mainlandSpreadProbability: 20,
    // Coast --------------------------
    coastWaveSpread: true,
    coastNeighbourProfile: 'Light orthogonal',
    coastSpread: 16,
    coastSpreadProbability: 20,
    // Beach --------------------------
    beachWaveSpread: false,
    beachNeighbourProfile: 'Light orthogonal',
    beachSpread: 4,
    beachSpreadProbability: 8,
    // Water 1 ------------------------
    water1WaveSpread: false,
    water1NeighbourProfile: 'Default',
    water1Spread: 24,
    water1SpreadProbability: 8,
    // Water 2 ------------------------
    water2WaveSpread: false,
    water2NeighbourProfile: 'Light orthogonal',
    water2Spread: 16,
    water2SpreadProbability: 12,
  },

  // VOLCANIC ISLANDS /////////////////////////////////////////////////////////
  {
    id: 'volcanic',
    name: 'Volcanic',
    // ISLAND CORE ========================================
    seedsCount: 3,
    coreIterations: 6,
    coreProbaMin: 20, 
    coreProbaMax: 60,
    // SEEDS EXPANSION ====================================
    // Main land ----------------------
    mainlandWaveSpread: false,
    mainlandNeighbourProfile: 'Light orthogonal',
    mainlandSpread: 40,
    mainlandSpreadProbability: 25,
    // Coast --------------------------
    coastWaveSpread: true,
    coastNeighbourProfile: 'Light orthogonal',
    coastSpread: 16,
    coastSpreadProbability: 16,
    // Beach --------------------------
    beachWaveSpread: false,
    beachNeighbourProfile: 'Light orthogonal',
    beachSpread: 2,
    beachSpreadProbability: 16,
    // Water 1 ------------------------
    water1WaveSpread: false,
    water1NeighbourProfile: 'Default',
    water1Spread: 6,
    water1SpreadProbability: 12,
    // Water 2 ------------------------
    water2WaveSpread: false,
    water2NeighbourProfile: 'Light orthogonal',
    water2Spread: 8,
    water2SpreadProbability: 16,
  },

  // CORAL HELL ///////////////////////////////////////////////////////////////
  {
    id: 'coral-hell',
    name: 'Coral hell',
    // ISLAND CORE ========================================
    seedsCount: 24,
    coreIterations: 80,
    coreProbaMin: 10, 
    coreProbaMax: 30,
    // SEEDS EXPANSION ====================================
    // Main land ----------------------
    mainlandWaveSpread: true,
    mainlandNeighbourProfile: 'Diagonal',
    mainlandSpread: 50,
    mainlandSpreadProbability: 70,
    // Coast --------------------------
    coastWaveSpread: true,
    coastNeighbourProfile: 'Light orthogonal',
    coastSpread: 12,
    coastSpreadProbability: 40,
    // Beach --------------------------
    beachWaveSpread: true,
    beachNeighbourProfile: 'Light diagonal',
    beachSpread: 32,
    beachSpreadProbability: 60,
    // Water 1 ------------------------
    water1WaveSpread: false,
    water1NeighbourProfile: 'Orthogonal',
    water1Spread: 20,
    water1SpreadProbability: 6,
    // Water 2 ------------------------
    water2WaveSpread: false,
    water2NeighbourProfile: 'Light orthogonal',
    water2Spread: 16,
    water2SpreadProbability: 12,
  },

  // ICEBERGS /////////////////////////////////////////////////////////////////
  {
    id: 'iceberg',
    name: 'Icebergs',
    // ISLAND CORE ========================================
    seedsCount: 5,
    coreIterations: 32,
    coreProbaMin: 25,
    coreProbaMax: 38,
    // SEEDS EXPANSION ====================================
    // Main land ----------------------
    mainlandWaveSpread: true,
    mainlandNeighbourProfile: 'Light diagonal',
    mainlandSpread: 18,
    mainlandSpreadProbability: 28,
    // Coast --------------------------
    coastWaveSpread: true,
    coastNeighbourProfile: 'Diagonal',
    coastSpread: 12,
    coastSpreadProbability: 18,
    // Beach --------------------------
    beachWaveSpread: false,
    beachNeighbourProfile: 'Strict orthogonal',
    beachSpread: 1,
    beachSpreadProbability: 4,
    // Water 1 ------------------------
    water1WaveSpread: false,
    water1NeighbourProfile: 'Light diagonal',
    water1Spread: 20,
    water1SpreadProbability: 10,
    // Water 2 ------------------------
    water2WaveSpread: false,
    water2NeighbourProfile: 'Light orthogonal',
    water2Spread: 24,
    water2SpreadProbability: 14,
  },

  // TROPICAL BELT ////////////////////////////////////////////////////////////
  {
    id: 'tropical-belt',
    name: 'Tropical belt',

    // CORE
    seedsCount: 14,
    coreIterations: 25,
    coreProbaMin: 16,
    coreProbaMax: 36,

    // MAINLAND
    mainlandWaveSpread: true,
    mainlandNeighbourProfile: 'Orthogonal',
    mainlandSpread: 22,
    mainlandSpreadProbability: 24,

    // COAST
    coastWaveSpread: true,
    coastNeighbourProfile: 'Light orthogonal',
    coastSpread: 8,
    coastSpreadProbability: 24,

    // BEACH
    beachWaveSpread: false,
    beachNeighbourProfile: 'Light diagonal',
    beachSpread: 6,
    beachSpreadProbability: 12,

    // WATER 1
    water1WaveSpread: false,
    water1NeighbourProfile: 'Default',
    water1Spread: 8,
    water1SpreadProbability: 16,

    // WATER 2
    water2WaveSpread: false,
    water2NeighbourProfile: 'Light orthogonal',
    water2Spread: 16,
    water2SpreadProbability: 12,
  },

  // MICRO ISLANDS ////////////////////////////////////////////////////////////
  {
    id: 'micro-islands',
    name: 'Micro islands',

    seedsCount: 32,
    coreIterations: 24,
    coreProbaMin: 10,
    coreProbaMax: 20,

    mainlandWaveSpread: true,
    mainlandNeighbourProfile: 'Light diagonal',
    mainlandSpread: 12,
    mainlandSpreadProbability: 20,

    coastWaveSpread: true,
    coastNeighbourProfile: 'Diagonal',
    coastSpread: 6,
    coastSpreadProbability: 16,

    beachWaveSpread: false,
    beachNeighbourProfile: 'Default',
    beachSpread: 4,
    beachSpreadProbability: 12,

    water1WaveSpread: true,
    water1NeighbourProfile: 'Light diagonal',
    water1Spread: 64,
    water1SpreadProbability: 62,

    water2WaveSpread: false,
    water2NeighbourProfile: 'Strict diagonal',
    water2Spread: 10,
    water2SpreadProbability: 24,
  },
];

// tropical islands
/* {
  id: 'tropical',
  name: 'Tropical islands',
  seedsCount: 14,
  mainlandSpread: 14 * 2,
  mainlandSpreadProbability: 17,
  coastSpread: 3 * 2,
  coastSpreadProbability: 10,
  beachSpread: 2 * 2,
  beachSpreadProbability: 40,
  water1Spread: 6 * 2,
  water1SpreadProbability: 25,
  water2Spread: 10 * 2,
  water2SpreadProbability: 18,
}, */
// fjord islands
/* {
  id: 'fjord',
  name: 'Fjords',
  seedsCount: 6,
  mainlandSpread: 26 * 2,
  mainlandSpreadProbability: 14,
  coastSpread: 7 * 2,
  coastSpreadProbability: 10,
  beachSpread: 1 * 2,
  beachSpreadProbability: 20,
  water1Spread: 6 * 2,
  water1SpreadProbability: 30,
  water2Spread: 12 * 2,
  water2SpreadProbability: 15,
}, */
/* {
  id: 'continent',
  name: 'Continent',
  seedsCount: 3,
  mainlandSpread: 36 * 2,
  mainlandSpreadProbability: 22,
  coastSpread: 6 * 2,
  coastSpreadProbability: 12,
  beachSpread: 1 * 2,
  beachSpreadProbability: 16,
  water1Spread: 2 * 2,
  water1SpreadProbability: 6,
  water2Spread: 8 * 2,
  water2SpreadProbability: 12,
}, */
/* {
  id: 'mangrove',
  name: 'Mangrove delta',
  seedsCount: 24,
  mainlandSpread: 2 * 2,
  mainlandSpreadProbability: 2,
  coastSpread: 12 * 2,
  coastSpreadProbability: 12,
  beachSpread: 4 * 2,
  beachSpreadProbability: 10,
  water1Spread: 6 * 2,
  water1SpreadProbability: 6,
  water2Spread: 12 * 2,
  water2SpreadProbability: 14,
}, */