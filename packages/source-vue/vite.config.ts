import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

const external = [
    "vue",
    "@glideapps/glide-data-grid-shared",
    "@glideapps/glide-data-grid-vue"
];

export default defineConfig({
    plugins: [vue()],
    build: {
        target: "es2022",
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "GlideDataGridSourceVue",
            formats: ["es", "cjs"],
            fileName: () => "index.js"
        },
        rollupOptions: {
            external,
            output: [
                {
                    format: "es",
                    dir: "dist/esm",
                    entryFileNames: "index.js",
                    chunkFileNames: "[name].js",
                    sourcemap: true
                },
                {
                    format: "cjs",
                    dir: "dist/cjs",
                    entryFileNames: "index.js",
                    chunkFileNames: "[name].js",
                    exports: "named",
                    sourcemap: true
                }
            ]
        },
        emptyOutDir: false,
        sourcemap: true
    }
});
