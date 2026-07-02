// Free vs Pro gating, per PAID-APP-STRATEGY.md:
//   Free — two-team trades, real salary matching, basic legality verdicts.
//   Pro ($9.99 one-time, no subscription) — multi-team trades, draft-pick
//   trading, apron/hard-cap explanations, save + share trade graphics.

export const PRO_PRICE = '$9.99';

export const PRO_FEATURES = [
  { icon: '🔀', title: '3 & 4-team trades', desc: 'Build the blockbuster multi-team deals' },
  { icon: '🎟️', title: 'Draft-pick trading', desc: 'Add first- and second-round picks to any deal' },
  { icon: '📖', title: 'Full CBA breakdowns', desc: 'Apron, hard-cap, and luxury-tax explanations for every rule' },
  { icon: '📸', title: 'Share trade graphics', desc: 'Save and post polished trade cards' },
] as const;

const KEY = 'btm_pro';

/** Read the persisted Pro flag (client only). `?pro=1|0` overrides for dev/testing. */
export function loadPro(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('pro');
    if (param === '1') { localStorage.setItem(KEY, '1'); return true; }
    if (param === '0') { localStorage.removeItem(KEY); return false; }
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

// TODO(StoreKit): replace both stubs with real IAP via a Capacitor purchases
// plugin (or RevenueCat) once the product exists in App Store Connect.
// Apple requires a working Restore Purchases flow at review time.

export async function purchasePro(): Promise<boolean> {
  try { localStorage.setItem(KEY, '1'); } catch { /* private mode */ }
  return true;
}

export async function restorePurchases(): Promise<boolean> {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}
