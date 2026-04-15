export function getRoundValue(value: number | null | undefined): string | number {
    if(!value) return '-';
    if ( value < 0) return 0;
    return Math.round(value);
}