import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, b as Navigate, f as useRouterState, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as createServerFn, o as getServerFnById, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-kgFKYUAS.mjs";
import { s as initialsFromName, t as cn } from "./utils-DyWB8yQo.mjs";
import { i as signOut } from "./client-sGid3STf.mjs";
import { n as useCurrentUserState, t as useCurrentUser } from "./use-current-user-DZ7NZd4-.mjs";
import { b as BookOpen, m as LogOut, n as UserRound, o as Sun, p as Moon, x as Archive } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-shell-C75zzjfi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NAV = [
	{
		to: "/dashboard",
		label: "Classes",
		icon: BookOpen,
		match: (p) => p === "/dashboard" || p.startsWith("/class")
	},
	{
		to: "/archived",
		label: "Archived",
		icon: Archive,
		match: (p) => p.startsWith("/archived")
	},
	{
		to: "/profile",
		label: "Profile",
		icon: UserRound,
		match: (p) => p.startsWith("/profile")
	}
];
function Sidebar({ userName, avatar, profile, dark, onToggleDark }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "sticky top-0 hidden h-dvh w-56 shrink-0 flex-col bg-slate text-white sm:flex",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/dashboard",
				className: "flex items-center gap-2 px-4 pt-5 pb-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-lg bg-white px-2 py-1.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/logo.png",
						alt: "Studious AI",
						className: "h-7 w-auto"
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex-1 space-y-1 px-2.5",
				children: NAV.map((item) => {
					const Icon = item.icon;
					const active = item.match(pathname);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors", active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 shrink-0" }), item.label]
					}, item.to);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 border-t border-white/10 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onToggleDark,
						className: "flex min-h-11 w-full items-center gap-2 text-sm text-white/75 hover:text-white",
						children: [dark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" }), dark ? "Light mode" : "Night mode"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/profile",
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-11 place-items-center overflow-hidden rounded-full bg-white/15 text-sm font-semibold ring-1 ring-white/20",
							children: avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: avatar,
								alt: "",
								className: "h-full w-full object-cover"
							}) : initialsFromName(userName)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm font-medium",
								children: userName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-[11px] capitalize text-white/55",
								children: profile?.role || "student"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void signOut("/"),
						className: "flex min-h-11 items-center gap-2 text-sm text-white/60 hover:text-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), "Sign out"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] tracking-wide text-white/35",
						children: "Nickersonian Institute"
					})
				]
			})
		]
	});
}
function BottomNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] sm:hidden",
		children: NAV.map((item) => {
			const Icon = item.icon;
			const active = item.match(pathname);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.to,
				className: cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-teal" : "text-muted"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
			}, item.to);
		})
	});
}
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* Auth is ON by default (including the sandbox live preview, which does real
* sign-in). Visitors are signed out until they authenticate. The shared dev
* user only appears when auth is explicitly disabled (`VITE_AUTH_ENABLED=false`).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
function RequireAuth({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-dvh place-items-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Loading…"
		})
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("18184547672c7149d4ceaeed294304774ab03185b25430db2539a79a75e1ef7b"));
var saveProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("cbd35ae0399351319cbefd9d5c534093de43069cc71eac8dd11e1888f129aa62"));
var listClasses = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((archived) => Boolean(archived)).handler(createSsrRpc("043bebd22833c5a9fa0e49643c2500c85fb75770e7f0f696de36487e7b9ebbc9"));
var getClassById = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("1be93e685fb0c5aef0cd90b282b68626853166f85136488766ab4dc916b4fa95"));
var createClass = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("10b1bc4b341edea3dcc6361f5f61c87a2bdd4c11f2acb50c0ac17ada76544c76"));
var updateClass = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("55e032a87aadd1e0b251d19fe8c20ca6791702e02253d92cb8c4d275d0d30ef3"));
var touchClass = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("efaf38309bab77a82e577e1b235dc3c8e03d979c9c30923e43da5c61366086fd"));
var listStudySets = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((classId) => classId).handler(createSsrRpc("ab27bc5db43144b6747ece10cff72365451c93386d79b533c19e41469bac17a1"));
var getStudySetById = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("db0e9f9c0219c50b3f5e781eb6d1bb627be893e9812c347879b8fc4b6792b15e"));
var createStudySet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("034d425024168ebf8d87a10b7fe3f9a997ad55a874f852daad05f0166daf8808"));
var updateStudySet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("6aa269e07467c077071ee441c0fed5bd2cfd97ef0af8978784d317dd41a03fce"));
var deleteStudySet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("0398e7ba66a9e3f5a8a7f0999a1f1c243d7fbc0dfeffd48576b7530186b2d26f"));
var seedSampleClass = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("272228bec3e614808b3688543d93d278cc0bb18039a5d682ada827c8e52a325a"));
function AppShell({ title, right, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireAuth, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShellInner, {
		title,
		right,
		children
	}) });
}
function AppShellInner({ title, right, children }) {
	const user = useCurrentUser();
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [dark, setDark] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const stored = localStorage.getItem("studious-theme");
		const preferDark = stored === "dark" || !stored && window.matchMedia("(prefers-color-scheme: dark)").matches;
		setDark(preferDark);
		document.documentElement.classList.toggle("dark", preferDark);
		getProfile().then(setProfile).catch(() => {});
	}, []);
	function toggleDark() {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("studious-theme", next ? "dark" : "light");
	}
	const name = user?.displayName || profile?.displayName || "Student";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {
				userName: name,
				avatar: user?.profileImageUrl || profile?.avatarDataUrl,
				profile,
				dark,
				onToggleDark: toggleDark
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/dashboard",
								className: "shrink-0 sm:hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/logo.png",
									alt: "Studious AI",
									className: "h-7 w-auto"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "hidden truncate text-[15px] font-semibold text-fg sm:block",
								children: title || ""
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex max-w-[70%] flex-wrap items-center justify-end gap-2",
							children: right
						})]
					}),
					title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-4 pt-3 sm:hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-base font-semibold text-fg",
							children: title
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-8",
						children
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { deleteStudySet as a, getStudySetById as c, saveProfile as d, seedSampleClass as f, updateStudySet as h, createStudySet as i, listClasses as l, updateClass as m, createClass as n, getClassById as o, touchClass as p, createSsrRpc as r, getProfile as s, AppShell as t, listStudySets as u };
