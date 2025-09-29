import type { FullyDefined } from "../common/support.js";
import type { InnerGridColumn } from "../internal/data-grid/data-grid-types.js";

export interface MappedGridColumn extends FullyDefined<InnerGridColumn> {
    sourceIndex: number;
    sticky: boolean;
}

export function mapColumns(columns: readonly InnerGridColumn[], freezeColumns: number): readonly MappedGridColumn[] {
    return columns.map(
        (c, i): MappedGridColumn => ({
            group: c.group,
            grow: c.grow,
            hasMenu: c.hasMenu,
            icon: c.icon,
            id: c.id,
            menuIcon: c.menuIcon,
            overlayIcon: c.overlayIcon,
            sourceIndex: i,
            sticky: i < freezeColumns,
            indicatorIcon: c.indicatorIcon,
            style: c.style,
            themeOverride: c.themeOverride,
            title: c.title,
            trailingRowOptions: c.trailingRowOptions,
            width: c.width,
            growOffset: c.growOffset,
            rowMarker: c.rowMarker,
            rowMarkerChecked: c.rowMarkerChecked,
            headerRowMarkerTheme: c.headerRowMarkerTheme,
            headerRowMarkerAlwaysVisible: c.headerRowMarkerAlwaysVisible,
            headerRowMarkerDisabled: c.headerRowMarkerDisabled,
        })
    );
}
