let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  audioContext ??= new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(
  context: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.08, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// tiny synthesized chime/buzz — no audio asset to ship, license, or load.
// two-note rising chime for success, one low tone for error
export function playChime(type: "success" | "error") {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  if (type === "success") {
    playTone(context, 660, now, 0.12);
    playTone(context, 880, now + 0.08, 0.15);
  } else {
    playTone(context, 220, now, 0.18);
  }
}
