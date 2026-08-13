import type { ThemeGamut } from '@/shared/lib/types';

/** All available theme gamuts. Add a new gamut here + a matching SCSS file in `themes/`. */
export const THEME_GAMUTS: readonly ThemeGamut[] = [
  { id: 'silver', labelKey: 'app.settings.theme.gamuts.silver' },
  { id: 'gold', labelKey: 'app.settings.theme.gamuts.gold' },
];

/** Gamut applied by default and used as fallback for unknown persisted ids. */
export const DEFAULT_THEME_GAMUT_ID = 'silver';