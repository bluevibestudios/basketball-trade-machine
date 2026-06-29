'use client';

import { useMemo, useState } from 'react';
import type { Player, Extra } from '@/lib/types';
import type { TeamResult } from '@/lib/engine';
import { TEAMS, type Team } from '@/lib/teams';
import { fmtShort } from '@/lib/cba';
import { Headshot, Logo, Money, TierBadge, cn } from './ui';

const PICK_YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032];

export interface OutgoingMove {
  player: Player;
  to: string;
}

function playerTags(p: Player): { text: string; cls: string }[] {
  const tags: { text: string; cls: string }[] = [];
  if (p.twoWay) tags.push({ text: 'Two-way', cls: 'text-violet-300 border-violet-500/40' });
  const future = Object.keys(p.salaries).filter((s) => s !== '2025-26');
  if (future.length === 0 && !p.twoWay) tags.push({ text: 'Expiring', cls: 'text-cyan-300 border-cyan-500/40' });
  const opt = Object.entries(p.options)[0];
  if (opt) {
    const label = opt[1] === 'player' ? 'Player option' : opt[1] === 'team' ? 'Team option' : 'ETO';
    tags.push({ text: label, cls: 'text-amber-300 border-amber-500/40' });
  }
  return tags;
}

export function TeamColumn({
  team,
  finance,
  roster,
  result,
  outgoing,
  incoming,
  outgoingExtras,
  incomingExtras,
  selectedTeams,
  canRemove,
  onAdd,
  onRemove,
  onSetDest,
  onAddExtra,
  onUpdateExtra,
  onRemoveExtra,
  onChangeTeam,
  onRemoveTeam,
}: {
  team: Team;
  finance: { salary: number; tier: string };
  roster: Player[];
  result?: TeamResult;
  outgoing: OutgoingMove[];
  incoming: Player[];
  outgoingExtras: Extra[];
  incomingExtras: Extra[];
  selectedTeams: string[];
  canRemove: boolean;
  onAdd: (p: Player) => void;
  onRemove: (id: string) => void;
  onSetDest: (id: string, to: string) => void;
  onAddExtra: (kind: 'pick' | 'cash') => void;
  onUpdateExtra: (id: string, patch: Partial<Extra>) => void;
  onRemoveExtra: (id: string) => void;
  onChangeTeam: (tri: string) => void;
  onRemoveTeam: () => void;
}) {
  const [q, setQ] = useState('');
  const movedIds = useMemo(() => new Set(outgoing.map((o) => o.player.id)), [outgoing]);
  const filtered = roster
    .filter((p) => !movedIds.has(p.id))
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const post = result?.postSalary ?? finance.salary;
  const delta = post - finance.salary;
  const otherTeams = selectedTeams.filter((t) => t !== team.tricode);

  return (
    <section
      className="flex w-[340px] shrink-0 flex-col rounded-2xl border border-line bg-panel/80 backdrop-blur"
      style={{ borderTopColor: team.primary, borderTopWidth: 3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 pb-2">
        <Logo tricode={team.tricode} size={40} />
        <div className="min-w-0 flex-1">
          <select
            value={team.tricode}
            onChange={(e) => onChangeTeam(e.target.value)}
            className="font-condensed -ml-1 w-full cursor-pointer truncate rounded-md bg-transparent px-1 py-0.5 text-[17px] font-semibold uppercase tracking-wide text-text hover:bg-panel2 focus:bg-panel2 focus:outline-none"
          >
            {TEAMS.map((t) => (
              <option key={t.tricode} value={t.tricode} className="bg-panel text-text">
                {t.city} {t.name}
              </option>
            ))}
          </select>
          <div className="px-1 text-xs text-muted">{team.conference} · {team.division}</div>
        </div>
        {canRemove && (
          <button onClick={onRemoveTeam} className="rounded-md px-1.5 text-muted hover:bg-panel2 hover:text-rose-300" title="Remove team">
            ✕
          </button>
        )}
      </div>

      {/* Payroll */}
      <div className="mx-3 mb-2 rounded-xl border border-line bg-panel2/60 p-3">
        <div className="flex items-center justify-between">
          <span className="font-condensed text-[12px] uppercase tracking-[0.18em] text-muted">Payroll</span>
          <TierBadge tier={result?.postTier ?? finance.tier} />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <Money value={post} short className="text-2xl font-bold" />
          {Math.abs(delta) > 1 && (
            <span className={cn('text-xs font-semibold', delta > 0 ? 'text-rose-300' : 'text-emerald-300')}>
              {delta > 0 ? '▲' : '▼'} <Money value={Math.abs(delta)} short />
            </span>
          )}
        </div>
        {result && (
          <div className="mt-1 text-[11px] text-muted">
            was <Money value={finance.salary} short /> · roster {result.rosterCount}/15
          </div>
        )}
      </div>

      {/* Trade block */}
      {(outgoing.length > 0 || incoming.length > 0 || outgoingExtras.length > 0 || incomingExtras.length > 0) && (
        <div className="mx-3 mb-2 space-y-2">
          {(outgoing.length > 0 || outgoingExtras.length > 0) && (
            <div>
              <div className="mb-1 font-condensed text-[12px] font-semibold uppercase tracking-[0.15em] text-rose-300/90">Trades away</div>
              <div className="space-y-1">
                {outgoing.map(({ player, to }) => (
                  <MovePill key={player.id} player={player} dirColor="rose">
                    {otherTeams.length > 1 ? (
                      <select
                        value={to}
                        onChange={(e) => onSetDest(player.id, e.target.value)}
                        className="rounded bg-panel px-1 py-0.5 text-[11px] text-muted ring-1 ring-line focus:outline-none"
                      >
                        {otherTeams.map((t) => (
                          <option key={t} value={t}>→ {t}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] text-muted">→ {to}</span>
                    )}
                    <button onClick={() => onRemove(player.id)} className="text-muted hover:text-rose-300">✕</button>
                  </MovePill>
                ))}
                {outgoingExtras.map((extra) => (
                  <ExtraPill key={extra.id} extra={extra} otherTeams={otherTeams} onUpdate={onUpdateExtra} onRemove={onRemoveExtra} />
                ))}
              </div>
            </div>
          )}
          {(incoming.length > 0 || incomingExtras.length > 0) && (
            <div>
              <div className="mb-1 font-condensed text-[12px] font-semibold uppercase tracking-[0.15em] text-emerald-300/90">Acquires</div>
              <div className="space-y-1">
                {incoming.map((player) => (
                  <MovePill key={player.id} player={player} dirColor="emerald">
                    <span className="text-[11px] text-muted">from {player.team}</span>
                  </MovePill>
                ))}
                {incomingExtras.map((extra) => (
                  <IncomingExtraPill key={extra.id} extra={extra} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add picks / cash */}
      <div className="mx-3 mb-2 flex gap-2">
        <button
          onClick={() => onAddExtra('pick')}
          data-add-pick={team.tricode}
          className="flex-1 rounded-lg border border-line bg-panel2/40 px-2 py-1.5 text-xs font-medium text-muted hover:text-text"
        >
          + Draft pick
        </button>
        <button
          onClick={() => onAddExtra('cash')}
          data-add-cash={team.tricode}
          className="flex-1 rounded-lg border border-line bg-panel2/40 px-2 py-1.5 text-xs font-medium text-muted hover:text-text"
        >
          + Cash
        </button>
      </div>

      {/* Roster picker */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-line">
        <div className="p-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${team.tricode} roster…`}
            className="w-full rounded-lg border border-line bg-panel2/60 px-3 py-1.5 text-sm placeholder:text-muted/70 focus:border-accent/60 focus:outline-none"
          />
        </div>
        <div className="scroll-thin max-h-[420px] min-h-[120px] flex-1 overflow-y-auto px-2 pb-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              data-player={p.id}
              onClick={() => onAdd(p)}
              className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-panel2"
            >
              <Headshot name={p.name} team={p.team} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{p.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {playerTags(p).map((t) => (
                    <span key={t.text} className={cn('rounded border px-1 text-[9px] font-medium', t.cls)}>{t.text}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <Money value={p.salary} short className="text-sm font-semibold" />
                <div className="text-[10px] text-muted opacity-0 group-hover:opacity-100">add +</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="px-2 py-6 text-center text-sm text-muted">No players</div>}
        </div>
      </div>
    </section>
  );
}

function ExtraPill({
  extra,
  otherTeams,
  onUpdate,
  onRemove,
}: {
  extra: Extra;
  otherTeams: string[];
  onUpdate: (id: string, patch: Partial<Extra>) => void;
  onRemove: (id: string) => void;
}) {
  const isCash = extra.kind === 'cash';
  return (
    <div className="animate-pop flex items-center gap-2 rounded-lg border border-rose-500/20 bg-panel2/60 px-2 py-1">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-panel text-[12px]">{isCash ? '💵' : '🎟️'}</div>
      <div className="min-w-0 flex-1">
        {isCash ? (
          <div className="flex items-center gap-1 text-[13px] font-semibold">
            <span>$</span>
            <input
              type="number"
              min={0}
              max={7.964}
              step={0.25}
              value={(extra.amount ?? 0) / 1e6}
              onChange={(e) => onUpdate(extra.id, { amount: Math.max(0, Math.round(parseFloat(e.target.value || '0') * 1e6)) })}
              className="w-14 rounded bg-panel px-1 py-0.5 text-[13px] tnum ring-1 ring-line focus:outline-none"
            />
            <span className="text-muted">M cash</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <select
              value={extra.year}
              onChange={(e) => onUpdate(extra.id, { year: Number(e.target.value) })}
              className="rounded bg-panel px-1 py-0.5 text-[12px] font-semibold ring-1 ring-line focus:outline-none"
            >
              {PICK_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={extra.round}
              onChange={(e) => onUpdate(extra.id, { round: Number(e.target.value) as 1 | 2 })}
              className="rounded bg-panel px-1 py-0.5 text-[12px] font-semibold ring-1 ring-line focus:outline-none"
            >
              <option value={1}>1st</option>
              <option value={2}>2nd</option>
            </select>
            <span className="text-[11px] text-muted">pick</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {otherTeams.length > 1 ? (
          <select
            value={extra.to}
            onChange={(e) => onUpdate(extra.id, { to: e.target.value })}
            className="rounded bg-panel px-1 py-0.5 text-[11px] text-muted ring-1 ring-line focus:outline-none"
          >
            {otherTeams.map((t) => (
              <option key={t} value={t}>→ {t}</option>
            ))}
          </select>
        ) : (
          <span className="text-[11px] text-muted">→ {otherTeams[0]}</span>
        )}
        <button onClick={() => onRemove(extra.id)} className="text-muted hover:text-rose-300">✕</button>
      </div>
    </div>
  );
}

function IncomingExtraPill({ extra }: { extra: Extra }) {
  const isCash = extra.kind === 'cash';
  return (
    <div className="animate-pop flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-panel2/60 px-2 py-1">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-panel text-[12px]">{isCash ? '💵' : '🎟️'}</div>
      <div className="min-w-0 flex-1 text-[13px] font-semibold">
        {isCash ? `${fmtShort(extra.amount ?? 0)} cash` : `${extra.year} ${extra.round === 1 ? '1st' : '2nd'}-round pick`}
      </div>
      <span className="text-[11px] text-muted">from {extra.from}</span>
    </div>
  );
}

function MovePill({ player, dirColor, children }: { player: Player; dirColor: 'rose' | 'emerald'; children: React.ReactNode }) {
  return (
    <div className={cn('animate-pop flex items-center gap-2 rounded-lg border bg-panel2/60 px-2 py-1', dirColor === 'rose' ? 'border-rose-500/20' : 'border-emerald-500/20')}>
      <Headshot name={player.name} team={player.team} size={28} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold leading-tight">{player.name}</div>
        <Money value={player.salary} short className="text-[11px] text-muted" />
      </div>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}
