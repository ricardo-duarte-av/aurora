import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    plugins: [react(), topLevelAwait()],

    define: {
        "process.env": {},
    },

    resolve: {
        alias: {
            "@element-hq/web-shared-components/src": resolve(
                __dirname,
                "node_modules/@element-hq/web-shared-components/src",
            ),
        },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    //   clearScreen: false,
    //   // 2. tauri expects a fixed port, fail if that port is not available
    //   server: {
    //     port: 1420,
    //     strictPort: true,
    //     watch: {
    //       // 3. tell vite to ignore watching `src-tauri`
    //       ignored: ["**/src-tauri/**"],
    //     },
    //   },
}));
