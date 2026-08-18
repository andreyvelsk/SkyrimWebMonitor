import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { CONNECTION_STATUS } from '@/shared/lib/constants/connection';

// =============================================================
// useWebSocketStore tests
// =============================================================

// Mock the WebSocket client BEFORE importing the store
const mockWsClient = {
  getUrl: vi.fn(() => 'ws://localhost:8080'),
  isConnected: vi.fn(() => false),
  connect: vi.fn(),
  disconnect: vi.fn(),
  reconnect: vi.fn(),
  subscribe: vi.fn(() => true),
  unsubscribe: vi.fn(() => true),
  unsubscribeAll: vi.fn(() => true),
  query: vi.fn(),
  command: vi.fn(),
  on: vi.fn(() => vi.fn()),
  onMessage: vi.fn(() => vi.fn()),
};

vi.mock('@/api/websocket', () => ({
  getWebSocketClient: () => mockWsClient,
}));

vi.mock('@/shared/lib/config/websocket', () => ({
  saveConfiguredWsUrl: vi.fn((url: string) => url),
  getConfiguredWsUrl: vi.fn(() => 'ws://localhost:8080'),
}));

vi.mock('@/stores/adapters/dataRouter', () => ({
  DataRouter: {
    routeDataById: vi.fn(() => ({ success: true, message: 'ok' })),
  },
}));

vi.mock('@/stores/system/useSystemStore', () => ({
  useSystemStore: () => ({
    handleQueryResponse: vi.fn(),
  }),
  SYSTEM_QUERY_ID: 'system',
  SYSTEM_QUERY_FIELDS: { language: 'Game::Language', features: 'App::Features' },
}));

vi.mock('@/stores/fixtures/fixtureLoader', () => ({
  applyFixturesIfEnabled: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/shared/lib/utils/logger', () => ({
  logger: { log: vi.fn() },
}));

