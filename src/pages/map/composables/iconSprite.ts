export function iconUrlToSymbolId(url: string): string {
  return `map-icon-${url.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}
