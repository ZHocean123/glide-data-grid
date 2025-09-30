import { defineConfig, configDefaults } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{js,ts,vue}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/node_modules/**'
      ]
    },
    threads: false,
    singleThread: true,
    watch: false,
    clearMocks: true,
    maxConcurrency: 5,
    fakeTimers: {
      toFake: [
        ...(configDefaults.fakeTimers.toFake ?? []),
        "performance",
        "requestAnimationFrame",
        "cancelAnimationFrame",
      ],
    },
    deps: {
      optimizer: {
        web: {
          include: ["vitest-canvas-mock"],
        },
      },
    },
    environmentOptions: {
      jsdom: {
        resources: "usable",
      },
    },
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
