const DEFAULT_SOUND_SETTINGS = Object.freeze({
  enabled: true,
  volume: 55,
  barcode: true,
  sale: true,
  errors: true,
  alerts: true,
  soundProfileVersion: 2,
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
    const key = storageKey(userId);
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    const legacyDefaultVolume = saved && saved.soundProfileVersion !== 2 && Number(saved.volume ?? 100) === 100;
    const settings = {
      ...DEFAULT_SOUND_SETTINGS,
      ...(saved && typeof saved === "object" ? saved : {}),
      enabled: saved?.enabled !== false,
      // Move the old 100% default to the requested medium level once, without
      // changing the user's enable/disable or per-event preferences.
      volume: Math.min(100, Math.max(0, Number(legacyDefaultVolume ? 55 : (saved?.volume ?? DEFAULT_SOUND_SETTINGS.volume)) || 0)),
      barcode: saved?.barcode !== false,
      sale: saved?.sale !== false,
      errors: saved?.errors !== false,
      alerts: saved?.alerts !== false,
      soundProfileVersion: 2,
    };
    if (saved && saved.soundProfileVersion !== 2) {
      localStorage.setItem(key, JSON.stringify(settings));
    }
    return settings;
  } catch {
    return { ...DEFAULT_SOUND_SETTINGS };
  }
}

export function saveSoundSettings(settings, userId = activeUserId) {
  const next = {
    ...DEFAULT_SOUND_SETTINGS,
    ...(settings && typeof settings === "object" ? settings : {}),
    enabled: settings?.enabled !== false,
    volume: Math.min(100, Math.max(0, Number(settings?.volume ?? DEFAULT_SOUND_SETTINGS.volume) || 0)),
    barcode: settings?.barcode !== false,
    sale: settings?.sale !== false,
    errors: settings?.errors !== false,
    alerts: settings?.alerts !== false,
    soundProfileVersion: 2,
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

// Soft, rounded tones with gentle pitch movement and short fades make each
// event feel like feedback from a polished payment terminal rather than a beep.
const SOUND_PATTERNS = {
  barcode: [
    { frequency: 880, endFrequency: 1046.5, duration: 0.075, delay: 0, level: 0.24 },
  ],
  sale: [
    { frequency: 523.25, duration: 0.105, delay: 0, level: 0.24 },
    { frequency: 659.25, duration: 0.105, delay: 0.085, level: 0.26 },
    { frequency: 783.99, duration: 0.17, delay: 0.17, level: 0.28 },
  ],
  errors: [
    { frequency: 392, endFrequency: 349.23, duration: 0.11, delay: 0, level: 0.22 },
    { frequency: 311.13, duration: 0.14, delay: 0.105, level: 0.22 },
  ],
  alerts: [
    { frequency: 659.25, duration: 0.09, delay: 0, level: 0.22 },
    { frequency: 783.99, duration: 0.11, delay: 0.12, level: 0.24 },
  ],
};

export function playSound(eventType) {
  const settings = getSoundSettings();
  if (!settings.enabled || settings.volume <= 0 || settings[eventType] !== true) return false;

  const pattern = SOUND_PATTERNS[eventType];
  if (!pattern) return false;

  const context = getAudioContext();
  if (!context) return false;

  const play = () => {
    const now = context.currentTime;
    const master = context.createGain();
    // Keep 55% as a comfortable, medium default. The slider still scales it
    // proportionally from silent to full output.
    master.gain.setValueAtTime(Math.max(0.0001, settings.volume / 100) * 0.16, now);
    master.connect(context.destination);

    pattern.forEach((tone) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = now + tone.delay;
      const end = start + tone.duration;
      const attackEnd = start + Math.min(0.018, tone.duration * 0.28);
      const releaseStart = Math.max(attackEnd, end - Math.min(0.045, tone.duration * 0.3));

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      if (tone.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);
      }

      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(tone.level, attackEnd);
      envelope.gain.setValueAtTime(tone.level, releaseStart);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.start(start);
      oscillator.stop(end + 0.015);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
    });

    const lastTone = pattern[pattern.length - 1];
    window.setTimeout(() => master.disconnect(), Math.ceil((lastTone.delay + lastTone.duration + 0.12) * 1000));
  };

  if (context.state === "suspended") {
    context.resume().then(play).catch(() => {});
  } else {
    try {
      play();
    } catch {
      return false;
    }
  }
  return true;
}

export function unlockSoundAudio() {
  const context = getAudioContext();
  if (context?.state === "suspended") {
    context.resume().catch(() => {});
  }
}
