import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// =============================================================
// Module-level WebSocket override (MUST run before imports
// that reference WebSocket, since vi.mock is hoisted).
// =============================================================

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  url: string;
  readyState: number = FakeWebSocket.CONNECTING;
  onopen: ((ev: Event) => unknown) | null = null;
  onclose: ((ev: CloseEvent) => unknown) | null = null;
  onerror: ((ev: Event) => unknown) | null = null;
  onmessage: ((ev: MessageEvent) => unknown) | null = null;
  private sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
  }

  // Test helpers

  simulateOpen(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateClose(code: number = 1000, reason: string = ''): void {
    this.readyState = FakeWebSocket.CLOSED;
    const event: CloseEvent = new CloseEvent('close', { code, reason, wasClean: true });
    this.onclose?.(event);
  }

  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  simulateMessage(message: unknown): void {
    const data = JSON.stringify(message);
    const event = new MessageEvent('message', { data });
    this.onmessage?.(event);
  }

  getSentMessages(): string[] {
    return [...this.sentMessages];
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }

  addEventListener(): void {}
  removeEventListener(): void {}
}

const socketHolder: { current: FakeWebSocket | null } = { current: null };

class TrackedFakeWebSocket extends FakeWebSocket {
  constructor(url: string) {
    super(url);
    socketHolder.current = this;
  }
}

Object.defineProperty(globalThis, 'WebSocket', {
  value: TrackedFakeWebSocket,
  writable: true,
  configurable: true,
});

// =============================================================
// Type-safe JSON helpers (no `as`, no `any`)
// =============================================================

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null;
}

function getString(rec: Record<string, unknown>, key: string): string | undefined {
  const val = rec[key];
  return typeof val === 'string' ? val : undefined;
}

function getNumber(rec: Record<string, unknown>, key: string): number | undefined {
  const val = rec[key];
  return typeof val === 'number' ? val : undefined;
}

function getBool(rec: Record<string, unknown>, key: string): boolean | undefined {
  const val = rec[key];
  return typeof val === 'boolean' ? val : undefined;
}

function getObject(rec: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const val = rec[key];
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return undefined;
  return val as Record<string, unknown>; // eslint-disable-line @typescript-eslint/consistent-type-assertions
}

// =============================================================
// Hoisted mock constant
// =============================================================

const { MOCK_WS_URL } = vi.hoisted(() => ({
  MOCK_WS_URL: 'ws://test-server:8765',
}));

vi.mock('@/shared/lib/config/websocket', () => ({
  getConfiguredWsUrl: vi.fn(() => MOCK_WS_URL),
  getDefaultWsUrl: vi.fn(() => 'ws://localhost:8765'),
  WS_CONFIG: {
    URL: MOCK_WS_URL,
    RECONNECT_INTERVAL: 10,
    MAX_RECONNECT_ATTEMPTS: 3,
    HEARTBEAT_INTERVAL: 100,
  },
}));

// =============================================================
// Dynamic import (so vi.mock is applied before module loads)
// =============================================================

import { WebSocketClient } from '@/api/websocket/websocket';
import type { ServerMessage } from '@/api/websocket/lib/types';

// =============================================================
// Tests
// =============================================================

