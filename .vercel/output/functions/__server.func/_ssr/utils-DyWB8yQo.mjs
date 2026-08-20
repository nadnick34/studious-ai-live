import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-DyWB8yQo.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid(prefix) {
	return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
function initialsFromName(name) {
	const parts = (name || "").trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return "S";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function timeAgo(iso) {
	const diff = Date.now() - new Date(iso).getTime();
	const hours = Math.floor(diff / 36e5);
	if (hours < 1) return "Just now";
	if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "Yesterday";
	return `${days} days ago`;
}
function formatDateTime(iso) {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric"
	}) + ", " + d.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit"
	});
}
function formatShortDate(value) {
	if (!value) return "";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) {
		const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (!m) return value;
		return `${m[2]}/${m[3]}/${m[1].slice(2)}`;
	}
	return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
}
function parseJson(value, fallback) {
	if (value == null) return fallback;
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
	return value;
}
async function compressImageFile(file, max = 1280, quality = .78) {
	const url = URL.createObjectURL(file);
	try {
		const img = await loadImage(url);
		const scale = Math.min(1, max / Math.max(img.width, img.height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(img.width * scale));
		canvas.height = Math.max(1, Math.round(img.height * scale));
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("canvas");
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL("image/jpeg", quality);
	} finally {
		URL.revokeObjectURL(url);
	}
}
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error("image"));
		img.src = src;
	});
}
async function fileToPayload(file) {
	const buf = await file.arrayBuffer();
	const bytes = new Uint8Array(buf);
	let binary = "";
	const chunk = 32768;
	for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	return {
		name: file.name,
		type: file.type || "application/octet-stream",
		size: file.size,
		base64: btoa(binary)
	};
}
function dataUrlToPayload(dataUrl, name) {
	const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
	return {
		name,
		type: match?.[1] || "image/jpeg",
		size: Math.round((match?.[2].length || 0) * 3 / 4),
		base64: match?.[2] || ""
	};
}
//#endregion
export { formatDateTime as a, parseJson as c, fileToPayload as i, timeAgo as l, compressImageFile as n, formatShortDate as o, dataUrlToPayload as r, initialsFromName as s, cn as t, uid as u };
