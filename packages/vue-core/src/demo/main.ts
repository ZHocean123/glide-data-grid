import { createApp } from 'vue';
import ExamplesDemo from '../examples/ExamplesDemo.vue';
import '../styles/index.css';

// 创建演示应用
const app = createApp(ExamplesDemo);

// 挂载应用
app.mount('#app');

// 开发环境下启用性能监控
// 性能监控
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure' && entry.duration > 100) {
      console.warn(`慢操作检测到: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
    }
  }
});

observer.observe({ entryTypes: ['measure'] });

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});