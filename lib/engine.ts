import { CAP, CASH_LIMIT, classifyTier, maxIncoming, matchRuleLabel, luxuryTax, fmt, fmtShort, type ApronTier } from './cba';
import type { Player, Extra } from './types';

export interface Check {
  label: string;
  ok: boolean;
  severity: 'error' | 'warn' | 'info';
  detail: string;
}

export interface TeamResult {
  tricode: string;
  preSalary: number;
  postSalary: number;
  outgoing: number; // matchable outgoing salary
  incoming: number; // matchable incoming salary
  outPlayers: Player[];
  inPlayers: Player[];
  outPicks: Extra[];
  inPicks: Extra[];
  cashOut: number;
  cashIn: number;
  preTier: ApronTier;
  postTier: ApronTier;
  matchRule: string;
  maxAllowedIncoming: number;
  preTax: number;
  postTax: number;
  rosterCount: number;
  checks: Check[];
  legal: boolean;
}

export interface TradeResult {
  teams: TeamResult[];
  legal: boolean;
  empty: boolean;
}

/** A trade is a set of player movements: each player id -> destination team. */
export type Movements = Record<string, string>; // playerId -> toTricode

// Matchable salary excludes two-way contracts (they don't count toward cap).
const matchable = (p: Player) => (p.twoWay ? 0 : p.salary);

