import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["test/unit/**/*.test.ts", "test/unit/**/*.test.tsx"],
    testTimeout: 30000,
    clearMocks: true,
  },
});
