import { join, dirname } from 'path'

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')))
}

export default {
  stories: [
    '../stories/**/*.stories.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx|vue)',
    '../src/**/*.stories.@(js|jsx|ts|tsx|vue)'
  ],
  addons: [
    // getAbsolutePath('@storybook/addon-links'),
    // getAbsolutePath('@storybook/addon-essentials'),
    // getAbsolutePath('@storybook/addon-interactions'),
    // getAbsolutePath('@storybook/addon-docs')
  ],
  framework: {
    name: getAbsolutePath('@storybook/vue3-vite'),
    options: {}
  },
  features: {
    storyStoreV7: true
  },
  docs: {
    autodocs: true
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite')
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': join(__dirname, '../src')
        }
      }
    })
  }
}