// Free vs Pro gating, per PAID-APP-STRATEGY.md:
//   Free — two-team trades, real salary matching, basic legality verdicts.
//   Pro ($9.99 one-time, no subscription) — multi-team trades, draft-pick
//   trading, apron/hard-cap explanations, cap outlook, share graphics.
//
// On iOS the purchase runs through StoreKit 2 via @capgo/native-purchases.
// In the browser (dev) it falls back to a localStorage stub so the web
// preview stays testable. The product must exist in App Store Connect as a
// non-consumable with id PRO_PRODUCT_ID before release; for local testing,
// ios/App/App/Pro.storekit provides it via Xcode's StoreKit test environment.

import { Capacitor } from '@capacitor/core';

export const PRO_PRICE = '$9.99'; // fallback label; iOS shows the store's localized price
export const PRO_PRODUCT_ID = 'pro_unlock';

export const PRO_FEATURES = [
  { icon: '🔀', title: '3 & 4-team trades', desc: 'Build the blockbuster multi-team deals' },
  { icon: '🎟️', title: 'Draft-pick trading', desc: 'Add first- and second-round picks to any deal' },
  { icon: '📖', title: 'Full CBA breakdowns', desc: 'Apron, hard-cap, and luxury-tax explanations for every rule' },
  { icon: '📅', title: 'Future cap outlook', desc: 'Every contract through 2030-31, trade-aware' },
  { icon: '📸', title: 'Share trade graphics', desc: 'Save and post polished trade cards' },
] as const;

const KEY = 'btm_pro';
const isNative = () => Capacitor.isNativePlatform();

function persist(owned: boolean) {
  try {
    if (owned) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch { /* private mode */ }
}

/** Fast synchronous read of the persisted flag. `?pro=1|0` overrides for dev. */
export function loadPro(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('pro');
    if (param === '1') { persist(true); return true; }
    if (param === '0') { persist(false); return false; }
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Localized price from the store (native), or the fallback label. */
export async function getProPrice(): Promise<string> {
  if (!isNative()) return PRO_PRICE;
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
    const { product } = await NativePurchases.getProduct({
      productIdentifier: PRO_PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
    });
    return product?.priceString || PRO_PRICE;
  } catch {
    return PRO_PRICE;
  }
}

/** Does the store say this account owns Pro? (native only) */
async function ownsPro(): Promise<boolean> {
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.INAPP,
      onlyCurrentEntitlements: true, // excludes refunded/revoked purchases
    });
    return (purchases ?? []).some((p) => p.productIdentifier === PRO_PRODUCT_ID);
  } catch {
    return false;
  }
}

/** Launch-time entitlement sync: grants Pro if the store account owns it
 *  (covers reinstalls and new devices without an explicit Restore tap). */
export async function syncEntitlement(): Promise<boolean> {
  if (!isNative()) return false;
  const owned = await ownsPro();
  if (owned) persist(true);
  return owned;
}

export async function purchasePro(): Promise<boolean> {
  if (!isNative()) {
    // Browser dev stub — real payments only exist inside the iOS app.
    persist(true);
    return true;
  }
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
    await NativePurchases.purchaseProduct({
      productIdentifier: PRO_PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1,
    });
    persist(true);
    return true;
  } catch {
    return false; // cancelled or failed — no entitlement
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!isNative()) return loadPro();
  try {
    const { NativePurchases } = await import('@capgo/native-purchases');
    await NativePurchases.restorePurchases();
  } catch { /* fall through to entitlement check */ }
  const owned = await ownsPro();
  if (owned) persist(true);
  return owned;
}
