import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // disable unused-vars rule
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // disable no-console rule
      "no-console": "off",
      "@typescript-eslint/no-console": "off",
      //Enable Use of "any"
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];

export default eslintConfig;
