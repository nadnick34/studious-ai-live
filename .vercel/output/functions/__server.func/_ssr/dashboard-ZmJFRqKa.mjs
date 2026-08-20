import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as timeAgo, o as formatShortDate } from "./utils-DyWB8yQo.mjs";
import { d as Pencil, l as Plus, x as Archive } from "../_libs/lucide-react.mjs";
import { f as seedSampleClass, l as listClasses, m as updateClass, n as createClass, t as AppShell } from "./app-shell-C75zzjfi.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
import { i as parseClassCalendar, r as lookupProfessor } from "./ai-tyeSwjdS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-ZmJFRqKa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var emptyForm = {
	name: "",
	code: "",
	subject: "",
	schoolName: "",
	semester: "",
	professorName: "",
	professorInsight: "",
	textbook: "",
	textbookAuthor: "",
	scheduleDays: "",
	scheduleTime: "",
	syllabusFile: "",
	syllabusText: "",
	miscNotes: ""
};
function DashboardPage() {
	const [classes, setClasses] = (0, import_react.useState)([]);
	const [showForm, setShowForm] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)(emptyForm);
	const [insightLoading, setInsightLoading] = (0, import_react.useState)(false);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	async function refresh() {
		const rows = await listClasses({ data: false });
		setClasses(rows);
		setLoading(false);
	}
	(0, import_react.useEffect)(() => {
		refresh();
	}, []);
	function setField(key, value) {
		setForm((f) => ({
			...f,
			[key]: value
		}));
	}
	function openCreate() {
		setEditing(null);
		setForm(emptyForm);
		setShowForm(true);
	}
	function openEdit(c, e) {
		e.preventDefault();
		e.stopPropagation();
		setEditing(c);
		setForm({
			name: c.name || "",
			code: c.code || "",
			subject: c.subject || "",
			schoolName: c.schoolName || "",
			semester: c.semester || "",
			professorName: c.professorName || "",
			professorInsight: c.professorInsight || "",
			textbook: c.textbook || "",
			textbookAuthor: c.textbookAuthor || "",
			scheduleDays: c.scheduleDays || "",
			scheduleTime: c.scheduleTime || "",
			syllabusFile: c.syllabusFile || "",
			syllabusText: c.syllabusText || "",
			miscNotes: c.miscNotes || ""
		});
		setShowForm(true);
	}
	async function handleArchive(c, e) {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm(`Archive “${c.code} – ${c.name}”?`)) return;
		await updateClass({ data: {
			id: c.id,
			patch: { archived: true }
		} });
		await refresh();
	}
	async function fetchProfessorInsight() {
		if (!form.professorName.trim()) return;
		setInsightLoading(true);
		try {
			const result = await lookupProfessor({ data: {
				professorName: form.professorName.trim(),
				schoolName: form.schoolName.trim(),
				subject: form.subject.trim(),
				courseCode: form.code.trim()
			} });
			setForm((f) => ({
				...f,
				professorInsight: result.summary
			}));
		} finally {
			setInsightLoading(false);
		}
	}
	async function handleSubmit(e) {
		e.preventDefault();
		if (!form.name.trim()) return;
		setSaving(true);
		let alerts = editing?.alerts;
		let upcoming = editing?.upcoming;
		try {
			const parsed = await parseClassCalendar({ data: {
				className: `${form.code} ${form.name}`.trim(),
				semester: form.semester,
				syllabusText: form.syllabusText
			} });
			if (parsed.alerts?.length) alerts = parsed.alerts;
			if (parsed.upcoming?.length) upcoming = parsed.upcoming;
		} catch {}
		const payload = {
			name: form.name.trim(),
			code: form.code.trim() || "NEW",
			subject: form.subject.trim() || "General",
			schoolName: form.schoolName.trim() || void 0,
			semester: form.semester.trim() || void 0,
			professorName: form.professorName.trim() || void 0,
			professorInsight: form.professorInsight.trim() || void 0,
			textbook: form.textbook.trim() || void 0,
			textbookAuthor: form.textbookAuthor.trim() || void 0,
			scheduleDays: form.scheduleDays.trim() || void 0,
			scheduleTime: form.scheduleTime.trim() || void 0,
			syllabusFile: form.syllabusFile || void 0,
			syllabusText: form.syllabusText,
			miscNotes: form.miscNotes.trim() || void 0,
			alerts,
			upcoming
		};
		if (editing) await updateClass({ data: {
			id: editing.id,
			patch: payload
		} });
		else await createClass({ data: payload });
		setSaving(false);
		setShowForm(false);
		setEditing(null);
		await refresh();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "My Classes",
		right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: openCreate,
			className: "min-h-10 px-3 text-xs sm:text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "New class"]
		}),
		children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-16 text-center text-sm text-muted",
			children: "Loading classes…"
		}) : classes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-md py-16 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-4 text-muted",
				children: "No classes yet. Create your first class to get started."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center gap-2 sm:flex-row sm:justify-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: openCreate,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "New class"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: async () => {
						await seedSampleClass();
						await refresh();
					},
					children: "Try a sample class"
				})]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
			children: classes.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface relative rounded-xl p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/class/$id",
					params: { id: c.id },
					className: "block pr-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 text-xs font-semibold text-teal",
							children: c.code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 pr-20 font-semibold text-fg",
							children: c.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-0.5 text-xs text-muted",
							children: [
								c.subject && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: c.subject }),
								c.professorName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Prof. ", c.professorName] }),
								(c.scheduleDays || c.scheduleTime) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: [c.scheduleDays, c.scheduleTime].filter(Boolean).join(" · ") }),
								c.semester && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: c.semester })
							]
						}),
						c.alerts && c.alerts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 space-y-1",
							children: c.alerts.slice(0, 3).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
								children: a.message
							}, a.id))
						}),
						c.upcoming && c.upcoming.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-1 text-[10px] font-semibold tracking-wide text-teal uppercase",
								children: "Upcoming"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "space-y-1",
								children: c.upcoming.slice(0, 4).map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex justify-between gap-2 text-[11px] text-fg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "truncate",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted capitalize",
												children: u.type
											}),
											" · ",
											u.title
										]
									}), u.date && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 text-muted",
										children: formatShortDate(u.date)
									})]
								}, u.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 text-[10px] text-muted",
							children: ["Last opened ", timeAgo(c.lastAccessed)]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute top-3 right-3 flex gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: (e) => openEdit(c, e),
						className: "inline-flex min-h-9 items-center gap-1 rounded-md border border-teal bg-card px-2.5 text-[11px] font-medium text-teal",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3" }), "Edit"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: (e) => void handleArchive(c, e),
						className: "inline-flex min-h-9 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-3" }), "Archive"]
					})]
				})]
			}, c.id))
		}), showForm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-6 shadow-xl sm:max-w-lg sm:rounded-xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mb-4 text-base font-semibold text-fg",
					children: editing ? "Edit class" : "New class"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSubmit,
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Class name *",
									value: form.name,
									onChange: (v) => setField("name", v),
									required: true,
									placeholder: "Principles of Biology"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Course code",
									value: form.code,
									onChange: (v) => setField("code", v),
									placeholder: "BIOL 1543"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Subject",
									value: form.subject,
									onChange: (v) => setField("subject", v),
									placeholder: "Biology"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "School",
									value: form.schoolName,
									onChange: (v) => setField("schoolName", v),
									placeholder: "University of Arkansas"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Semester",
									value: form.semester,
									onChange: (v) => setField("semester", v),
									placeholder: "Fall 2026"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Days",
									value: form.scheduleDays,
									onChange: (v) => setField("scheduleDays", v),
									placeholder: "MWF"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Time",
									value: form.scheduleTime,
									onChange: (v) => setField("scheduleTime", v),
									placeholder: "10:00–10:50 AM"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "sm:col-span-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Professor",
											value: form.professorName,
											onChange: (v) => setField("professorName", v),
											placeholder: "Dr. Sarah Mitchell"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => void fetchProfessorInsight(),
											disabled: insightLoading || !form.professorName.trim(),
											className: "mt-1 text-xs text-teal hover:underline disabled:opacity-50",
											children: insightLoading ? "Looking up insight…" : "Get professor insight"
										}),
										form.professorInsight && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 rounded-lg border border-border bg-bg px-2.5 py-2 text-[11px] leading-relaxed text-muted",
											children: form.professorInsight
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Textbook",
									value: form.textbook,
									onChange: (v) => setField("textbook", v)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Textbook author",
									value: form.textbookAuthor,
									onChange: (v) => setField("textbookAuthor", v)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SyllabusField, {
							value: form.syllabusText,
							fileName: form.syllabusFile,
							onText: (v) => setField("syllabusText", v),
							onFile: (n) => setField("syllabusFile", n)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "mb-1 block text-xs font-medium text-muted",
							children: "Misc notes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: form.miscNotes,
							onChange: (e) => setField("miscNotes", e.target.value),
							rows: 2,
							className: "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg outline-none focus:border-teal"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-end gap-2 pt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								onClick: () => {
									setShowForm(false);
									setEditing(null);
								},
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: saving,
								children: saving ? "Saving…" : editing ? "Save changes" : "Create class"
							})]
						})
					]
				})]
			})
		})]
	});
}
function Field({ label, value, onChange, placeholder, required }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: "mb-1 block text-xs font-medium text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		value,
		onChange: (e) => onChange(e.target.value),
		placeholder,
		required,
		className: "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-fg outline-none focus:border-teal"
	})] });
}
function SyllabusField({ value, fileName, onText, onFile }) {
	const ref = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			className: "mb-1 block text-xs font-medium text-muted",
			children: "Syllabus"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					className: "min-h-10 text-xs",
					onClick: () => ref.current?.click(),
					children: "Upload syllabus"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate text-xs text-muted",
					children: fileName || "Optional — used for alerts and upcoming"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref,
					type: "file",
					accept: ".pdf,.txt,.png,.jpg,.jpeg",
					className: "hidden",
					onChange: (e) => {
						const f = e.target.files?.[0];
						if (f) onFile(f.name);
					}
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			value,
			onChange: (e) => onText(e.target.value),
			rows: 4,
			placeholder: "Or paste syllabus text here (due dates, exams, readings)…",
			className: "mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg outline-none focus:border-teal"
		})
	] });
}
//#endregion
export { DashboardPage as component };
