import { useEffect, useMemo, useRef, useState } from 'react';
import type { AchievementId } from '../types';
import { ACHIEVEMENT_META } from '../lib/xp/achievements';
import { useAppStore } from '../store/useAppStore';

type PopupState = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
};

function startConfettiBurst(durationMs = 1400) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1000';
  document.body.appendChild(canvas);

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const resize = () => {
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#a78bfa', '#22d3ee', '#34d399', '#f472b6', '#fde047', '#ffffff'];
  const gravity = 1800;
  const drag = 0.985;

  const now = () => performance.now();
  const t0 = now();

  type P = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rot: number;
    vr: number;
    color: string;
    life: number;
  };

  const particles: P[] = [];
  const count = 180;
  const cx = canvas.width / 2;
  const cy = canvas.height * 0.25;

  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = 300 + Math.random() * 900;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed * 0.85 - 350,
      size: 6 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 12,
      color: colors[(Math.random() * colors.length) | 0]!,
      life: 0.8 + Math.random() * 0.7,
    });
  }

  let raf = 0;
  let last = now();

  const frame = () => {
    const t = now();
    const dt = Math.min(0.033, (t - last) / 1000);
    last = t;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      const age = (t - t0) / 1000;
      const alpha = Math.max(0, Math.min(1, 1 - age / (p.life * (durationMs / 1000))));
      if (alpha <= 0) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }

    if (t - t0 < durationMs) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}

export function AchievementPopup() {
  const achievements = useAppStore((s) => s.xp.achievements);
  const prevRef = useRef(achievements);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const unlockedNow = useMemo(() => {
    const out: AchievementId[] = [];
    for (const k of Object.keys(achievements) as AchievementId[]) {
      const cur = achievements[k];
      const prev = prevRef.current[k];
      if (cur?.unlocked && !prev?.unlocked) out.push(k);
    }
    return out;
  }, [achievements]);

  useEffect(() => {
    if (unlockedNow.length === 0) {
      prevRef.current = achievements;
      return;
    }

    const id = unlockedNow[0]!;
    const meta = ACHIEVEMENT_META[id];
    if (!meta) return;

    setPopup({ id, ...meta });
    const stop = startConfettiBurst();

    const t = window.setTimeout(() => {
      setPopup((p) => (p?.id === id ? null : p));
      stop();
    }, 2600);

    prevRef.current = achievements;
    return () => {
      window.clearTimeout(t);
      stop();
    };
  }, [achievements, unlockedNow]);

  if (!popup) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1001] grid place-items-center px-4">
      <div className="pointer-events-none w-full max-w-xl rounded-2xl border border-stat-yellow/50 bg-bg-panel/90 p-6 shadow-purple backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-stat-yellow/40 bg-stat-yellow/15 text-4xl">
            {popup.icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-[0.22em] text-stat-yellow">
              ACHIEVEMENT UNLOCKED
            </div>
            <div className="mt-1 truncate text-2xl font-semibold text-fg">
              {popup.title}
            </div>
            <div className="mt-1 text-base text-fg-muted">
              {popup.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

