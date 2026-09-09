const SRC = "/tutorial-theme.mp3";

let current: HTMLAudioElement | null = null;

export function playTheme(opts?: { loop?: boolean; volume?: number }) {
  stopTheme();
  if (typeof window === "undefined") return;
  const audio = new Audio(SRC);
  audio.loop = Boolean(opts?.loop);
  audio.volume = opts?.volume ?? 0.38;
  current = audio;
  void audio.play().catch(() => {
    /* autoplay blocked — ignore */
  });
}

export function stopTheme() {
  if (!current) return;
  current.pause();
  current.src = "";
  current = null;
}
