// import { getDataEditorTheme } from '../src/common/styles'

const preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' }
      ]
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    docs: {
      source: {
        language: 'html'
      }
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div class="storybook-wrapper" style="padding: 20px; font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;">
          <story />
        </div>
      `
    })
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ],
        dynamicTitle: true
      }
    }
  }
}

export default preview