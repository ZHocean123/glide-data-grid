export default {
    stories: ["../packages/*-vue/stories/**/*.stories.ts"],
    addons: ["@storybook/addon-docs", "@storybook/addon-links"],

    framework: {
        name: "@storybook/vue3-vite",
        options: {},
    },

    docs: {
        autodocs: true
    }
};