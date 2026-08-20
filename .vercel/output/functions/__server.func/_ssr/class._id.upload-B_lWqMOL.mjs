import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as createStudySet, o as getClassById, t as AppShell } from "./app-shell-C75zzjfi.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
import { o as Route$5 } from "./router-4SD9wsgu.mjs";
import { n as capturedToPayloads, t as CaptureBar } from "./capture-bar-W27jEmsh.mjs";
import { n as generateStudyPackage, t as extractMaterials } from "./ai-tyeSwjdS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/class._id.upload-B_lWqMOL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function UploadPage() {
	const { id: classId } = Route$5.useParams();
	const navigate = useNavigate();
	const [cls, setCls] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [files, setFiles] = (0, import_react.useState)([]);
	const [generating, setGenerating] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [status, setStatus] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		getClassById({ data: classId }).then((c) => setCls(c));
	}, [classId]);
	async function handleGenerate() {
		if (!name.trim()) {
			setError("Please name this chapter (for example: Chapter 2).");
			return;
		}
		if (!files.length) {
			setError("Add at least one file, photo, or scan.");
			return;
		}
		if (!cls) return;
		setError(null);
		setGenerating(true);
		setStatus("Reading your materials…");
		try {
			const payloads = await capturedToPayloads(files);
			const extracted = await extractMaterials({ data: { files: payloads } });
			setStatus("Building notes, audio, flash cards, and quiz…");
			const generated = await generateStudyPackage({ data: {
				className: cls.name,
				classCode: cls.code,
				subject: cls.subject,
				setName: name.trim(),
				sourceFiles: extracted.attachments.map((a) => a.name),
				extractedText: extracted.text
			} });
			const set = await createStudySet({ data: {
				classId,
				name: name.trim(),
				generated,
				sourceFiles: extracted.attachments.map((a) => a.name),
				attachments: extracted.attachments
			} });
			await navigate({
				to: "/class/$id/set/$setId",
				params: {
					id: classId,
					setId: set.id
				}
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
			setGenerating(false);
			setStatus("");
		}
	}
	if (!cls) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Upload",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Loading…"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: `${cls.code} – New chapter`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/class/$id",
			params: { id: classId },
			className: "mb-4 inline-block text-sm text-teal hover:underline",
			children: "← Back to class"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-lg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface rounded-xl p-5 sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-1 text-base font-semibold",
						children: "New chapter"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-5 text-xs text-muted",
						children: "Name the set, then attach files, take a photo, or scan a page. Generate when you’re ready."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "mb-1.5 block text-xs font-medium text-muted",
							children: "Name this set"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "e.g. Chapter 2",
							disabled: generating,
							className: "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-teal"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptureBar, {
						items: files,
						onChange: setFiles,
						disabled: generating
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red",
						children: error
					}),
					status && generating && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 text-sm text-teal",
						children: status
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/class/$id",
							params: { id: classId },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								disabled: generating,
								children: "Cancel"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: () => void handleGenerate(),
							disabled: generating || !files.length || !name.trim(),
							children: generating ? "Generating…" : "Generate study materials"
						})]
					})
				]
			})
		})]
	});
}
//#endregion
export { UploadPage as component };