export function evaluateTrade(
  players: Player[],
  teamSalary: Record<string, number>,
  rosterCounts: Record<string, number>,
  movements: Movements,
  extras: Extra[] = [],
): TradeResult {
  const byId = new Map(players.map((p) => [p.id, p]));
  const moved = Object.entries(movements)
    .map(([id, to]) => ({ p: byId.get(id)!, to }))
    .filter((m) => m.p && m.p.team !== m.to);
  const validExtras = extras.filter((e) => e.from !== e.to);

  if (moved.length === 0 && validExtras.length === 0) return { teams: [], legal: true, empty: true };

  const involved = new Set<string>();
  for (const m of moved) {
    involved.add(m.p.team);
    involved.add(m.to);
  }
  for (const e of validExtras) {
    involved.add(e.from);
    involved.add(e.to);
  }

  const teams: TeamResult[] = [];
  for (const tri of involved) {
    const outPlayers = moved.filter((m) => m.p.team === tri).map((m) => m.p);
    const inPlayers = moved.filter((m) => m.to === tri).map((m) => m.p);
    const outgoing = outPlayers.reduce((s, p) => s + matchable(p), 0);
    const incoming = inPlayers.reduce((s, p) => s + matchable(p), 0);

    const outPicks = validExtras.filter((e) => e.kind === 'pick' && e.from === tri);
    const inPicks = validExtras.filter((e) => e.kind === 'pick' && e.to === tri);
    const cashOut = validExtras.filter((e) => e.kind === 'cash' && e.from === tri).reduce((s, e) => s + (e.amount ?? 0), 0);
    const cashIn = validExtras.filter((e) => e.kind === 'cash' && e.to === tri).reduce((s, e) => s + (e.amount ?? 0), 0);

    const preSalary = teamSalary[tri] ?? 0;
    const postSalary = preSalary - outgoing + incoming;
    const preTier = classifyTier(preSalary);
    const postTier = classifyTier(postSalary);

    const room = Math.max(0, CAP.salaryCap - preSalary);
    const bracketAllowed = maxIncoming(outgoing, preTier);
    const roomAllowed = outgoing + room; // under-cap teams absorb with room
    const maxAllowedIncoming = preTier === 'below' ? Math.max(bracketAllowed, roomAllowed) : outgoing;

    const checks: Check[] = [];
    const EPS = 1;

    // 1) Salary matching
    const matchOk = incoming <= maxAllowedIncoming + EPS;
    checks.push({
      label: 'Salary matching',
      ok: matchOk,
      severity: 'error',
      detail: matchOk
        ? `Takes back ${fmtShort(incoming)} against ${fmtShort(outgoing)} out — within the ${fmtShort(maxAllowedIncoming)} limit (${matchRuleLabel(outgoing, preTier)}).`
        : `Takes back ${fmtShort(incoming)} but can only absorb ${fmtShort(maxAllowedIncoming)} (${matchRuleLabel(outgoing, preTier)}). Over by ${fmtShort(incoming - maxAllowedIncoming)}.`,
    });

    // 2) Expanded matching hard-caps a team at the first apron
    if (preTier === 'below' && incoming > outgoing + EPS) {
      const ok = postSalary <= CAP.firstApron + EPS;
      checks.push({
        label: 'First-apron hard cap',
        ok,
        severity: 'error',
        detail: ok
          ? `Using expanded matching is fine — ends at ${fmtShort(postSalary)}, under the ${fmtShort(CAP.firstApron)} apron.`
          : `Taking back more than it sends hard-caps the team at the first apron (${fmtShort(CAP.firstApron)}), but it would land at ${fmtShort(postSalary)}.`,
      });
    }

    // 3) First-apron team cannot cross the second apron
    if (preTier === 'first') {
      const ok = postSalary <= CAP.secondApron + EPS;
      checks.push({
        label: 'Second-apron ceiling',
        ok,
        severity: 'error',
        detail: ok
          ? `Stays below the second apron (${fmtShort(CAP.secondApron)}).`
          : `An over-first-apron team cannot make a trade that pushes it past the second apron (${fmtShort(CAP.secondApron)}); it would reach ${fmtShort(postSalary)}.`,
      });
    }

    // 4) Second-apron restrictions: no aggregation, can't take back more than sent
    if (preTier === 'second') {
      const nonTwoWayOut = outPlayers.filter((p) => !p.twoWay);
      const largestSingleOut = Math.max(0, ...nonTwoWayOut.map((p) => p.salary));
      const aggregating = nonTwoWayOut.length >= 2 && incoming > largestSingleOut + EPS;
      checks.push({
        label: 'No salary aggregation',
        ok: !aggregating,
        severity: 'error',
        detail: aggregating
          ? `Above the second apron, salaries can't be aggregated. Combining ${nonTwoWayOut.length} outgoing players to absorb ${fmtShort(incoming)} is not allowed.`
          : `No prohibited aggregation.`,
      });
      const takeOk = incoming <= outgoing + EPS;
      checks.push({
        label: 'Can’t take back more (2nd apron)',
        ok: takeOk,
        severity: 'error',
        detail: takeOk
          ? `Incoming ${fmtShort(incoming)} does not exceed outgoing ${fmtShort(outgoing)}.`
          : `Above the second apron a team cannot take back more salary than it sends out.`,
      });
    }

    // 5) Roster size (standard contracts, max 15)
    const baseRoster = rosterCounts[tri] ?? 0;
    const rosterCount = baseRoster - outPlayers.filter((p) => !p.twoWay).length + inPlayers.filter((p) => !p.twoWay).length;
    if (rosterCount > 15) {
      checks.push({
        label: 'Roster limit',
        ok: false,
        severity: 'warn',
        detail: `Would carry ${rosterCount} standard contracts; teams may roster at most 15. A waive/second move would be required.`,
      });
    }

    // 6) Cash considerations
    if (cashOut > 0) {
      if (preTier === 'second') {
        checks.push({
          label: 'Cash in trade',
          ok: false,
          severity: 'error',
          detail: `A team above the second apron (${fmtShort(CAP.secondApron)}) cannot send cash in a trade.`,
        });
      } else if (cashOut > CASH_LIMIT + 1) {
        checks.push({
          label: 'Cash limit',
          ok: false,
          severity: 'error',
          detail: `Sends ${fmt(cashOut)} — over the ${fmt(CASH_LIMIT)} league-year cash limit by ${fmt(cashOut - CASH_LIMIT)}.`,
        });
      } else {
        checks.push({
          label: 'Cash in trade',
          ok: true,
          severity: 'info',
          detail: `Sends ${fmt(cashOut)} of the ${fmt(CASH_LIMIT)} allowed. Sending cash hard-caps this team at the second apron for the season.`,
        });
      }
    }

    // 7) Draft picks — Stepien rule (no first-rounders in consecutive future years)
    if (outPicks.length > 0) {
      const firstYears = outPicks.filter((p) => p.round === 1 && p.year).map((p) => p.year!).sort((a, b) => a - b);
      const consecutive = firstYears.some((y, i) => i > 0 && y - firstYears[i - 1] === 1);
      if (consecutive) {
        checks.push({
          label: 'Stepien rule',
          ok: false,
          severity: 'warn',
          detail: 'Trading first-round picks in back-to-back future years is generally prohibited — teams must keep a first-rounder every other year.',
        });
      }
      const label = outPicks.map((p) => `${p.year} ${p.round === 1 ? '1st' : '2nd'}`).join(', ');
      checks.push({ label: 'Draft picks out', ok: true, severity: 'info', detail: `Sends ${label}. Pick ownership isn’t validated — confirm the team controls these.` });
    }

    // 8) Tax / apron movement info
    const preTax = luxuryTax(preSalary);
    const postTax = luxuryTax(postSalary);
    if (Math.abs(postTax - preTax) > 1) {
      checks.push({
        label: 'Luxury tax impact',
        ok: true,
        severity: 'info',
        detail:
          postTax > preTax
            ? `Tax bill rises ${fmtShort(postTax - preTax)} (to ${fmtShort(postTax)}).`
            : `Tax bill falls ${fmtShort(preTax - postTax)} (to ${postTax > 0 ? fmtShort(postTax) : '$0'}).`,
      });
    }

    const legal = checks.every((c) => c.severity !== 'error' || c.ok);
    teams.push({
      tricode: tri,
      preSalary,
      postSalary,
      outgoing,
      incoming,
      outPlayers,
      inPlayers,
      outPicks,
      inPicks,
      cashOut,
      cashIn,
      preTier,
      postTier,
      matchRule: matchRuleLabel(outgoing, preTier),
      maxAllowedIncoming,
      preTax,
      postTax,
      rosterCount,
      checks,
      legal,
    });
  }

  return { teams, legal: teams.every((t) => t.legal), empty: false };
}
