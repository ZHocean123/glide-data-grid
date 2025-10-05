import type { App, Plugin } from "vue";
import BooleanCell from "./components/BooleanCell.vue";
import StarCellComponent from "./components/StarCell.vue";
import SparklineCellComponent from "./components/SparklineCell.vue";
import TagsCellComponent from "./components/TagsCell.vue";
import UserProfileCellComponent from "./components/UserProfileCell.vue";
import DropdownCellComponent from "./components/DropdownCell.vue";
import RangeCellComponent from "./components/RangeCell.vue";
import SpinnerCellComponent from "./components/SpinnerCell.vue";
import DatePickerCellComponent from "./components/DatePickerCell.vue";
import LinksCellComponent from "./components/LinksCell.vue";
import ButtonCellComponent from "./components/ButtonCell.vue";
import TreeViewCellComponent from "./components/TreeViewCell.vue";
import MultiSelectCellComponent from "./components/MultiSelectCell.vue";

// Export renderers
import { StarCellRenderer } from "./renderers/star-renderer";
import { SparklineCellRenderer } from "./renderers/sparkline-renderer";
import { TagsCellRenderer } from "./renderers/tags-renderer";
import { UserProfileCellRenderer } from "./renderers/user-profile-renderer";
import { DropdownCellRenderer } from "./renderers/dropdown-renderer";
import { RangeCellRenderer } from "./renderers/range-renderer";
import { SpinnerCellRenderer } from "./renderers/spinner-renderer";
import { DatePickerCellRenderer } from "./renderers/date-picker-renderer";
import { LinksCellRenderer } from "./renderers/links-renderer";
import { ButtonCellRenderer } from "./renderers/button-renderer";
import { TreeViewCellRenderer } from "./renderers/tree-view-renderer";
import { MultiSelectCellRenderer } from "./renderers/multi-select-renderer";

// Export types
export type {
    StarCell,
    SparklineCell,
    TagsCell,
    UserProfileCell,
    DropdownCell,
    RangeCell,
    SpinnerCell,
    DatePickerCell,
    LinksCell,
    ButtonCell,
    TreeViewCell,
    MultiSelectCell,
    SelectOption,
    VueCellRenderer
} from "./types";

// Export components
export {
    BooleanCell,
    StarCellComponent,
    SparklineCellComponent,
    TagsCellComponent,
    UserProfileCellComponent,
    DropdownCellComponent,
    RangeCellComponent,
    SpinnerCellComponent,
    DatePickerCellComponent,
    LinksCellComponent,
    ButtonCellComponent,
    TreeViewCellComponent,
    MultiSelectCellComponent
};

// Export renderers
export { StarCellRenderer, SparklineCellRenderer, TagsCellRenderer, UserProfileCellRenderer, DropdownCellRenderer, RangeCellRenderer, SpinnerCellRenderer, DatePickerCellRenderer, LinksCellRenderer, ButtonCellRenderer, TreeViewCellRenderer, MultiSelectCellRenderer };

// All renderers collection
export const allRenderers = [
    StarCellRenderer,
    SparklineCellRenderer,
    TagsCellRenderer,
    UserProfileCellRenderer,
    DropdownCellRenderer,
    RangeCellRenderer,
    SpinnerCellRenderer,
    DatePickerCellRenderer,
    LinksCellRenderer,
    ButtonCellRenderer,
    TreeViewCellRenderer,
    MultiSelectCellRenderer,
];

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
            app.component(prefix + "StarCell", StarCellComponent);
            app.component(prefix + "SparklineCell", SparklineCellComponent);
            app.component(prefix + "TagsCell", TagsCellComponent);
            app.component(prefix + "UserProfileCell", UserProfileCellComponent);
            app.component(prefix + "DropdownCell", DropdownCellComponent);
            app.component(prefix + "RangeCell", RangeCellComponent);
            app.component(prefix + "SpinnerCell", SpinnerCellComponent);
            app.component(prefix + "DatePickerCell", DatePickerCellComponent);
            app.component(prefix + "LinksCell", LinksCellComponent);
            app.component(prefix + "ButtonCell", ButtonCellComponent);
            app.component(prefix + "TreeViewCell", TreeViewCellComponent);
            app.component(prefix + "MultiSelectCell", MultiSelectCellComponent);
        }
    };
};
