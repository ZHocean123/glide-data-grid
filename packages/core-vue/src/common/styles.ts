export interface Theme {
    accentColor: string;
    accentFg: string;
    accentLight: string;
    
    textDark: string;
    textMedium: string;
    textLight: string;
    textBubble: string;
    
    bgIconHeader: string;
    fgIconHeader: string;
    textHeader: string;
    textGroupHeader?: string;
    textHeaderSelected: string;
    
    bgCell: string;
    bgCellMedium: string;
    bgHeader: string;
    bgHeaderHasFocus: string;
    bgHeaderHovered: string;
    
    bgBubble: string;
    bgBubbleSelected: string;
    
    bgSearchResult: string;
    
    borderColor: string;
    horizontalBorderColor?: string;
    verticalBorderColor?: string;
    
    drilldownBorder: string;
    
    linkColor: string;
    
    headerFontStyle: string;
    baseFontStyle: string;
    markerFontStyle?: string;
    
    fontFamily: string;
}

export type FullTheme = Theme;

export function mergeAndRealizeTheme(base: Theme, ...overrides: (Partial<Theme> | undefined)[]): FullTheme {
    let result: Theme = { ...base };
    
    for (const override of overrides) {
        if (override) {
            result = { ...result, ...override };
        }
    }
    
    return result as FullTheme;
}

export function makeCSSStyle(theme: Theme): Record<string, string> {
    return {
        '--gdg-accent-color': theme.accentColor,
        '--gdg-accent-fg': theme.accentFg,
        '--gdg-accent-light': theme.accentLight,
        '--gdg-text-dark': theme.textDark,
        '--gdg-text-medium': theme.textMedium,
        '--gdg-text-light': theme.textLight,
        '--gdg-text-bubble': theme.textBubble,
        '--gdg-bg-icon-header': theme.bgIconHeader,
        '--gdg-fg-icon-header': theme.fgIconHeader,
        '--gdg-text-header': theme.textHeader,
        '--gdg-text-header-selected': theme.textHeaderSelected,
        '--gdg-bg-cell': theme.bgCell,
        '--gdg-bg-cell-medium': theme.bgCellMedium,
        '--gdg-bg-header': theme.bgHeader,
        '--gdg-bg-header-has-focus': theme.bgHeaderHasFocus,
        '--gdg-bg-header-hovered': theme.bgHeaderHovered,
        '--gdg-bg-bubble': theme.bgBubble,
        '--gdg-bg-bubble-selected': theme.bgBubbleSelected,
        '--gdg-bg-search-result': theme.bgSearchResult,
        '--gdg-border-color': theme.borderColor,
        '--gdg-drilldown-border': theme.drilldownBorder,
        '--gdg-link-color': theme.linkColor,
        '--gdg-header-font-style': theme.headerFontStyle,
        '--gdg-base-font-style': theme.baseFontStyle,
        '--gdg-font-family': theme.fontFamily,
    };
}

export function getDataEditorTheme(): Theme {
    return {
        accentColor: '#4F46E5',
        accentFg: '#FFFFFF',
        accentLight: '#EEF2FF',
        
        textDark: '#111827',
        textMedium: '#6B7280',
        textLight: '#9CA3AF',
        textBubble: '#FFFFFF',
        
        bgIconHeader: '#6B7280',
        fgIconHeader: '#FFFFFF',
        textHeader: '#374151',
        textHeaderSelected: '#FFFFFF',
        
        bgCell: '#FFFFFF',
        bgCellMedium: '#F9FAFB',
        bgHeader: '#F3F4F6',
        bgHeaderHasFocus: '#E5E7EB',
        bgHeaderHovered: '#E5E7EB',
        
        bgBubble: '#6366F1',
        bgBubbleSelected: '#4F46E5',
        
        bgSearchResult: '#FEF3C7',
        
        borderColor: '#E5E7EB',
        horizontalBorderColor: '#F3F4F6',
        verticalBorderColor: '#E5E7EB',
        
        drilldownBorder: '#D1D5DB',
        
        linkColor: '#4F46E5',
        
        headerFontStyle: '600 13px',
        baseFontStyle: '13px',
        markerFontStyle: '11px',
        
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    };
}