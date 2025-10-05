<template>
    <div
        ref="containerRef"
        class="glide-data-grid-vue"
        :style="containerStyle"
    >
        <canvas
            ref="canvasRef"
            :width="width"
            :height="height"
            :style="canvasStyle"
            tabindex="0"
            @keydown="handleKeyDown"
            @keyup="handleKeyUp"
            @focus="handleFocus"
            @blur="handleBlur"
        />
        <canvas
            ref="overlayRef"
            :width="width"
            :height="height"
            :style="overlayStyle"
        />
        <div v-if="showShadows" class="grid-shadows">
            <div
                v-if="shadowXOpacity > 0"
                class="shadow-x"
                :style="shadowXStyle"
            />
            <div
                v-if="shadowYOpacity > 0"
                class="shadow-y"
                :style="shadowYStyle"
            />
        </div>
        <div v-if="accessibilityTree" class="accessibility-tree" :aria-hidden="true">
            <!-- Accessibility tree for screen readers -->
            <div
                v-for="(row, rowIndex) in accessibilityTree.children"
                :key="rowIndex"
                :role="row.role"
                :aria-rowindex="row['aria-rowindex']"
            >
                <div
                    v-for="(cell, cellIndex) in row.children"
                    :key="cellIndex"
                    :role="cell.role"
                    :aria-colindex="cell['aria-colindex']"
                    :aria-label="cell['aria-label']"
                >
                    <span v-for="(child, childIndex) in cell.children" :key="childIndex">
                        {{ child.text }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    ref,
    computed,
    onMounted,
    onUpdated,
    onBeforeUnmount,
    nextTick,
    type CSSProperties
} from "vue";
import type {
    GridSelection,
    InnerGridCell,
    InnerGridColumn,
    GridMouseEventArgs,
    GridKeyEventArgs,
    GridDragEventArgs,
    DrawHeaderCallback,
    DrawCellCallback,
    GroupDetailsCallback,
    GetRowThemeCallback,
    Highlight,
    FillHandle,
    FullTheme,
    ImageWindowLoader,
    CellRenderer,
    GridItem,
    Rectangle
} from "../types";

// Props interface
interface Props {
    // Dimensions
    width: number;
    height: number;

    // Scroll position
    cellXOffset: number;
    cellYOffset: number;
    translateX?: number;
    translateY?: number;

    // Accessibility
    accessibilityHeight: number;

    // Freezing
    freezeColumns: number;
    freezeTrailingRows: number;
    hasAppendRow: boolean;
    firstColAccessible: boolean;

    // Shadows
    fixedShadowX?: boolean;
    fixedShadowY?: boolean;

    // Interaction states
    allowResize?: boolean;
    isResizing: boolean;
    resizeColumn?: number;
    isDragging: boolean;
    isFilling: boolean;

    // Grid appearance
    horizontalBorder?: boolean;
    rowMarkers?: boolean;

    // Selection
    gridSelection?: GridSelection;
    isFocused: boolean;
    onGridSelectionChange?: (selection: GridSelection) => void;
    onCellActivated?: (event: { location: [number, number] }) => void;

    // Event handlers
    onMouseUp?: (args: GridMouseEventArgs) => void;
    onMouseLeave?: (args: GridMouseEventArgs) => void;
    onClick?: (args: GridMouseEventArgs) => void;
    onDoubleClick?: (args: GridMouseEventArgs) => void;
    onContextMenu?: (args: GridMouseEventArgs) => void;
    onPointerDown?: (args: GridMouseEventArgs) => void;
    onPointerMove?: (args: GridMouseEventArgs) => void;
    onPointerUp?: (args: GridMouseEventArgs) => void;
    onPointerLeave?: (args: GridMouseEventArgs) => void;
    onDragOver?: (args: GridDragEventArgs) => void;
    onDrop?: (args: GridDragEventArgs) => void;

    // Data
    columns: readonly InnerGridColumn[];
    rows: number;

    // Dimensions
    headerHeight: number;
    groupHeaderHeight: number;
    enableGroups: boolean;
    rowHeight: number | ((index: number) => number);

    // Refs
    canvasRef?: any; // Will be handled via template ref
    eventTargetRef?: any; // Will be handled via template ref

