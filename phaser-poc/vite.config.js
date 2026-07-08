import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  // relative base so the build works when served from a GitHub Pages
  // project-site subpath (https://<user>.github.io/<repo>/) as well as
  // from the domain root — no repo name needs to be hardcoded here.
  base: "./",
  build: {
    outDir: "dist",
  },
});
