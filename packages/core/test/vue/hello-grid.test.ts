import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import HelloGrid from "../../src/vue/components/HelloGrid.vue";

describe("HelloGrid", () => {
    it("renders the provided title", () => {
        const wrapper = mount(HelloGrid, { props: { title: "Vue Stack" } });
        expect(wrapper.text()).toContain("Vue Stack");
    });
});
