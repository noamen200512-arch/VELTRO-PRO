const DEFAULT_SOUND_SETTINGS = Object.freeze({
  enabled: true,
  volume: 100,
  barcode: true,
  sale: true,
  errors: true,
  alerts: true,
});

let activeUserId = "device";
let audioContext = null;

function storageKey(userId = activeUserId) {
  return `veltro_sound_settings:${String(userId || "device")}`;
}

export function setSoundUser(userId) {
  activeUserId = String(userId || "device");
}

export function getSoundSettings(userId = activeUserId) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)) || "null");
    return {
      ...DEFAULT_SOUND_SETTINGS,
      ...(saved && typeof saved === "object" ? saved : {}),
      enabled: saved?.enabled !== false,
      volume: Math.min(100, Math.max(0, Number(saved?.volume ?? DEFAULT_SOUND_SETTINGS.volume) || 0)),
      barcode: saved?.barcode !== false,
      sale: saved?.sale !== false,
      errors: saved?.errors !== false,
      alerts: saved?.alerts !== false,
    };
  } catch {
    return { ...DEFAULT_SOUND_SETTINGS };
  }
}

export function saveSoundSettings(settings, userId = activeUserId) {
  const next = {
    ...DEFAULT_SOUND_SETTINGS,
    ...(settings && typeof settings === "object" ? settings : {}),
    enabled: settings?.enabled !== false,
    volume: Math.min(100, Math.max(0, Number(settings?.volume ?? 100) || 0)),
    barcode: settings?.barcode !== false,
    sale: settings?.sale !== false,
    errors: settings?.errors !== false,
    alerts: settings?.alerts !== false,
  };

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
    return next;
  } catch (error) {
    console.warn("VELTRO-PRO could not save sound settings:", error);
    return next;
  }
}

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

export function playSound(eventType) {
  const settings = getSoundSettings();
  if (!settings.enabled || settings.volume <= 0 || settings[eventType] !== true) return false;

  const context = getAudioContext();
  if (!context) return false;

  const patterns = {
    barcode: [{ frequency: 1120, duration: 0.065, delay: 0, wave: "sine" }],
    sale: [
      { frequency: 740, duration: 0.09, delay: 0, wave: "sine" },
      { frequency: 990, duration: 0.14, delay: 0.09, wave: "sine" },
    ],
    errors: [
      { frequency: 260, duration: 0.12, delay: 0, wave: "triangle" },
      { frequency: 190, duration: 0.16, delay: 0.13, wave: "triangle" },
    ],
    alerts: [
      { frequency: 660, duration: 0.09, delay: 0, wave: "sine" },
      { frequency: 660, duration: 0.09, delay: 0.14, wave: "sine" },
    ],
  };
  const pattern = patterns[eventType];
  if (!pattern) return false;

  const play = () => {
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(Math.max(0.0001, settings.volume / 100) * 0.22, now);
    master.connect(context.destination);

    pattern.forEach((tone) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + tone.delay;
      const end = start + tone.duration;
      oscillator.type = tone.wave;
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.7, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
    const lastTone = pattern[pattern.length - 1];
    window.setTimeout(() => master.disconnect(), Math.ceil((lastTone.delay + lastTone.duration + 0.1) * 1000));
  };

  if (context.state === "suspended") {
    context.resume().then(play).catch(() => {});
  } else {
    try { play(); } catch { return false; }
  }
  return true;
}

export function unlockSoundAudio() {
  const context = getAudioContext();
  if (context?.state === "suspended") {
    context.resume().catch(() => {});
  }
}
