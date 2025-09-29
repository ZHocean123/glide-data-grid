// Storybook Vue3 with Vite - ESM config
// 迁移说明：将原 CommonJS main.cjs 迁移为 ESM main.ts，以消除在 Vite 下的 CommonJS 使用警告。
// - 使用 export default 导出配置对象
// - 顶部静态导入 Vite 插件，避免动态 import 造成的额外开销
// - 通过 viteFinal 合并自定义插件（@vitejs/plugin-vue 与 @wyw-in-js/vite）

import vue from "@vitejs/plugin-vue";
import wyw from "@wyw-in-js/vite";
import { mergeConfig, type UserConfig } from "vite";

// 如果需要类型，可启用下行注释并安装对应类型：
// import type { StorybookConfig } from "@storybook/vue3-vite";

const config /*: any /* StorybookConfig */ = {
    stories: [
        "../packages/core/src/vue/**/*.stories.@(ts|tsx)",
        "../packages/core/src/vue/**/*.stories.vue",
    ],
    addons: ["@storybook/addon-docs"],
    framework: {
        name: "@storybook/vue3-vite",
        options: {},
    },
    async viteFinal(baseConfig: UserConfig) {
        // 合并我们需要的 Vite 插件配置
        return mergeConfig(baseConfig, {
            plugins: [vue(), wyw()],
        });
    },
};

export default config;
