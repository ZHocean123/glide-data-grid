const { dirname, join } = require("path");

module.exports = {
    stories: ["../packages/*-vue/stories/**/*.stories.ts"],
    addons: [getAbsolutePath("@storybook/addon-docs"), getAbsolutePath("@storybook/addon-links")],

    framework: {
        name: getAbsolutePath("@storybook/vue3-vite"),
        options: {},
    },

    docs: {
        autodocs: true
    }
};

function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, "package.json")));
}