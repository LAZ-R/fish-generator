import { playMusic, stopMusic } from "../services/music.service.js";
import { requestWakeLock } from "../utils/wakelock.js";
import { getUser, setUser } from "./storage.service.js";

export function onThemeClick(theme) {
  let user = getUser();
  if (user.PREFERED_THEME != theme) {
    user.PREFERED_THEME = theme;
    setUser(user);
    document.getElementsByClassName('lzr')[0].style = `
      --theme: '${user.PREFERED_THEME}';
      --font-family--user: '${user.IS_ACCESSIBLE_FONT ? 'open-dyslexic' : 'inter-var'}';
    ';`;
  }
};
window.onThemeClick = onThemeClick;

export function onPreferedSpritesClick(preferedSprites) {
  let user = getUser();
  if (user.PREFERED_SPRITES != preferedSprites) {
    user.PREFERED_SPRITES = preferedSprites;
    setUser(user);
  }
};
window.onPreferedSpritesClick = onPreferedSpritesClick;

export function onKeepScreenAwakeClick(event) {
  const isChecked = event.srcElement.checked;
  let user = getUser();
  user.KEEP_SCREEN_AWAKE = isChecked;
  setUser(user);
  if (isChecked) {
    requestWakeLock();
  }
}
window.onKeepScreenAwakeClick = onKeepScreenAwakeClick;

export function onMusicClick(event) {
  const isChecked = event.srcElement.checked;
  let user = getUser();
  user.MUSIC = isChecked;
  setUser(user);
  if (!isChecked) {
    stopMusic();
  } else {
    playMusic('pokemon-center');
  }
}
window.onMusicClick = onMusicClick;

export function onSoundEffectsClick(event) {
  const isChecked = event.srcElement.checked;
  let user = getUser();
  user.SOUND_EFFECTS = isChecked;
  setUser(user);
}
window.onSoundEffectsClick = onSoundEffectsClick;

export function onOpenStatsClick(event) {
  const isChecked = event.srcElement.checked;
  let user = getUser();
  user.OPENED_STATS = isChecked;
  setUser(user);
}
window.onOpenStatsClick = onOpenStatsClick;

export function onOpenSpritesClick(event) {
  const isChecked = event.srcElement.checked;
  let user = getUser();
  user.OPENED_SPRITES = isChecked;
  setUser(user);
}
window.onOpenSpritesClick = onOpenSpritesClick;

export function onOpenDyslexicClick(event) {
  const isChecked = event.srcElement.checked;
  let user = getUser();
  user.IS_ACCESSIBLE_FONT = isChecked;
  setUser(user);

  document.getElementsByClassName('lzr')[0].style = `
    --theme: '${user.PREFERED_THEME}';
    --font-family--user: '${user.IS_ACCESSIBLE_FONT ? 'open-dyslexic' : 'inter-var'}';
  `;
}
window.onOpenDyslexicClick = onOpenDyslexicClick;
