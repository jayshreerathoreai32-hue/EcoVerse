import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  ...nextVitals,
  ...nextTypescript,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "no-console": "warn",
      "unused-imports/no-unused-imports": "warn",
    },
  },
];