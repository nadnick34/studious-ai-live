import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as fileToPayload, n as compressImageFile, r as dataUrlToPayload } from "./utils-DyWB8yQo.mjs";
import { _ as FilePlus2, a as SwitchCamera, c as ScanLine, t as X, y as Camera } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/capture-bar-W27jEmsh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CameraModal({ title, onClose, onCapture }) {
	const videoRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [facing, setFacing] = (0, import_react.useState)("environment");
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		async function start() {
			setError(null);
			try {
				streamRef.current?.getTracks().forEach((t) => t.stop());
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: { ideal: facing },
						width: { ideal: 1600 }
					},
					audio: false
				});
				if (cancelled) {
					stream.getTracks().forEach((t) => t.stop());
					return;
				}
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					await videoRef.current.play();
				}
			} catch {
				setError("Camera isn’t available here. Use Take photo instead — it opens your phone’s camera.");
			}
		}
		start();
		return () => {
			cancelled = true;
			streamRef.current?.getTracks().forEach((t) => t.stop());
		};
	}, [facing]);
	function snap() {
		const video = videoRef.current;
		if (!video || !video.videoWidth) return;
		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(video, 0, 0);
		canvas.toBlob((blob) => {
			if (!blob) return;
			onCapture(new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" }));
			onClose();
		}, "image/jpeg", .86);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[70] flex flex-col bg-black",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 py-3 text-white",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "grid size-11 place-items-center rounded-full hover:bg-white/10",
					"aria-label": "Close camera",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					ref: videoRef,
					playsInline: true,
					muted: true,
					className: "h-full w-full object-cover"
				}), error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-x-4 top-4 rounded-xl bg-black/70 px-4 py-3 text-sm text-white",
					children: error
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-center gap-8 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setFacing((f) => f === "environment" ? "user" : "environment"),
						className: "grid size-12 place-items-center rounded-full bg-white/15 text-white",
						"aria-label": "Flip camera",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchCamera, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: snap,
						disabled: Boolean(error),
						className: "grid size-16 place-items-center rounded-full bg-white text-slate-dark shadow-lg disabled:opacity-40",
						"aria-label": "Capture",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-7" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "text-white",
						onClick: onClose,
						children: "Cancel"
					})
				]
			})
		]
	});
}
async function toPayload(item) {
	if (item.file.type.startsWith("image/")) {
		const dataUrl = await compressImageFile(item.file);
		return dataUrlToPayload(dataUrl, item.file.name);
	}
	return fileToPayload(item.file);
}
async function capturedToPayloads(items) {
	return Promise.all(items.map(toPayload));
}
function CaptureBar({ items, onChange, disabled }) {
	const fileRef = (0, import_react.useRef)(null);
	const photoRef = (0, import_react.useRef)(null);
	const scanRef = (0, import_react.useRef)(null);
	const [cameraMode, setCameraMode] = (0, import_react.useState)(null);
	function addFiles(list, mode) {
		if (!list) return;
		const next = Array.from(list).map((file) => ({
			id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 6)}`,
			file,
			preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : void 0,
			mode
		}));
		onChange([...items, ...next]);
	}
	function remove(id) {
		const found = items.find((i) => i.id === id);
		if (found?.preview) URL.revokeObjectURL(found.preview);
		onChange(items.filter((i) => i.id !== id));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled,
						onClick: () => fileRef.current?.click(),
						className: "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-bg px-2 py-3 text-center text-xs font-medium text-fg hover:border-teal disabled:opacity-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePlus2, { className: "size-5 text-teal" }), "Files"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled,
						onClick: () => {
							if (navigator.mediaDevices) setCameraMode("photo");
							else photoRef.current?.click();
						},
						className: "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-bg px-2 py-3 text-center text-xs font-medium text-fg hover:border-teal disabled:opacity-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-5 text-teal" }), "Photo"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled,
						onClick: () => {
							if (navigator.mediaDevices) setCameraMode("scan");
							else scanRef.current?.click();
						},
						className: "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-bg px-2 py-3 text-center text-xs font-medium text-fg hover:border-teal disabled:opacity-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanLine, { className: "size-5 text-teal" }), "Scan"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] leading-relaxed text-muted",
				children: "Files, a live photo, or a page scan. Scans are read for text when you generate."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				multiple: true,
				className: "sr-only",
				accept: ".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,.mp3,.m4a,.wav",
				onChange: (e) => {
					addFiles(e.target.files, "file");
					e.currentTarget.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: photoRef,
				type: "file",
				accept: "image/*",
				capture: "environment",
				className: "sr-only",
				onChange: (e) => {
					addFiles(e.target.files, "photo");
					e.currentTarget.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: scanRef,
				type: "file",
				accept: "image/*",
				capture: "environment",
				className: "sr-only",
				onChange: (e) => {
					addFiles(e.target.files, "scan");
					e.currentTarget.value = "";
				}
			}),
			items.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1.5",
				children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm",
					children: [
						item.preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: item.preview,
							alt: "",
							className: "size-10 rounded-md object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-10 place-items-center rounded-md bg-bg text-[10px] font-semibold uppercase text-muted",
							children: item.file.name.split(".").pop()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate font-medium",
								children: item.file.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[11px] capitalize text-muted",
								children: [
									item.mode === "scan" ? "Scan" : item.mode === "photo" ? "Photo" : "File",
									" ·",
									" ",
									Math.max(1, Math.round(item.file.size / 1024)),
									" KB"
								]
							})]
						}),
						!disabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => remove(item.id),
							className: "grid size-11 place-items-center text-muted hover:text-red",
							"aria-label": "Remove",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})
					]
				}, item.id))
			}),
			cameraMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraModal, {
				title: cameraMode === "scan" ? "Scan a page" : "Take a photo",
				onClose: () => setCameraMode(null),
				onCapture: (file) => addFiles([file], cameraMode)
			})
		]
	});
}
//#endregion
export { capturedToPayloads as n, CaptureBar as t };
