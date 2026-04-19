import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

globalThis.localStorage = localStorageMock as Storage;

// Mock jq-web
vi.mock('jq-web', () => ({
  default: async () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JQ mock accepts arbitrary JSON
    json: (input: any, filter: string) => {
      // Simple mock implementation
      if (filter === '.') return input;
      if (filter === '{ id: .id, name: .name }') {
        return { id: input.id, name: input.name };
      }
      if (filter.includes('error')) {
        throw new Error('JQ syntax error');
      }
      return input;
    },
  }),
}));
