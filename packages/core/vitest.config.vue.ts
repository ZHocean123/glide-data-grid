import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [vue()],
    test: {
        include: ["test/vue/**/*.test.ts"],
        environment: "jsdom",
        watch: false,
        clearMocks: true
    }
});
