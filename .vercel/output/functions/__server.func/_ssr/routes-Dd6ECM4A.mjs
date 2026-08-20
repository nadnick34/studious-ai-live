import { C as require_jsx_runtime, b as Navigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useCurrentUserState } from "./use-current-user-DZ7NZd4-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dd6ECM4A.js
var import_jsx_runtime = require_jsx_runtime();
function Landing() {
	const { user } = useCurrentUserState();
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/dashboard" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-dvh flex-col overflow-hidden bg-slate-dark text-cream",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 bg-cover bg-center",
				style: { backgroundImage: "url('/library-bg.jpg')" },
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 bg-[#2c3a47]/55",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "relative z-10 h-1 shrink-0 bg-teal" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-6 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/hero-mark.png",
						alt: "",
						className: "h-16 w-auto sm:h-20"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 mb-4 font-serif text-2xl font-semibold tracking-wide sm:text-3xl",
						children: "Studious AI"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "max-w-3xl font-serif text-[1.7rem] leading-[1.15] font-semibold sm:text-4xl",
						children: "Your masterclass for every class."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 font-serif text-xl font-semibold italic text-teal sm:text-2xl",
						children: "Get Studious!"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-lg text-[13px] leading-relaxed text-cream/80 sm:text-[15px]",
						children: "Turn notes, PDFs, lectures, and photos into one place to learn: study notes, a lecture you can listen to, flash cards, and a quiz. Built for mastery — not a shortcut around the work."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex w-full max-w-xs flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/signup",
							className: "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-cream px-6 text-sm font-semibold text-slate-dark hover:bg-white sm:w-44",
							children: "Create account"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							className: "inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-teal px-6 text-sm font-semibold text-teal hover:bg-teal hover:text-white sm:w-44",
							children: "Log in"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "relative z-10 px-6 py-3 text-center text-[11px] text-cream/40",
				children: "Notes · Audio · Flash cards · Quiz"
			})
		]
	});
}
//#endregion
export { Landing as component };
