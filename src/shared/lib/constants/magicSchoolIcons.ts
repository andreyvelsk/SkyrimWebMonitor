export const MAGIC_SCHOOL_ICON_PATHS: Record<string, string> = {
  Alteration: 'lorc/magic-swirl.svg',
  Conjuration: 'lorc/portal.svg',
  Destruction: 'lorc/flaming-claw.svg',
  Illusion: 'delapouite/sparkles.svg',
  Restoration: 'delapouite/nested-hearts.svg',
};

export function getMagicSchoolIconPath(school?: string | null): string {
  if (!school) return MAGIC_SCHOOL_ICON_PATHS.Alteration;
  return MAGIC_SCHOOL_ICON_PATHS[school] ?? MAGIC_SCHOOL_ICON_PATHS.Alteration;
}
