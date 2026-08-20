import { i as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-kgFKYUAS.mjs";
import { r as createSsrRpc } from "./app-shell-C75zzjfi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-tyeSwjdS.js
var extractMaterials = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("3a33784bfe4b18fb419f789e3966a198b5de98c075a4192d5dd9cf05d9ff43d0"));
var generateStudyPackage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("999e8d529732bcb6be834c345f36be2df13dff7c69b5a5e7b943483b58d6db70"));
var parseClassCalendar = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("156fd2f967842b9be506f41212b0aac5fcd4b8413af7003e29f32863104e21c0"));
var lookupProfessor = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("d10ccbbdf10288b30be6878e601650705f2b6897a8e0323e31ec6331a1e50654"));
var speakLecture = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("799356f9501dee9fbf19d11ed97dbeec2806105f6dd0e34f88bd90e237fc7cfd"));
//#endregion
export { speakLecture as a, parseClassCalendar as i, generateStudyPackage as n, lookupProfessor as r, extractMaterials as t };
