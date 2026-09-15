import { defineConfig } from "vitest/config";
import ts from "typescript";
export default defineConfig({
  plugins: [{ name: "project-jsx", enforce: "pre", transform(source, id) {
    if (!/(?:app|testy)\/.*\.[jt]sx?$/.test(id)) return;
    return { code: ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, fileName: id.replace(/\.js$/, ".jsx") }).outputText, map: null };
  } }],
  test: { environment: "jsdom", include: ["testy/*.test.jsx"], setupFiles: ["./testy/setup-dom.mjs"], restoreMocks: true },
});
