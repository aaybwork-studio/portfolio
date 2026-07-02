import { defineConfig } from "astro/config";

// Static output — Vercel auto-detects Astro and serves dist/. No adapter needed.
// Phaser is mounted client-side only on the homepage island; it is never SSR'd.
export default defineConfig({
  output: "static",
  site: "https://example.com",
  vite: {
    // Phaser ships a large prebuilt bundle; keep it out of Astro's dep optimizer noise.
    optimizeDeps: { include: ["phaser"] },
  },
});
