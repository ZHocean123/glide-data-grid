import type { App, Plugin } from "vue";
import DataGrid from "./components/DataGrid.vue";

export { DataGrid };

export interface GlideDataGridVuePluginOptions {
    readonly componentName?: string;
}

export const createGlideDataGridVuePlugin = (
    options: GlideDataGridVuePluginOptions = {}
): Plugin => {
    const componentName = options.componentName ?? "GlideDataGrid";

    return {
        install(app: App) {
            app.component(componentName, DataGrid);
        }
    };
};
