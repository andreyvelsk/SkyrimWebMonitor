import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeWsUrl, getDefaultWsUrl, getConfiguredWsUrl, saveConfiguredWsUrl } from '@/shared/lib/config/websocket';

// =============================================================
// WebSocket Config tests
// =============================================================

describe('normalizeWsUrl', () => {
  it('returns default URL for empty string', () => {
    const result = normalizeWsUrl('');
    // In test env, getDefaultWsUrl returns ws://localhost:XXXX/ws (Vite dev server URL)
    expect(result).toMatch(/^ws:\/\/localhost:\d+\/ws$/);
  });

  it('returns default URL for whitespace-only string', () => {
    const result = normalizeWsUrl('   ');
    expect(result).toMatch(/^ws:\/\/localhost:\d+\/ws$/);
  });

  it('keeps ws:// URL unchanged', () => {
    const result = normalizeWsUrl('ws://10.0.0.1:8765');
    expect(result).toBe('ws://10.0.0.1:8765/');
  });

  it('keeps wss:// URL unchanged', () => {
    const result = normalizeWsUrl('wss://example.com:8765');
    expect(result).toBe('wss://example.com:8765/');
  });

  it('converts http:// to ws://', () => {
    const result = normalizeWsUrl('http://10.0.0.1:8765');
    expect(result).toBe('ws://10.0.0.1:8765/');
  });

  it('converts https:// to wss://', () => {
    const result = normalizeWsUrl('https://example.com:8765');
    expect(result).toBe('wss://example.com:8765/');
  });

  it('adds ws:// prefix when no protocol', () => {
    const result = normalizeWsUrl('10.0.0.1');
    expect(result).toBe('ws://10.0.0.1:8765/');
  });

  it('adds default port when missing', () => {
    const result = normalizeWsUrl('ws://10.0.0.1');
    expect(result).toBe('ws://10.0.0.1:8765/');
  });

  it('handles host:port without protocol', () => {
    const result = normalizeWsUrl('10.0.0.1:9000');
    expect(result).toBe('ws://10.0.0.1:9000/');
  });

  it('trims whitespace', () => {
    const result = normalizeWsUrl('  ws://10.0.0.1:8765  ');
    expect(result).toBe('ws://10.0.0.1:8765/');
  });
});

describe('getDefaultWsUrl', () => {
  it('returns a ws:// URL in dev mode', () => {
    const result = getDefaultWsUrl();
    // In test env, we're not in PROD mode, so it uses location.host
    expect(result).toMatch(/^wss?:\/\/.+\/ws$/);
  });
});

describe('getConfiguredWsUrl', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default URL when no stored URL', () => {
    const result = getConfiguredWsUrl();
    expect(result).toMatch(/^wss?:\/\//);
  });

  it('uses stored URL when available', () => {
    localStorage.setItem('skyrim-web-monitor-ws-endpoint', 'ws://10.0.0.1:9000');
    const result = getConfiguredWsUrl();
    expect(result).toBe('ws://10.0.0.1:9000/');
  });

  it('falls back to default on corrupt stored URL', () => {
    localStorage.setItem('skyrim-web-monitor-ws-endpoint', 'not-a-valid-url:::');
    const result = getConfiguredWsUrl();
    expect(result).toMatch(/^wss?:\/\//);
  });
});

describe('saveConfiguredWsUrl', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes and saves URL', () => {
    const result = saveConfiguredWsUrl('10.0.0.1:9000');
    expect(result).toBe('ws://10.0.0.1:9000/');
    expect(localStorage.getItem('skyrim-web-monitor-ws-endpoint')).toBe('ws://10.0.0.1:9000/');
  });

  it('returns normalized URL', () => {
    const result = saveConfiguredWsUrl('ws://10.0.0.1');
    expect(result).toBe('ws://10.0.0.1:8765/');
  });
});
