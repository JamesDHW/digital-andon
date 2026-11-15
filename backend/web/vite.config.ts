import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Builds the web app into web/dist, which the Worker serves as static assets.
 * `pnpm dev:web` proxies API calls to `pnpm dev` on port 8787. */
export default defineConfig({
  root: "web",
  plugins: [react(), tailwindcss()],
  // The web app shares the backend's domain and protocol code; this matches "paths" in tsconfig.web.json.
  resolve: { alias: { "@backend": fileURLToPath(new URL("../src", import.meta.url)) } },
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    proxy: {
      "/auth": "http://localhost:8787",
      "/me": "http://localhost:8787",
      "/team/": "http://localhost:8787",
    },
  },
});
