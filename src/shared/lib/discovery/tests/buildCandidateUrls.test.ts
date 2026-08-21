import { describe, it, expect } from 'vitest';
import { buildCandidateUrls } from '../buildCandidateUrls';

describe('buildCandidateUrls', () => {
  it('puts localhost candidates first', () => {
    const urls = buildCandidateUrls('192.168.1.42', [8765]);

    expect(urls[0]).toBe('ws://localhost:8765');
    expect(urls[1]).toBe('ws://127.0.0.1:8765');
  });

  it('generates all /24 subnet hosts after localhost', () => {
    const urls = buildCandidateUrls('192.168.1.42', [8765]);

    // 2 localhost + 254 subnet hosts
    expect(urls).toHaveLength(256);
    expect(urls[2]).toBe('ws://192.168.1.1:8765');
    expect(urls[255]).toBe('ws://192.168.1.254:8765');
    expect(urls).toContain('ws://192.168.1.42:8765');
  });

  it('expands multiple ports per host', () => {
    const urls = buildCandidateUrls(null, [8765, 9000]);

    expect(urls[0]).toBe('ws://localhost:8765');
    expect(urls[1]).toBe('ws://localhost:9000');
    expect(urls[2]).toBe('ws://127.0.0.1:8765');
    expect(urls[3]).toBe('ws://127.0.0.1:9000');
  });

  it('falls back to localhost only when local IP is unknown', () => {
    const urls = buildCandidateUrls(null, [8765]);

    expect(urls).toEqual(['ws://localhost:8765', 'ws://127.0.0.1:8765']);
  });
});
