const { dirname, join } = require("path");

module.exports = {
    stories: ["../**/src/**/*.stories.tsx", "../**/stories/**/*.stories.ts", "../packages/*-vue/stories/**/*.stories.ts"],
    addons: [getAbsolutePath("@storybook/addon-docs"), getAbsolutePath("@storybook/addon-links")],

    typescript: {
        reactDocgen: false,
    },

    async viteFinal(config) {
        const { mergeConfig } = await import("vite");
        const wyw = await import("@wyw-in-js/vite");
        return mergeConfig(config, {
            plugins: [wyw.default()],
        });
    },

    framework: {
        name: getAbsolutePath("@storybook/react-vite"),
        options: {},
    },
};

function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, "package.json")));
}