    // Data callbacks
    getCellContent: (cell: [number, number], forceStrict?: boolean) => InnerGridCell;
    getGroupDetails?: GroupDetailsCallback;
    getRowThemeOverride?: GetRowThemeCallback;

    // Header events
    onHeaderMenuClick?: (col: number, screenPosition: any) => void;
    onHeaderIndicatorClick?: (col: number, screenPosition: any) => void;

    // Selection
    selection: GridSelection;
    prelightCells?: readonly [number, number][];
    highlightRegions?: readonly Highlight[];

    // Fill handle
    fillHandle?: FillHandle;

    // Disabled rows
    disabledRows?: any; // CompactSelection type

    // Image loading
    imageWindowLoader: ImageWindowLoader;

    // Mouse events
    onItemHovered?: (args: GridMouseEventArgs) => void;
    onMouseMove?: (args: GridMouseEventArgs) => void;
    onMouseDown?: (args: GridMouseEventArgs) => void;

    // Focus events
    onCanvasFocused?: () => void;
    onCanvasBlur?: () => void;
    onCellFocused?: (args: [number, number]) => void;

    // Raw mouse events
    onMouseMoveRaw?: (event: MouseEvent) => void;

    // Keyboard events
    onKeyDown?: (event: GridKeyEventArgs) => void;
    onKeyUp?: (event: GridKeyEventArgs) => void;

    // Borders
    verticalBorder: (col: number) => boolean;

    // Drag and drop
    isDraggable?: boolean | "cell" | "header";
    onDragStart?: (args: GridDragEventArgs) => void;
    onDragEnd?: () => void;
    onDragOverCell?: (cell: [number, number], dataTransfer: DataTransfer | null) => void;
    onDragLeave?: () => void;

    // Drawing callbacks
    drawHeader?: DrawHeaderCallback;
    drawCell?: DrawCellCallback;

    // Focus ring
    drawFocusRing: boolean;

    // Drag and drop state
    dragAndDropState?: {
        src: number;
        dest: number;
    };

    // Experimental features
    experimental?: {
        disableAccessibilityTree?: boolean;
        disableMinimumCellWidth?: boolean;
        paddingRight?: number;
        paddingBottom?: number;
        enableFirefoxRescaling?: boolean;
        enableSafariRescaling?: boolean;
        kineticScrollPerfHack?: boolean;
        isSubGrid?: boolean;
        strict?: boolean;
        scrollbarWidthOverride?: number;
        hyperWrapping?: boolean;
        renderStrategy?: "single-buffer" | "double-buffer" | "direct";
        eventTarget?: HTMLElement | Window | Document;
    };

    // Header icons
    headerIcons?: any; // SpriteMap type

    // Smooth scrolling
    smoothScrollX?: boolean;
    smoothScrollY?: boolean;

    // Theme
    theme: FullTheme;

    // Cell renderer
    getCellRenderer: (cell: InnerGridCell) => CellRenderer | undefined;

    // Resize indicator
    resizeIndicator?: "full" | "header" | "none";
}

