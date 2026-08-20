import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as getStudySetById, o as getClassById, t as AppShell } from "./app-shell-C75zzjfi.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
import { r as Route$1 } from "./router-4SD9wsgu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/class._id.set._setId.flashcards-a8vInrgv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FlashCardsPage() {
	const { id: classId, setId } = Route$1.useParams();
	const [set, setSet] = (0, import_react.useState)(null);
	const [cls, setCls] = (0, import_react.useState)(null);
	const [index, setIndex] = (0, import_react.useState)(0);
	const [flipped, setFlipped] = (0, import_react.useState)(false);
	const [mode, setMode] = (0, import_react.useState)("study");
	const [reversed, setReversed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
			setSet(s);
			setCls(c);
		});
	}, [classId, setId]);
	if (!set || !cls) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Flash cards",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Loading…"
		})
	});
	const cards = set.flashcards || [];
	const card = cards[index];
	const total = cards.length;
	if (total === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Flash cards",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/class/$id",
			params: { id: classId },
			className: "text-sm text-teal hover:underline",
			children: "← Back to class"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-16 text-center text-muted",
			children: "No flash cards for this set yet."
		})]
	});
	const frontLabel = reversed ? "Definition" : "Term";
	const backLabel = reversed ? "Term" : "Definition";
	const frontText = reversed ? card.definition : card.term;
	const backText = reversed ? card.term : card.definition;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: `Flash cards – ${set.name}`,
		right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap justify-end gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: reversed ? "primary" : "secondary",
					className: "min-h-10 text-xs",
					onClick: () => {
						setReversed((r) => !r);
						setFlipped(false);
					},
					children: "Flip first side"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: mode === "study" ? "primary" : "secondary",
					className: "min-h-10 text-xs",
					onClick: () => setMode("study"),
					children: "Study"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: mode === "print" ? "primary" : "secondary",
					className: "min-h-10 text-xs",
					onClick: () => setMode("print"),
					children: "List"
				})
			]
		}),
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
		}), mode === "study" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 text-center text-xs text-muted",
					children: [
						"Card ",
						index + 1,
						" of ",
						total,
						" · Tap to flip"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setFlipped(!flipped),
					className: "flex min-h-[220px] w-full items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-md",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 text-[10px] tracking-wide text-muted uppercase",
						children: flipped ? backLabel : frontLabel
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-lg leading-relaxed font-semibold text-fg",
						children: flipped ? backText : frontText
					})] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => {
							setFlipped(false);
							setIndex((i) => (i - 1 + total) % total);
						},
						children: "Previous"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							setFlipped(false);
							setIndex((i) => (i + 1) % total);
						},
						children: "Next"
					})]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "print-hidden mb-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Print-friendly list"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => window.print(),
					children: "Print"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-xl border border-border bg-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-b border-border px-5 py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-sm font-semibold",
						children: [set.name, " — Flash cards"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "divide-y divide-border",
					children: cards.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-2 px-5 py-3.5 sm:grid-cols-[1fr_2fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm font-semibold",
							children: [
								i + 1,
								". ",
								c.term
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm",
							children: c.definition
						})]
					}, c.id))
				})]
			})]
		})]
	});
}
//#endregion
export { FlashCardsPage as component };
