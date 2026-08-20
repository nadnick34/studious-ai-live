import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Pause, u as Play } from "../_libs/lucide-react.mjs";
import { c as getStudySetById, o as getClassById, t as AppShell } from "./app-shell-C75zzjfi.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
import { i as Route$2 } from "./router-4SD9wsgu.mjs";
import { a as speakLecture } from "./ai-tyeSwjdS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/class._id.set._setId.audio-Dpx4fTVZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AudioPage() {
	const { id: classId, setId } = Route$2.useParams();
	const [set, setSet] = (0, import_react.useState)(null);
	const [cls, setCls] = (0, import_react.useState)(null);
	const [loadingAudio, setLoadingAudio] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [audioUrl, setAudioUrl] = (0, import_react.useState)(null);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [duration, setDuration] = (0, import_react.useState)(0);
	const [currentTime, setCurrentTime] = (0, import_react.useState)(0);
	const audioRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
			setSet(s);
			setCls(c);
		});
	}, [classId, setId]);
	async function ensureAudio() {
		if (audioUrl) return audioUrl;
		if (!set?.audioScript) {
			setError("No lecture script available for this set.");
			return null;
		}
		setLoadingAudio(true);
		setError(null);
		try {
			const result = await speakLecture({ data: {
				text: set.audioScript,
				voice: "eve"
			} });
			if (!result.ok) {
				setError(result.error);
				setLoadingAudio(false);
				return null;
			}
			const bytes = Uint8Array.from(atob(result.audioBase64), (c) => c.charCodeAt(0));
			const url = URL.createObjectURL(new Blob([bytes], { type: result.mime }));
			setAudioUrl(url);
			setLoadingAudio(false);
			return url;
		} catch (err) {
			setLoadingAudio(false);
			setError(err instanceof Error ? err.message : "Audio generation failed");
			return null;
		}
	}
	async function handlePlayPause() {
		const el = audioRef.current;
		if (!el) return;
		if (playing) {
			el.pause();
			setPlaying(false);
			return;
		}
		let url = audioUrl;
		if (!url) {
			url = await ensureAudio();
			if (!url) return;
			el.src = url;
			await new Promise((resolve) => {
				el.onloadeddata = () => resolve();
				el.load();
			});
		}
		try {
			await el.play();
			setPlaying(true);
		} catch {
			setError("Playback failed. Check device sound and try again.");
			setPlaying(false);
		}
	}
	function formatTime(sec) {
		if (!isFinite(sec) || sec < 0) return "0:00";
		return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;
	}
	if (!set || !cls) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Audio",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Loading…"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: `Audio – ${set.name}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-5 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/class/$id",
				params: { id: classId },
				className: "text-sm text-teal hover:underline",
				children: "← Back to class"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted",
				children: cls.code
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface rounded-xl p-8 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-1 font-semibold text-fg",
						children: set.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-6 text-xs text-muted",
						children: "AI lecture audio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
						ref: audioRef,
						preload: "none",
						onTimeUpdate: (e) => {
							const a = e.currentTarget;
							setCurrentTime(a.currentTime);
							if (a.duration) setProgress(a.currentTime / a.duration * 100);
						},
						onLoadedMetadata: (e) => setDuration(e.currentTarget.duration),
						onEnded: () => {
							setPlaying(false);
							setProgress(100);
						},
						onPause: () => setPlaying(false),
						onPlay: () => setPlaying(true),
						className: "hidden"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 h-1.5 overflow-hidden rounded-full bg-bg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full bg-teal",
							style: { width: `${progress}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex justify-between text-[10px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatTime(currentTime) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: duration ? formatTime(duration) : "—" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void handlePlayPause(),
						disabled: loadingAudio,
						className: "mx-auto grid size-16 place-items-center rounded-full bg-teal text-white disabled:opacity-60",
						"aria-label": playing ? "Pause" : "Play",
						children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-6" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-6 ml-0.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs text-muted",
						children: loadingAudio ? "Generating audio…" : playing ? "Playing" : audioUrl ? "Ready — tap play" : "Tap play to generate audio"
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-left text-xs text-red",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "text-xs",
							disabled: loadingAudio,
							onClick: async () => {
								if (audioUrl) URL.revokeObjectURL(audioUrl);
								setAudioUrl(null);
								setProgress(0);
								await ensureAudio();
							},
							children: "Regenerate audio"
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 rounded-xl border border-border bg-card p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mb-3 text-xs font-semibold tracking-wide text-muted uppercase",
					children: "Script"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed whitespace-pre-wrap text-fg",
					children: set.audioScript
				})]
			})]
		})]
	});
}
//#endregion
export { AudioPage as component };
