import playersJson from '@/data/players.json';
import metaJson from '@/data/meta.json';
import type { Player } from './types';
import type { DataMeta } from './liveData';

export function getPlayers(): Player[] {
  return playersJson as unknown as Player[];
}

export function getMeta(): DataMeta {
  const m = metaJson as { season: string; updatedAt: string };
  return { season: m.season, updatedAt: m.updatedAt };
}
