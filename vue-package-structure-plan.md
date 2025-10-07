# Vue 3 包结构和构建配置计划

## Vue 包结构设计

### 1. 包命名约定

- `@glideapps/glide-data-grid-vue` - 核心数据网格
- `@glideapps/glide-data-grid-cells-vue` - 单元格渲染器
- `@glideapps/glide-data-grid-source-vue` - 数据源钩子

### 2. 目录结构

#### core-vue/

```
packages/core-vue/
├── package.json
├── tsconfig.json
├── tsconfig.esm.json
├── tsconfig.cjs.json
├── build.sh
├── src/
│   ├── index.ts
│   ├── components/
│   │   ├── DataEditor.vue
│   │   └── DataGrid.vue
│   ├── composables/
│   │   ├── use-selection.ts
│   │   ├── use-editing.ts
│   │   └── use-events.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── index.ts
└── dist/
    ├── esm/
    ├── cjs/
    └── dts/
```

#### cells-vue/

```
packages/cells-vue/
├── package.json
├── tsconfig.json
├── build.sh
├── src/
│   ├── index.ts
│   ├── cells/
│   │   ├── text-cell.vue
│   │   ├── number-cell.vue
│   │   ├── multi-select-cell.vue
│   │   └── index.ts
│   └── composables/
│       └── use-cell-renderer.ts
└── dist/
```

#### source-vue/

```
packages/source-vue/
├── package.json
├── tsconfig.json
├── build.sh
├── src/
│   ├── index.ts
│   └── composables/
│       ├── use-async-data-source.ts
│       ├── use-column-sort.ts
│       ├── use-movable-columns.ts
│       └── use-undo-redo.ts
└── dist/
```

## 构建配置设计

### 1. TypeScript 配置

#### 基础 tsconfig.json

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "Node16",
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "allowJs": true,
        "skipLibCheck": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "strict": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "preserve",
        "declaration": true,
        "outDir": "./dist",
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

#### ESM 配置 (tsconfig.esm.json)

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "module": "ESNext",
        "outDir": "./dist/esm-tmp",
        "declarationDir": "./dist/dts-tmp"
    }
}
```

#### CJS 配置 (tsconfig.cjs.json)

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "module": "CommonJS",
        "outDir": "./dist/cjs-tmp"
    }
}
```

### 2. Package.json 配置

#### core-vue/package.json

```json
{
    "name": "@glideapps/glide-data-grid-vue",
    "version": "6.0.4-alpha23",
    "description": "Vue 3 data grid for beautifully displaying and editing large amounts of data with amazing performance.",
    "type": "module",
    "browser": "dist/esm/index.js",
    "main": "dist/cjs/index.js",
    "module": "dist/esm/index.js",
    "types": "dist/dts/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/dts/index.d.ts",
            "import": "./dist/esm/index.js",
            "require": "./dist/cjs/index.js"
        },
        "./dist/index.css": {
            "import": "./dist/index.css",
            "require": "./dist/index.css"
        },
        "./index.css": {
            "import": "./dist/index.css",
            "require": "./dist/index.css"
        }
    },
    "scripts": {
        "build": "./build.sh",
        "dev": "vite",
        "lint": "eslint src --ext .ts,.tsx,.vue",
        "test": "vitest"
    },
    "dependencies": {
        "@linaria/core": "^6.3.0",
        "canvas-hypertxt": "^1.0.3",
        "lodash": "^4.17.21"
    },
    "peerDependencies": {
        "vue": "^3.3.0"
    },
    "devDependencies": {
        "@vitejs/plugin-vue": "^4.0.0",
        "typescript": "^5.8.3",
        "vite": "^4.0.0",
        "vue": "^3.3.0",
        "@vue/tsconfig": "^0.5.0"
    }
}
```

### 3. 构建脚本设计

#### core-vue/build.sh

