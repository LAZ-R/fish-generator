import { APP_BASE_PATH, APP_ORIGIN } from "../router.js";
import { getUser } from "./storage.service.js";

let MAIN_MUSIC = null;
let TEMP_AUDIO = null;
let CURRENTLY_PLAYING = null;

// Pour annuler proprement les callbacks si tu changes de musique en cours
let PLAY_TOKEN = 0;

let MUSICS = [
  { name: "title-screen", loop_point: 4160 },
  { name: "oak-lab", loop_point: 1070 },
  { name: "road-24-welcome", loop_point: 0 },
  { name: "pallet-town", loop_point: 0 },
  { name: "pokemon-center", loop_point: 0 },
];

// --- helpers ---
function waitCanPlay(audio) {
  return new Promise((resolve, reject) => {
    if (!audio) return reject(new Error("Audio is null"));
    if (audio.readyState >= 3) return resolve(); // HAVE_FUTURE_DATA

    const onReady = () => cleanup(resolve);
    const onError = () => cleanup(() => reject(audio.error || new Error("Audio load error")));

    const cleanup = (cb) => {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("error", onError);
      cb();
    };

    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });

    // force le chargement (utile selon navigateur/cache)
    audio.load();
  });
}

function safePause(audio) {
  try { audio?.pause(); } catch {}
}

export function playMusic(musicName) {
  const musicObj = MUSICS.find((m) => m.name === musicName);
  if (!musicObj) return;

  const user = getUser();
  if (!user.MUSIC) return;

  // si même musique, on ne relance pas
  if (CURRENTLY_PLAYING && CURRENTLY_PLAYING.name === musicName) return;

  stopMusic();

  CURRENTLY_PLAYING = musicObj;
  MAIN_MUSIC = new Audio(`${APP_ORIGIN}assets/medias/audio/music/${musicObj.name}.ogg`);
  MAIN_MUSIC.loop = true;
  MAIN_MUSIC.volume = 1;

  playMainMusic();
}

export async function playMainMusic() {
  if (!MAIN_MUSIC || !CURRENTLY_PLAYING) return;

  const name = CURRENTLY_PLAYING.name;
  const needsPre = CURRENTLY_PLAYING.loop_point > 0;

  // Main ready
  MAIN_MUSIC.loop = true;

  if (!needsPre) {
    await MAIN_MUSIC.play();
    return;
  }

  TEMP_AUDIO = new Audio(`${APP_ORIGIN}assets/medias/audio/music/${name}-pre.ogg`);
  TEMP_AUDIO.loop = false;

  // Préload (important pour avoir duration fiable)
  await Promise.all([
    new Promise((res, rej) => {
      if (TEMP_AUDIO.readyState >= 1) return res();
      TEMP_AUDIO.addEventListener("loadedmetadata", res, { once: true });
      TEMP_AUDIO.addEventListener("error", rej, { once: true });
      TEMP_AUDIO.load();
    }),
    new Promise((res, rej) => {
      if (MAIN_MUSIC.readyState >= 3) return res();
      MAIN_MUSIC.addEventListener("canplaythrough", res, { once: true });
      MAIN_MUSIC.addEventListener("error", rej, { once: true });
      MAIN_MUSIC.load();
    }),
  ]);

  // Lance l'intro
  await TEMP_AUDIO.play();

  // Déclenchement avant la fin
  const LEAD = 0.08; // 80ms avant la fin (à ajuster: 0.05 -> 0.15)
  let startedMain = false;
  let rafId = 0;

  const tick = async () => {
    if (!TEMP_AUDIO || TEMP_AUDIO.paused) return;

    // duration parfois NaN si metadata pas là (normalement réglé plus haut)
    const d = TEMP_AUDIO.duration;
    if (!Number.isFinite(d)) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    const remaining = d - TEMP_AUDIO.currentTime;

    if (!startedMain && remaining <= LEAD) {
      startedMain = true;

      try {
        // démarre la loop pendant que l'intro finit ses dernières ms
        await MAIN_MUSIC.play();
      } catch {
        // autoplay policy etc.
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  // Clean quand l'intro finit
  TEMP_AUDIO.onended = () => {
    cancelAnimationFrame(rafId);
    // on stoppe l'intro (au cas où)
    try { TEMP_AUDIO.pause(); } catch {}
    TEMP_AUDIO = null;

    // Si jamais la main n’a pas été lancée (tab inactive / rAF throttled),
    // on la lance ici en fallback.
    if (!startedMain) {
      MAIN_MUSIC.play().catch(() => {});
    }
  };
}


export function stopMusic() {
  // invalide toutes les callbacks async en cours
  PLAY_TOKEN++;

  if (TEMP_AUDIO) {
    TEMP_AUDIO.onended = null;
    safePause(TEMP_AUDIO);
  }
  if (MAIN_MUSIC) {
    safePause(MAIN_MUSIC);
  }

  MAIN_MUSIC = null;
  TEMP_AUDIO = null;
  CURRENTLY_PLAYING = null;
}
