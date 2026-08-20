import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as compressImageFile, s as initialsFromName } from "./utils-DyWB8yQo.mjs";
import { t as authClient } from "./client-sGid3STf.mjs";
import { t as useCurrentUser } from "./use-current-user-DZ7NZd4-.mjs";
import { d as saveProfile, s as getProfile, t as AppShell } from "./app-shell-C75zzjfi.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-BJtJmqqB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_BRAND = {
	id: "studious",
	name: "Studious AI",
	location: "",
	kind: "default",
	primary: "#0d9488",
	accent: "#3d4f5f",
	initials: "S"
};
var COLLEGE_STOCK = [
	{
		id: "lsu",
		name: "Louisiana State University",
		location: "Baton Rouge, LA",
		kind: "college",
		primary: "#461D7C",
		accent: "#2A1248",
		mascot: "Tigers",
		initials: "LSU"
	},
	{
		id: "uark",
		name: "University of Arkansas",
		location: "Fayetteville, AR",
		kind: "college",
		primary: "#9D2235",
		accent: "#1C1C1C",
		mascot: "Razorbacks",
		initials: "UA"
	},
	{
		id: "latech",
		name: "Louisiana Tech University",
		location: "Ruston, LA",
		kind: "college",
		primary: "#002F6C",
		accent: "#8B1323",
		mascot: "Bulldogs",
		initials: "LT"
	},
	{
		id: "baylor",
		name: "Baylor University",
		location: "Waco, TX",
		kind: "college",
		primary: "#154734",
		accent: "#0F2F23",
		mascot: "Bears",
		initials: "BU"
	},
	{
		id: "stanford",
		name: "Stanford University",
		location: "Stanford, CA",
		kind: "college",
		primary: "#8C1515",
		accent: "#2E2D29",
		mascot: "Cardinal",
		initials: "SU"
	}
];
var HIGH_SCHOOL_STOCK = [
	{
		id: "benton-la",
		name: "Benton High School",
		location: "Benton, Bossier Parish, LA",
		kind: "high-school",
		primary: "#5B2C8C",
		accent: "#3D1D5C",
		mascot: "Tigers",
		initials: "BHS"
	},
	{
		id: "airline-la",
		name: "Airline High School",
		location: "Bossier City, Bossier Parish, LA",
		kind: "high-school",
		primary: "#0B3A6E",
		accent: "#082846",
		mascot: "Vikings",
		initials: "AHS"
	},
	{
		id: "pca-bossier",
		name: "Providence Classical Academy",
		location: "Bossier City, LA",
		kind: "high-school",
		primary: "#1B3A6B",
		accent: "#122544",
		mascot: "Knights",
		initials: "PCA"
	},
	{
		id: "calvary-shreveport",
		name: "Calvary Baptist Academy",
		location: "Shreveport, LA",
		kind: "high-school",
		primary: "#1F6B2D",
		accent: "#143F1C",
		mascot: "Cavaliers",
		initials: "CBA"
	},
	{
		id: "magnolia-ar",
		name: "Magnolia High School",
		location: "Magnolia, AR",
		kind: "high-school",
		primary: "#B32024",
		accent: "#6E1416",
		mascot: "Panthers",
		initials: "MHS"
	}
];
var FALLBACK_PALETTES = [
	{
		id: "studious",
		name: "Studious teal",
		primary: "#0d9488",
		accent: "#3d4f5f"
	},
	{
		id: "navy",
		name: "Navy",
		primary: "#0B3A6E",
		accent: "#082846"
	},
	{
		id: "navy-gold",
		name: "Navy & gold",
		primary: "#0B3A6E",
		accent: "#1A2740"
	},
	{
		id: "royal",
		name: "Royal blue",
		primary: "#1D4ED8",
		accent: "#1E3A5F"
	},
	{
		id: "sky",
		name: "Columbia blue",
		primary: "#3B82C4",
		accent: "#1E3A5F"
	},
	{
		id: "teal",
		name: "Deep teal",
		primary: "#0F766E",
		accent: "#134E4A"
	},
	{
		id: "forest",
		name: "Forest green",
		primary: "#1F6B2D",
		accent: "#143F1C"
	},
	{
		id: "forest-gold",
		name: "Forest & gold",
		primary: "#1F6B2D",
		accent: "#3F2E10"
	},
	{
		id: "purple",
		name: "Purple",
		primary: "#5B2C8C",
		accent: "#3D1D5C"
	},
	{
		id: "purple-gold",
		name: "Purple & gold",
		primary: "#5B2C8C",
		accent: "#3D1D5C"
	},
	{
		id: "cardinal",
		name: "Cardinal",
		primary: "#9D2235",
		accent: "#1C1C1C"
	},
	{
		id: "crimson",
		name: "Crimson",
		primary: "#8C1515",
		accent: "#2E2D29"
	},
	{
		id: "crimson-navy",
		name: "Crimson & navy",
		primary: "#8C1515",
		accent: "#1B2A4A"
	},
	{
		id: "orange",
		name: "Orange",
		primary: "#EA580C",
		accent: "#7C2D12"
	},
	{
		id: "burnt-orange",
		name: "Burnt orange",
		primary: "#BF5700",
		accent: "#3D1F00"
	},
	{
		id: "orange-navy",
		name: "Orange & navy",
		primary: "#F97316",
		accent: "#0F2744"
	},
	{
		id: "gold",
		name: "Gold",
		primary: "#C9A227",
		accent: "#3D3410"
	},
	{
		id: "black-gold",
		name: "Black & gold",
		primary: "#1A1A1A",
		accent: "#2C2C2C"
	},
	{
		id: "maroon",
		name: "Maroon",
		primary: "#7A1F2B",
		accent: "#3B0F16"
	},
	{
		id: "slate",
		name: "Slate",
		primary: "#475569",
		accent: "#1E293B"
	}
];
function allStock() {
	return [...COLLEGE_STOCK, ...HIGH_SCHOOL_STOCK];
}
function getStockById(id) {
	return allStock().find((s) => s.id === id) || (id === "studious" ? DEFAULT_BRAND : void 0);
}
function shade(hex, amount) {
	const n = hex.replace("#", "");
	const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
	return "#" + [
		Math.max(0, Math.min(255, (num >> 16 & 255) + amount)),
		Math.max(0, Math.min(255, (num >> 8 & 255) + amount)),
		Math.max(0, Math.min(255, (num & 255) + amount))
	].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function applyBrand(brand) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	root.style.setProperty("--teal", brand.primary);
	root.style.setProperty("--teal-hover", shade(brand.primary, -18));
	root.style.setProperty("--slate", brand.accent);
	root.style.setProperty("--slate-dark", shade(brand.accent, -20));
}
function ProfilePage() {
	const user = useCurrentUser();
	const navigate = useNavigate();
	const [phone, setPhone] = (0, import_react.useState)("");
	const [smsAlerts, setSmsAlerts] = (0, import_react.useState)(false);
	const [schoolSelect, setSchoolSelect] = (0, import_react.useState)("studious");
	const [avatar, setAvatar] = (0, import_react.useState)("");
	const [role, setRole] = (0, import_react.useState)("student");
	const [customName, setCustomName] = (0, import_react.useState)("");
	const [paletteId, setPaletteId] = (0, import_react.useState)("studious");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [currentPassword, setCurrentPassword] = (0, import_react.useState)("");
	const [newPassword, setNewPassword] = (0, import_react.useState)("");
	const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
	const [pwMsg, setPwMsg] = (0, import_react.useState)(null);
	const [pwError, setPwError] = (0, import_react.useState)(null);
	const [pwBusy, setPwBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		getProfile().then((p) => {
			setPhone(p.phone);
			setSmsAlerts(p.smsAlerts);
			setSchoolSelect(p.schoolSelect);
			setAvatar(p.avatarDataUrl || "");
			setRole(p.role);
			setCustomName(p.customSchoolName || "");
			setPaletteId(p.paletteId || "studious");
		});
	}, []);
	async function handleSave(e) {
		e.preventDefault();
		setSaving(true);
		const next = {
			displayName: user?.displayName,
			phone,
			smsAlerts,
			schoolSelect,
			paletteId,
			customSchoolName: customName,
			avatarDataUrl: avatar,
			role,
			edition: role === "teacher" ? "teacher" : "student",
			setupComplete: true
		};
		await saveProfile({ data: next });
		if (schoolSelect === "custom") {
			const pal = FALLBACK_PALETTES.find((p) => p.id === paletteId) || FALLBACK_PALETTES[0];
			applyBrand({
				...DEFAULT_BRAND,
				id: "custom",
				name: customName || "Custom",
				primary: pal.primary,
				accent: pal.accent,
				initials: initialsFromName(customName || "CS"),
				kind: "custom"
			});
		} else applyBrand(getStockById(schoolSelect) || DEFAULT_BRAND);
		setSaving(false);
		if (next.edition === "teacher") await navigate({ to: "/coming-soon" });
		else await navigate({ to: "/dashboard" });
	}
	async function handlePassword(e) {
		e.preventDefault();
		setPwMsg(null);
		setPwError(null);
		if (newPassword.length < 8) {
			setPwError("New password must be at least 8 characters.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setPwError("New passwords don’t match.");
			return;
		}
		setPwBusy(true);
		const { error } = await authClient.changePassword({
			currentPassword,
			newPassword,
			revokeOtherSessions: true
		});
		setPwBusy(false);
		if (error) {
			setPwError(error.message || "Could not change password. Sign in with email to use this.");
			return;
		}
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setPwMsg("Password updated.");
	}
	const name = user?.displayName || "Student";
	const email = user?.primaryEmail || "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Profile",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-xl space-y-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handlePassword,
				className: "card-surface space-y-3 rounded-xl p-5 sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-semibold",
						children: "Change password"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "For email accounts. Google / X sign-in manages passwords with that provider."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PwField, {
						label: "Current password",
						value: currentPassword,
						onChange: setCurrentPassword,
						autoComplete: "current-password"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PwField, {
						label: "New password",
						value: newPassword,
						onChange: setNewPassword,
						autoComplete: "new-password"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PwField, {
						label: "Confirm new password",
						value: confirmPassword,
						onChange: setConfirmPassword,
						autoComplete: "new-password"
					}),
					pwError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-lg bg-red-50 px-3 py-2 text-sm text-red",
						children: pwError
					}),
					pwMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-green",
						children: pwMsg
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: pwBusy,
						children: pwBusy ? "Updating…" : "Update password"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSave,
				className: "card-surface space-y-5 rounded-xl p-5 sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-teal text-lg font-semibold text-white",
							children: avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: avatar,
								alt: "",
								className: "h-full w-full object-cover"
							}) : initialsFromName(name)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mb-1 block text-xs text-muted",
								children: "Profile photo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "image/*",
								capture: "user",
								className: "text-xs",
								onChange: async (e) => {
									const f = e.target.files?.[0];
									if (f) setAvatar(await compressImageFile(f, 240));
								}
							}),
							avatar && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mt-1 block text-[11px] text-muted",
								onClick: () => setAvatar(""),
								children: "Remove photo"
							})
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnly, {
						label: "Name",
						value: name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnly, {
						label: "Email",
						value: email
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mb-1 block text-xs text-muted",
						children: "I am a"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm",
						value: role,
						onChange: (e) => setRole(e.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "student",
								children: "Student"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "teacher",
								children: "Teacher"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "both",
								children: "Student & Teacher"
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mb-1 block text-xs text-muted",
						children: "School"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm",
						value: schoolSelect,
						onChange: (e) => setSchoolSelect(e.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "studious",
								children: "Studious default"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
								label: "Colleges",
								children: allStock().filter((s) => s.kind === "college").map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: s.id,
									children: s.name
								}, s.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
								label: "High schools",
								children: allStock().filter((s) => s.kind === "high-school").map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: s.id,
									children: s.name
								}, s.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "custom",
								children: "Custom"
							})
						]
					})] }),
					schoolSelect === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mb-1 block text-xs text-muted",
						children: "Custom school name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "w-full rounded-lg border border-border px-3 py-2.5 text-sm",
						value: customName,
						onChange: (e) => setCustomName(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mb-1 block text-xs text-muted",
						children: "Phone number"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "tel",
						className: "w-full rounded-lg border border-border px-3 py-2.5 text-sm",
						value: phone,
						onChange: (e) => setPhone(e.target.value),
						placeholder: "(318) 555-0100"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: smsAlerts,
							onChange: (e) => setSmsAlerts(e.target.checked)
						}), "Send me text alerts for upcoming assignments and tests"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: saving,
						children: saving ? "Saving…" : "Save profile"
					})
				]
			})]
		})
	});
}
function ReadOnly({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: "mb-1 block text-xs text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: "w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm",
		value,
		readOnly: true
	})] });
}
function PwField({ label, value, onChange, autoComplete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: "mb-1 block text-xs text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type: "password",
		required: true,
		minLength: 8,
		autoComplete,
		className: "w-full rounded-lg border border-border px-3 py-2.5 text-sm",
		value,
		onChange: (e) => onChange(e.target.value)
	})] });
}
//#endregion
export { ProfilePage as component };
