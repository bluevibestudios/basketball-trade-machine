// Season-by-season cap thresholds for the future-cap explorer.
// 2025-26 and 2026-27 are official league numbers; later seasons project the
// league's current +7% growth assumption (the CBA allows at most +10%/yr).

export interface SeasonCaps {
  season: string;
  salaryCap: number;
  taxLine: number;
  firstApron: number;
  secondApron: number;
  projected: boolean;
}

const OFFICIAL: SeasonCaps[] = [
  { season: '2025-26', salaryCap: 154_647_000, taxLine: 187_895_000, firstApron: 195_945_000, secondApron: 207_824_000, projected: false },
  { season: '2026-27', salaryCap: 164_961_000, taxLine: 200_428_000, firstApron: 209_015_000, secondApron: 221_686_000, projected: false },
];

const GROWTH = 1.07;
const FUTURE = ['2027-28', '2028-29', '2029-30', '2030-31'];

export const SEASON_CAPS: SeasonCaps[] = (() => {
  const all = [...OFFICIAL];
  let prev = OFFICIAL[OFFICIAL.length - 1];
  for (const season of FUTURE) {
    prev = {
      season,
      salaryCap: Math.round(prev.salaryCap * GROWTH),
      taxLine: Math.round(prev.taxLine * GROWTH),
      firstApron: Math.round(prev.firstApron * GROWTH),
      secondApron: Math.round(prev.secondApron * GROWTH),
      projected: true,
    };
    all.push(prev);
  }
  return all;
})();

export function tierForSeason(total: number, caps: SeasonCaps): 'under' | 'over' | 'tax' | 'first' | 'second' {
  if (total > caps.secondApron) return 'second';
  if (total > caps.firstApron) return 'first';
  if (total > caps.taxLine) return 'tax';
  if (total > caps.salaryCap) return 'over';
  return 'under';
}
