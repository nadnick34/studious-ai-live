import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatDateTime } from "./utils-DyWB8yQo.mjs";
import { b as BookOpen, d as Pencil, g as Headphones, h as Layers, i as Trash2, l as Plus, s as Sparkles, v as Ellipsis } from "../_libs/lucide-react.mjs";
import { a as deleteStudySet, h as updateStudySet, i as createStudySet, o as getClassById, p as touchClass, t as AppShell, u as listStudySets } from "./app-shell-C75zzjfi.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
import { s as Route$6 } from "./router-4SD9wsgu.mjs";
import { n as capturedToPayloads, t as CaptureBar } from "./capture-bar-W27jEmsh.mjs";
import { n as generateStudyPackage, t as extractMaterials } from "./ai-tyeSwjdS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/class._id.index-CKc2SZyv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ClassPage() {
	const { id: classId } = Route$6.useParams();
	const navigate = useNavigate();
	const [cls, setCls] = (0, import_react.useState)(null);
	const [sets, setSets] = (0, import_react.useState)([]);
	const [showCombine, setShowCombine] = (0, import_react.useState)(false);
	const [showFocus, setShowFocus] = (0, import_react.useState)(false);
	const [showMore, setShowMore] = (0, import_react.useState)(false);
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [focusText, setFocusText] = (0, import_react.useState)("");
	const [focusName, setFocusName] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [editing, setEditing] = (0, import_react.useState)(null);
	async function refresh() {
		const [c, s] = await Promise.all([getClassById({ data: classId }), listStudySets({ data: classId })]);
		if (!c) {
			navigate({ to: "/dashboard" });
			return;
		}
		setCls(c);
		setSets(s);
	}
	(0, import_react.useEffect)(() => {
		touchClass({ data: classId });
		refresh();
	}, [classId]);
	async function handleCustomFocus() {
		if (!cls || !focusText.trim()) {
			setError("Describe what you want to focus on.");
			return;
		}
		setError(null);
		setBusy(true);
		const setName = focusName.trim() || `Focus: ${focusText.trim().slice(0, 40)}`;
		try {
			const generated = await generateStudyPackage({ data: {
				className: cls.name,
				classCode: cls.code,
				subject: cls.subject,
				setName,
				sourceFiles: ["Custom Focus"],
				focusPrompt: focusText.trim()
			} });
			const set = await createStudySet({ data: {
				classId,
				name: setName,
				generated,
				sourceFiles: ["Custom Focus"],
				focusPrompt: focusText.trim()
			} });
			setShowFocus(false);
			setFocusText("");
			setFocusName("");
			await navigate({
				to: "/class/$id/set/$setId",
				params: {
					id: classId,
					setId: set.id
				}
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setBusy(false);
		}
	}
	async function handleCombine() {
		if (!cls || selected.length < 2) return;
		const chosen = sets.filter((s) => selected.includes(s.id));
		const extractedText = chosen.map((s) => {
			const secs = (s.notes?.sections || []).map((sec) => [
				sec.heading,
				sec.body || "",
				(sec.bullets || []).join("\n")
			].filter(Boolean).join("\n")).join("\n\n");
			return `===== ${s.name} =====\n${s.notes?.title || ""}\n${secs}`;
		}).join("\n\n");
		setBusy(true);
		setStatus("Combining selected chapters…");
		setError(null);
		try {
			const generated = await generateStudyPackage({ data: {
				className: cls.name,
				classCode: cls.code,
				subject: cls.subject,
				setName: "Midterm / Final review",
				sourceFiles: chosen.map((s) => s.name),
				extractedText,
				focusPrompt: "Combine these chapter notes into one comprehensive midterm/final review."
			} });
			const set = await createStudySet({ data: {
				classId,
				name: "Midterm / Final review",
				generated,
				sourceFiles: chosen.map((s) => s.name)
			} });
			setShowCombine(false);
			setSelected([]);
			await navigate({
				to: "/class/$id/set/$setId",
				params: {
					id: classId,
					setId: set.id
				}
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Combine failed");
		} finally {
			setBusy(false);
			setStatus("");
		}
	}
	if (!cls) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Class",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Loading…"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: cls.code,
		right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/class/$id/upload",
				params: { id: classId },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "min-h-10 px-3 text-xs sm:text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "New chapter"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setShowMore((v) => !v),
				className: "grid size-10 place-items-center rounded-lg border border-border bg-card text-fg",
				"aria-label": "More actions",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-4" })
			})]
		}),
		children: [
			showMore && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid gap-2 rounded-xl border border-border bg-card p-2 sm:flex sm:flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					className: "justify-start",
					onClick: () => {
						setShowMore(false);
						setShowFocus(true);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "Custom focus"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "justify-start",
					onClick: () => {
						setShowMore(false);
						setShowCombine(true);
					},
					children: "Combine for midterm / final"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-1 text-xs text-muted",
				children: "Class"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "mb-5 text-lg font-bold text-fg",
				children: [
					cls.code,
					" – ",
					cls.name
				]
			}),
			sets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface rounded-xl px-4 py-12 text-center text-sm text-muted",
				children: ["No chapters yet. Add materials, take a photo, or scan a page to start.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/class/$id/upload",
						params: { id: classId },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { children: "New chapter" })
					})
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: sets.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChapterCard, {
					classId,
					set: s,
					onEdit: () => setEditing(s),
					onDelete: async () => {
						if (!confirm(`Delete “${s.name}”? This cannot be undone.`)) return;
						await deleteStudySet({ data: s.id });
						await refresh();
					}
				}, s.id))
			}),
			showCombine && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "Combine for midterm / final",
				onClose: () => setShowCombine(false),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-xs text-muted",
						children: "Select at least two chapters to merge into one study package."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 max-h-60 space-y-2 overflow-y-auto",
						children: sets.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: selected.includes(s.id),
								onChange: (e) => {
									if (e.target.checked) setSelected([...selected, s.id]);
									else setSelected(selected.filter((id) => id !== s.id));
								}
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: s.name
							})]
						}, s.id))
					}),
					status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm text-teal",
						children: status
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm text-red",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setShowCombine(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: selected.length < 2 || busy,
							onClick: () => void handleCombine(),
							children: busy ? "Generating…" : "Combine selected"
						})]
					})
				]
			}),
			showFocus && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "Custom focus",
				onClose: () => setShowFocus(false),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-xs text-muted",
						children: "Tell Studious what to emphasize — a tough section or extra depth. A full study package will be generated."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mb-1 block text-xs font-medium text-muted",
						children: "Optional name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: focusName,
						onChange: (e) => setFocusName(e.target.value),
						className: "mb-3 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-teal",
						placeholder: "e.g. Punnett squares deep dive"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mb-1 block text-xs font-medium text-muted",
						children: "What should we focus on?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: focusText,
						onChange: (e) => setFocusText(e.target.value),
						rows: 4,
						className: "mb-4 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-teal"
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm text-red",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setShowFocus(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: busy,
							onClick: () => void handleCustomFocus(),
							children: busy ? "Generating…" : "Generate focused set"
						})]
					})
				]
			}),
			editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditChapterModal, {
				cls,
				set: editing,
				onClose: () => setEditing(null),
				onSaved: async () => {
					setEditing(null);
					await refresh();
				}
			})
		]
	});
}
function ChapterCard({ classId, set, onEdit, onDelete }) {
	const actions = [
		{
			to: "/class/$id/set/$setId",
			label: "Notes",
			icon: BookOpen
		},
		{
			to: "/class/$id/set/$setId/audio",
			label: "Audio",
			icon: Headphones
		},
		{
			to: "/class/$id/set/$setId/flashcards",
			label: "Cards",
			icon: Layers,
			extra: set.flashcards?.length
		},
		{
			to: "/class/$id/set/$setId/quiz",
			label: "Quiz",
			icon: Sparkles
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card-surface rounded-xl p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "truncate font-semibold text-fg",
						children: [set.name, set.focusPrompt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-200",
							children: "Focus"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-0.5 text-xs text-muted",
						children: formatDateTime(set.createdAt)
					}),
					set.sourceFiles?.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 truncate text-[11px] text-muted",
						children: [
							set.attachments?.length || set.sourceFiles.length,
							" attachment",
							(set.attachments?.length || set.sourceFiles.length) === 1 ? "" : "s",
							" · ",
							set.sourceFiles.slice(0, 2).join(", ")
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onEdit,
					className: "grid size-10 place-items-center rounded-lg text-teal hover:bg-bg",
					"aria-label": "Edit chapter",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onDelete,
					className: "grid size-10 place-items-center rounded-lg text-red hover:bg-bg",
					"aria-label": "Delete chapter",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid grid-cols-4 gap-1",
			children: actions.map((a) => {
				const Icon = a.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: a.to,
					params: {
						id: classId,
						setId: set.id
					},
					className: "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-bg text-[11px] font-medium text-fg hover:bg-teal/10 hover:text-teal",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }),
						a.label,
						a.extra ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[10px] text-muted",
							children: [
								"(",
								a.extra,
								")"
							]
						}) : null
					]
				}, a.label);
			})
		})]
	});
}
function EditChapterModal({ cls, set, onClose, onSaved }) {
	const [name, setName] = (0, import_react.useState)(set.name);
	const [attachments, setAttachments] = (0, import_react.useState)(set.attachments || []);
	const [newFiles, setNewFiles] = (0, import_react.useState)([]);
	const [rebuild, setRebuild] = (0, import_react.useState)(false);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function save() {
		if (!name.trim()) return;
		setSaving(true);
		setError(null);
		try {
			let nextAttachments = attachments;
			let extractedExtra = "";
			if (newFiles.length) {
				const payloads = await capturedToPayloads(newFiles);
				const extracted = await extractMaterials({ data: { files: payloads } });
				nextAttachments = [...attachments, ...extracted.attachments];
				extractedExtra = extracted.text;
			}
			const sourceFiles = nextAttachments.map((a) => a.name);
			if (rebuild) {
				const existingText = nextAttachments.map((a) => a.extractedText || a.name).join("\n\n");
				const generated = await generateStudyPackage({ data: {
					className: cls.name,
					classCode: cls.code,
					subject: cls.subject,
					setName: name.trim(),
					sourceFiles,
					extractedText: [existingText, extractedExtra].filter(Boolean).join("\n"),
					focusPrompt: set.focusPrompt
				} });
				await updateStudySet({ data: {
					id: set.id,
					patch: {
						name: name.trim(),
						sourceFiles,
						attachments: nextAttachments,
						notes: generated.notes,
						audioScript: generated.audioScript,
						quiz: generated.quiz,
						flashcards: generated.flashcards
					}
				} });
			} else await updateStudySet({ data: {
				id: set.id,
				patch: {
					name: name.trim(),
					sourceFiles,
					attachments: nextAttachments
				}
			} });
			onSaved();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		title: "Edit chapter",
		onClose,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "mb-1 block text-xs font-medium text-muted",
				children: "Name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: name,
				onChange: (e) => setName(e.target.value),
				className: "mb-4 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-teal"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs font-medium text-muted",
				children: "Attachments"
			}),
			attachments.length === 0 && newFiles.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs text-muted",
				children: "None yet — add files, a photo, or a scan."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mb-3 space-y-1.5",
				children: attachments.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate",
						children: a.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-xs text-red",
						onClick: () => setAttachments(attachments.filter((x) => x.id !== a.id)),
						children: "Remove"
					})]
				}, a.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptureBar, {
				items: newFiles,
				onChange: setNewFiles,
				disabled: saving
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 flex items-start gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					className: "mt-1",
					checked: rebuild,
					onChange: (e) => setRebuild(e.target.checked)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rebuild notes, audio, cards, and quiz from all attachments" })]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-red",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: onClose,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: saving || !name.trim(),
					onClick: () => void save(),
					children: saving ? "Saving…" : "Save"
				})]
			})
		]
	});
}
function Modal({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-6 shadow-xl sm:max-w-lg sm:rounded-xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-base font-semibold",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "text-sm text-muted",
					children: "Close"
				})]
			}), children]
		})
	});
}
//#endregion
export { ClassPage as component };
