import playersJson from '@/data/players.json';
import teamsJson from '@/data/teams.json';
import type { Player, TeamFinance } from './types';

export function getPlayers(): Player[] {
  return playersJson as unknown as Player[];
}

export function getTeamFinance(): Record<string, TeamFinance> {
  return teamsJson as unknown as Record<string, TeamFinance>;
}

export function getTeamSalaries(): Record<string, number> {
  const fin = getTeamFinance();
  return Object.fromEntries(Object.entries(fin).map(([t, f]) => [t, f.salary]));
}

// Standard-contract roster count (excludes two-way and dead money).
export function getRosterCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of getPlayers()) {
    if (p.twoWay || p.deadMoney) continue;
    counts[p.team] = (counts[p.team] ?? 0) + 1;
  }
  return counts;
}
