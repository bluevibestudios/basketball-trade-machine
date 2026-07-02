'use client';

import { useMemo } from 'react';
import type { Player } from '@/lib/types';
import type { Movements } from '@/lib/engine';
import { SEASON_CAPS, tierForSeason } from '@/lib/capProjections';
import { TEAM_BY_TRICODE } from '@/lib/teams';
import { fmtShort } from '@/lib/cba';
import { Logo, TIER_META, cn } from './ui';

const OPT_BADGE: Record<string, { text: string; cls: string }> = {
  player: { text: 'PO', cls: 'text-amber-300' },
  team: { text: 'TO', cls: 'text-sky-300' },
  eto: { text: 'ETO', cls: 'text-amber-300' },
};

export function CapOutlook({
  tricode,
  players,
  movements,
  onClose,
}: {
  tricode: string;
  players: Player[];
  movements: Movements;
  onClose: () => void;
}) {
  const team = TEAM_BY_TRICODE[tricode];

  const { roster, totals, preTotals, tradeActive } = useMemo(() => {
    const post = players.filter(
      (p) =>
        (p.team === tricode && (!movements[p.id] || movements[p.id] === tricode)) ||
        (p.team !== tricode && movements[p.id] === tricode),
    );
    const pre = players.filter((p) => p.team === tricode);
    const sum = (list: Player[], season: string) =>
      list.reduce((s, p) => s + (p.twoWay ? 0 : p.salaries[season] ?? 0), 0);
    const totals = SEASON_CAPS.map((c) => sum(post, c.season));
    const preTotals = SEASON_CAPS.map((c) => sum(pre, c.season));
    const tradeActive = totals.some((t, i) => Math.abs(t - preTotals[i]) > 1);
    const roster = [...post]
      .filter((p) => !p.twoWay)
      .sort((a, b) => (b.salaries['2025-26'] ?? 0) - (a.salaries['2025-26'] ?? 0));
    return { roster, totals, preTotals, tradeActive };
  }, [players, movements, tricode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div data-cap-outlook className="animate-pop relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-line bg-panel">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-line p-4">
          <Logo tricode={tricode} size={36} />
          <div className="min-w-0 flex-1">
            <h2 className="font-condensed truncate text-lg font-semibold uppercase tracking-wide">
              {team.city} {team.name} — Cap Outlook
            </h2>
            <div className="text-[11px] text-muted">
              {tradeActive ? 'Reflecting the trade on the table · ' : ''}
              Options included · two-way excluded · 2027-28+ thresholds projected at +7%/yr
            </div>
          </div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-muted hover:bg-panel2 hover:text-text">✕</button>
        </div>

        {/* table */}
        <div className="scroll-thin overflow-auto p-4">
          <table className="w-full min-w-[640px] border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-panel pb-2 pr-3 text-left font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Player
                </th>
                {SEASON_CAPS.map((c) => (
                  <th key={c.season} className="pb-2 pl-3 text-right font-condensed text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {c.season}
                    {c.projected && <span className="text-accent" title="Projected thresholds">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.map((p) => {
                const incoming = p.team !== tricode;
                return (
                  <tr key={p.id} className="border-t border-line/60">
                    <td className={cn('sticky left-0 bg-panel py-1.5 pr-3', incoming && 'text-emerald-300')}>
                      <span className="font-medium">{p.name}</span>
                      {incoming && <span className="ml-1 text-[9px] uppercase">in</span>}
                      {p.deadMoney && <span className="ml-1 text-[9px] uppercase text-muted">dead</span>}
                    </td>
                    {SEASON_CAPS.map((c) => {
                      const v = p.salaries[c.season];
                      const opt = p.options[c.season];
                      return (
                        <td key={c.season} className="tnum py-1.5 pl-3 text-right">
                          {v ? (
                            <>
                              {fmtShort(v)}
                              {opt && <sup className={cn('ml-0.5 text-[8px] font-bold', OPT_BADGE[opt].cls)}>{OPT_BADGE[opt].text}</sup>}
                            </>
                          ) : (
                            <span className="text-muted/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line font-semibold">
                <td className="sticky left-0 bg-panel py-2 pr-3">Total</td>
                {totals.map((t, i) => (
                  <td key={i} className="tnum py-2 pl-3 text-right">{t > 0 ? fmtShort(t) : '—'}</td>
                ))}
              </tr>
              {tradeActive && (
                <tr className="text-[11px] text-muted">
                  <td className="sticky left-0 bg-panel pb-1 pr-3">vs. before trade</td>
                  {totals.map((t, i) => {
                    const d = t - preTotals[i];
                    return (
                      <td key={i} className={cn('tnum pb-1 pl-3 text-right', d > 1 ? 'text-rose-300' : d < -1 ? 'text-emerald-300' : '')}>
                        {Math.abs(d) > 1 ? `${d > 0 ? '+' : '−'}${fmtShort(Math.abs(d))}` : '·'}
                      </td>
                    );
                  })}
                </tr>
              )}
              <tr className="text-[11px]">
                <td className="sticky left-0 bg-panel py-1.5 pr-3 text-muted">Status</td>
                {totals.map((t, i) => {
                  const m = TIER_META[tierForSeason(t, SEASON_CAPS[i])];
                  return (
                    <td key={i} className="py-1.5 pl-3 text-right">
                      {t > 0 ? <span className={cn('rounded-full border px-1.5 py-0.5 text-[9px] font-semibold', m.cls)}>{m.label}</span> : null}
                    </td>
                  );
                })}
              </tr>
              <tr className="text-[11px] text-muted">
                <td className="sticky left-0 bg-panel py-1 pr-3">Cap space</td>
                {totals.map((t, i) => {
                  const space = SEASON_CAPS[i].salaryCap - t;
                  return (
                    <td key={i} className={cn('tnum py-1 pl-3 text-right', space > 0 && t > 0 && 'text-emerald-300')}>
                      {t > 0 ? (space > 0 ? fmtShort(space) : '—') : ''}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
          <div className="mt-3 text-[10px] leading-relaxed text-muted">
            <sup className="text-amber-300">PO</sup> player option · <sup className="text-sky-300">TO</sup> team option ·
            <sup className="text-amber-300"> ETO</sup> early termination · <span className="text-accent">*</span> projected
            thresholds (league +7% growth assumption). Future seasons show contracts currently on the books — cap holds and
            re-signings not included.
          </div>
        </div>
      </div>
    </div>
  );
}
