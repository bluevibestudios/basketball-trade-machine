'use client';

// Stale-while-revalidate roster data. The app boots instantly from the
// bundled dataset, then (a) adopts a newer localStorage copy from a previous
// session, and (b) fetches the latest data from DATA_URL in the background.
//
// DATA_URL points at a directory serving meta.json + players.json — e.g.
// https://raw.githubusercontent.com/<owner>/<repo>/main/data
// Set via NEXT_PUBLIC_DATA_URL at build time. Dev/testing override:
// localStorage.setItem('btm_data_url', '<url>').
//
// Safety: remote data is only adopted when its meta.season matches the season
// this binary's CBA engine is built for — a rolled-over dataset against last
// year's cap constants would be silently wrong everywhere.

import { useEffect, useState } from 'react';
import type { Player } from './types';

const CACHE_KEY = 'btm_data_v1';
const ENV_URL = process.env.NEXT_PUBLIC_DATA_URL || null;

export interface DataMeta {
  season: string;
  updatedAt: string; // ISO — string comparison is chronological
}

interface Snapshot extends DataMeta {
  players: Player[];
}

function validPlayers(p: unknown): p is Player[] {
  return (
    Array.isArray(p) &&
    p.length > 300 &&
    p.slice(0, 3).every(
      (x) => typeof x?.id === 'string' && typeof x?.team === 'string' && typeof x?.salary === 'number' && typeof x?.salaries === 'object',
    )
  );
}

export function useLiveData(initialPlayers: Player[], meta: DataMeta): Snapshot {
  const [snap, setSnap] = useState<Snapshot>({ players: initialPlayers, ...meta });

  useEffect(() => {
    let cancelled = false;
    let current = meta.updatedAt;

    const adopt = (next: Snapshot) => {
      if (cancelled || next.season !== meta.season || next.updatedAt <= current) return;
      current = next.updatedAt;
      setSnap(next);
    };

    // 1) Cached copy from a previous session (survives app restarts offline).
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Snapshot | null;
      if (cached && validPlayers(cached.players)) adopt(cached);
    } catch { /* corrupt cache — ignore */ }

    // 2) Network refresh.
    const base = (() => {
      try { return localStorage.getItem('btm_data_url') || ENV_URL; } catch { return ENV_URL; }
    })();
    if (!base) return;

    (async () => {
      try {
        const metaRes = await fetch(`${base}/meta.json`, { cache: 'no-store' });
        if (!metaRes.ok) return;
        const remoteMeta = (await metaRes.json()) as DataMeta;
        if (remoteMeta.season !== meta.season || remoteMeta.updatedAt <= current) return;

        const playersRes = await fetch(`${base}/players.json`, { cache: 'no-store' });
        if (!playersRes.ok) return;
        const players = await playersRes.json();
        if (!validPlayers(players)) return;

        const next: Snapshot = { players, season: remoteMeta.season, updatedAt: remoteMeta.updatedAt };
        adopt(next);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* storage full */ }
      } catch { /* offline — bundled/cached data stands */ }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return snap;
}