```bash
#!/bin/bash
set -em
source ../../config/build-util.sh

ensure_bash_4

shopt -s globstar

echo -e "\033[0;36m🏗️ Building Glide Data Grid Vue 🏗️\033[0m"

compile_esm() {
    tsc -p tsconfig.esm.json --outdir ./dist/esm-tmp --declarationDir ./dist/dts-tmp
    wyw-in-js -r dist/esm-tmp/ -m esnext -o dist/esm-tmp/ dist/esm-tmp/**/*.js -t -i dist/esm-tmp -c ../../config/linaria.json > /dev/null
    remove_all_css_imports dist/esm-tmp

    # Vue SFC 编译处理
    # 这里需要添加 Vue SFC 到 JS 的编译逻辑

    mv dist/esm-tmp dist/esm
    mv dist/dts-tmp dist/dts
}

compile_cjs() {
    tsc -p tsconfig.cjs.json --outdir ./dist/cjs-tmp
    wyw-in-js -r dist/cjs-tmp/ -m commonjs -o dist/cjs-tmp/ dist/cjs-tmp/**/*.js -t -i dist/cjs-tmp -c ../../config/linaria.json > /dev/null
    remove_all_css_imports dist/cjs-tmp

    # Vue SFC 编译处理
    mv dist/cjs-tmp dist/cjs
}

run_in_parallel compile_esm compile_cjs

generate_index_css

echo -e "\033[0;36m🎉 Vue Core Build Complete 🎉\033[0m"
```

### 4. Vue 3 特定配置

#### Vite 配置 (用于开发)

```javascript
// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: "./src/index.ts",
            name: "GlideDataGridVue",
            fileName: format => `glide-data-grid-vue.${format}.js`,
        },
        rollupOptions: {
            external: ["vue"],
            output: {
                globals: {
                    vue: "Vue",
                },
            },
        },
    },
});
```

### 5. 依赖映射策略

#### React → Vue 依赖映射

| React 依赖                | Vue 3 替代方案           | 策略           |
| ------------------------- | ------------------------ | -------------- |
| react                     | vue                      | 直接替换       |
| react-dom                 | -                        | 移除           |
| @linaria/react            | @linaria/core + Vue 集成 | 保持 CSS-in-JS |
| react-number-format       | 自定义实现               | 创建 Vue 组件  |
| react-select              | vue-select               | 第三方库替换   |
| react-responsive-carousel | vue3-carousel            | 第三方库替换   |
| @toast-ui/react-editor    | @toast-ui/editor         | 直接使用核心库 |

### 6. 开发环境配置

#### Storybook for Vue 配置

```javascript
// .storybook/main-vue.cjs
module.exports = {
    stories: ["../packages/**/src/**/*.stories.vue"],
    addons: ["@storybook/addon-docs"],

    framework: {
        name: "@storybook/vue3-vite",
        options: {},
    },

    async viteFinal(config) {
        return config;
    },
};
```

## 实施步骤

### 阶段 1: 基础结构搭建

1. 创建 package.json 文件
2. 配置 TypeScript 编译
3. 设置构建脚本
4. 配置开发环境

### 阶段 2: Vue 组件迁移

1. 创建基础 Vue 组件结构
2. 实现 Composition API 钩子
3. 迁移类型定义
4. 设置样式系统

### 阶段 3: 构建优化

1. 优化包大小
2. 配置 Tree Shaking
3. 设置类型声明生成
4. 集成测试环境

## 技术考虑

### 1. Vue 3 特性利用

- **Composition API** - 替代 React Hooks
- **Teleport** - 替代 React Portal
- **Suspense** - 异步组件加载
- **Fragments** - 多根节点支持

### 2. 性能优化策略

- **响应式优化** - 使用 shallowRef 和 markRaw
- **组件懒加载** - 使用 defineAsyncComponent
- **事件处理优化** - 使用事件修饰符
- **内存管理** - 及时清理副作用

### 3. 兼容性保证

- **API 一致性** - 保持与 React 版本相同的 API
- **类型安全** - 完整的 TypeScript 支持
- **文档对齐** - 相同的使用文档和示例

这个构建配置计划将为 Vue 3 版本的 Glide Data Grid 提供完整的开发、构建和发布支持。
