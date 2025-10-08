import type { Preview } from '@storybook/vue3-vite'

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        method: "alphabetical",
        order: ["Glide-Data-Grid-Vue", "Examples", "Components"],
        locales: "en-US",
      },
    },
    docs: {
      codePanel: true
    }
  },
};

export default preview;