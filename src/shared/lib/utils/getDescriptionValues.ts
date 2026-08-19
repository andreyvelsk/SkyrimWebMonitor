export function getRoundValue(value: number | null | undefined): string | number {
    if (value === null || value === undefined) return 0;
    if (value < 0) return 0;
    return Math.round(value * 10) / 10;
}