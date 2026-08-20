import { C as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/coming-soon-n8x1PO4L.js
var import_jsx_runtime = require_jsx_runtime();
function ComingSoon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-dvh flex-col overflow-hidden bg-slate-dark text-cream",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 bg-cover bg-center",
				style: { backgroundImage: "url('/library-bg.jpg')" },
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 bg-slate-dark/60",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "relative z-10 h-1 bg-teal" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/hero-mark.png",
						alt: "",
						className: "mb-2 h-24 w-auto"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-2xl font-semibold",
						children: "Studious AI"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-2 rounded-full border border-teal-700/40 bg-teal-950/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-teal uppercase",
						children: "Teacher Edition"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-5 max-w-lg font-serif text-3xl font-semibold sm:text-4xl",
						children: "Coming Soon!"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 font-serif text-lg italic text-teal",
						children: "Less grading. More time with the student."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-md text-sm leading-relaxed text-cream/78",
						children: "School-aligned assessments, scanned-test grading, and class analytics are on the way."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/dashboard",
						className: "mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-cream px-6 text-sm font-semibold text-slate-dark",
						children: "Back to Student Edition"
					})
				]
			})
		]
	});
}
//#endregion
export { ComingSoon as component };
