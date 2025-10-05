import type { Plugin } from "vue";
import DataGrid from "./components/DataGrid.vue";
export { DataGrid };
export interface GlideDataGridVuePluginOptions {
    readonly componentName?: string;
}
export declare const createGlideDataGridVuePlugin: (options?: GlideDataGridVuePluginOptions) => Plugin;
