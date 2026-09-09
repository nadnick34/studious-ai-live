let current: HTMLAudioElement | null = null;

export function playClip(src: string, opts?: { loop?: boolean; volume?: number }) {
  stopTheme();
  if (typeof window === "undefined") return;
  const audio = new Audio(src);
  audio.loop = Boolean(opts?.loop);
  audio.volume = opts?.volume ?? 0.38;
  current = audio;
  void audio.play().catch(() => {
    /* autoplay blocked until a tap */
  });
}

export function playTheme(opts?: { loop?: boolean; volume?: number }) {
  playClip("/tutorial-theme.mp3", opts);
}

export function playLandingTheme() {
  playClip("/landing-theme.mp3", { loop: false, volume: 0.36 });
}

export function stopTheme() {
  if (!current) return;
  current.pause();
  current.src = "";
  current = null;
}

export function isThemePlaying() {
  return Boolean(current && !current.paused);
}