describe('useWebSocketStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockWsClient.isConnected.mockReturnValue(false);
    mockWsClient.getUrl.mockReturnValue('ws://localhost:8080');
    mockWsClient.subscribe.mockReturnValue(true);
    mockWsClient.unsubscribe.mockReturnValue(true);
    mockWsClient.unsubscribeAll.mockReturnValue(true);
    mockWsClient.connect.mockResolvedValue(undefined);
    mockWsClient.disconnect.mockImplementation(() => {});
    mockWsClient.on.mockReturnValue(vi.fn());
    mockWsClient.onMessage.mockReturnValue(vi.fn());
  });

  describe('initial state', () => {
    it('status is DISCONNECTED', async () => {
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      expect(store.status).toBe(CONNECTION_STATUS.DISCONNECTED);
    });

    it('isConnected is false', async () => {
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      expect(store.isConnected).toBe(false);
    });

    it('isConnecting is false', async () => {
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      expect(store.isConnecting).toBe(false);
    });

    it('activeSubscriptions is empty', async () => {
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      expect(store.activeSubscriptions.size).toBe(0);
    });

    it('endpointUrl matches client default', async () => {
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      expect(store.endpointUrl).toBe('ws://localhost:8080');
    });
  });

  describe('connect', () => {
    it('sets status to CONNECTED on success', async () => {
      mockWsClient.isConnected.mockReturnValue(true);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect(); // clean up setupListeners side effects
      await store.connect();
      expect(store.status).toBe(CONNECTION_STATUS.CONNECTED);
    });

    it('sets status to DISCONNECTED and error on failure', async () => {
      mockWsClient.connect.mockRejectedValue(new Error('Connection refused'));
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await store.connect();
      expect(store.status).toBe(CONNECTION_STATUS.DISCONNECTED);
      expect(store.error).toBe('Connection refused');
    });
  });

  describe('disconnect', () => {
    it('sets status to DISCONNECTED and calls client.disconnect', async () => {
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      expect(store.status).toBe(CONNECTION_STATUS.DISCONNECTED);
      expect(mockWsClient.disconnect).toHaveBeenCalled();
    });

    it('resets reconnectAttempt and reconnectFailed', async () => {
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      expect(store.reconnectAttempt).toBe(0);
      expect(store.reconnectFailed).toBe(false);
    });
  });

  describe('startSubscription', () => {
    it('calls client.subscribe when connected', async () => {
      mockWsClient.isConnected.mockReturnValue(true);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await store.connect();
      store.startSubscription('test.sub', { field: 'Data::Field' });
      expect(mockWsClient.subscribe).toHaveBeenCalledWith('test.sub', { field: 'Data::Field' }, 100, true);
    });

    it('does not call subscribe when not connected', async () => {
      mockWsClient.isConnected.mockReturnValue(false);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      store.startSubscription('test.sub', { field: 'Data::Field' });
      expect(mockWsClient.subscribe).not.toHaveBeenCalled();
    });

    it('adds subscription to activeSubscriptions map', async () => {
      mockWsClient.isConnected.mockReturnValue(true);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await store.connect();
      store.startSubscription('test.sub', { field: 'Data::Field' });
      expect(store.activeSubscriptions.has('test.sub')).toBe(true);
    });
  });

  describe('stopSubscription', () => {
    it('removes subscription from activeSubscriptions', async () => {
      mockWsClient.isConnected.mockReturnValue(true);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await store.connect();
      store.startSubscription('test.sub', { field: 'Data::Field' });
      store.stopSubscription('test.sub');
      expect(mockWsClient.unsubscribe).toHaveBeenCalledWith('test.sub');
    });
  });

  describe('sendCommand', () => {
    it('calls client.command when connected', async () => {
      mockWsClient.isConnected.mockReturnValue(true);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await store.connect();
      store.sendCommand({ command: 'equip', formId: '0x123' });
      expect(mockWsClient.command).toHaveBeenCalled();
    });

    it('passes path to the command message', async () => {
      mockWsClient.isConnected.mockReturnValue(true);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await store.connect();
      store.sendCommand({ command: 'file_download', path: 'interface/exported/hudmenu.gfx' });
      expect(mockWsClient.command).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ command: 'file_download', path: 'interface/exported/hudmenu.gfx' })
      );
    });
  });

  describe('downloadFile', () => {
    it('rejects when not connected', async () => {
      mockWsClient.isConnected.mockReturnValue(false);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await expect(store.downloadFile('interface/exported/hudmenu.gfx')).rejects.toThrow('not connected');
    });

    it('sends file_download command with path when connected', async () => {
      mockWsClient.isConnected.mockReturnValue(true);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await store.connect();

      const promise = store.downloadFile('interface/exported/hudmenu.gfx');
      expect(mockWsClient.command).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ command: 'file_download', path: 'interface/exported/hudmenu.gfx' }),
        false
      );
      // The pending promise is intentionally left unresolved in this mock.
      promise.catch(() => {});
    });
  });

  describe('updateEndpoint', () => {
    it('updates endpointUrl', async () => {
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      store.updateEndpoint('ws://new-host:8081');
      expect(store.endpointUrl).toBe('ws://new-host:8081');
    });
  });

  describe('reconnect', () => {
    it('sets status to CONNECTED on success', async () => {
      mockWsClient.reconnect.mockResolvedValue(undefined);
      mockWsClient.isConnected.mockReturnValue(true);
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await store.reconnect();
      expect(store.status).toBe(CONNECTION_STATUS.CONNECTED);
    });

    it('sets error on failure', async () => {
      mockWsClient.reconnect.mockRejectedValue(new Error('Reconnect failed'));
      const { useWebSocketStore } = await import('@/stores/use-websocket-store/useWebsocketStore');
      const store = useWebSocketStore();
      store.disconnect();
      await store.reconnect();
      expect(store.status).toBe(CONNECTION_STATUS.DISCONNECTED);
    });
  });
});