// Emits interface
interface Emits {
    (e: 'itemHovered', args: GridMouseEventArgs): void;
    (e: 'mouseMove', args: GridMouseEventArgs): void;
    (e: 'mouseDown', args: GridMouseEventArgs): void;
    (e: 'mouseUp', args: GridMouseEventArgs, isOutside: boolean): void;
    (e: 'mouseLeave', args: GridMouseEventArgs): void;
    (e: 'click', args: GridMouseEventArgs): void;
    (e: 'doubleClick', args: GridMouseEventArgs): void;
    (e: 'contextMenu', args: GridMouseEventArgs, preventDefault: () => void): void;
    (e: 'pointerDown', args: GridMouseEventArgs): void;
    (e: 'pointerMove', args: GridMouseEventArgs): void;
    (e: 'pointerUp', args: GridMouseEventArgs): void;
    (e: 'pointerLeave', args: GridMouseEventArgs): void;
    (e: 'canvasFocused'): void;
    (e: 'canvasBlur'): void;
    (e: 'cellFocused', args: [number, number]): void;
    (e: 'mouseMoveRaw', event: MouseEvent): void;
    (e: 'keyDown', event: GridKeyEventArgs): void;
    (e: 'keyUp', event: GridKeyEventArgs): void;
    (e: 'headerMenuClick', col: number, screenPosition: any): void;
    (e: 'headerIndicatorClick', col: number, screenPosition: any): void;
    (e: 'onCellActivated', event: { location: [number, number] }): void;
    (e: 'update:gridSelection', selection: GridSelection): void;
    (e: 'update:selection', selection: GridSelection): void;
    (e: 'update:cellXOffset', offset: number): void;
    (e: 'update:cellYOffset', offset: number): void;
    (e: 'dragStart', args: GridDragEventArgs): void;
    (e: 'dragOver', args: GridDragEventArgs): void;
    (e: 'drop', args: GridDragEventArgs): void;
    (e: 'dragEnd'): void;
    (e: 'dragOverCell', cell: [number, number], dataTransfer: DataTransfer | null): void;
    (e: 'dragLeave'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Template refs
const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
const overlayRef = ref<HTMLCanvasElement>();

// Reactive state
const drawCursorOverride = ref<string | undefined>();
const overFill = ref(false);
const hoveredOnEdge = ref(false);

// Computed styles
const containerStyle = computed<CSSProperties>(() => ({
    position: 'relative',
    width: `${props.width}px`,
    height: `${props.height}px`,
    overflow: 'hidden',
    contain: 'strict'
}));

const canvasStyle = computed<CSSProperties>(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'block',
    cursor: computedCursor.value
}));

const overlayStyle = computed<CSSProperties>(() => ({
    position: 'absolute',
    top: 0,
    left: 0
}));

// Computed cursor
const computedCursor = computed(() => {
    if (props.isDragging) return 'grabbing';
    if (hoveredOnEdge.value || props.isResizing) return 'col-resize';
    if (overFill.value || props.isFilling) return 'crosshair';
    if (drawCursorOverride.value) return drawCursorOverride.value;

    // TODO: Add logic for pointer cursor on headers, clickable cells, etc.
    return 'default';
});

// Computed shadows
const shadowXOpacity = computed(() => {
    if (!props.fixedShadowX) return 0;
    // TODO: Implement shadow opacity calculation
    return 0;
});

const shadowYOpacity = computed(() => {
    if (!props.fixedShadowY) return 0;
    // TODO: Implement shadow opacity calculation
    return 0;
});

const showShadows = computed(() => shadowXOpacity.value > 0 || shadowYOpacity.value > 0);

const shadowXStyle = computed<CSSProperties>(() => ({
    position: 'absolute',
    top: 0,
    left: '0', // TODO: Calculate stickyX
    width: `${props.width}px`, // TODO: Adjust for stickyX
    height: `${props.height}px`,
    opacity: shadowXOpacity.value,
    pointerEvents: 'none',
    transition: !props.smoothScrollX ? 'opacity 0.2s' : undefined,
    boxShadow: 'inset 13px 0 10px -13px rgba(0, 0, 0, 0.2)'
}));

const shadowYStyle = computed<CSSProperties>(() => {
    const totalHeaderHeight = props.enableGroups ?
        props.groupHeaderHeight + props.headerHeight :
        props.headerHeight;

    return {
        position: 'absolute',
        top: totalHeaderHeight,
        left: 0,
        width: `${props.width}px`,
        height: `${props.height}px`,
        opacity: shadowYOpacity.value,
        pointerEvents: 'none',
        transition: !props.smoothScrollY ? 'opacity 0.2s' : undefined,
        boxShadow: 'inset 0 13px 10px -13px rgba(0, 0, 0, 0.2)'
    };
});

// Accessibility tree
const accessibilityTree = computed(() => {
    if (props.width < 50 || props.experimental?.disableAccessibilityTree) {
        return null;
    }

    return {
        // Generate accessibility tree structure
        role: 'grid',
        'aria-label': 'Data Grid',
        'aria-rowcount': props.rows ?? 0,
        'aria-colcount': props.columns?.length ?? 0,
        children: generateAccessibilityTreeChildren()
    };
});

