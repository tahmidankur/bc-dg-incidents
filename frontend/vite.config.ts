import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  build: {
    // Recharts makes up most of the bundle (about 190 kB gzipped in total).
    // That is acceptable for a one-chart site, so the warning limit is set
    // just above the real size instead of splitting the code.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: "jsdom",
  },
});
