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
        child_process: path.resolve(__dirname, "src/polyfills/child_process.ts"),
        "node:child_process": path.resolve(__dirname, "src/polyfills/child_process.ts"),
        "fs/promises": path.resolve(__dirname, "src/polyfills/fs-promises.ts"),
        "node:fs/promises": path.resolve(__dirname, "src/polyfills/fs-promises.ts"),
        path: path.resolve(__dirname, "src/polyfills/path.ts"),
        "node:path": path.resolve(__dirname, "src/polyfills/path.ts"),
        "fs": path.resolve(__dirname, "src/polyfills/fs.ts"),
        "node:fs": path.resolve(__dirname, "src/polyfills/fs.ts"),
        "module": path.resolve(__dirname, "src/polyfills/module.ts"),
        "node:module": path.resolve(__dirname, "src/polyfills/module.ts"),
        os: path.resolve(__dirname, "src/polyfills/os.ts"),
        "node:os": path.resolve(__dirname, "src/polyfills/os.ts"),
        "@skipo/ui/theme": path.resolve(__dirname, "src/libraries/skipo/ui/theme/index.ts"),
        "@skipo/ui/dist/index.css": path.resolve(__dirname, "src/libraries/skipo/ui/theme/tokens.css"),
        "@skipo/ui": path.resolve(__dirname, "src/libraries/skipo/ui/index.ts"),
        "@skipo/core": path.resolve(__dirname, "src/libraries/skipo/core/index.ts"),
        "@skipo/backend": path.resolve(__dirname, "src/libraries/skipo/backend/index.ts"),
        "@skipo/systems": path.resolve(__dirname, "src/libraries/skipo/systems/index.ts"),
        "@huggingface/transformers": path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts"),
        "cactus-needle": path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts"),
        "onnxruntime-web": path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts"),
        "@dinilmusick/gutts/models": path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts"),
        "@dinilmusick/gutts/storage": path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts"),
        googleapis: path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts"),
        "node-fetch": path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts"),
      },
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'cross-origin',
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