const generateAccessibilityTreeChildren = () => {
    const children = [];

    // Add headers to accessibility tree
    if (props.columns && props.columns.length > 0) {
        const headerRow = {
            role: 'row',
            'aria-rowindex': 1,
            children: props.columns.map((column, index) => ({
                role: 'columnheader',
                'aria-colindex': index + 1,
                'aria-label': column.title,
                children: [{ text: column.title }]
            }))
        };
        children.push(headerRow);
    }

    // Add data rows to accessibility tree
    const cellXOffset = props.cellXOffset;
    const cellYOffset = props.cellYOffset;
    const visibleRows = Math.min(10, (props.rows ?? 0) - cellYOffset);

    for (let row = 0; row < visibleRows; row++) {
        const rowIndex = row + cellYOffset + 1;
        const rowChildren = [];

        // Add row header if available
        if (props.rowMarkers) {
            rowChildren.push({
                role: 'rowheader',
                'aria-colindex': 1,
                'aria-label': `Row ${rowIndex}`,
                children: [{ text: `Row ${rowIndex}` }]
            });
        }

        // Add cells
        const visibleCols = Math.min(10, (props.columns?.length ?? 0) - cellXOffset);
        for (let col = 0; col < visibleCols; col++) {
            const colIndex = col + cellXOffset + 1;
            const cell = props.getCellContent?.([col + cellXOffset, row + cellYOffset]);

            if (cell) {
                const cellText = cell.displayData || cell.data?.toString() || '';
                rowChildren.push({
                    role: 'gridcell',
                    'aria-colindex': colIndex + (props.rowMarkers ? 1 : 0),
                    'aria-label': cellText,
                    children: [{ text: cellText }]
                });
            }
        }

        children.push({
            role: 'row',
            'aria-rowindex': rowIndex + 1, // +1 for header row
            children: rowChildren
        });
    }

    return children;
};

// Event handlers
const handleKeyDown = (event: KeyboardEvent) => {
    const keyEventArgs: GridKeyEventArgs = {
        bounds: undefined,
        stopPropagation: () => event.stopPropagation(),
        preventDefault: () => event.preventDefault(),
        cancel: () => {},
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        key: event.key,
        keyCode: event.keyCode,
        rawEvent: event,
        location: undefined
    };

    // Handle keyboard navigation
    if (props.isFocused) {
        handleKeyboardNavigation(event);
    }

    emit('keyDown', keyEventArgs);
    props.onKeyDown?.(keyEventArgs);
};

// Keyboard navigation
const handleKeyboardNavigation = (event: KeyboardEvent) => {
    const selection = props.gridSelection || props.selection;
    if (!selection || !selection.current) return;

    let newCell = [...(selection.current.cell || [0, 0])] as [number, number];
    let hasChanged = false;

    switch (event.key) {
        case 'ArrowUp':
            if (newCell[1] > 0) {
                newCell[1]--;
                hasChanged = true;
            }
            break;
        case 'ArrowDown':
            if (newCell[1] < props.rows - 1) {
                newCell[1]++;
                hasChanged = true;
            }
            break;
        case 'ArrowLeft':
            if (newCell[0] > 0) {
                newCell[0]--;
                hasChanged = true;
            }
            break;
        case 'ArrowRight':
            if (newCell[0] < props.columns.length - 1) {
                newCell[0]++;
                hasChanged = true;
            }
            break;
        case 'Home':
            if (event.ctrlKey) {
                newCell = [0, 0];
            } else {
                newCell[0] = 0;
            }
            hasChanged = true;
            break;
        case 'End':
            if (event.ctrlKey) {
                newCell = [props.columns.length - 1, props.rows - 1];
            } else {
                newCell[0] = props.columns.length - 1;
            }
            hasChanged = true;
            break;
        case 'PageUp':
            newCell[1] = Math.max(0, newCell[1] - Math.floor((props.height - props.headerHeight) / 30));
            hasChanged = true;
            break;
        case 'PageDown':
            newCell[1] = Math.min(props.rows - 1, newCell[1] + Math.floor((props.height - props.headerHeight) / 30));
            hasChanged = true;
            break;
        case 'Enter':
            // Enter key for cell activation
            emit('onCellActivated', { location: newCell });
            props.onCellActivated?.({ location: newCell });
            break;
        case 'Tab':
            if (event.shiftKey) {
                // Shift+Tab - move left
                if (newCell[0] > 0) {
                    newCell[0]--;
                } else if (newCell[1] > 0) {
                    newCell[0] = props.columns.length - 1;
                    newCell[1]--;
                }
            } else {
                // Tab - move right
                if (newCell[0] < props.columns.length - 1) {
                    newCell[0]++;
                } else if (newCell[1] < props.rows - 1) {
                    newCell[0] = 0;
                    newCell[1]++;
                }
            }
            hasChanged = true;
            event.preventDefault(); // Prevent default tab behavior
            break;
    }

    if (hasChanged) {
        // Update selection
        const newSelection: GridSelection = {
            ...selection,
            current: {
                ...selection.current,
                cell: newCell
            }
        };

        emit('update:gridSelection', newSelection);
        emit('update:selection', newSelection);
        props.onGridSelectionChange?.(newSelection);

        // Ensure cell is visible
        ensureCellVisible(newCell[0], newCell[1]);
    }
};

