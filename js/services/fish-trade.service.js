import { getUser, setUser } from "./storage.service.js";
import { showToast } from "./toast.service.js";

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUtf8(base64) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function reverseString(str) {
  return [...str].reverse().join('');
}

/**
 * Checksum simple :
 * - pas sécurisé
 * - sert juste à détecter une modification "naïve" ou une corruption
 * - on retourne une string hexadécimale pour garder un format compact
 */
function simpleChecksum(str) {
  let total = 0;
  const mod = 1000000007;

  for (let i = 0; i < str.length; i++) {
    total = (total + str.charCodeAt(i) * (i + 1)) % mod;
  }

  return total.toString(16);
}

function encodeFishForExport(fish) {
  // 1) On sérialise l'objet métier d'origine
  const fishJson = JSON.stringify(fish);

  // 2) On calcule le checksum sur les données seules
  const checksum = simpleChecksum(fishJson);

  // 3) On encapsule data + checksum dans un payload
  const payload = {
    data: fish,
    checksum
  };

  // 4) On sérialise le payload complet
  const payloadJson = JSON.stringify(payload);

  // 5) Puis on applique ton pipeline d'obfuscation
  const base64 = utf8ToBase64(payloadJson);
  const reversed = reverseString(base64);

  // Déplace les "=" du début vers la fin
  const match = reversed.match(/^=+/);
  const padding = match ? match[0] : '';
  const cleaned = reversed.slice(padding.length);
  const reordered = cleaned + padding;

  // Préfixe de format
  const prefixed = 'FISH|' + reordered;

  return prefixed;
}

function decodeFishFromImport(text) {
  const prefix = 'FISH|';

  if (!text.startsWith(prefix)) {
    throw new Error('Invalid save format');
  }

  // 1) On retire le préfixe
  const payload = text.slice(prefix.length);

  // 2) On remet les "=" du padding au début avant de ré-inverser
  const match = payload.match(/=+$/);
  const padding = match ? match[0] : '';
  const cleaned = payload.slice(0, payload.length - padding.length);
  const restored = padding + cleaned;

  // 3) On revient à la base64 d'origine
  const unreversed = reverseString(restored);

  // 4) On décode en JSON texte
  const payloadJson = base64ToUtf8(unreversed);

  // 5) On parse le payload complet
  const parsedPayload = JSON.parse(payloadJson);

  // Vérifications minimales de structure
  if (
    !parsedPayload ||
    typeof parsedPayload !== 'object' ||
    !('data' in parsedPayload) ||
    !('checksum' in parsedPayload)
  ) {
    throw new Error('Invalid save payload');
  }

  // 6) Recalcule le checksum sur les données seules
  const fishJson = JSON.stringify(parsedPayload.data);
  const expectedChecksum = simpleChecksum(fishJson);

  // 7) Compare avec le checksum stocké
  if (parsedPayload.checksum !== expectedChecksum) {
    throw new Error('Save modified or corrupted');
  }

  // 8) Si tout est OK, on retourne les données métier
  return parsedPayload.data;
}





export function downloadFishFile(fish) {
  const blob = new Blob([encodeFishForExport(fish)], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fish.id}.fish`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function onImportFishFileClick(event) {
  const input = event.target;
  if (!input.files?.length) return;

  console.log('Importing .fish file');
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = async () => {
    const text = reader.result;
    try {
      let importedFish = decodeFishFromImport(text);
      //console.log(importedFish);
      let user = getUser();
      // Check si dans banlist
      const isInBanList = user.BAN_LIST.find((e) => e.creator == importedFish.creator && e.id == importedFish.id) !== undefined;
      const isInSavedList = user.SAVED_FISHES.find((e) => e.creator == importedFish.creator && e.id == importedFish.id) !== undefined;
      if (isInBanList) {
        showToast('lzr-error', 'Impossible de réimporter un poisson généré par vous-même.');
      } else if (isInSavedList) {
        showToast('lzr-error', 'Impossible de réimporter un poisson déjà importé.');
      } else {
        user.SAVED_FISHES.push(importedFish);
        setUser(user);
        showToast('lzr-success', 'Poisson importé');
      }
      input.value = ''; // Important : reset file value here, to be able to upload the same file and still trigger the onchange event
    } catch (error) {
      console.log(error);
    }
  };
  reader.readAsText(file);
}
window.onImportFishFileClick = onImportFishFileClick;