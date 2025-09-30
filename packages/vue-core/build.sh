#!/bin/bash

# 清理之前的构建
rm -rf dist

# 构建ES模块版本
echo "Building ESM version..."
vite build --outDir dist/esm

# 构建CommonJS版本
echo "Building CJS version..."
vite build --outDir dist/cjs --config vite.config.cjs.ts

# 构建类型定义
echo "Building TypeScript definitions..."
vue-tsc --emitDeclarationOnly --outDir dist/dts

# 复制CSS文件
cp src/index.css dist/index.css 2>/dev/null || echo "No CSS file found"

echo "Build completed successfully!"