// Ensure cell is visible in viewport
const ensureCellVisible = (col: number, row: number) => {
    const visibleCols = Math.ceil(props.width / 100);
    const visibleRows = Math.ceil((props.height - props.headerHeight) / 30);

    let newCellXOffset = props.cellXOffset;
    let newCellYOffset = props.cellYOffset;

    // Horizontal scrolling
    if (col < props.cellXOffset) {
        newCellXOffset = col;
    } else if (col >= props.cellXOffset + visibleCols) {
        newCellXOffset = col - visibleCols + 1;
    }

    // Vertical scrolling
    if (row < props.cellYOffset) {
        newCellYOffset = row;
    } else if (row >= props.cellYOffset + visibleRows) {
        newCellYOffset = row - visibleRows + 1;
    }

    // Update offsets if changed
    if (newCellXOffset !== props.cellXOffset || newCellYOffset !== props.cellYOffset) {
        emit('update:cellXOffset', newCellXOffset);
        emit('update:cellYOffset', newCellYOffset);
    }
};

const handleKeyUp = (event: KeyboardEvent) => {
    // TODO: Implement key up handler
    const keyEventArgs: GridKeyEventArgs = {
        bounds: undefined,
        stopPropagation: () => event.stopPropagation(),
        preventDefault: () => event.preventDefault(),
        cancel: () => {},
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        key: event.key,
        keyCode: event.keyCode,
        rawEvent: event,
        location: undefined
    };

    emit('keyUp', keyEventArgs);
    props.onKeyUp?.(keyEventArgs);
};

const handleFocus = () => {
    emit('canvasFocused');
    props.onCanvasFocused?.();
};

const handleBlur = () => {
    emit('canvasBlur');
    props.onCanvasBlur?.();
};

// Lifecycle
onMounted(() => {
    initializeCanvasRendering();
    setupEventListeners();
});

onUpdated(() => {
    // Update canvas rendering when props change
    nextTick(() => {
        requestAnimationFrame(renderCanvas);
    });
});

onBeforeUnmount(() => {
    cleanupEventListeners();
});

// Canvas rendering
const initializeCanvasRendering = () => {
    requestAnimationFrame(renderCanvas);
};

const renderCanvas = () => {
    const canvas = canvasRef.value;
    const overlay = overlayRef.value;

    if (!canvas || !overlay) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlay.getContext('2d');

    if (!ctx || !overlayCtx) return;

    // Clear canvases
    ctx.clearRect(0, 0, props.width, props.height);
    overlayCtx.clearRect(0, 0, props.width, props.height);

    // Draw background
    drawBackground(ctx);

    // Draw grid lines
    drawGridLines(ctx);

    // Draw headers
    drawHeaders(ctx);

    // Draw cells
    drawCells(ctx);

    // Draw selection
    drawSelection(ctx);

    // Draw overlay content (fill handles, resize indicators, etc.)
    drawOverlay(overlayCtx);
};

const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = props.theme?.bgCell ?? '#ffffff';
    ctx.fillRect(0, 0, props.width, props.height);
};

const drawGridLines = (ctx: CanvasRenderingContext2D) => {
    if (!props.horizontalBorder) return;

    ctx.strokeStyle = props.theme?.borderColor ?? '#e0e0e0';
    ctx.lineWidth = 1;

    // Draw vertical lines
    // TODO: Calculate column positions using props.verticalBorder function
    ctx.beginPath();
    // Placeholder - draw some vertical lines
    for (let i = 0; i < 10; i++) {
        const x = i * 100;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, props.height);
    }
    ctx.stroke();

    // Draw horizontal lines
    if (props.horizontalBorder) {
        // TODO: Calculate row positions
        ctx.beginPath();
        // Placeholder - draw some horizontal lines
        for (let i = 0; i < 10; i++) {
            const y = i * 30;
            ctx.moveTo(0, y);
            ctx.lineTo(props.width, y);
        }
        ctx.stroke();
    }
};

