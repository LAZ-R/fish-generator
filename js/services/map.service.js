/**
 * Map Service
 * -----------
 * Objectif :
 * - Interaction type Google Maps/Leaflet : pan 1 doigt, pinch 2 doigts, zoom centré sous les doigts
 * - Bornes souples (rebond) pour éviter de perdre la map
 * - MIN_SCALE = "contain" : dézoom mini = map entièrement visible
 * - État persistant (originX/originY/scale) quand on revient sur la page
 * - Vue initiale "device-independent" :
 *   -> on définit un point (X,Y) en pixels de la map non-scalée à afficher au centre du viewport.
 *
 * Règle importante :
 * - Les coordonnées "map" (centerMapX/centerMapY) sont exprimées dans le repère de la map à scale=1
 *   (donc en px de la div .map, qui correspond idéalement à l'image d'origine / ton repère logique).
 */

/* -------------------------------------------------------------------------- */
/*  Engine config (générique : "feel" / algorithme)                            */
/* -------------------------------------------------------------------------- */

const defaultEngineConfig = {
  reboundStrength: 0.2,

  momentumFriction: 0.92,
  momentumStopSpeed: 0.02,        // px/ms
  momentumIdleCutoffMs: 90,

  wheelZoomIntensity: 0.0015,

  zoomEpsilon: 0.001,
  zoomThrottleMs: 33,

  deltaTimeClampMs: 32
};

/* -------------------------------------------------------------------------- */
/*  Map config (spécifique à la "carte" affichée)                              */
/* -------------------------------------------------------------------------- */

const defaultMapConfig = {
  /**
   * Identifiant logique de la map (si tu changes de map et que tu veux reset l’état)
   * Exemple : "world-01", "dungeon-A", ...
   * Si null => pas de détection de changement.
   */
  mapKey: null,

  /**
   * Si true et mapKey change, on reset mapState.hasSavedState pour ne pas restaurer l'ancienne vue.
   */
  resetStateWhenMapKeyChanges: false,

  /**
   * Zoom max dépend souvent du contenu (map = plus détaillée => maxScale plus haut)
   */
  maxScale: 2.5,

  /**
   * Zoom min :
   * - "contain" => la map entière visible
   * - "fixed"   => valeur fixe minScaleFixed
   */
  minScaleMode: "contain", // "contain" | "fixed"
  minScaleFixed: 0.17,

  /**
   * Vue initiale (si pas d'état sauvegardé)
   */
  initialView: {
    scale: 1.2,
    centerMapX: 961,
    centerMapY: 3904
  },

  /**
   * Au resize : garder le point logique centré (si connu)
   */
  keepCenterPointOnResize: true
};

/* -------------------------------------------------------------------------- */
/*  Etat persistant (tant que l'app tourne)                                    */
/* -------------------------------------------------------------------------- */

export const mapState = {
  hasSavedState: false,

  scale: 1,
  originX: 0,
  originY: 0,

  // point map (repère scale=1) que l'on garde centré (utile resize)
  centerMapX: null,
  centerMapY: null,

  // optionnel : permet de détecter un "changement de map" si tu veux reset
  activeMapKey: null
};

/* -------------------------------------------------------------------------- */
/*  Events                                                                     */
/* -------------------------------------------------------------------------- */

export const mapEvents = new EventTarget();
export const MAP_ZOOM_CHANGE_EVENT = 'map:zoom-change';

function emitZoomChange(newScale) {
  mapEvents.dispatchEvent(new CustomEvent(MAP_ZOOM_CHANGE_EVENT, {
    detail: { scale: newScale }
  }));
}

/* -------------------------------------------------------------------------- */
/*  DOM refs (varient si la page est détruite/recréée)                         */
/* -------------------------------------------------------------------------- */

let viewportElement = null; // la zone visible, fenêtre
let mapElement = null;      // le contenu qu'on translate/scale

let cleanup = null;         // pour éviter doublons si init rappelé







