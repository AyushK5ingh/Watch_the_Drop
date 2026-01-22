export const DURATION = .8;
const sections = ['NAVBAR','HERO_HEADING','HERO_TEXT', 'HERO_BUTTON', 'HERO_IMAGE'] as const;

export const Delay: Record<typeof sections[number], number> = sections.reduce(
  (acc, section, index) => {
    acc[section] = DURATION * index*.3;
    return acc;
  },
  {} as Record<typeof sections[number], number>
);
