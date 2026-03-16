export const THEMES = {
  'midnight-indigo': {
    label: 'Midnight Indigo',
    '--bg-base':      '#0F1117',
    '--bg-surface':   '#1a1d2e',
    '--bg-elevated':  '#23263a',
    '--accent':       '#6366f1',
    '--accent-light': '#818cf8',
    '--accent-muted': '#c7d2fe',
    '--text-primary': '#e0e7ff',
    '--text-muted':   '#818cf8',
    '--border':       '#2d3155',
  },
  'forest-study': {
    label: 'Forest Study',
    '--bg-base':      '#0d1f16',
    '--bg-surface':   '#14291e',
    '--bg-elevated':  '#1a3326',
    '--accent':       '#16a34a',
    '--accent-light': '#4ade80',
    '--accent-muted': '#bbf7d0',
    '--text-primary': '#dcfce7',
    '--text-muted':   '#4ade80',
    '--border':       '#1f4a2e',
  },
  'warm-parchment': {
    label: 'Warm Parchment',
    '--bg-base':      '#faf7f2',
    '--bg-surface':   '#f3ede3',
    '--bg-elevated':  '#ece5d5',
    '--accent':       '#d97706',
    '--accent-light': '#f59e0b',
    '--accent-muted': '#fde68a',
    '--text-primary': '#451a03',
    '--text-muted':   '#92400e',
    '--border':       '#e0d5c0',
  },
  'aurora': {
    label: 'Aurora',
    '--bg-base':      '#0a0f1e',
    '--bg-surface':   '#111827',
    '--bg-elevated':  '#1a2338',
    '--accent':       '#06b6d4',
    '--accent-light': '#8b5cf6',
    '--accent-muted': '#34d399',
    '--text-primary': '#e0f2fe',
    '--text-muted':   '#7dd3fc',
    '--border':       '#1e3a5f',
  },
  'chalk-slate': {
    label: 'Chalk & Slate',
    '--bg-base':      '#1c1917',
    '--bg-surface':   '#292524',
    '--bg-elevated':  '#3a3835',
    '--accent':       '#ef4444',
    '--accent-light': '#f87171',
    '--accent-muted': '#fecaca',
    '--text-primary': '#fafaf9',
    '--text-muted':   '#a8a29e',
    '--border':       '#44403c',
  },
} as const;

export type ThemeId = keyof typeof THEMES;
export const DEFAULT_THEME: ThemeId = 'midnight-indigo';

const THEME_STORAGE_KEY = 'koda-color-theme';

/** CSS variable keys on each theme (excluding `label`) */
type ThemeVarKey = Exclude<keyof (typeof THEMES)[ThemeId], 'label'>;

const CSS_VAR_KEYS: ThemeVarKey[] = [
  '--bg-base',
  '--bg-surface',
  '--bg-elevated',
  '--accent',
  '--accent-light',
  '--accent-muted',
  '--text-primary',
  '--text-muted',
  '--border',
];

/** Apply a color theme's CSS variables to <html> and persist in localStorage. */
export function applyTheme(id: ThemeId): void {
  const theme = THEMES[id];
  if (!theme) return;

  const root = document.documentElement;
  for (const key of CSS_VAR_KEYS) {
    root.style.setProperty(key, theme[key]);
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // localStorage may be unavailable (private browsing, quota, etc.)
  }
}

/** Read the saved theme from localStorage, falling back to DEFAULT_THEME. */
export function getSavedTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && saved in THEMES) {
      return saved as ThemeId;
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_THEME;
}
