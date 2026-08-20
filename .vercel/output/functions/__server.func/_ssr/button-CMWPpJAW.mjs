import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cn } from "./utils-DyWB8yQo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-CMWPpJAW.js
var import_jsx_runtime = require_jsx_runtime();
var styles = {
	primary: "bg-teal text-white hover:bg-teal-hover shadow-sm",
	secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100",
	ghost: "bg-transparent text-muted hover:bg-slate-100 dark:hover:bg-slate-800",
	danger: "bg-red-50 text-red hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70"
};
function Button({ variant = "primary", className = "", children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50", styles[variant], className),
		...props,
		children
	});
}
//#endregion
export { Button as t };
