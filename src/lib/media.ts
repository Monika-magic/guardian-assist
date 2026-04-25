// Browser media helpers: TTS, microphone, camera

export function speak(text: string) {
  if (typeof window === "undefined") return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    u.lang = "en-US";
    synth.speak(u);
  } catch {}
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch {}
}

let micStream: MediaStream | null = null;
let recorder: MediaRecorder | null = null;
const chunks: Blob[] = [];

export async function startMic(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return false;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks.length = 0;
    if (typeof MediaRecorder !== "undefined") {
      recorder = new MediaRecorder(micStream);
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.start(1000);
    }
    return true;
  } catch {
    return false;
  }
}

export function stopMic() {
  try { recorder?.stop(); } catch {}
  recorder = null;
  micStream?.getTracks().forEach(t => t.stop());
  micStream = null;
}

let camStream: MediaStream | null = null;

export async function startCamera(video: HTMLVideoElement): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return false;
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = camStream;
    await video.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function stopCamera() {
  camStream?.getTracks().forEach(t => t.stop());
  camStream = null;
}
