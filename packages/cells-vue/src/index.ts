import type { App, Plugin } from "vue";
import BooleanCell from "./components/BooleanCell.vue";

export { BooleanCell };

export interface GlideDataGridCellsVuePluginOptions {
    readonly componentPrefix?: string;
}

export const createGlideDataGridCellsVuePlugin = (
    options: GlideDataGridCellsVuePluginOptions = {}
): Plugin => {
    const prefix = options.componentPrefix ?? "Gdg";

    return {
        install(app: App) {
            app.component(prefix + "BooleanCell", BooleanCell);
        }
    };
};
