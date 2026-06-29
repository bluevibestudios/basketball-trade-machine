'use client';

import type { TradeResult, TeamResult, Check } from '@/lib/engine';
import { TEAM_BY_TRICODE } from '@/lib/teams';
import { Logo, Money, cn } from './ui';

// The headline status — rendered as a page-level sticky bar so it stays
// visible while the user edits the trade below.
export function StatusBanner({ result }: { result: TradeResult }) {
  if (result.empty) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel/90 p-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xl text-accent">↔</div>
        <div>
          <div className="font-display text-xl uppercase tracking-wide text-text">Build a trade</div>
          <div className="text-xs text-muted">Tap players, picks, or cash to add them — checked against the 2025-26 CBA live.</div>
        </div>
      </div>
    );
  }

  const legal = result.legal;
  const errorCount = result.teams.reduce((n, t) => n + t.checks.filter((c) => c.severity === 'error' && !c.ok).length, 0);

  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border bg-panel/90 p-3.5', legal ? 'border-emerald-500/40 glow-ok' : 'border-rose-500/40 glow-bad')}>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl', legal ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300')}>
        {legal ? '✓' : '✕'}
      </div>
      <div>
        <div className={cn('font-display text-xl uppercase tracking-wide', legal ? 'text-emerald-300' : 'text-rose-300')}>
          {legal ? 'Trade is legal' : 'Trade is not allowed'}
        </div>
        <div className="text-xs text-muted">
          {legal
            ? 'Satisfies salary matching, apron, and roster rules for every team.'
            : `${errorCount} rule${errorCount === 1 ? '' : 's'} violated — see the flagged team${errorCount === 1 ? '' : 's'} below.`}
        </div>
      </div>
    </div>
  );
}

export function Verdict({ result }: { result: TradeResult }) {
  if (result.empty) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {result.teams.map((t) => (
        <TeamVerdict key={t.tricode} t={t} />
      ))}
    </div>
  );
}

function TeamVerdict({ t }: { t: TeamResult }) {
  const team = TEAM_BY_TRICODE[t.tricode];
  const denom = Math.max(t.incoming, t.maxAllowedIncoming, 1);
  const allowedPct = (t.maxAllowedIncoming / denom) * 100;
  const inPct = (t.incoming / denom) * 100;
  const over = t.incoming > t.maxAllowedIncoming + 1;

  return (
    <div className={cn('rounded-2xl border bg-panel/70 p-3.5', t.legal ? 'border-line' : 'border-rose-500/30')}>
      <div className="mb-2 flex items-center gap-2">
        <Logo tricode={t.tricode} size={22} />
        <span className="font-condensed text-[15px] font-semibold uppercase tracking-wide">{team.city} {team.name}</span>
        <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold', t.legal ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300')}>
          {t.legal ? 'OK' : 'Blocked'}
        </span>
      </div>

      {/* Salary matching bar */}
      <div className="mb-2.5">
        <div className="mb-1 flex justify-between text-[11px] text-muted">
          <span>Out <Money value={t.outgoing} short className="text-text" /></span>
          <span>In <Money value={t.incoming} short className={over ? 'text-rose-300' : 'text-emerald-300'} /></span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-panel2">
          <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/70" style={{ width: `${Math.min(inPct, allowedPct)}%` }} />
          {over && (
            <div className="absolute inset-y-0 rounded-r-full bg-rose-500/80" style={{ left: `${allowedPct}%`, width: `${inPct - allowedPct}%` }} />
          )}
          <div className="absolute inset-y-0 w-px bg-text/70" style={{ left: `${allowedPct}%` }} title="Max allowed" />
        </div>
        <div className="mt-1 text-[10px] text-muted">
          Max intake <Money value={t.maxAllowedIncoming} short className="text-text" /> · {t.matchRule}
        </div>
      </div>

      <ul className="space-y-1.5">
        {t.checks.map((c, i) => (
          <CheckRow key={i} c={c} />
        ))}
      </ul>
    </div>
  );
}

function CheckRow({ c }: { c: Check }) {
  const icon = c.severity === 'info' ? 'ℹ' : c.ok ? '✓' : c.severity === 'warn' ? '⚠' : '✕';
  const color =
    c.severity === 'info'
      ? 'text-sky-300'
      : c.ok
        ? 'text-emerald-300'
        : c.severity === 'warn'
          ? 'text-amber-300'
          : 'text-rose-300';
  return (
    <li className="flex gap-2 text-[12px] leading-snug">
      <span className={cn('mt-0.5 shrink-0 font-bold', color)}>{icon}</span>
      <span>
        <span className="font-semibold text-text">{c.label}.</span>{' '}
        <span className="text-muted">{c.detail}</span>
      </span>
    </li>
  );
}
