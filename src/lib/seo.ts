/** Shared SEO copy — also imported by the Vite HTML transform plugin. */
export const SITE_NAME = 'CubeRush';

export const SITE_TITLE =
  "CubeRush — Free Rubik's Cube Timer | Stats, Scrambles & Guest Mode";

export const SITE_DESCRIPTION =
  "Free online Rubik's cube timer with official WCA scrambles, session stats, Ao5, progression charts, XP, and guest mode. No account required — start timing in your browser.";

export const SITE_KEYWORDS = [
  'rubiks cube timer',
  "rubik's cube timer",
  'speedcubing timer',
  'online cube timer',
  'WCA scrambles',
  'ao5 timer',
  'speedcube stats',
  'cuberush',
  'cube timer app',
].join(', ');

export const SITE_TAGLINE = 'Solve faster. Track better. Be legendary.';

export const DEFAULT_SITE_URL = 'https://anythesuper.github.io/cuberush';

export function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, '');
}

export function siteUrlWithSlash(url: string): string {
  return `${normalizeSiteUrl(url)}/`;
}
