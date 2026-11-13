import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: /^@\/(.*)/, replacement: path.resolve(__dirname, "$1") },
        { find: "crypto", replacement: path.resolve(__dirname, "src/polyfills/crypto.ts") },
        { find: /^child_process$/, replacement: path.resolve(__dirname, "src/polyfills/child_process.ts") },
        { find: /^node:child_process$/, replacement: path.resolve(__dirname, "src/polyfills/child_process.ts") },
        { find: /^fs\/promises$/, replacement: path.resolve(__dirname, "src/polyfills/fs-promises.ts") },
        { find: /^node:fs\/promises$/, replacement: path.resolve(__dirname, "src/polyfills/fs-promises.ts") },
        { find: /^path$/, replacement: path.resolve(__dirname, "src/polyfills/path.ts") },
        { find: /^node:path$/, replacement: path.resolve(__dirname, "src/polyfills/path.ts") },
        { find: /^fs$/, replacement: path.resolve(__dirname, "src/polyfills/fs.ts") },
        { find: /^node:fs$/, replacement: path.resolve(__dirname, "src/polyfills/fs.ts") },
        { find: /^module$/, replacement: path.resolve(__dirname, "src/polyfills/module.ts") },
        { find: /^node:module$/, replacement: path.resolve(__dirname, "src/polyfills/module.ts") },
        { find: /^os$/, replacement: path.resolve(__dirname, "src/polyfills/os.ts") },
        { find: /^node:os$/, replacement: path.resolve(__dirname, "src/polyfills/os.ts") },
        { find: /^@huggingface\/transformers(?:\/.*)?$/, replacement: path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts") },
        { find: /^cactus-needle(?:\/.*)?$/, replacement: path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts") },
        { find: /^onnxruntime-web(?:\/.*)?$/, replacement: path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts") },
        { find: /^@dinilmusick\/gutts\/models(?:\/.*)?$/, replacement: path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts") },
        { find: /^@dinilmusick\/gutts\/storage(?:\/.*)?$/, replacement: path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts") },
        { find: /^googleapis(?:\/.*)?$/, replacement: path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts") },
        { find: /^node-fetch(?:\/.*)?$/, replacement: path.resolve(__dirname, "src/libraries/shims/browserModelShim.ts") },
      ],
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