describe('WebSocketClient', () => {
  let client: WebSocketClient;

  function currentSocket(): FakeWebSocket | null {
    return socketHolder.current;
  }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    socketHolder.current = null;
    client = new WebSocketClient();
  });

  afterEach(() => {
    client.disconnect();
    vi.restoreAllMocks();
    vi.useRealTimers();
    socketHolder.current = null;
  });

  // -------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------

  describe('initial state', () => {
    it('is not connected initially', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('has 0 reconnect attempts initially', () => {
      expect(client.getReconnectAttempts()).toBe(0);
    });

    it('max reconnect attempts is 3', () => {
      expect(client.getMaxReconnectAttempts()).toBe(3);
    });
  });

  // -------------------------------------------------------------
  // connect
  // -------------------------------------------------------------

  describe('connect', () => {
    it('resolves when socket opens', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      expect(socket).not.toBeNull();

      if (socket) {
        socket.simulateOpen();
      }

      await expect(connectPromise).resolves.toBeUndefined();
      expect(client.isConnected()).toBe(true);
    });

    it('rejects when socket errors', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();

      if (socket) {
        socket.simulateError();
      }

      await expect(connectPromise).rejects.toThrow('Failed to connect');
      expect(client.isConnected()).toBe(false);
    });

    it('does not reconnect if already connected', async () => {
      const connectPromise1 = client.connect();
      const socket1 = currentSocket();
      if (socket1) socket1.simulateOpen();
      await connectPromise1;

      expect(client.isConnected()).toBe(true);

      const connectPromise2 = client.connect();
      await expect(connectPromise2).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------

  describe('disconnect', () => {
    it('closes the socket', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      expect(client.isConnected()).toBe(true);
      client.disconnect();
      expect(client.isConnected()).toBe(false);
    });

    it('is idempotent (safe to call multiple times)', () => {
      client.disconnect();
      client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // reconnect
  // -------------------------------------------------------------

  describe('reconnect', () => {
    it('cancels pending connection and creates new one', async () => {
      const connectPromise = client.connect();
      const socket1 = currentSocket();
      if (socket1) socket1.simulateOpen();
      await connectPromise;

      const reconnectPromise = client.reconnect();
      const socket2 = currentSocket();
      expect(socket2).not.toBeNull();
      expect(socket2).not.toBe(socket1);
      if (socket2) socket2.simulateOpen();

      await expect(reconnectPromise).resolves.toBeUndefined();
      expect(client.isConnected()).toBe(true);
    });

    it('resets reconnect attempts to 0', async () => {
      const reconnectPromise = client.reconnect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await reconnectPromise;

      expect(client.getReconnectAttempts()).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // subscribe / unsubscribe / unsubscribeAll
  // -------------------------------------------------------------

  describe('subscribe', () => {
    it('sends a subscribe message when connected', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      const result = client.subscribe('test.id', { field: 'Test::Field' });
      expect(result).toBe(true);

      const sent = currentSocket()?.getSentMessages() ?? [];
      expect(sent.length).toBe(1);
      const parsed: unknown = JSON.parse(sent[0]);

      expect(isRecord(parsed)).toBe(true);
      if (isRecord(parsed)) {
        expect(parsed.type).toBe('subscribe');
        expect(getString(parsed, 'id')).toBe('test.id');

        const fields = getObject(parsed, 'fields');
        if (fields) {
          expect(getString(fields, 'field')).toBe('Test::Field');
        }

        const settings = getObject(parsed, 'settings');
        if (settings) {
          expect(getNumber(settings, 'frequency')).toBe(500);
          expect(getBool(settings, 'sendOnChange')).toBe(true);
        }
      }
    });

    it('returns false when not connected', () => {
      const result = client.subscribe('test.id', { field: 'Test::Field' });
      expect(result).toBe(false);
    });
  });

  describe('unsubscribe', () => {
    it('sends unsubscribe message with id', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      const result = client.unsubscribe('test.id');
      expect(result).toBe(true);

      const sent = currentSocket()?.getSentMessages() ?? [];
      const parsed: unknown = JSON.parse(sent[0]);
      if (isRecord(parsed)) {
        expect(parsed.type).toBe('unsubscribe');
        expect(getString(parsed, 'id')).toBe('test.id');
      }
    });

    it('sends unsubscribe without id', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      currentSocket()?.clearSentMessages();
      const result = client.unsubscribe();
      expect(result).toBe(true);

      const sent = currentSocket()?.getSentMessages() ?? [];
      const parsed: unknown = JSON.parse(sent[0]);
      if (isRecord(parsed)) {
        expect(parsed.type).toBe('unsubscribe');
        expect(getString(parsed, 'id')).toBeUndefined();
      }
    });
  });

  describe('unsubscribeAll', () => {
    it('sends unsubscribe_all message', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      currentSocket()?.clearSentMessages();
      const result = client.unsubscribeAll();
      expect(result).toBe(true);

      const sent = currentSocket()?.getSentMessages() ?? [];
      const parsed: unknown = JSON.parse(sent[0]);
      if (isRecord(parsed)) {
        expect(parsed.type).toBe('unsubscribe_all');
      }
    });
  });

  // -------------------------------------------------------------
  // query
  // -------------------------------------------------------------

  describe('query', () => {
    it('sends query message with id and fields', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      const result = client.query('query.id', { field: 'Test::Field' });
      expect(result).toBe(true);

      const sent = currentSocket()?.getSentMessages() ?? [];
      const parsed: unknown = JSON.parse(sent[0]);
      if (isRecord(parsed)) {
        expect(parsed.type).toBe('query');
        expect(getString(parsed, 'id')).toBe('query.id');

        const fields = getObject(parsed, 'fields');
        if (fields) {
          expect(getString(fields, 'field')).toBe('Test::Field');
        }
      }
    });

    it('returns false when not connected', () => {
      const result = client.query('id', {});
      expect(result).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // command
  // -------------------------------------------------------------

  describe('command', () => {
    it('sends command with all optional fields', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      const result = client.command('cmd.id', {
        command: 'equip',
        formId: '0x123',
        active: true,
        hand: 'right',
        count: 1,
        slot: 1,
        x: 100,
        y: 200,
        z: 300,
      });
      expect(result).toBe(true);

      const sent = currentSocket()?.getSentMessages() ?? [];
      const parsed: unknown = JSON.parse(sent[0]);
      if (isRecord(parsed)) {
        expect(parsed.type).toBe('command');
        expect(getString(parsed, 'command')).toBe('equip');
        expect(getString(parsed, 'formId')).toBe('0x123');
        expect(getBool(parsed, 'active')).toBe(true);
        expect(getString(parsed, 'hand')).toBe('right');
        expect(getNumber(parsed, 'count')).toBe(1);
        expect(getNumber(parsed, 'slot')).toBe(1);
        expect(getNumber(parsed, 'x')).toBe(100);
        expect(getNumber(parsed, 'y')).toBe(200);
        expect(getNumber(parsed, 'z')).toBe(300);
      }
    });

    it('omits undefined optional fields from message', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      const result = client.command('cmd.id', {
        command: 'equip',
        formId: '0x123',
      });
      expect(result).toBe(true);

      const sent = currentSocket()?.getSentMessages() ?? [];
      const parsed: unknown = JSON.parse(sent[0]);
      if (isRecord(parsed)) {
        expect(parsed).not.toHaveProperty('active');
        expect(parsed).not.toHaveProperty('hand');
        expect(parsed).not.toHaveProperty('count');
        expect(parsed).not.toHaveProperty('slot');
        expect(parsed).not.toHaveProperty('x');
        expect(parsed).not.toHaveProperty('y');
        expect(parsed).not.toHaveProperty('z');
      }
    });
  });

  // -------------------------------------------------------------
  // onMessage handler
  // -------------------------------------------------------------

  describe('onMessage', () => {
    it('registers a handler and receives messages', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      const handler = vi.fn();
      const cleanup = client.onMessage(handler);

      const testMessage: ServerMessage = {
        type: 'data',
        id: 'test.id',
        ts: 123456,
        fields: { value: 42 },
      };

      const sock = currentSocket();
      if (sock) {
        sock.simulateMessage(testMessage);
      }

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(testMessage);

      // Cleanup removes handler
      cleanup();
      handler.mockClear();

      if (sock) {
        sock.simulateMessage(testMessage);
      }
      expect(handler).not.toHaveBeenCalled();
    });

    it('supports multiple handlers', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      client.onMessage(handler1);
      client.onMessage(handler2);

      const testMessage: ServerMessage = {
        type: 'data',
        id: 'test.id',
        ts: 0,
        fields: {},
      };

      const sock = currentSocket();
      if (sock) {
        sock.simulateMessage(testMessage);
      }

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------
  // on events
  // -------------------------------------------------------------

  describe('on events', () => {
    it('registers and triggers onOpen event', async () => {
      const onOpenCallback = vi.fn();
      client.on('onOpen', onOpenCallback);

      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      expect(onOpenCallback).toHaveBeenCalledTimes(1);
    });

    it('registers and triggers onClose event', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      const onCloseCallback = vi.fn();
      client.on('onClose', onCloseCallback);

      const sock = currentSocket();
      if (sock) {
        sock.simulateClose();
      }

      expect(onCloseCallback).toHaveBeenCalledTimes(1);
    });

    it('registers and triggers onError event', async () => {
      const onErrorCallback = vi.fn();
      client.on('onError', onErrorCallback);

      const connectPromise = client.connect();
      void connectPromise.catch(() => {});

      const socket = currentSocket();
      if (socket) {
        socket.simulateError();
      }

      await Promise.resolve();
      expect(onErrorCallback).toHaveBeenCalledTimes(1);
    });

    it('cleanup removes event listener', () => {
      const callback = vi.fn();
      const cleanup = client.on('onOpen', callback);
      cleanup();
      expect(typeof cleanup).toBe('function');
    });

    it('handles unknown event type safely', () => {
      const callback = vi.fn();
      const cleanup = client.on('nonExistentEvent', callback);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  // -------------------------------------------------------------
  // isConnected
  // -------------------------------------------------------------

  describe('isConnected', () => {
    it('returns false when no socket', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('returns true when socket is OPEN', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      expect(client.isConnected()).toBe(true);
    });

    it('returns false after disconnect', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // Reconnect attempts
  // -------------------------------------------------------------

  describe('getReconnectAttempts / getMaxReconnectAttempts', () => {
    it('returns 0 after successful connect', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      expect(client.getReconnectAttempts()).toBe(0);
    });

    it('returns configured max reconnect attempts', () => {
      expect(client.getMaxReconnectAttempts()).toBe(3);
    });
  });

  // -------------------------------------------------------------
  // Auto-reconnect on close
  // -------------------------------------------------------------

  describe('auto-reconnect on close', () => {
    it('attempts reconnect after socket close', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      expect(client.getReconnectAttempts()).toBe(0);

      const sock = currentSocket();
      if (sock) {
        sock.simulateClose();
      }

      expect(client.getReconnectAttempts()).toBe(1);
    });

    it('emits onReconnectFailed after max attempts', async () => {
      const onFailed = vi.fn();
      client.on('onReconnectFailed', onFailed);

      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      for (let i = 0; i < 4; i++) {
        const sock = currentSocket();
        if (sock) {
          sock.simulateClose();
        }
        // Advance timers so the reconnect setTimeout fires,
        // creating a new socket that we can close in the next iteration.
        vi.advanceTimersByTime(20);
      }

      expect(onFailed).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------
  // Heartbeat
  // -------------------------------------------------------------

  describe('heartbeat', () => {
    it('starts heartbeat after connect', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      currentSocket()?.clearSentMessages();

      vi.advanceTimersByTime(150);

      const sent = currentSocket()?.getSentMessages() ?? [];
      const heartbeatMsgs = sent.filter((s) => {
        const parsed: unknown = JSON.parse(s);
        return isRecord(parsed) && parsed.type === 'heartbeat';
      });
      expect(heartbeatMsgs.length).toBeGreaterThanOrEqual(1);
    });

    it('stops heartbeat after disconnect', async () => {
      const connectPromise = client.connect();
      const socket = currentSocket();
      if (socket) socket.simulateOpen();
      await connectPromise;

      client.disconnect();

      currentSocket()?.clearSentMessages();

      vi.advanceTimersByTime(300);

      const sent = currentSocket()?.getSentMessages() ?? [];
      expect(sent.length).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // Connection generation (stale socket events)
  // -------------------------------------------------------------

  describe('connection generation', () => {
    it('ignores events from old connections', async () => {
      const connectPromise1 = client.connect();
      const oldSocket = currentSocket();

      client.disconnect();
      const connectPromise2 = client.connect();
      // Suppress rejection from the pending connect — afterEach will
      // call disconnect() which rejects it through cancelPendingConnect.
      connectPromise2.catch(() => {});

      expect(currentSocket()).not.toBe(oldSocket);

      if (oldSocket) {
        oldSocket.simulateOpen();
      }

      await expect(connectPromise1).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------
  // cancelPendingConnect
  // -------------------------------------------------------------

  describe('cancelPendingConnect', () => {
    it('rejects pending connect promise on disconnect', async () => {
      const connectPromise = client.connect();
      client.disconnect();

      await expect(connectPromise).rejects.toThrow();
    });
  });
});