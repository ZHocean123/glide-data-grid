const { dirname, join } = require("path");

module.exports = {
    stories: [
        "../packages/core/src/vue/**/*.stories.@(ts|tsx)",
        "../packages/core/src/vue/**/*.stories.vue"
    ],
    addons: [getAbsolutePath("@storybook/addon-docs")],

    framework: {
        name: getAbsolutePath("@storybook/vue3-vite"),
        options: {}
    },

    async viteFinal(config) {
        const { mergeConfig } = await import("vite");
        const vue = await import("@vitejs/plugin-vue");
        const wyw = await import("@wyw-in-js/vite");
        return mergeConfig(config, {
            plugins: [vue.default(), wyw.default()]
        });
    }
};

function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, "package.json")));
}
