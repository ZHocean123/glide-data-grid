import type { Preview } from '@storybook/vue3';

/**
 * Storybook 全局参数配置
 * - 居中布局，便于组件预览
 */
const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
};

export default preview;