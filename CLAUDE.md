# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glide Data Grid is a high-performance React data grid built on HTML Canvas, designed to handle millions of rows with native scrolling performance. The project is structured as a monorepo with multiple packages:

- `packages/core` - Main data grid implementation
- `packages/cells` - Additional cell types and renderers
- `packages/source` - Data source utilities and hooks

## Development Commands

### Root Level Commands
- `npm start` / `npm run storybook` - Start development Storybook on port 9009
- `npm run build` - Build all packages and run linting
- `npm run test` - Run tests for core package
- `npm run test-18` / `npm run test-19` - Run tests with specific React versions
- `npm run test-cells` / `npm run test-source` - Run tests for specific packages
- `npm run typedoc` - Generate TypeScript documentation

### Package-Specific Commands
Each package has its own build and test scripts:
- `npm run build` - Build the package
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest tests
- `npm run watch` - Watch for changes and rebuild (core only)

## Build System

The project uses a custom build system with TypeScript compilation and Linaria for CSS-in-JS:

- Build process compiles to both ESM and CJS formats
- CSS files are automatically generated and aggregated
- Uses `@wyw-in-js` for CSS extraction
- Build utilities are in `config/build-util.sh`

## Architecture

### Core Components
- `DataEditor` - Main grid component (packages/core/src/data-editor/data-editor.tsx)
- `DataGrid` - Internal canvas-based grid implementation
- Cell renderers - Located in `packages/core/src/cells/`

### Key Concepts
- **Canvas-based rendering**: All cell rendering happens on HTML Canvas for performance
- **Lazy loading**: Cells are rendered on-demand to handle large datasets
- **Custom cell types**: Text, number, boolean, image, markdown, bubble, drilldown, URI, etc.
- **Row grouping**: Support for hierarchical row organization
- **Selection blending**: Configurable selection behavior (exclusive/multi)

### Package Structure
- `core/src/internal/` - Internal implementation details
- `core/src/cells/` - Built-in cell renderers
- `core/src/common/` - Shared utilities and styles
- `core/src/data-editor/` - Main DataEditor component and hooks

## Testing

- Uses Vitest for testing
- Tests are co-located with source files
- Storybook provides interactive examples and visual testing
- Multiple React version testing support (16-19)

## Storybook

The project uses Storybook extensively for development and documentation:
- Located in root directory
- Runs on port 9009
- Contains comprehensive examples of all features
- Used for visual testing and documentation

## TypeScript Configuration

- Uses strict TypeScript configuration
- Targets ES2022
- Module resolution: Node16
- Composite builds for monorepo

## Peer Dependencies

- React 16-19 compatible
- lodash, marked, react-responsive-carousel
- Each package has specific peer dependencies

## Development Notes

- The grid uses a row marker offset system (adds 1 column for row markers)
- CSS imports are automatically removed during build
- Build process requires Bash 4 or higher
- Uses Linaria for CSS-in-JS with build-time extraction