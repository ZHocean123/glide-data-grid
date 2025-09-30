import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
    plugins: [
        vue({
            script: {
                defineModel: true,
                propsDestructure: true,
            },
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "GlideDataGridVue",
            fileName: format => `index.${format}.js`,
            formats: ["es"],
        },
        rollupOptions: {
            external: ["vue"],
            output: {
                globals: {
                    vue: "Vue",
                },
            },
        },
        sourcemap: true,
        minify: false,
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    test: {
        globals: true,
        environment: "happy-dom",
    },
});
