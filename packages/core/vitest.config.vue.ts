import vue from "@vitejs/plugin-vue";
import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
    plugins: [vue()],
    test: {
        setupFiles: "vitest.setup.ts",
        include: ["test/vue/**/*.test.ts"],
        environment: "jsdom",
        watch: false,
        clearMocks: true,
        maxConcurrency: 8,
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
        },
        fakeTimers: {
            toFake: [
                ...(configDefaults.fakeTimers.toFake ?? []),
                "performance",
                "requestAnimationFrame",
                "cancelAnimationFrame",
            ],
        },
    }
});
