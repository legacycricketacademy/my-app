/**
 * Test setup file for Vitest
 * Provides jsdom environment and localStorage polyfill
 */

import { vi } from 'vitest';

// Mock localStorage for Node.js environment
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock window object for Node.js environment
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
    },
  },
  writable: true,
});

// Mock localStorage for Node.js environment
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockImplementation(() => {});
  localStorageMock.removeItem.mockImplementation(() => {});
  localStorageMock.clear.mockImplementation(() => {});
});
