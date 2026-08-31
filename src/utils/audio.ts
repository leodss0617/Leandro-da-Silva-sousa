/**
 * Synthesizer & Audio Alert Helper
 */

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    } catch {
      // Audio not supported
    }
  }
  return audioCtx;
}

export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
  } catch {
    // Ignore unlock issues
  }
}

export function playSignalSound(volume = 0.7, force = false, soundEnabled = true): void {
  if (!force && !soundEnabled) return;
  unlockAudio();
  const ctx = getAudioContext();
  if (!ctx) return;

  const runSound = () => {
    const vol = Math.max(0.05, Math.min(1, volume));
    const now = ctx.currentTime;
    
    // 3-tone attention alert pattern
    const tones = [
      { f: 740, t: 0, d: 0.12 },
      { f: 988, t: 0.14, d: 0.12 },
      { f: 1175, t: 0.28, d: 0.22 },
    ];

    tones.forEach(({ f, t, d }) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, now + t);
        gain.gain.linearRampToValueAtTime(vol * 0.35, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.02);
      } catch {
        // Audio node error ignored
      }
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([120, 60, 120, 60, 200]);
      }
    } catch {
      // Ignore vibration error
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(runSound).catch(() => {});
  } else {
    runSound();
  }
}

export function play80PercentWarningSound(
  volume = 0.8,
  soundType: 'off' | 'fanfare' | 'chime' | 'radar' | 'bell' = 'fanfare',
  force = false,
  soundEnabled = true
): void {
  if (soundType === 'off') return;
  if (!force && !soundEnabled) return;
  unlockAudio();
  const ctx = getAudioContext();
  if (!ctx) return;

  const runSound = () => {
    const vol = Math.max(0.05, Math.min(1, volume));
    const now = ctx.currentTime;

    if (soundType === 'fanfare') {
      // Ascending triumphant fanfare chords (C5, E5, G5, C6)
      const tones = [
        { f: 523.25, t: 0, d: 0.14, type: 'triangle' as OscillatorType },
        { f: 659.25, t: 0.12, d: 0.14, type: 'triangle' as OscillatorType },
        { f: 783.99, t: 0.24, d: 0.16, type: 'sine' as OscillatorType },
        { f: 1046.5, t: 0.40, d: 0.35, type: 'sine' as OscillatorType },
      ];
      tones.forEach(({ f, t, d, type }) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0.0001, now + t);
          gain.gain.linearRampToValueAtTime(vol * 0.4, now + t + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + d + 0.05);
        } catch {}
      });
    } else if (soundType === 'chime') {
      // Harmonic Zen Chime with bell harmonics
      const tones = [
        { f: 880, t: 0, d: 0.4, type: 'sine' as OscillatorType },
        { f: 1320, t: 0.05, d: 0.35, type: 'sine' as OscillatorType },
        { f: 1760, t: 0.1, d: 0.45, type: 'triangle' as OscillatorType },
      ];
      tones.forEach(({ f, t, d, type }) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0.0001, now + t);
          gain.gain.linearRampToValueAtTime(vol * 0.35, now + t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + d + 0.05);
        } catch {}
      });
    } else if (soundType === 'radar') {
      // High-tech Sonar Double Pulse
      const pulses = [0, 0.22];
      pulses.forEach(t => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1400, now + t);
          osc.frequency.exponentialRampToValueAtTime(800, now + t + 0.16);
          gain.gain.setValueAtTime(0.0001, now + t);
          gain.gain.linearRampToValueAtTime(vol * 0.4, now + t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + 0.2);
        } catch {}
      });
    } else {
      // Metallic golden bell tone
      const tones = [
        { f: 1108.73, t: 0, d: 0.35 },
        { f: 1479.98, t: 0.08, d: 0.45 },
      ];
      tones.forEach(({ f, t, d }) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0.0001, now + t);
          gain.gain.linearRampToValueAtTime(vol * 0.38, now + t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + d + 0.05);
        } catch {}
      });
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 300]);
      }
    } catch {}
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(runSound).catch(() => {});
  } else {
    runSound();
  }
}

/**
 * Text to Speech Voice Announcer (PT-BR)
 */
export function speakAnnouncement(text: string, enabled = true, volume = 0.9): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Cancel previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1; // Slightly dynamic rate for fast double rounds
    utterance.pitch = 1.0;
    utterance.volume = Math.max(0.1, Math.min(1, volume));

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {}
}

export function formatBRL(v: number): string {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

