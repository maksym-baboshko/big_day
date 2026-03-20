import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/widgets/rsvp/server/email-template.tsx"],
    rules: {
      // This file renders raw HTML email markup for Resend/@react-email,
      // so the Next.js page-level <head> rule is not applicable here.
      "@next/next/no-head-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    // Git worktrees created by Claude Code — contain their own .next builds
    ".claude/**",
  ]),
]);

export default eslintConfig;
