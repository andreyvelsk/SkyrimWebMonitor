import { vi } from 'vitest';

// =============================================================
// localStorage mock
// =============================================================
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// =============================================================
// import.meta.env stubs
// =============================================================
vi.stubEnv('BASE_URL', '/');
// For logger tests: DEV is true in test environment
vi.stubEnv('DEV', true);
vi.stubEnv('PROD', false);

// =============================================================
// WebSocket mock (for modules that reference WebSocket at load time)
// =============================================================
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((this: MockWebSocket, ev: Event) => unknown) | null = null;
  onclose: ((this: MockWebSocket, ev: CloseEvent) => unknown) | null = null;
  onerror: ((this: MockWebSocket, ev: Event) => unknown) | null = null;
  onmessage: ((this: MockWebSocket, ev: MessageEvent) => unknown) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send(_data: string): void {}
  close(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
}

Object.defineProperty(globalThis, 'WebSocket', {
  value: MockWebSocket,
  writable: true,
});
