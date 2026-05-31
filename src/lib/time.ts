export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function formatMs(ms: number) {
  const sign = ms < 0 ? '-' : '';
  const abs = Math.abs(ms);
  const totalSeconds = Math.floor(abs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centis = Math.floor((abs % 1000) / 10);

  const ss = minutes > 0 ? String(seconds).padStart(2, '0') : String(seconds);
  const cc = String(centis).padStart(2, '0');
  return minutes > 0
    ? `${sign}${minutes}:${ss}.${cc}`
    : `${sign}${ss}.${cc}`;
}

