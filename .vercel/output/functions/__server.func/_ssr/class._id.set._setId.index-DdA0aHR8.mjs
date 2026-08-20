import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as getStudySetById, o as getClassById, t as AppShell } from "./app-shell-C75zzjfi.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
import { a as Route$3 } from "./router-4SD9wsgu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/class._id.set._setId.index-DdA0aHR8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NotesPage() {
	const { id: classId, setId } = Route$3.useParams();
	const [set, setSet] = (0, import_react.useState)(null);
	const [cls, setCls] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
			setSet(s);
			setCls(c);
		});
	}, [classId, setId]);
	if (!set || !cls) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Study notes",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Loading…"
		})
	});
	const sections = set.notes?.sections || [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: set.name,
		right: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "secondary",
			className: "print-hidden min-h-10 text-xs",
			onClick: () => window.print(),
			children: "Print / Save PDF"
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "print-hidden mb-5 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/class/$id",
				params: { id: classId },
				className: "text-sm text-teal hover:underline",
				children: "← Back to class"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-muted",
				children: cls.code
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "notes-sheet mx-auto max-w-3xl rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-1 flex items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-semibold tracking-wider text-muted uppercase",
						children: "Comprehensive Study Notes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-[10px] text-muted",
						children: "Studious AI"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-xl leading-tight font-bold text-fg sm:text-2xl",
					children: set.notes.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 mb-2 text-sm text-muted",
					children: set.notes.subtitle
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mb-6 text-[11px] text-muted",
					children: [
						cls.code,
						" · ",
						set.name,
						set.sourceFiles?.length ? ` · Sources: ${set.sourceFiles.join(", ")}` : ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-7",
					children: sections.map((sec, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBlock, {
						section: sec,
						index: i
					}, i))
				}),
				set.notes.otherResources?.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 border-t border-border pt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-3 text-sm font-semibold text-fg",
						children: "Other Resources"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1.5",
						children: set.notes.otherResources.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-2 text-sm text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 text-teal",
								children: "→"
							}), r.url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: r.url,
								target: "_blank",
								rel: "noreferrer",
								className: "text-teal hover:underline",
								children: r.title
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.title })]
						}, i))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "print-hidden mt-8 flex flex-wrap justify-center gap-3 border-t border-border pt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/class/$id/set/$setId/audio",
							params: {
								id: classId,
								setId
							},
							className: "text-sm font-medium text-sky-600 hover:underline",
							children: "Audio"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-border",
							children: "|"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/class/$id/set/$setId/flashcards",
							params: {
								id: classId,
								setId
							},
							className: "text-sm font-medium text-amber-700 hover:underline",
							children: "Flash cards"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-border",
							children: "|"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/class/$id/set/$setId/quiz",
							params: {
								id: classId,
								setId
							},
							className: "text-sm font-medium text-violet-600 hover:underline",
							children: "Quiz"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10 flex flex-col items-center gap-2 border-t border-border pt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/logo.png",
						alt: "Studious AI",
						className: "h-8 w-auto"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] text-muted",
						children: "Your masterclass for every class"
					})]
				})
			]
		})]
	});
}
function SectionBlock({ section, index }) {
	const layout = section.layout || (section.table ? "table" : section.columns?.length ? "two-column" : "stack");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mb-2 flex items-baseline gap-2 text-sm font-bold text-fg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs font-semibold text-teal",
				children: [index + 1, "."]
			}), section.heading]
		}),
		section.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm leading-relaxed text-fg",
			children: section.body
		}),
		layout === "two-column" && section.columns && section.columns.length >= 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
			children: section.columns.map((col, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border bg-bg p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-2 text-xs font-semibold text-teal",
					children: col.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: (col.bullets || []).map((b, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-1.5 text-[13px] leading-snug text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 text-teal",
							children: "•"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b })]
					}, j))
				})]
			}, i))
		}) : layout === "table" && section.table ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto rounded-lg border border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-left text-[13px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
					className: "border-b border-border bg-bg",
					children: section.table.headers.map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "whitespace-nowrap px-3 py-2 font-semibold text-fg",
						children: h
					}, i))
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: section.table.rows.map((row, ri) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
					className: "border-b border-border last:border-0 even:bg-bg",
					children: row.map((cell, ci) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 align-top text-fg",
						children: cell
					}, ci))
				}, ri)) })]
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1.5",
			children: (section.bullets || []).map((b, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex gap-2 text-sm leading-snug text-fg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 shrink-0 text-teal",
					children: "•"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b })]
			}, j))
		}),
		layout !== "stack" && section.bullets && section.bullets.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-1.5",
			children: section.bullets.map((b, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex gap-2 text-sm leading-snug text-fg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 shrink-0 text-teal",
					children: "•"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b })]
			}, j))
		}),
		section.reference && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 text-[11px] text-muted italic",
			children: ["Source: ", section.reference]
		})
	] });
}
//#endregion
export { NotesPage as component };
