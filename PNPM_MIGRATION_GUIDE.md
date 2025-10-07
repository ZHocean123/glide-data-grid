# pnpm 迁移指南

## 概述

本项目已成功从 npm/yarn 迁移到 pnpm 包管理器。迁移包括以下关键更改：

## 迁移内容

### 1. 配置文件更新

- **pnpm-workspace.yaml**: 定义了工作区包结构
- **.npmrc**: 更新了 pnpm 特定配置
    - `auto-install-peers=true`: 自动安装 peer dependencies
    - `shamefully-hoist=true`: 提升依赖到根 node_modules
    - `strict-peer-dependencies=false`: 放宽 peer dependencies 检查

### 2. 脚本更新

#### 根目录 package.json

- 所有 npm 命令已转换为 pnpm 命令
- 使用 `pnpm -r` 替代 `npm run --workspaces`
- 使用 `pnpm --filter` 替代工作区特定命令

#### 子包 package.json

- 构建脚本从 shell 脚本转换为跨平台的 Node.js 脚本
- 所有包现在使用统一的构建系统

### 3. CI/CD 更新

所有 GitHub Actions 工作流已更新：

- 添加 `pnpm/action-setup@v2` 步骤
- 将 `npm install` 替换为 `pnpm install`
- 将 `npm run` 命令替换为 `pnpm` 命令

### 4. 锁文件

- 已生成 `pnpm-lock.yaml` 文件
- 已删除旧的 `package-lock.json` 文件

### 5. 文档更新

- README.md: 添加了 pnpm 安装说明
- CONTRIBUTING.md: 添加了 pnpm 开发说明

## 使用说明

### 安装依赖

```bash
# 安装所有工作区依赖
pnpm install

# 安装特定包的依赖
pnpm --filter @glideapps/glide-data-grid install
```

### 常用命令

```bash
# 构建所有包
pnpm build

# 运行测试
pnpm test

# 运行特定包测试
pnpm --filter @glideapps/glide-data-grid test

# 运行 lint
pnpm lint

# 启动 Storybook
pnpm storybook
```

### 开发工作流

```bash
# 1. 安装依赖
pnpm install

# 2. 构建项目
pnpm build

# 3. 运行测试
pnpm test

# 4. 启动开发环境
pnpm storybook
```

## 故障排除

### 常见问题

1. **构建失败**
    - 确保所有依赖已正确安装
    - 检查 TypeScript 配置

2. **依赖解析问题**
    - 运行 `pnpm install --force` 重新安装
    - 检查 `.npmrc` 配置

3. **Vue 包构建问题**
    - Vue 包使用不同的构建配置
    - 可能需要额外的 TypeScript 配置

### 回滚步骤

如果需要回滚到 npm：

1. 删除 `pnpm-lock.yaml` 和 `pnpm-workspace.yaml`
2. 恢复 package.json 中的脚本
3. 运行 `npm install` 重新生成 package-lock.json

## 性能优势

使用 pnpm 带来的好处：

- **更快的安装速度**: 硬链接和符号链接优化
- **磁盘空间节省**: 共享依赖存储
- **更好的依赖管理**: 严格的 node_modules 结构
- **工作区支持**: 优化的 monorepo 管理

## 注意事项

- 确保团队所有成员都安装了 pnpm
- CI/CD 环境需要配置 pnpm
- 某些工具可能需要额外配置以支持 pnpm
