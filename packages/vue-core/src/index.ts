import "./styles/index.css";

// Export components
export { default as DataEditor } from "./internal/data-grid/data-grid.vue";

// Export types
export type { 
    GridColumn,
    GridCell,
    InnerGridCell,
    Rectangle,
    Item,
    GridColumnIcon,
    GridCellKind,
    InnerGridCellKind,
    GridSelection,
    CompactSelection,
    BaseGridCell,
    TextCell,
    NumberCell,
    ImageCell,
    BubbleCell,
    BooleanCell,
    RowIDCell,
    MarkdownCell,
    UriCell,
    DrilldownCell,
    LoadingCell,
    ProtectedCell,
    CustomCell,
    NewRowCell,
    MarkerCell,
    EditableGridCell,
    ReadWriteGridCell,
    ValidatedGridCell,
    DrawCellCallback,
    DrawHeaderCallback,
    HoverEffectTheme,
} from "./internal/data-grid/data-grid-types.js";

// Export types from common styles
export type { 
    Theme,
    FullTheme,
} from "./common/styles.js";

// Export types from render
export type { 
    DrawCellsArg,
    DrawHeaderArg,
    DrawGridArg,
} from "./internal/data-grid/render/index.js";

// Export types from data-grid-lib
export type { 
    MappedGridColumn,
} from "./internal/data-grid/render/data-grid-lib.js";

// Export types from cell-set
export type { 
    CellSet,
} from "./internal/data-grid/cell-set.js";

// Export types from cells
export type { 
    BaseDrawArgs,
} from "./cells/cell-types.js";

// Export types from data-grid-sprites
export type { 
    SpriteManager,
} from "./internal/data-grid/data-grid-sprites.js";

// Export types from image-window-loader-interface
export type { 
    ImageWindowLoader,
} from "./internal/data-grid/image-window-loader-interface.js";

// Export utilities
export { 
    getDataEditorTheme,
    makeCSSStyle,
    mergeAndRealizeTheme,
} from "./common/styles.js";

// Export render functions
export { 
    drawGrid,
    drawCells,
    drawHeader,
    drawCheckbox,
    drawEditHoverIndicator,
} from "./internal/data-grid/render/index.js";