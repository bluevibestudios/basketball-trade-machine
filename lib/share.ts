import type { Extra } from './types';
import type { Movements } from './engine';

export interface TradeState {
  teams: string[];
  movements: Movements;
  extras: Extra[];
}

// Compact base64url encoding of the whole trade for shareable URLs.
export function encodeTrade(state: TradeState): string {
  const compact = {
    s: state.teams,
    m: state.movements,
    e: state.extras.map((x) => [x.kind === 'cash' ? 'c' : 'p', x.from, x.to, x.amount ?? 0, x.year ?? 0, x.round ?? 0, x.id]),
  };
  const json = JSON.stringify(compact);
  const b64 = typeof window === 'undefined' ? Buffer.from(json).toString('base64') : btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeTrade(token: string): TradeState | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof window === 'undefined' ? Buffer.from(b64, 'base64').toString() : decodeURIComponent(escape(atob(b64)));
    const c = JSON.parse(json);
    if (!Array.isArray(c.s)) return null;
    const extras: Extra[] = (c.e ?? []).map((a: unknown[]) => ({
      kind: a[0] === 'c' ? 'cash' : 'pick',
      from: a[1],
      to: a[2],
      amount: a[3] || undefined,
      year: a[4] || undefined,
      round: a[5] || undefined,
      id: (a[6] as string) ?? `x${Math.random().toString(36).slice(2, 8)}`,
    }));
    return { teams: c.s, movements: c.m ?? {}, extras };
  } catch {
    return null;
  }
}
