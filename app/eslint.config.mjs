import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Underscore prefix = deliberately unused (rest-sibling omissions, kept-for-API params).
  { rules: { "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }] } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-debug/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node tooling scripts are plain CJS, not app code
    "scripts/**",
    // Vendored/minified assets, not app code
    "public/**",
    // Generated Prisma client
    "src/generated/**",
  ]),
]);

export default eslintConfig;