const drawHeaders = (ctx: CanvasRenderingContext2D) => {
    if (!props.columns || props.columns.length === 0) return;

    const headerHeight = props.headerHeight;
    const groupHeaderHeight = props.enableGroups ? props.groupHeaderHeight : 0;

    // Draw group headers
    if (props.enableGroups && groupHeaderHeight > 0) {
        // TODO: Implement group header drawing
    }

    // Draw column headers
    ctx.fillStyle = props.theme?.bgHeader ?? '#f8f9fa';
    ctx.fillRect(0, groupHeaderHeight, props.width, headerHeight);

    // Draw header text
    ctx.fillStyle = props.theme?.textHeader ?? '#333333';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Placeholder - draw some header text
    props.columns.forEach((column, index) => {
        const x = index * 100 + 5;
        const y = groupHeaderHeight + headerHeight / 2;
        ctx.fillText(column.title, x, y);
    });
};

const drawCells = (ctx: CanvasRenderingContext2D) => {
    if (!props.columns || props.columns.length === 0 || !props.getCellContent) return;

    const cellXOffset = props.cellXOffset;
    const cellYOffset = props.cellYOffset;
    const headerHeight = props.headerHeight;
    const groupHeaderHeight = props.enableGroups ? props.groupHeaderHeight : 0;
    const startY = groupHeaderHeight + headerHeight;

    // Calculate visible cells based on scroll position and viewport
    const visibleCols = Math.min(props.columns.length - cellXOffset, Math.ceil(props.width / 100));
    const visibleRows = Math.min(props.rows - cellYOffset, Math.ceil((props.height - startY) / 30));

    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Render visible cells
    for (let col = 0; col < visibleCols; col++) {
        for (let row = 0; row < visibleRows; row++) {
            const cellX = col * 100;
            const cellY = startY + row * 30;

            // Get cell content
            const cell = props.getCellContent([col + cellXOffset, row + cellYOffset]);

            if (cell) {
                // Draw cell background
                ctx.fillStyle = props.theme?.bgCell ?? '#ffffff';
                ctx.fillRect(cellX, cellY, 100, 30);

                // Draw cell border
                ctx.strokeStyle = props.theme?.borderColor ?? '#e0e0e0';
                ctx.strokeRect(cellX, cellY, 100, 30);

                // Draw cell content based on cell kind
                ctx.fillStyle = props.theme?.textDark ?? '#000000';

                switch (cell.kind) {
                    case 'text':
                        ctx.fillText(cell.displayData || cell.data || '', cellX + 5, cellY + 15);
                        break;
                    case 'number':
                        ctx.fillText(String(cell.data || ''), cellX + 5, cellY + 15);
                        break;
                    case 'boolean':
                        ctx.fillText(cell.data ? '✓' : '✗', cellX + 45, cellY + 15);
                        break;
                    case 'loading':
                        ctx.fillText('...', cellX + 45, cellY + 15);
                        break;
                    case 'bubble':
                        ctx.fillText(cell.data || '', cellX + 5, cellY + 15);
                        break;
                    case 'markdown':
                        ctx.fillText(cell.data || '', cellX + 5, cellY + 15);
                        break;
                    case 'uri':
                        ctx.fillStyle = props.theme?.accentColor ?? '#007acc';
                        ctx.fillText(cell.data || '', cellX + 5, cellY + 15);
                        break;
                    case 'image':
                        ctx.fillText('🖼️', cellX + 45, cellY + 15);
                        break;
                    case 'row-id':
                        ctx.fillText(`Row ${row + cellYOffset}`, cellX + 5, cellY + 15);
                        break;
                    case 'protected':
                        ctx.fillStyle = props.theme?.textLight ?? '#666666';
                        ctx.fillText('***', cellX + 45, cellY + 15);
                        break;
                    case 'drilldown':
                        ctx.fillText('▶', cellX + 45, cellY + 15);
                        break;
                    default:
                        ctx.fillText('?', cellX + 45, cellY + 15);
                }
            }
        }
    }
};

