'use client';

import { fmt, fmtShort } from '@/lib/cba';
import { TEAM_BY_TRICODE } from '@/lib/teams';

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export const TIER_META: Record<string, { label: string; cls: string; dot: string }> = {
  under: { label: 'Under cap', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
  over: { label: 'Over cap', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30', dot: 'bg-sky-400' },
  tax: { label: 'Luxury tax', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
  first: { label: '1st apron', cls: 'text-orange-300 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-400' },
  second: { label: '2nd apron', cls: 'text-rose-300 bg-rose-500/10 border-rose-500/30', dot: 'bg-rose-400' },
};

export function TierBadge({ tier }: { tier: string }) {
  const m = TIER_META[tier] ?? TIER_META.over;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold', m.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  );
}

export function Money({ value, short, className }: { value: number; short?: boolean; className?: string }) {
  return <span className={cn('tnum', className)}>{short ? fmtShort(value) : fmt(value)}</span>;
}

// --- color helpers (no third-party artwork; just team color schemes) ---
function rgb(hex: string) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function luminance(hex: string) {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function textOn(hex: string) {
  return luminance(hex) > 0.62 ? '#0b0e14' : '#ffffff';
}
function shade(hex: string, pct: number) {
  const [r, g, b] = rgb(hex).map((c) => Math.max(0, Math.min(255, Math.round(c + (255 * pct) / 100))));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Original team badge: the tricode set on the team's color scheme. */
export function Logo({ tricode, size = 28, className }: { tricode: string; size?: number; className?: string }) {
  const t = TEAM_BY_TRICODE[tricode];
  if (!t) return null;
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-lg font-black tracking-tight', className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, ${t.primary}, ${shade(t.primary, -16)})`,
        color: textOn(t.primary),
        boxShadow: `inset 0 0 0 1.5px ${t.secondary}`,
        fontSize: size * 0.3,
        letterSpacing: '-0.04em',
      }}
    >
      {tricode}
    </div>
  );
}

/** Original initials avatar tinted with the player's team colors (no photos). */
export function Headshot({ name, team, size = 40 }: { name: string; team?: string; size?: number }) {
  const t = team ? TEAM_BY_TRICODE[team] : undefined;
  const bg = t?.primary ?? '#1b2230';
  const ring = t?.secondary ?? '#2c3446';
  const initials = name
    .replace(/[^A-Za-z .'-]/g, '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bg}, ${shade(bg, -22)})`,
        color: textOn(bg),
        boxShadow: `inset 0 0 0 1.5px ${ring}66`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}
