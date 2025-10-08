# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glide Data Grid is a high-performance React data grid component built with HTML Canvas. It's a monorepo with three packages:
- **@glideapps/glide-data-grid** (packages/core): The main data grid component
- **@glideapps/glide-data-grid-cells** (packages/cells): Additional cell renderers and editors
- **@glideapps/glide-data-grid-source** (packages/source): Data source hooks for common patterns

## Development Commands

### Root-level commands
```bash
# Start development with Storybook
npm run start
# or
npm run storybook

# Build all packages
npm run build

# Run tests for core package
npm run test

# Run tests for React 18/19 compatibility
npm run test-18
npm run test-19

# Run tests for other packages
npm run test-cells
npm run test-source

# Generate documentation
npm run typedoc
npm run serve-docs

# Build Storybook for production
npm run build-storybook
npm run prod-storybook
```

### Package-specific commands
Each package (`packages/core`, `packages/cells`, `packages/source`) has its own scripts:
```bash
# Build individual package
npm run build

# Run package tests
npm run test

# Lint package code
npm run lint

# Watch for changes and rebuild
npm run watch
```

## Architecture

### Core Package Structure
- **DataEditor**: Main React component ([data-editor.tsx](packages/core/src/data-editor/data-editor.tsx))
- **DataGrid**: Canvas rendering engine ([internal/data-grid/data-grid.ts](packages/core/src/internal/data-grid/data-grid.ts))
- **Cell Renderers**: Built-in cell types ([cells/](packages/core/src/cells/))
- **Event System**: Mouse/keyboard handling ([internal/data-grid/event-args.ts](packages/core/src/internal/data-grid/event-args.ts))
- **Theming**: Theme system and styles ([common/styles.ts](packages/core/src/common/styles.ts))

### Key Concepts
- **Canvas-based rendering**: All cells are rendered to HTML canvas for performance
- **Virtual scrolling**: Only visible cells are rendered to handle millions of rows
- **Cell system**: Pluggable cell renderers with different types (text, number, markdown, etc.)
- **Layer architecture**: Separate layers for cells, overlays, headers, and selections
- **Event propagation**: Mouse/keyboard events flow through grid system with hooks

### Cell Types
Cells are the fundamental unit with these key properties:
- `GridCellKind`: Type discriminator (Text, Number, Markdown, Image, etc.)
- `data`: The actual cell value
- `displayData`: Formatted display value
- `allowOverlay`: Whether cell shows an overlay editor
- `readonly`: Edit permissions

### Rendering Pipeline
1. **Layout**: Calculate visible region and cell positions
2. **Render**: Draw cells, headers, and decorations to canvas
3. **Overlays**: Render HTML overlays for editing when needed
4. **Animation**: Handle transitions and visual effects

## Testing

The project uses Vitest for unit testing. Tests are organized by package:
- Core tests: `packages/core/src/**/*.test.ts`
- Cell tests: `packages/cells/src/**/*.test.ts`
- Source tests: `packages/source/src/**/*.test.ts`

Run tests with `npm run test` from root or individual package directories.

## Build System

- **TypeScript**: Strict TypeScript configuration
- **Linaria**: CSS-in-JS for styled components
- **ESLint**: Linting with React/TypeScript rules
- **ESBuild**: Fast bundling for development
- **Multiple outputs**: ESM, CJS, and declaration files

## Key Files

- [packages/core/src/index.ts](packages/core/src/index.ts): Main public API exports
- [packages/core/src/data-editor/data-editor.tsx](packages/core/src/data-editor/data-editor.tsx): Primary component
- [packages/core/src/internal/data-grid/data-grid-types.ts](packages/core/src/internal/data-grid/data-grid-types.ts): Core type definitions
- [packages/core/src/cells/cell-types.ts](packages/core/src/cells/cell-types.ts): Cell rendering interface

## Development Notes

- The grid is designed to handle **millions of rows** through canvas rendering and virtualization
- Performance is critical - avoid DOM manipulation in the render path
- Cell renderers must use Canvas API, not React components
- The codebase uses extensive TypeScript type safety and runtime assertions
- Event handling is complex due to layered rendering approach