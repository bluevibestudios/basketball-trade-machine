// 2025-26 NBA CBA constants and salary-matching math.
// Sources: NBA.com (cap set at $154.647M), Hoops Rumors (apron/tax lines,
// salary-matching brackets), Sports Business Classroom.

export const SEASON = '2025-26';

export const CAP = {
  salaryCap: 154_647_000,
  taxLine: 187_895_000,
  firstApron: 195_945_000,
  secondApron: 207_824_000,
  minTeamSalary: 139_182_000,
} as const;

// Max cash a team may send (or receive) across all trades in the league year.
export const CASH_LIMIT = 7_964_000;

// Salary-matching bracket thresholds (2025-26).
export const MATCH = {
  lowTier: 7_500_000, // outgoing at/under this: 200% + $250k
  midTier: 29_000_000, // between low and this: outgoing + $7.5M
  flatAdd: 250_000,
  midAdd: 7_500_000,
} as const;

export type ApronTier = 'below' | 'first' | 'second';

export function classifyTier(teamSalary: number): ApronTier {
  if (teamSalary > CAP.secondApron) return 'second';
  if (teamSalary > CAP.firstApron) return 'first';
  return 'below';
}

/**
 * Max incoming salary a team may take back, given its outgoing salary and the
 * matching tier that applies to it.
 *  - below first apron: the 3-bracket rule
 *  - first/second apron: cannot take back more than it sends out (100%)
 */
export function maxIncoming(outgoing: number, tier: ApronTier): number {
  if (tier !== 'below') return outgoing; // apron teams: 100% matching only
  if (outgoing <= MATCH.lowTier) return outgoing * 2 + MATCH.flatAdd;
  if (outgoing <= MATCH.midTier) return outgoing + MATCH.midAdd;
  return outgoing * 1.25 + MATCH.flatAdd;
}

/** Human-readable description of the matching rule applied. */
export function matchRuleLabel(outgoing: number, tier: ApronTier): string {
  if (tier === 'second')
    return 'Over 2nd apron — limited to 100% of outgoing, no salary aggregation';
  if (tier === 'first')
    return 'Over 1st apron — limited to 100% of outgoing salary';
  if (outgoing <= MATCH.lowTier) return '200% of outgoing + $250K';
  if (outgoing <= MATCH.midTier) return 'Outgoing + $7.5M';
  return '125% of outgoing + $250K';
}

// Progressive luxury-tax schedule (standard / non-repeater).
// Incremental rate per dollar within each band above the tax line.
const TAX_BANDS: { upTo: number; rate: number }[] = [
  { upTo: 5_000_000, rate: 1.5 },
  { upTo: 10_000_000, rate: 1.75 },
  { upTo: 15_000_000, rate: 2.5 },
  { upTo: 20_000_000, rate: 3.25 },
];
// Above $20M over the line: 3.75, then +0.5 each additional $5M.

export function luxuryTax(teamSalary: number): number {
  let over = teamSalary - CAP.taxLine;
  if (over <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const band of TAX_BANDS) {
    const slice = Math.min(over, band.upTo) - prev;
    if (slice > 0) tax += slice * band.rate;
    prev = band.upTo;
    if (over <= band.upTo) return tax;
  }
  // Beyond $20M over the line.
  let rate = 3.75;
  let remaining = over - 20_000_000;
  tax += Math.min(remaining, 5_000_000) * rate;
  remaining -= 5_000_000;
  while (remaining > 0) {
    rate += 0.5;
    tax += Math.min(remaining, 5_000_000) * rate;
    remaining -= 5_000_000;
  }
  return tax;
}

export const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const fmtShort = (n: number) => {
  const m = n / 1_000_000;
  return `$${m.toFixed(m >= 100 ? 1 : 2)}M`;
};
