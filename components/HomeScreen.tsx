'use client';

import { useState } from 'react';
import { TEAMS, type Team } from '@/lib/teams';
import { Logo, cn } from './ui';

export function HomeScreen({ onStart }: { onStart: (teams: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (tri: string) =>
    setPicked((p) => (p.includes(tri) ? p.filter((t) => t !== tri) : p.length >= 4 ? p : [...p, tri]));

  const byCity = (a: Team, b: Team) => a.city.localeCompare(b.city);
  const west = TEAMS.filter((t) => t.conference === 'West').sort(byCity);
  const east = TEAMS.filter((t) => t.conference === 'East').sort(byCity);

  const TeamButton = ({ t }: { t: Team }) => {
    const sel = picked.includes(t.tricode);
    const order = picked.indexOf(t.tricode) + 1;
    return (
      <button
        onClick={() => toggle(t.tricode)}
        disabled={!sel && picked.length >= 4}
        className={cn(
          'relative flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition',
          sel
            ? 'border-accent bg-accent/10'
            : 'border-line bg-panel/60 hover:bg-panel2 disabled:cursor-not-allowed disabled:opacity-35',
        )}
      >
        <Logo tricode={t.tricode} size={30} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-condensed text-[14px] font-semibold uppercase leading-tight tracking-wide">{t.name}</div>
          <div className="truncate text-[10px] text-muted">{t.city}</div>
        </div>
        {sel && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-black">
            {order}
          </span>
        )}
      </button>
    );
  };

  const Section = ({ title, teams }: { title: string; teams: Team[] }) => (
    <div>
      <h3 className="mb-2 font-condensed text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {teams.map((t) => (
          <TeamButton key={t.tricode} t={t} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8">
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-mark.png" alt="Basketball Trade Machine" width={76} height={76} className="rounded-2xl" style={{ width: 76, height: 76 }} />
        <h1 className="mt-3 font-display text-3xl uppercase leading-none tracking-wide">
          Basketball <span className="text-accent">Trade Machine</span>
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          Build a trade and check it instantly against the real 2025-26 salary cap, aprons, and CBA rules.
        </p>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <h2 className="font-condensed text-base font-semibold uppercase tracking-[0.16em]">Choose teams</h2>
        <span className="text-xs text-muted">{picked.length}/4 · pick 2–4</span>
      </div>

      <div className="mt-3 grid gap-6 lg:grid-cols-2">
        <Section title="Western Conference" teams={west} />
        <Section title="Eastern Conference" teams={east} />
      </div>

      {/* Sticky start bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/92 px-4 pt-3 backdrop-blur" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {picked.length === 0 ? (
              <span className="text-sm text-muted">Select at least 2 teams</span>
            ) : (
              picked.map((tri) => <Logo key={tri} tricode={tri} size={26} />)
            )}
          </div>
          <button
            onClick={() => onStart(picked)}
            disabled={picked.length < 2}
            className="rounded-xl bg-accent px-5 py-2.5 font-condensed text-base font-semibold uppercase tracking-wide text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start trade →
          </button>
        </div>
      </div>
    </div>
  );
}
