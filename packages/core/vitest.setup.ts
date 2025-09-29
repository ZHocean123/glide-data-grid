import "vitest-canvas-mock";
import { vi } from "vitest";

// this is needed to make the canvas mock work for some reason
global.jest = vi;

global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

Image.prototype.decode = () => new Promise(resolve => window.setTimeout(resolve, 10));
