import type { StoryContext } from '@storybook/vue3';
import { h } from 'vue';

/**
 * A decorator that provides a wrapper for Vue components
 */
export const withVueWrapper = (story: any, context: StoryContext) => {
  return {
    components: { story },
    template: `
      <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h1 style="margin-bottom: 20px;">${context.title}</h1>
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <story />
        </div>
      </div>
    `,
  };
};

/**
 * A decorator that provides a theme wrapper for components
 */
export const withThemeWrapper = (theme: 'light' | 'dark' = 'light') => {
  return (story: any, context: StoryContext) => {
    const bgColor = theme === 'dark' ? '#1e1e1e' : '#ffffff';
    const textColor = theme === 'dark' ? '#cccccc' : '#333333';
    
    return {
      components: { story },
      template: `
        <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${bgColor}; color: ${textColor}; min-height: 100vh;">
          <h1 style="margin-bottom: 20px;">${context.title}</h1>
          <div style="border: 1px solid ${theme === 'dark' ? '#404040' : '#e0e0e0'}; border-radius: 8px; overflow: hidden;">
            <story />
          </div>
        </div>
      `,
    };
  };
};

/**
 * A decorator that provides a responsive wrapper for components
 */
export const withResponsiveWrapper = (story: any, context: StoryContext) => {
  return {
    components: { story },
    template: `
      <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h1 style="margin-bottom: 20px;">${context.title}</h1>
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; max-width: 100%; overflow-x: auto;">
          <story />
        </div>
        <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <p><strong>Responsive Test:</strong> Try resizing your browser window to see how the grid adapts.</p>
        </div>
      </div>
    `,
  };
};