'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { Player, TeamFinance, Extra } from '@/lib/types';
import { TEAMS, TEAM_BY_TRICODE } from '@/lib/teams';
import { CAP, fmtShort } from '@/lib/cba';
import { evaluateTrade, type Movements } from '@/lib/engine';
import { encodeTrade, decodeTrade } from '@/lib/share';
import { loadPro } from '@/lib/pro';
import { shareTradeCard } from '@/lib/shareCard';
import { TeamColumn } from './TeamColumn';
import { Verdict, StatusBanner } from './Verdict';
import { HomeScreen } from './HomeScreen';
import { ProSheet } from './ProSheet';

export function TradeMachine({
  players,
  finance,
  rosterCounts,
}: {
  players: Player[];
  finance: Record<string, TeamFinance>;
  rosterCounts: Record<string, number>;
}) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [movements, setMovements] = useState<Movements>({});
  const [extras, setExtras] = useState<Extra[]>([]);
  const [copied, setCopied] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [shared, setShared] = useState<string | null>(null);
  const extraSeq = useRef(0);
  const hydrated = useRef(false);

  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const rosterByTeam = useMemo(() => {
    const m: Record<string, Player[]> = {};
    for (const p of players) {
      if (p.deadMoney) continue;
      (m[p.team] ??= []).push(p);
    }
    for (const t of Object.keys(m)) m[t].sort((a, b) => b.salary - a.salary);
    return m;
  }, [players]);

  const teamSalaries = useMemo(
    () => Object.fromEntries(Object.entries(finance).map(([t, f]) => [t, f.salary])),
    [finance],
  );

  const result = useMemo(
    () => evaluateTrade(players, teamSalaries, rosterCounts, movements, extras),
    [players, teamSalaries, rosterCounts, movements, extras],
  );
  const resultByTeam = useMemo(() => new Map(result.teams.map((t) => [t.tricode, t])), [result]);

  const nextTeam = useCallback(
    (from: string) => {
      const others = selectedTeams.filter((t) => t !== from);
      return others[0] ?? from;
    },
    [selectedTeams],
  );

  const addPlayer = useCallback(
    (p: Player) => setMovements((m) => ({ ...m, [p.id]: nextTeam(p.team) })),
    [nextTeam],
  );
  const removePlayer = useCallback(
    (id: string) => setMovements((m) => { const n = { ...m }; delete n[id]; return n; }),
    [],
  );
  const setDest = useCallback((id: string, to: string) => setMovements((m) => ({ ...m, [id]: to })), []);

  const addExtra = useCallback(
    (kind: 'pick' | 'cash', from: string) => {
      if (kind === 'pick' && !isPro) { setShowPro(true); return; } // Pro: draft-pick trading
      const to = nextTeam(from);
      const id = `e${extraSeq.current++}`;
      const base: Extra =
        kind === 'cash'
          ? { id, kind, from, to, amount: 1_000_000 }
          : { id, kind, from, to, year: 2027, round: 1 };
      setExtras((a) => [...a, base]);
    },
    [nextTeam, isPro],
  );
  const updateExtra = useCallback(
    (id: string, patch: Partial<Extra>) => setExtras((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [],
  );
  const removeExtra = useCallback((id: string) => setExtras((a) => a.filter((x) => x.id !== id)), []);
  const pruneExtras = (tri: string) => setExtras((a) => a.filter((x) => x.from !== tri && x.to !== tri));

  const changeTeam = useCallback(
    (i: number, newTri: string) => {
      setSelectedTeams((prev) => {
        const j = prev.indexOf(newTri);
        const next = [...prev];
        if (j !== -1) { [next[i], next[j]] = [next[j], next[i]]; return next; }
        const oldTri = prev[i];
        next[i] = newTri;
        setMovements((m) => {
          const n: Movements = {};
          for (const [id, to] of Object.entries(m)) {
            const pl = playerById.get(id);
            if (!pl || pl.team === oldTri || to === oldTri) continue;
            n[id] = to;
          }
          return n;
        });
        pruneExtras(oldTri);
        return next;
      });
    },
    [playerById],
  );

  const addTeam = useCallback(() => {
    if (!isPro && selectedTeams.length >= 2) { setShowPro(true); return; } // Pro: 3-4 team trades
    setSelectedTeams((prev) => {
      if (prev.length >= 4) return prev;
      const avail = TEAMS.find((t) => !prev.includes(t.tricode));
      return avail ? [...prev, avail.tricode] : prev;
    });
  }, [isPro, selectedTeams.length]);

  const removeTeam = useCallback(
    (tri: string) => {
      setSelectedTeams((prev) => (prev.length <= 2 ? prev : prev.filter((t) => t !== tri)));
      setMovements((m) => {
        const n: Movements = {};
        for (const [id, to] of Object.entries(m)) {
          const pl = playerById.get(id);
          if (!pl || pl.team === tri || to === tri) continue;
          n[id] = to;
        }
        return n;
      });
      pruneExtras(tri);
    },
    [playerById],
  );

  const reset = useCallback(() => { setMovements({}); setExtras([]); }, []);
  const goHome = useCallback(() => { setSelectedTeams([]); setMovements({}); setExtras([]); }, []);
  const dealSize = Object.keys(movements).length + extras.length;

  // Hydrate from a shared ?t= link on mount.
  useEffect(() => {
    setIsPro(loadPro());
    const token = new URLSearchParams(window.location.search).get('t');
    if (token) {
      const st = decodeTrade(token);
      if (st && st.teams.length >= 2) {
        setSelectedTeams(st.teams.slice(0, 4));
        setMovements(st.movements);
        setExtras(st.extras);
        const maxSeq = st.extras.reduce((m, e) => Math.max(m, Number(e.id.replace(/\D/g, '')) || 0), 0);
        extraSeq.current = maxSeq + 1;
      }
    }
    hydrated.current = true;
  }, []);

  // Keep the URL in sync so it's always shareable.
  useEffect(() => {
    if (!hydrated.current) return;
    const token = encodeTrade({ teams: selectedTeams, movements, extras });
    window.history.replaceState(null, '', `${window.location.pathname}?t=${token}`);
  }, [selectedTeams, movements, extras]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const shareGraphic = useCallback(async () => {
    if (!isPro) { setShowPro(true); return; } // Pro: share trade graphics
    try {
      const how = await shareTradeCard(result);
      setShared(how === 'shared' ? '✓ Shared' : '✓ Saved');
      setTimeout(() => setShared(null), 1600);
    } catch {
      setShared('Share failed');
      setTimeout(() => setShared(null), 1600);
    }
  }, [isPro, result]);

  const proSheet = (
    <ProSheet open={showPro} onClose={() => setShowPro(false)} onUnlocked={() => setIsPro(true)} />
  );

  // Start on the team-selection home screen until the user picks teams.
  if (selectedTeams.length === 0) {
    return (
      <>
        <HomeScreen
          onStart={(teams) => setSelectedTeams(teams)}
          maxTeams={isPro ? 4 : 2}
          onLimit={() => setShowPro(true)}
        />
        {proSheet}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-mark.png" alt="Basketball Trade Machine" width={44} height={44} className="h-11 w-11 rounded-xl" />
          <div>
            <h1 className="font-display text-2xl uppercase leading-none tracking-wide">
              The Trade <span className="text-accent">Machine</span>
            </h1>
            <div className="font-condensed text-[11px] uppercase tracking-[0.2em] text-muted">2025-26 · Full CBA Engine</div>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-[11px] md:flex">
          <Legend label="Cap" value={CAP.salaryCap} dot="bg-emerald-400" />
          <Legend label="Tax" value={CAP.taxLine} dot="bg-amber-400" />
          <Legend label="1st apron" value={CAP.firstApron} dot="bg-orange-400" />
          <Legend label="2nd apron" value={CAP.secondApron} dot="bg-rose-400" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={goHome} className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-muted hover:text-text" title="Back to team selection">
            ⌂ Teams
          </button>
          {dealSize > 0 && (
            <button onClick={reset} data-reset className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-muted hover:text-text">
              Reset deal
            </button>
          )}
          {dealSize > 0 && (
            <button
              onClick={copyLink}
              className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm font-medium text-text hover:bg-panel2"
            >
              {copied ? '✓ Copied' : '🔗 Copy link'}
            </button>
          )}
          {dealSize > 0 && (
            <button
              onClick={shareGraphic}
              data-share
              className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm font-medium text-text hover:bg-panel2"
            >
              {shared ?? <>📸 Share graphic{!isPro && <ProChip />}</>}
            </button>
          )}
          <button
            onClick={addTeam}
            disabled={selectedTeams.length >= 4}
            className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add team{!isPro && selectedTeams.length >= 2 && <ProChip />}
          </button>
        </div>
      </header>

      {/* Status — page-level sticky bar, always visible while editing below */}
      <div className="sticky top-0 z-30 -mx-4 mb-3 bg-bg/85 px-4 py-2 backdrop-blur">
        <StatusBanner result={result} />
      </div>

      {/* Per-team verdict detail */}
      <div className="mb-4">
        <Verdict result={result} isPro={isPro} onUpsell={() => setShowPro(true)} />
      </div>

      {/* Team columns */}
      <div className="scroll-thin flex gap-3 overflow-x-auto pb-3">
        {selectedTeams.map((tri, i) => {
            const team = TEAM_BY_TRICODE[tri];
            const outgoing = Object.entries(movements)
              .map(([id, to]) => ({ player: playerById.get(id)!, to }))
              .filter((o) => o.player && o.player.team === tri);
            const incoming = Object.entries(movements)
              .filter(([, to]) => to === tri)
              .map(([id]) => playerById.get(id)!)
              .filter(Boolean);
            const outgoingExtras = extras.filter((e) => e.from === tri);
            const incomingExtras = extras.filter((e) => e.to === tri);
            return (
              <TeamColumn
                key={tri}
                team={team}
                finance={finance[tri] ?? { salary: 0, tier: 'under' }}
                roster={rosterByTeam[tri] ?? []}
                result={resultByTeam.get(tri)}
                outgoing={outgoing}
                incoming={incoming}
                outgoingExtras={outgoingExtras}
                incomingExtras={incomingExtras}
                selectedTeams={selectedTeams}
                canRemove={selectedTeams.length > 2}
                onAdd={addPlayer}
                onRemove={removePlayer}
                onSetDest={setDest}
                onAddExtra={(kind) => addExtra(kind, tri)}
                onUpdateExtra={updateExtra}
                onRemoveExtra={removeExtra}
                onChangeTeam={(t) => changeTeam(i, t)}
                onRemoveTeam={() => removeTeam(tri)}
              />
            );
          })}
      </div>
      {proSheet}
    </div>
  );
}

function ProChip() {
  return (
    <span className="ml-1.5 rounded bg-accent/20 px-1 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wide text-accent">
      Pro
    </span>
  );
}

function Legend({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel/60 px-2 py-1">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-muted">{label}</span>
      <span className="tnum font-semibold">{fmtShort(value)}</span>
    </span>
  );
}
