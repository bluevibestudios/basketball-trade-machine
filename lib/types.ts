export type OptionType = 'player' | 'team' | 'eto';

export interface Player {
  id: string;
  name: string;
  team: string; // tricode
  age: number | null;
  salary: number; // current-season (2025-26) cap hit
  salaries: Record<string, number>;
  options: Record<string, OptionType>;
  guaranteedRemaining: number;
  twoWay: boolean;
  deadMoney: boolean;
  headshot: string;
}

export interface TeamFinance {
  salary: number;
  tier: 'under' | 'over' | 'tax' | 'first' | 'second';
}

// Non-player trade assets: draft picks and cash considerations.
export interface Extra {
  id: string;
  kind: 'pick' | 'cash';
  from: string; // tricode
  to: string; // tricode
  amount?: number; // cash
  year?: number; // pick
  round?: 1 | 2; // pick
}
