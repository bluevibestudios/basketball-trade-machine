// Derives team payrolls, apron tiers, and roster counts from the player list.
// Single source of truth for both the bundled dataset and live-refreshed data.

import { CAP } from './cba';
import type { Player, TeamFinance } from './types';

export function computeFinance(players: Player[]): {
  finance: Record<string, TeamFinance>;
  rosterCounts: Record<string, number>;
} {
  const salary: Record<string, number> = {};
  const rosterCounts: Record<string, number> = {};
  for (const p of players) {
    if (p.twoWay) continue;
    salary[p.team] = (salary[p.team] ?? 0) + p.salary;
    if (!p.deadMoney) rosterCounts[p.team] = (rosterCounts[p.team] ?? 0) + 1;
  }
  const classify = (s: number): TeamFinance['tier'] =>
    s > CAP.secondApron ? 'second' : s > CAP.firstApron ? 'first' : s > CAP.taxLine ? 'tax' : s > CAP.salaryCap ? 'over' : 'under';
  const finance = Object.fromEntries(
    Object.entries(salary).map(([t, s]) => [t, { salary: s, tier: classify(s) }]),
  );
  return { finance, rosterCounts };
}