/* -------------------------------------------------------------------------- */
/*  API interne exposée                                                       */
/* -------------------------------------------------------------------------- */

let mapApi = null; // rempli par initMapLogic()

/* -------------------------------------------------------------------------- */
/*  Helpers "purs"                                                             */
/* -------------------------------------------------------------------------- */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convertit un point map (repère scale=1) vers originX/originY pour centrer ce point.
 */
function computeOriginToCenterMapPoint({
  centerMapX,
  centerMapY,
  scale,
  viewportWidth,
  viewportHeight
}) {
  return {
    originX: (viewportWidth / 2) - (centerMapX * scale),
    originY: (viewportHeight / 2) - (centerMapY * scale)
  };
}

/**
 * Convertit un point client (event.clientX/Y) en coords locales au viewport.
 */
function getPointerPositionInViewport(event, viewport) {
  const rect = viewport.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

/**
 * Centre entre deux touches en coords locales viewport.
 */
function getTouchesCenter(touch1, touch2, viewport) {
  const rect = viewport.getBoundingClientRect();
  return {
    x: ((touch1.clientX + touch2.clientX) / 2) - rect.left,
    y: ((touch1.clientY + touch2.clientY) / 2) - rect.top
  };
}

/* -------------------------------------------------------------------------- */
/*  Core (fonctions qui manipulent un "contexte")                              */
/* -------------------------------------------------------------------------- */

function createMapLogicContext({ viewport, map, engineConfig, mapConfig }) {
  return {
    viewport,
    map,

    engineConfig,
    mapConfig,

    // Etat live
    scale: 1,
    originX: 0,
    originY: 0,
    minScale: 0.17,

    // Input tracking
    lastTouches: [],
    isMouseDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    lastMouseMoveTime: 0,

    // Momentum
    velocityX: 0,
    velocityY: 0,
    lastMoveTime: 0,
    isDragging: false,
    isMomentumActive: false,

    // Zoom event throttling
    lastEmittedScale: 1,
    lastZoomEmitTime: 0,

    // RAF bookkeeping
    rafId: 0,
    lastRafTime: 0
  };
}

function applyTransform(context) {
  context.map.style.transform =
    `translate(${context.originX}px, ${context.originY}px) scale(${context.scale})`;
}

/**
 * Calcule le minScale selon mapConfig.minScaleMode.
 */
function updateMinScale(context) {
  const viewportWidth = context.viewport.clientWidth;
  const viewportHeight = context.viewport.clientHeight;

  const mapWidth = context.map.clientWidth;
  const mapHeight = context.map.clientHeight;

  if (context.mapConfig.minScaleMode === "fixed") {
    context.minScale = context.mapConfig.minScaleFixed;
    return;
  }

  // contain
  context.minScale = Math.min(viewportWidth / mapWidth, viewportHeight / mapHeight);
}

function computeBoundsTarget(context) {
  const viewportWidth = context.viewport.clientWidth;
  const viewportHeight = context.viewport.clientHeight;

  const scaledMapWidth = context.map.clientWidth * context.scale;
  const scaledMapHeight = context.map.clientHeight * context.scale;

  // X
  const centeredX = (viewportWidth - scaledMapWidth) / 2;
  const minX = viewportWidth - scaledMapWidth;
  const maxX = 0;

  const targetX =
    (scaledMapWidth <= viewportWidth)
      ? centeredX
      : clamp(context.originX, minX, maxX);

  // Y
  const centeredY = (viewportHeight - scaledMapHeight) / 2;
  const minY = viewportHeight - scaledMapHeight;
  const maxY = 0;

  const targetY =
    (scaledMapHeight <= viewportHeight)
      ? centeredY
      : clamp(context.originY, minY, maxY);

  return { targetX, targetY };
}

/**
 * Applique les bounds avec rebond doux (feel moteur).
 */
function applyBoundsWithRebound(context) {
  const { targetX, targetY } = computeBoundsTarget(context);

  const strength = context.engineConfig.reboundStrength;
  context.originX += (targetX - context.originX) * strength;
  context.originY += (targetY - context.originY) * strength;

  applyTransform(context);

  // retourne l’erreur restante (utile pour décider si on continue en rAF)
  return {
    remainingX: targetX - context.originX,
    remainingY: targetY - context.originY
  };
}

/**
 * Variante "snap" (utile pour setView programmatique).
 */
function applyBoundsSnap(context) {
  const viewportWidth = context.viewport.clientWidth;
  const viewportHeight = context.viewport.clientHeight;

  const scaledMapWidth = context.map.clientWidth * context.scale;
  const scaledMapHeight = context.map.clientHeight * context.scale;

  const centeredX = (viewportWidth - scaledMapWidth) / 2;
  const minX = viewportWidth - scaledMapWidth;
  const maxX = 0;

  context.originX =
    (scaledMapWidth <= viewportWidth)
      ? centeredX
      : clamp(context.originX, minX, maxX);

  const centeredY = (viewportHeight - scaledMapHeight) / 2;
  const minY = viewportHeight - scaledMapHeight;
  const maxY = 0;

  context.originY =
    (scaledMapHeight <= viewportHeight)
      ? centeredY
      : clamp(context.originY, minY, maxY);

  applyTransform(context);
}

function clampScaleToLimits(context) {
  context.scale = clamp(context.scale, context.minScale, context.mapConfig.maxScale);
}

function saveStateFromContext(context) {
  mapState.scale = context.scale;
  mapState.originX = context.originX;
  mapState.originY = context.originY;
  mapState.activeMapKey = context.mapConfig.mapKey;
}

function updateCenteredMapPointInState(context) {
  const viewportWidth = context.viewport.clientWidth;
  const viewportHeight = context.viewport.clientHeight;

  mapState.centerMapX = (viewportWidth / 2 - context.originX) / context.scale;
  mapState.centerMapY = (viewportHeight / 2 - context.originY) / context.scale;
}

function emitZoomChangeIfNeeded(context) {
  const now = performance.now();

  if (Math.abs(context.scale - context.lastEmittedScale) <= context.engineConfig.zoomEpsilon) return;
  if (now - context.lastZoomEmitTime < context.engineConfig.zoomThrottleMs) return;

  context.lastEmittedScale = context.scale;
  context.lastZoomEmitTime = now;

  emitZoomChange(context.scale);
}

/**
 * Applique une vue par point map centré.
 * - mode "snapBounds" : true => snap (teleport)
 * - sinon rebond doux
 */
function applyViewByMapPoint(context, { centerMapX, centerMapY, scale }, snapBounds) {
  updateMinScale(context);

  context.scale = scale;
  clampScaleToLimits(context);

  const viewportWidth = context.viewport.clientWidth;
  const viewportHeight = context.viewport.clientHeight;

  const computed = computeOriginToCenterMapPoint({
    centerMapX,
    centerMapY,
    scale: context.scale,
    viewportWidth,
    viewportHeight
  });

  context.originX = computed.originX;
  context.originY = computed.originY;

  if (snapBounds) applyBoundsSnap(context);
  else applyBoundsWithRebound(context);

  updateCenteredMapPointInState(context);
  saveStateFromContext(context);
  emitZoomChangeIfNeeded(context);
}

/**
 * Restore ou init.
 */
function restoreOrInitView(context) {
  const shouldTryRestore = mapState.hasSavedState;

  if (shouldTryRestore) {
    context.scale = mapState.scale;
    context.originX = mapState.originX;
    context.originY = mapState.originY;

    updateMinScale(context);
    clampScaleToLimits(context);

    applyBoundsWithRebound(context);

    updateCenteredMapPointInState(context);
    saveStateFromContext(context);
    return;
  }

  // initial view
  applyViewByMapPoint(context, context.mapConfig.initialView, true); // snap pour init = net

  mapState.hasSavedState = true;
}

/* -------------------------------------------------------------------------- */
/*  API PUBLIQUE                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Initialise le moteur map sur la page courante.
 *
 * - Ne supporte pas 2 maps simultanées (volontaire).
 * - Peut être rappelé avec un autre mapConfig : l'ancienne instance DOM est nettoyée, la nouvelle est bindée.
 */
export function initMapLogic(mapConfigOverride = {}, engineConfigOverride = {}) {
  // Si déjà initialisé, on nettoie l'instance précédente (listeners + raf)
  if (cleanup) cleanup();

  viewportElement = document.querySelector('.map-viewport');
  mapElement = document.querySelector('.map');

  if (!viewportElement || !mapElement) {
    cleanup = null;
    return;
  }

  const engineConfig = { ...defaultEngineConfig, ...engineConfigOverride };
  const mapConfig = {
    ...defaultMapConfig,
    ...mapConfigOverride,
    initialView: { ...defaultMapConfig.initialView, ...(mapConfigOverride.initialView || {}) }
  };

  // Option : si mapKey change, on reset l'état sauvegardé
  if (mapConfig.resetStateWhenMapKeyChanges && mapConfig.mapKey != null) {
    if (mapState.activeMapKey != null && mapState.activeMapKey !== mapConfig.mapKey) {
      mapState.hasSavedState = false;
      mapState.centerMapX = null;
      mapState.centerMapY = null;
    }
  }

  const mapLogicContext = createMapLogicContext({
    viewport: viewportElement,
    map: mapElement,
    engineConfig,
    mapConfig
  });

  /* ------------------------------------------------------------------------ */
  /*  RAF on-demand (optim CPU)                                                */
  /* ------------------------------------------------------------------------ */

  let isAnimationFrameScheduled = false;

  function requestAnimationFrameIfNeeded() {
    if (isAnimationFrameScheduled) return;
    isAnimationFrameScheduled = true;
    mapLogicContext.rafId = requestAnimationFrame(updateFrame);
  }

  /* ------------------------------------------------------------------------ */
  /*  Handlers (utilisent mapLogicContext)                                     */
  /* ------------------------------------------------------------------------ */

  function stopMomentum() {
    mapLogicContext.isMomentumActive = false;
    mapLogicContext.velocityX = 0;
    mapLogicContext.velocityY = 0;
  }

  function onTouchStart(event) {
    stopMomentum();

    if (event.touches.length === 1) {
      mapLogicContext.lastTouches = [event.touches[0]];
      mapLogicContext.isDragging = true;
      mapLogicContext.lastMoveTime = performance.now();
    } else if (event.touches.length === 2) {
      mapLogicContext.lastTouches = [...event.touches];
      mapLogicContext.isDragging = false;
    }

    // On déclenche une frame au cas où (pas obligatoire, mais safe)
    requestAnimationFrameIfNeeded();
  }

  function onTouchMove(event) {
    event.preventDefault();

    // Pan 1 doigt
    if (event.touches.length === 1 && mapLogicContext.lastTouches.length === 1) {
      const now = performance.now();
      const dt = Math.max(1, now - mapLogicContext.lastMoveTime);

      const deltaX = event.touches[0].clientX - mapLogicContext.lastTouches[0].clientX;
      const deltaY = event.touches[0].clientY - mapLogicContext.lastTouches[0].clientY;

      mapLogicContext.originX += deltaX;
      mapLogicContext.originY += deltaY;

      const instantVX = deltaX / dt;
      const instantVY = deltaY / dt;

      mapLogicContext.velocityX = mapLogicContext.velocityX * 0.7 + instantVX * 0.3;
      mapLogicContext.velocityY = mapLogicContext.velocityY * 0.7 + instantVY * 0.3;

      mapLogicContext.lastMoveTime = now;
      mapLogicContext.lastTouches = [event.touches[0]];
    }

    // Pinch 2 doigts
    if (event.touches.length === 2 && mapLogicContext.lastTouches.length === 2) {
      mapLogicContext.velocityX = 0;
      mapLogicContext.velocityY = 0;
      mapLogicContext.isDragging = false;

      const previousDistance = Math.hypot(
        mapLogicContext.lastTouches[0].clientX - mapLogicContext.lastTouches[1].clientX,
        mapLogicContext.lastTouches[0].clientY - mapLogicContext.lastTouches[1].clientY
      );

      const currentDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );

      const previousCenter = getTouchesCenter(mapLogicContext.lastTouches[0], mapLogicContext.lastTouches[1], viewportElement);
      const currentCenter = getTouchesCenter(event.touches[0], event.touches[1], viewportElement);

      const zoomFactor = currentDistance / previousDistance;

      const newScale = clamp(
        mapLogicContext.scale * zoomFactor,
        mapLogicContext.minScale,
        mapLogicContext.mapConfig.maxScale
      );

      // déplacement naturel du centre si les doigts bougent
      mapLogicContext.originX += (currentCenter.x - previousCenter.x);
      mapLogicContext.originY += (currentCenter.y - previousCenter.y);

      // zoom autour du centre
      const scaleChange = newScale / mapLogicContext.scale;
      mapLogicContext.originX = currentCenter.x - (currentCenter.x - mapLogicContext.originX) * scaleChange;
      mapLogicContext.originY = currentCenter.y - (currentCenter.y - mapLogicContext.originY) * scaleChange;

      mapLogicContext.scale = newScale;
      mapLogicContext.lastTouches = [...event.touches];

      emitZoomChangeIfNeeded(mapLogicContext);
    }

    applyBoundsWithRebound(mapLogicContext);
    updateCenteredMapPointInState(mapLogicContext);
    saveStateFromContext(mapLogicContext);

    // IMPORTANT : relance rAF (rebond + éventuel momentum)
    requestAnimationFrameIfNeeded();
  }

  function onTouchEnd() {
    mapLogicContext.lastTouches = [];

    if (mapLogicContext.isDragging) {
      mapLogicContext.isDragging = false;

      const speed = Math.hypot(mapLogicContext.velocityX, mapLogicContext.velocityY);
      if (speed > mapLogicContext.engineConfig.momentumStopSpeed) {
        mapLogicContext.isMomentumActive = true;
        mapLogicContext.lastRafTime = 0; // évite un saut dt
        requestAnimationFrameIfNeeded();
      } else {
        stopMomentum();
      }
    }
  }

  function onMouseDown(event) {
    if (event.button !== 0) return;

    event.preventDefault();
    stopMomentum();

    mapLogicContext.isMouseDragging = true;
    viewportElement.classList.toggle('is-dragging', true);

    const pointer = getPointerPositionInViewport(event, viewportElement);
    mapLogicContext.lastMouseX = pointer.x;
    mapLogicContext.lastMouseY = pointer.y;

    mapLogicContext.lastMouseMoveTime = performance.now();

    requestAnimationFrameIfNeeded();
  }

  function onMouseMove(event) {
    if (!mapLogicContext.isMouseDragging) return;

    event.preventDefault();

    const pointer = getPointerPositionInViewport(event, viewportElement);

    const now = performance.now();
    const dt = Math.max(1, now - mapLogicContext.lastMouseMoveTime);

    const deltaX = pointer.x - mapLogicContext.lastMouseX;
    const deltaY = pointer.y - mapLogicContext.lastMouseY;

    mapLogicContext.originX += deltaX;
    mapLogicContext.originY += deltaY;

    const instantVX = deltaX / dt;
    const instantVY = deltaY / dt;

    mapLogicContext.velocityX = mapLogicContext.velocityX * 0.7 + instantVX * 0.3;
    mapLogicContext.velocityY = mapLogicContext.velocityY * 0.7 + instantVY * 0.3;

    mapLogicContext.lastMouseX = pointer.x;
    mapLogicContext.lastMouseY = pointer.y;
    mapLogicContext.lastMouseMoveTime = now;

    applyBoundsWithRebound(mapLogicContext);
    updateCenteredMapPointInState(mapLogicContext);
    saveStateFromContext(mapLogicContext);

    requestAnimationFrameIfNeeded();
  }

  function onMouseUp() {
    if (!mapLogicContext.isMouseDragging) return;

    mapLogicContext.isMouseDragging = false;
    viewportElement.classList.toggle('is-dragging', false);

    const now = performance.now();
    const idleMs = now - mapLogicContext.lastMouseMoveTime;

    if (idleMs > mapLogicContext.engineConfig.momentumIdleCutoffMs) {
      stopMomentum();
      return;
    }

    // atténuation selon idle
    const frames = idleMs / 16;
    const decay = Math.pow(mapLogicContext.engineConfig.momentumFriction, frames);
    mapLogicContext.velocityX *= decay;
    mapLogicContext.velocityY *= decay;

    const speed = Math.hypot(mapLogicContext.velocityX, mapLogicContext.velocityY);
    if (speed > mapLogicContext.engineConfig.momentumStopSpeed) {
      mapLogicContext.isMomentumActive = true;
      mapLogicContext.lastRafTime = 0; // reset dt rAF
      requestAnimationFrameIfNeeded();
    } else {
      stopMomentum();
    }
  }

  function onMouseLeave() {
    if (mapLogicContext.isMouseDragging) onMouseUp();
  }

  function onWheel(event) {
    event.preventDefault();
    stopMomentum();

    const pointer = getPointerPositionInViewport(event, viewportElement);

    const zoomFactor = Math.exp(-event.deltaY * mapLogicContext.engineConfig.wheelZoomIntensity);

    const newScale = clamp(
      mapLogicContext.scale * zoomFactor,
      mapLogicContext.minScale,
      mapLogicContext.mapConfig.maxScale
    );

    const scaleChange = newScale / mapLogicContext.scale;

    mapLogicContext.originX = pointer.x - (pointer.x - mapLogicContext.originX) * scaleChange;
    mapLogicContext.originY = pointer.y - (pointer.y - mapLogicContext.originY) * scaleChange;

    mapLogicContext.scale = newScale;

    emitZoomChangeIfNeeded(mapLogicContext);

    applyBoundsWithRebound(mapLogicContext);
    updateCenteredMapPointInState(mapLogicContext);
    saveStateFromContext(mapLogicContext);

    requestAnimationFrameIfNeeded();
  }

  function onResize() {
    updateMinScale(mapLogicContext);
    clampScaleToLimits(mapLogicContext);

    if (mapLogicContext.mapConfig.keepCenterPointOnResize && mapState.centerMapX != null && mapState.centerMapY != null) {
      applyViewByMapPoint(mapLogicContext, {
        centerMapX: mapState.centerMapX,
        centerMapY: mapState.centerMapY,
        scale: mapLogicContext.scale
      }, false);
      return;
    }

    applyBoundsWithRebound(mapLogicContext);
    updateCenteredMapPointInState(mapLogicContext);
    saveStateFromContext(mapLogicContext);

    requestAnimationFrameIfNeeded();
  }

  /* ------------------------------------------------------------------------ */
  /*  Attach listeners                                                         */
  /* ------------------------------------------------------------------------ */

  viewportElement.addEventListener('touchstart', onTouchStart, { passive: true });
  viewportElement.addEventListener('touchmove', onTouchMove, { passive: false });
  viewportElement.addEventListener('touchend', onTouchEnd, { passive: true });

  viewportElement.addEventListener('wheel', onWheel, { passive: false });

  viewportElement.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  viewportElement.addEventListener('mouseleave', onMouseLeave);

  window.addEventListener('resize', onResize);

  /* ------------------------------------------------------------------------ */
  /*  Init                                                                     */
  /* ------------------------------------------------------------------------ */

  updateMinScale(mapLogicContext);
  restoreOrInitView(mapLogicContext);

  /* ------------------------------------------------------------------------ */
  /*  RAF loop on-demand (momentum + bounds)                                   */
  /* ------------------------------------------------------------------------ */

  function updateFrame() {
    isAnimationFrameScheduled = false;

    if (!viewportElement || !mapElement || !document.body.contains(viewportElement)) return;

    if (mapLogicContext.isMomentumActive) {
      const now = performance.now();
      mapLogicContext.lastRafTime = mapLogicContext.lastRafTime || now;

      const dt = Math.min(mapLogicContext.engineConfig.deltaTimeClampMs, now - mapLogicContext.lastRafTime);
      mapLogicContext.lastRafTime = now;

      mapLogicContext.originX += mapLogicContext.velocityX * dt;
      mapLogicContext.originY += mapLogicContext.velocityY * dt;

      mapLogicContext.velocityX *= mapLogicContext.engineConfig.momentumFriction;
      mapLogicContext.velocityY *= mapLogicContext.engineConfig.momentumFriction;

      const speed = Math.hypot(mapLogicContext.velocityX, mapLogicContext.velocityY);
      if (speed < mapLogicContext.engineConfig.momentumStopSpeed) {
        stopMomentum();
      }

      updateCenteredMapPointInState(mapLogicContext);
      saveStateFromContext(mapLogicContext);
    }

    // On avance d'un step de rebond, puis on décide si on continue.
    // NOTE : applyBoundsWithRebound retourne remainingX/remainingY (voir patch nécessaire ci-dessous)
    const { remainingX, remainingY } = applyBoundsWithRebound(mapLogicContext);

    const STILL_NEEDS_BOUNDS = Math.abs(remainingX) > 0.5 || Math.abs(remainingY) > 0.5;
    const SHOULD_CONTINUE = mapLogicContext.isMomentumActive || STILL_NEEDS_BOUNDS;

    if (SHOULD_CONTINUE) requestAnimationFrameIfNeeded();
  }

  // IMPORTANT : au cas où restore/init a créé une position hors bounds, on laisse le rebond finir
  requestAnimationFrameIfNeeded();

  /* ------------------------------------------------------------------------ */
  /*  Cleanup                                                                  */
  /* ------------------------------------------------------------------------ */

  cleanup = () => {
    if (!viewportElement) return;

    viewportElement.removeEventListener('touchstart', onTouchStart);
    viewportElement.removeEventListener('touchmove', onTouchMove);
    viewportElement.removeEventListener('touchend', onTouchEnd);

    viewportElement.removeEventListener('wheel', onWheel);

    viewportElement.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    viewportElement.removeEventListener('mouseleave', onMouseLeave);

    window.removeEventListener('resize', onResize);

    cancelAnimationFrame(mapLogicContext.rafId);

    viewportElement = null;
    mapElement = null;
    mapApi = null;
    cleanup = null;
  };

  /* ------------------------------------------------------------------------ */
  /*  API                                                                      */
  /* ------------------------------------------------------------------------ */

  mapApi = {
    /**
     * Set view programmatique : teleport net (snap bounds).
     * x/y = repère map à scale=1
     */
    setViewByMapPoint: ({ x, y, zoom }) => {
      applyViewByMapPoint(mapLogicContext, {
        centerMapX: x,
        centerMapY: y,
        scale: zoom
      }, true);

      // au cas où il reste du rebond après snap (rare), on laisse finir
      requestAnimationFrameIfNeeded();
    },

    getState: () => ({
      scale: mapLogicContext.scale,
      originX: mapLogicContext.originX,
      originY: mapLogicContext.originY,
      minScale: mapLogicContext.minScale
    })
  };
}

/**
 * Détruit proprement la logique map (listeners + rAF).
 */
export function destroyMapLogic() {
  if (cleanup) cleanup();
}

/**
 * API externe inchangée : centre la map sur un point "map" (repère scale=1) et un zoom.
 */
export function setMapToSpecificCoordinatesAndZoom(xCoord, yCoord, zoomLevel) {
  if (!mapApi) return;
  mapApi.setViewByMapPoint({ x: xCoord, y: yCoord, zoom: zoomLevel });
}