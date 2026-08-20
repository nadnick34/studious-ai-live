import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as listClasses, m as updateClass, t as AppShell } from "./app-shell-C75zzjfi.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/archived-IPs2eEGK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ArchivedPage() {
	const [classes, setClasses] = (0, import_react.useState)([]);
	async function refresh() {
		setClasses(await listClasses({ data: true }));
	}
	(0, import_react.useEffect)(() => {
		refresh();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Archived classes",
		children: classes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "py-16 text-center text-sm text-muted",
			children: "No archived classes. Archive a class from My Classes when you’re done with it."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-2xl space-y-3",
			children: classes.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface flex flex-col justify-between gap-3 rounded-xl p-4 sm:flex-row sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-semibold text-muted",
						children: c.code
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-medium text-fg",
						children: c.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted",
						children: c.subject
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/class/$id",
						params: { id: c.id },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "text-xs",
							children: "Open"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "text-xs",
						onClick: async () => {
							await updateClass({ data: {
								id: c.id,
								patch: { archived: false }
							} });
							await refresh();
						},
						children: "Restore"
					})]
				})]
			}, c.id))
		})
	});
}
//#endregion
export { ArchivedPage as component };
