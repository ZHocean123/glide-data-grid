import type { Meta, StoryObj } from '@storybook/vue3';
import BasicExample from './BasicExample.vue';
import AdvancedExample from './AdvancedExample.vue';
import AccessibilityExample from './AccessibilityExample.vue';
import PerformanceExample from './PerformanceExample.vue';
import ScrollingExample from './ScrollingExample.vue';

const meta: Meta = {
  title: 'Glide-Data-Grid-Vue/Examples',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => ({
    components: { BasicExample },
    template: '<BasicExample />',
  }),
};

export const Advanced: Story = {
  render: () => ({
    components: { AdvancedExample },
    template: '<AdvancedExample />',
  }),
};

export const Accessibility: Story = {
  render: () => ({
    components: { AccessibilityExample },
    template: '<AccessibilityExample />',
  }),
};

export const Performance: Story = {
  render: () => ({
    components: { PerformanceExample },
    template: '<PerformanceExample />',
  }),
};

export const Scrolling: Story = {
  render: () => ({
    components: { ScrollingExample },
    template: '<ScrollingExample />',
  }),
};