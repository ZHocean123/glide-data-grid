import type { Meta, StoryObj } from '@storybook/vue3';
import MarkdownDiv from '../internal/markdown-div/markdown-div.vue';

/**
 * MarkdownDiv 组件故事
 * 展示基础 Markdown 渲染能力
 */
const meta: Meta<typeof MarkdownDiv> = {
  title: 'Internal/MarkdownDiv',
  component: MarkdownDiv,
  args: {
    contents: '# Glide Data Grid\n\n- 支持 **Markdown**\n- 易于使用',
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownDiv>;

export const Basic: Story = {
  render: (args) => ({
    components: { MarkdownDiv },
    setup() {
      return { args };
    },
    template: '<MarkdownDiv v-bind="args" />',
  }),
};