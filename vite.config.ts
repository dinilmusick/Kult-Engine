import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
        crypto: path.resolve(__dirname, "src/polyfills/crypto.ts"),
        "@skipo/ui/theme": path.resolve(__dirname, "src/libraries/skipo/ui/theme/index.ts"),
        "@skipo/ui/dist/index.css": path.resolve(__dirname, "src/libraries/skipo/ui/theme/tokens.css"),
        "@skipo/ui": path.resolve(__dirname, "src/libraries/skipo/ui/index.ts"),
        "@skipo/core": path.resolve(__dirname, "src/libraries/skipo/core/index.ts"),
        "@skipo/backend": path.resolve(__dirname, "src/libraries/skipo/backend/index.ts"),
        "@skipo/systems": path.resolve(__dirname, "src/libraries/skipo/systems/index.ts"),
      },
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
    build: {
      outDir: "dist",
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name]-[hash][extname]",
        },
        onwarn(warning, defaultHandler) {
          if (
            warning.code === "INVALID_ANNOTATION" ||
            warning.message?.includes("annotation that Rollup cannot interpret") ||
            (warning.id && warning.id.includes("node_modules/zod"))
          ) {
            return;
          }
          defaultHandler(warning);
        },
      },
    },
  };
});