const drawSelection = (ctx: CanvasRenderingContext2D) => {
    const selection = props.gridSelection || props.selection;
    if (!selection) return;

    const headerHeight = props.headerHeight;
    const groupHeaderHeight = props.enableGroups ? props.groupHeaderHeight : 0;
    const startY = groupHeaderHeight + headerHeight;

    ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;

    // Draw current cell selection
    if (selection.current && selection.current.cell) {
        const [col, row] = selection.current.cell;
        const cellX = (col - props.cellXOffset) * 100;
        const cellY = startY + (row - props.cellYOffset) * 30;

        // Only draw if cell is visible
        if (cellX >= 0 && cellX < props.width && cellY >= startY && cellY < props.height) {
            ctx.strokeRect(cellX, cellY, 100, 30);
            ctx.fillRect(cellX, cellY, 100, 30);
        }
    }

    // Draw range selection
    if (selection.current && selection.current.range) {
        const { x: startX, y: startRow, width: rangeWidth, height: rangeHeight } = selection.current.range;

        for (let col = startX; col < startX + rangeWidth; col++) {
            for (let row = startRow; row < startRow + rangeHeight; row++) {
                const cellX = (col - props.cellXOffset) * 100;
                const cellY = startY + (row - props.cellYOffset) * 30;

                // Only draw if cell is visible
                if (cellX >= 0 && cellX < props.width && cellY >= startY && cellY < props.height) {
                    ctx.fillRect(cellX, cellY, 100, 30);
                }
            }
        }
    }
};

const drawOverlay = (_ctx: CanvasRenderingContext2D) => {
    const selection = props.gridSelection || props.selection;

    // Draw fill handles
    if (props.fillHandle && selection) {
        // TODO: Implement fill handle drawing
    }

    // Draw resize indicators
    if (props.isResizing && props.resizeColumn !== undefined) {
        // TODO: Implement resize indicator drawing
    }
};

// Cleanup event listeners
const cleanupEventListeners = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    canvas.removeEventListener('click', handleClick);
    canvas.removeEventListener('dblclick', handleDoubleClick);
    canvas.removeEventListener('contextmenu', handleContextMenu);

    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerup', handlePointerUp);
    canvas.removeEventListener('pointerleave', handlePointerLeave);

    canvas.removeEventListener('dragstart', handleDragStart);
    canvas.removeEventListener('dragover', handleDragOver);
    canvas.removeEventListener('drop', handleDrop);
};

// Setup event listeners
const setupEventListeners = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // Pointer events for touch support
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    // Drag and drop
    canvas.addEventListener('dragstart', handleDragStart);
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
};

// Mouse event handlers
const handleMouseDown = (event: MouseEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('mouseDown', mouseArgs);
    props.onMouseDown?.(mouseArgs);
};

const handleMouseMove = (event: MouseEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('mouseMove', mouseArgs);
    props.onMouseMove?.(mouseArgs);
};

const handleMouseUp = (event: MouseEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('mouseUp', mouseArgs, false);
    props.onMouseUp?.(mouseArgs);
};

const handleMouseLeave = (event: MouseEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('mouseLeave', mouseArgs);
    props.onMouseLeave?.(mouseArgs);
};

const handleClick = (event: MouseEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('click', mouseArgs);
    props.onClick?.(mouseArgs);
};

const handleDoubleClick = (event: MouseEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('doubleClick', mouseArgs);
    props.onDoubleClick?.(mouseArgs);
};

const handleContextMenu = (event: MouseEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('contextMenu', mouseArgs, () => event.preventDefault());
    props.onContextMenu?.(mouseArgs);
};

// Pointer event handlers (for touch support)
const handlePointerDown = (event: PointerEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('pointerDown', mouseArgs);
    props.onPointerDown?.(mouseArgs);
};

const handlePointerMove = (event: PointerEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('pointerMove', mouseArgs);
    props.onPointerMove?.(mouseArgs);
};

const handlePointerUp = (event: PointerEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('pointerUp', mouseArgs);
    props.onPointerUp?.(mouseArgs);
};

