import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cn } from "./utils-DyWB8yQo.mjs";
import { c as getStudySetById, o as getClassById, t as AppShell } from "./app-shell-C75zzjfi.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
import { n as Route } from "./router-4SD9wsgu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/class._id.set._setId.quiz-vWQAiE4y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function QuizPage() {
	const { id: classId, setId } = Route.useParams();
	const [set, setSet] = (0, import_react.useState)(null);
	const [cls, setCls] = (0, import_react.useState)(null);
	const [index, setIndex] = (0, import_react.useState)(0);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [revealed, setRevealed] = (0, import_react.useState)(false);
	const [score, setScore] = (0, import_react.useState)(0);
	const [finished, setFinished] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
			setSet(s);
			setCls(c);
		});
	}, [classId, setId]);
	if (!set || !cls) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Quiz",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Loading…"
		})
	});
	const questions = set.quiz;
	const q = questions[index];
	const total = questions.length;
	if (total === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Quiz",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/class/$id",
			params: { id: classId },
			className: "text-sm text-teal hover:underline",
			children: "← Back to class"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-16 text-center text-muted",
			children: "No quiz questions for this set yet."
		})]
	});
	function handleSelect(i) {
		if (revealed) return;
		setSelected(i);
		setRevealed(true);
		if (i === q.correctIndex) setScore((s) => s + 1);
	}
	function restart() {
		setIndex(0);
		setSelected(null);
		setRevealed(false);
		setScore(0);
		setFinished(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: `Quiz – ${set.name}`,
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
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-lg",
			children: finished ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface rounded-xl p-8 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 text-3xl font-bold text-fg",
						children: [
							score,
							"/",
							total
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-6 text-sm text-muted",
						children: score === total ? "Perfect — you’ve mastered this material." : score >= total * .7 ? "Solid work. Review the missed items and try again." : "Keep going. Revisit the notes and audio, then retake the quiz."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: restart,
							children: "Retake quiz"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/class/$id/set/$setId",
							params: {
								id: classId,
								setId
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { children: "Review notes" })
						})]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface rounded-xl p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-5 h-1.5 overflow-hidden rounded-full bg-bg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full bg-teal transition-all",
							style: { width: `${(index + (revealed ? 1 : 0)) / total * 100}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 text-xs text-muted",
						children: [
							"Question ",
							index + 1,
							" of ",
							total
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-5 text-base leading-snug font-semibold text-fg",
						children: q.question
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2.5",
						children: q.options.map((opt, i) => {
							let style = "border-border hover:border-teal";
							if (revealed) {
								if (i === q.correctIndex) style = "border-green-400 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200";
								else if (i === selected) style = "border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200";
								else style = "border-border opacity-60";
							} else if (selected === i) style = "border-teal bg-teal/10";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => handleSelect(i),
								disabled: revealed,
								className: cn("w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors", style),
								children: opt
							}, i);
						})
					}),
					revealed && q.explanation && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 rounded-lg bg-bg p-3 text-xs text-muted",
						children: q.explanation
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/class/$id",
							params: { id: classId },
							className: "text-sm text-muted",
							children: "Exit"
						}), revealed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								if (index + 1 >= total) setFinished(true);
								else {
									setIndex(index + 1);
									setSelected(null);
									setRevealed(false);
								}
							},
							children: index + 1 >= total ? "See results" : "Next"
						})]
					})
				]
			})
		})]
	});
}
//#endregion
export { QuizPage as component };
