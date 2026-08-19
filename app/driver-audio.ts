"use client";

let sharedContext: AudioContext | null = null;
let activeLocalClip: HTMLAudioElement | null = null;
let previousLocalClipIndex = -1;

const localActivationClipUrls = Array.from(
  { length: 16 },
  (_, index) => `http://127.0.0.1:8765/candidate-${String(index + 1).padStart(2, "0")}.m4a`,
);

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  sharedContext ??= new AudioContextClass();
  if (sharedContext.state === "suspended") void sharedContext.resume();
  return sharedContext;
}

function tone(
  context: AudioContext,
  options: {
    start: number;
    duration: number;
    frequency: number;
    endFrequency?: number;
    gain: number;
    type?: OscillatorType;
  },
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + options.start;
  const endAt = startAt + options.duration;
  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(options.frequency, startAt);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, endAt);
  }
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(options.gain, startAt + Math.min(0.025, options.duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(endAt + 0.02);
}

function noiseBurst(context: AudioContext, start: number, duration: number, gainValue: number) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / samples.length, 2.5);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const startAt = context.currentTime + start;
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1600, startAt);
  filter.frequency.exponentialRampToValueAtTime(240, startAt + duration);
  filter.Q.value = 1.2;
  gain.gain.setValueAtTime(gainValue, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(startAt);
  source.stop(startAt + duration);
}

export function playCardSelectSound() {
  const context = getAudioContext();
  if (!context) return;
  tone(context, { start: 0, duration: 0.08, frequency: 920, endFrequency: 650, gain: 0.075, type: "triangle" });
  tone(context, { start: 0.035, duration: 0.09, frequency: 1380, endFrequency: 1060, gain: 0.04, type: "sine" });
}

export function playCommandSelectSound() {
  const context = getAudioContext();
  if (!context) return;
  tone(context, { start: 0, duration: 0.07, frequency: 420, endFrequency: 520, gain: 0.055, type: "square" });
  tone(context, { start: 0.075, duration: 0.08, frequency: 650, endFrequency: 820, gain: 0.045, type: "square" });
}

export function playCardInsertSound() {
  const context = getAudioContext();
  if (!context) return;
  noiseBurst(context, 0, 0.36, 0.08);
  tone(context, { start: 0, duration: 0.36, frequency: 190, endFrequency: 72, gain: 0.07, type: "sawtooth" });
  tone(context, { start: 0.32, duration: 0.07, frequency: 116, endFrequency: 78, gain: 0.16, type: "square" });
  tone(context, { start: 0.38, duration: 0.09, frequency: 840, endFrequency: 1040, gain: 0.055, type: "triangle" });
}

function playSynthesizedActivationSequence(role: string, name: string, command: string) {
  const context = getAudioContext();
  if (context) {
    noiseBurst(context, 0, 0.16, 0.12);
    [0.08, 0.2, 0.32, 0.44].forEach((start, index) => {
      tone(context, {
        start,
        duration: 0.09,
        frequency: 520 + index * 150,
        endFrequency: 680 + index * 180,
        gain: 0.065,
        type: "square",
      });
    });
    tone(context, { start: 0.08, duration: 0.76, frequency: 92, endFrequency: 980, gain: 0.1, type: "sawtooth" });
    tone(context, { start: 0.7, duration: 0.62, frequency: 72, endFrequency: 34, gain: 0.21, type: "sine" });
    tone(context, { start: 0.78, duration: 0.5, frequency: 220, gain: 0.075, type: "sawtooth" });
    tone(context, { start: 0.78, duration: 0.5, frequency: 330, gain: 0.055, type: "triangle" });
    tone(context, { start: 0.78, duration: 0.5, frequency: 440, gain: 0.04, type: "triangle" });
    noiseBurst(context, 0.74, 0.34, 0.07);
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `PERSONA RIDE。${role}，${name}。${command}模式，启动。`,
    );
    utterance.lang = "zh-CN";
    utterance.rate = 0.76;
    utterance.pitch = 0.62;
    utterance.volume = 0.96;
    window.setTimeout(() => window.speechSynthesis.speak(utterance), 920);
  }
}

function playRandomLocalActivationClip(fallback: () => void) {
  if (
    typeof window === "undefined" ||
    !["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return false;
  }

  const choices = localActivationClipUrls
    .map((url, index) => ({ url, index }))
    .filter(({ index }) => index !== previousLocalClipIndex);
  const selected = choices[Math.floor(Math.random() * choices.length)];
  previousLocalClipIndex = selected.index;

  activeLocalClip?.pause();
  const clip = new Audio(selected.url);
  clip.preload = "auto";
  clip.volume = 0.92;
  activeLocalClip = clip;
  clip.addEventListener("ended", () => {
    if (activeLocalClip === clip) activeLocalClip = null;
  });
  void clip.play().catch(() => {
    if (activeLocalClip === clip) activeLocalClip = null;
    fallback();
  });
  return true;
}

export function playActivationSequence(role: string, name: string, command: string) {
  const fallback = () => playSynthesizedActivationSequence(role, name, command);
  if (!playRandomLocalActivationClip(fallback)) fallback();
}

export function stopDriverAudio() {
  if (activeLocalClip) {
    activeLocalClip.pause();
    activeLocalClip.currentTime = 0;
    activeLocalClip = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
