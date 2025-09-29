import type { Meta, StoryObj } from "@storybook/vue3";
import HelloGrid from "../components/HelloGrid.vue";

const meta: Meta<typeof HelloGrid> = {
    title: "Vue/HelloGrid",
    component: HelloGrid,
    args: {
        title: "Glide Data Grid (Vue Preview)"
    }
};

export default meta;

type Story = StoryObj<typeof HelloGrid>;

export const Preview: Story = {
    args: {
        title: "Glide Data Grid (Vue Preview)"
    }
};
