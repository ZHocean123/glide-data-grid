/**
 * Vitest配置文件
 * 为Vue版本的Glide Data Grid测试提供配置
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'jsdom',
    
    // 全局设置
    globals: true,
    
    // 设置文件
    setupFiles: ['./src/test/test-setup.ts'],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/test/',
        'src/demo/'
      ]
    },
    
    // 测试匹配模式
    include: [
      'src/**/*.{test,spec}.{ts,js}'
    ],
    
    // 排除模式
    exclude: [
      'node_modules/',
      'dist/',
      '**/*.d.ts'
    ],
    
    // 测试超时
    testTimeout: 10000,
    
    // 钩子超时
    hookTimeout: 10000,
    
    // 并发测试
    threads: true,
    
    // 监听模式下的文件
    watchExclude: [
      'node_modules/',
      'dist/'
    ]
  },
  
  // 定义全局常量
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
});