import { defineConfig } from "vitest/config";

// Tests run without the dev server: they call Doorlist's code directly.
export default defineConfig({ test: { include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"] } });
