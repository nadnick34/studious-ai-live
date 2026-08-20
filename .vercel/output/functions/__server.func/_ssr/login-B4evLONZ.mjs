import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, U as require_react, b as Navigate, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn, t as authClient } from "./client-sGid3STf.mjs";
import { n as useCurrentUserState } from "./use-current-user-DZ7NZd4-.mjs";
import { t as Button } from "./button-CMWPpJAW.mjs";
import { t as GROK_PROVIDERS } from "./server-ECxmHHnb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-B4evLONZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user } = useCurrentUserState();
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/dashboard" });
	async function handleSubmit(e) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const { error: err } = await authClient.signIn.email({
			email: email.trim(),
			password
		});
		setLoading(false);
		if (err) {
			setError(err.message || "Invalid email or password.");
			return;
		}
		await navigate({ to: "/dashboard" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-slate-dark px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-[380px] rounded-2xl border border-border bg-card p-8 shadow-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 flex flex-col items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/logo.png",
							alt: "Studious AI",
							className: "h-10 w-auto"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "Your masterclass for every class."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-5 text-center text-base font-semibold text-fg",
					children: "Log in"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 space-y-2",
					children: [GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void signIn(p.providerId, { callbackURL: "/dashboard" }),
						className: "w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-bg",
						children: ["Continue with ", p.label]
					}, p.providerId)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative py-2 text-center text-[11px] text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "bg-card px-2",
							children: "or email"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSubmit,
					className: "space-y-3.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Email",
							type: "email",
							value: email,
							onChange: setEmail,
							autoComplete: "email"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Password",
							type: "password",
							value: password,
							onChange: setPassword,
							autoComplete: "current-password"
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-lg bg-red-50 px-3 py-2 text-sm text-red",
							children: error
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "mt-2 w-full",
							disabled: loading,
							children: loading ? "Signing in…" : "Log in"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-center text-xs text-muted",
					children: [
						"No account?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/signup",
							className: "font-medium text-teal hover:underline",
							children: "Create one"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-center text-xs text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "hover:underline",
						children: "← Back to home"
					})
				})
			]
		})
	});
}
function Field({ label, type, value, onChange, autoComplete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: "mb-1 block text-xs font-medium text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		value,
		onChange: (e) => onChange(e.target.value),
		required: true,
		autoComplete,
		className: "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-fg outline-none focus:border-teal"
	})] });
}
//#endregion
export { Login as component };
