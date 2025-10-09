import { type InnerGridCell } from "../internal/data-grid/data-grid-types.js";
import { booleanCellRenderer } from "./boolean-cell.vue";
import { bubbleCellRenderer } from "./bubble-cell.js";
import type { InternalCellRenderer } from "./cell-types.js";
import { drilldownCellRenderer } from "./drilldown-cell.js";
import { imageCellRenderer } from "./image-cell.js";
import { loadingCellRenderer } from "./loading-cell.js";
import { markdownCellRenderer } from "./markdown-cell.js";
import { markerCellRenderer } from "./marker-cell.js";
import { newRowCellRenderer } from "./new-row-cell.js";
import { numberCellRenderer } from "./number-cell.vue";
import { protectedCellRenderer } from "./protected-cell.js";
import { rowIDCellRenderer } from "./row-id-cell.js";
import { textCellRenderer } from "./text-cell.vue";
import { uriCellRenderer } from "./uri-cell.vue";

export const AllCellRenderers = [
    markerCellRenderer,
    newRowCellRenderer,
    booleanCellRenderer,
    bubbleCellRenderer,
    drilldownCellRenderer,
    imageCellRenderer,
    loadingCellRenderer,
    markdownCellRenderer,
    numberCellRenderer,
    protectedCellRenderer,
    rowIDCellRenderer,
    textCellRenderer,
    uriCellRenderer,
] as InternalCellRenderer<InnerGridCell>[];