const handlePointerLeave = (event: PointerEvent) => {
    const mouseArgs = createMouseEventArgs(event);
    emit('pointerLeave', mouseArgs);
    props.onPointerLeave?.(mouseArgs);
};

// Drag and drop handlers
const handleDragStart = (event: DragEvent) => {
    const dragArgs = createDragEventArgs(event);
    emit('dragStart', dragArgs);
    props.onDragStart?.(dragArgs);
};

const handleDragOver = (event: DragEvent) => {
    const dragArgs = createDragEventArgs(event);
    emit('dragOver', dragArgs);
    props.onDragOver?.(dragArgs);
};

const handleDrop = (event: DragEvent) => {
    const dragArgs = createDragEventArgs(event);
    emit('drop', dragArgs);
    props.onDrop?.(dragArgs);
};

// Helper functions to create event args
const createMouseEventArgs = (event: MouseEvent | PointerEvent): GridMouseEventArgs => {
    const canvas = canvasRef.value;
    if (!canvas) {
        return {
            location: [0, 0],
            bounds: { x: 0, y: 0, width: 0, height: 0 },
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            altKey: event.altKey,
            isTouch: event instanceof PointerEvent && event.pointerType === 'touch',
            isEdge: false,
            isFillHandle: false,
            button: event.button,
            buttons: event.buttons
        };
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate cell coordinates
    const headerHeight = props.headerHeight;
    const groupHeaderHeight = props.enableGroups ? props.groupHeaderHeight : 0;
    const startY = groupHeaderHeight + headerHeight;

    let col = Math.floor(x / 100) + props.cellXOffset;
    let row = Math.floor((y - startY) / 30) + props.cellYOffset;

    // Clamp to valid ranges
    col = Math.max(0, Math.min(col, props.columns.length - 1));
    row = Math.max(0, Math.min(row, props.rows - 1));

    const location: GridItem = [col, row];
    const bounds: Rectangle = {
        x: (col - props.cellXOffset) * 100,
        y: startY + (row - props.cellYOffset) * 30,
        width: 100,
        height: 30
    };

    // Check if mouse is on edge (for column resizing)
    const isEdge = Math.abs(x - bounds.x - bounds.width) < 5;

    return {
        location,
        bounds,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        isTouch: event instanceof PointerEvent && event.pointerType === 'touch',
        isEdge,
        isFillHandle: false, // TODO: Calculate fill handle position
        button: event.button,
        buttons: event.buttons
    };
};

const createDragEventArgs = (event: DragEvent): GridDragEventArgs => {
    const canvas = canvasRef.value;
    if (!canvas) {
        return {
            location: [0, 0],
            bounds: { x: 0, y: 0, width: 0, height: 0 },
            dataTransfer: event.dataTransfer
        };
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate cell coordinates
    const headerHeight = props.headerHeight;
    const groupHeaderHeight = props.enableGroups ? props.groupHeaderHeight : 0;
    const startY = groupHeaderHeight + headerHeight;

    let col = Math.floor(x / 100) + props.cellXOffset;
    let row = Math.floor((y - startY) / 30) + props.cellYOffset;

    // Clamp to valid ranges
    col = Math.max(0, Math.min(col, props.columns.length - 1));
    row = Math.max(0, Math.min(row, props.rows - 1));

    const location: GridItem = [col, row];
    const bounds: Rectangle = {
        x: (col - props.cellXOffset) * 100,
        y: startY + (row - props.cellYOffset) * 30,
        width: 100,
        height: 30
    };

    return {
        location,
        bounds,
        dataTransfer: event.dataTransfer
    };
};

// Expose methods for imperative API
defineExpose({
    focus: () => {
        canvasRef.value?.focus({ preventScroll: true });
    },
    getBounds: () => {
        // TODO: Implement bounds calculation
        return undefined;
    },
    damage: () => {
        // TODO: Implement damage region
    },
    getMouseArgsForPosition: () => {
        // TODO: Implement mouse args calculation
        return undefined;
    }
});
</script>

<style scoped>
.glide-data-grid-vue {
    font-family: var(--gdg-font-family, system-ui, sans-serif);
}

.grid-shadows {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.shadow-x,
.shadow-y {
    position: absolute;
}

.accessibility-tree {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
}
</style>
