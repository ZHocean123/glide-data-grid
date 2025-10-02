# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glide Data Grid is a high-performance, canvas-based React data grid component designed to handle millions of rows with smooth scrolling. The project is organized as a monorepo with three main packages:

- **packages/core**: Main data grid component (`@glideapps/glide-data-grid`)
- **packages/cells**: Additional cell types (`@glideapps/glide-data-grid-cells`)
- **packages/source**: Data source utilities (`@glideapps/glide-data-grid-source`)

## Common Commands

### Development
```bash
npm start                # Start Storybook with hot-reload
npm run storybook        # Same as above - concurrent Storybook + core watch
npm run watch:core       # Watch core package only
```

### Building
```bash
npm run build            # Build all workspaces and run lint
npm run build-storybook  # Build Storybook for production
```

### Testing
```bash
npm test                 # Run core package tests
npm run test-18          # Test with React 18
npm run test-19          # Test with React 19
npm run test-source      # Test source package
npm run test-cells       # Test cells package
npm run test-projects    # Test example projects
```

### Linting
```bash
npm run lint --workspaces  # Lint all packages
```

Individual package commands are run from within each package directory (e.g., `cd packages/core && npm run test`).

## Architecture

### Core Components
- **DataEditor**: Main wrapper component (`packages/core/src/data-editor/data-editor.tsx`)
- **DataEditorAll**: Full-featured version with all built-in functionality (`packages/core/src/data-editor-all.tsx`)
- **Cell Renderers**: Canvas-based cell rendering system (`packages/core/src/cells/`)

### Key Directories
- `packages/core/src/internal/data-grid/`: Core grid rendering and interaction logic
- `packages/core/src/cells/`: Built-in cell types (text, number, boolean, image, etc.)
- `packages/core/src/data-editor/`: Main DataEditor component and related hooks
- `packages/core/src/docs/`: Storybook documentation and examples
- `packages/core/src/common/`: Shared utilities and theming

### Cell System
The grid uses a canvas-based rendering system where each cell type has its own renderer. Cell types are defined in `packages/core/src/cells/cell-types.ts` and include:
- Text, Number, Boolean, Image cells
- Markdown, URI, Drilldown cells
- Custom cells via `CustomRenderer` interface

### Theme System
Theming is handled through the `Theme` interface in `packages/core/src/common/styles.ts`. Components use the `ThemeContext` and `useTheme` hook.

## Development Notes

### Canvas Rendering
The grid uses HTML Canvas for performance with millions of cells. When adding custom cell renderers, use the Canvas 2D API rather than DOM elements.

### Workspaces
This is a npm workspaces project. Dependencies are managed at the root level, but each package has its own build script.

### React Version Support
The project supports React 16-19. Test scripts are available for different React versions.

### Build System
Each package uses custom build scripts (`./build.sh`) that handle TypeScript compilation and bundling for both ESM and CJS outputs.
