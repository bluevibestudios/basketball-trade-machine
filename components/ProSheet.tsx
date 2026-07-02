'use client';

import { useState } from 'react';
import { PRO_FEATURES, PRO_PRICE, purchasePro, restorePurchases } from '@/lib/pro';

export function ProSheet({
  open,
  onClose,
  onUnlocked,
}: {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  if (!open) return null;

  const buy = async () => {
    setBusy(true);
    const ok = await purchasePro();
    setBusy(false);
    if (ok) { onUnlocked(); onClose(); }
  };

  const restore = async () => {
    const ok = await restorePurchases();
    if (ok) { onUnlocked(); onClose(); }
    else setRestoreMsg('No previous purchase found.');
  };

  return (
    <div data-pro-sheet className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="animate-pop relative w-full max-w-md rounded-t-3xl border border-line bg-panel p-6 pb-8 sm:rounded-3xl" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-md px-2 py-1 text-muted hover:bg-panel2 hover:text-text">✕</button>

        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-mark.png" alt="" width={56} height={56} className="rounded-xl" style={{ width: 56, height: 56 }} />
          <h2 className="mt-3 font-display text-3xl uppercase tracking-wide">
            Go <span className="text-accent">Pro</span>
          </h2>
          <p className="mt-1 font-condensed text-[12px] uppercase tracking-[0.2em] text-muted">
            Pay once · Yours forever · No subscription
          </p>
        </div>

        <ul className="mt-5 space-y-3">
          {PRO_FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">{f.icon}</span>
              <div>
                <div className="font-condensed text-[15px] font-semibold uppercase tracking-wide">{f.title}</div>
                <div className="text-xs text-muted">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>

        <button
          data-pro-buy
          onClick={buy}
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-accent py-3 font-condensed text-lg font-semibold uppercase tracking-wide text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? 'Unlocking…' : `Unlock Pro · ${PRO_PRICE}`}
        </button>
        <button onClick={restore} className="mt-3 w-full text-center text-xs text-muted underline-offset-2 hover:text-text hover:underline">
          Restore purchases
        </button>
        {restoreMsg && <div className="mt-2 text-center text-xs text-rose-300">{restoreMsg}</div>}
      </div>
    </div>
  );
}
