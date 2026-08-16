/**
 * Convert an SVG string into a data URL usable as an image source.
 */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
