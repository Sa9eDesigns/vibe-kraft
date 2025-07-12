/**
 * Test setup for SSH library
 */

import { vi } from 'vitest';

// Mock SSH2 for testing
vi.mock('ssh2', () => ({
  Client: vi.fn(() => ({
    connect: vi.fn(),
    end: vi.fn(),
    destroy: vi.fn(),
    shell: vi.fn(),
    exec: vi.fn(),
    sftp: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn()
  }))
}));

// Mock xterm for testing
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    writeln: vi.fn(),
    clear: vi.fn(),
    reset: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
    onKey: vi.fn(),
    loadAddon: vi.fn()
  }))
}));

// Mock xterm addons
vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn(() => ({
    activate: vi.fn(),
    dispose: vi.fn(),
    fit: vi.fn()
  }))
}));

vi.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: vi.fn(() => ({
    activate: vi.fn(),
    dispose: vi.fn()
  }))
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};
