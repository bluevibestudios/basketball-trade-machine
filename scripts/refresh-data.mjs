#!/usr/bin/env node
// Refreshes data/players.json + data/teams.json from Basketball-Reference's
// per-team contract pages (the league-wide page double-counts mid-season
// movers — see memory/README). Usage:
//   npm run data:refresh            # fetch all 30 teams (~2 min, throttled)
//   node scripts/refresh-data.mjs --cache-dir <dir>   # reuse fetched HTML
//
// SEASON ROLLOVER: when B-Ref advances its contract pages to the next league
// year, the y1 column changes meaning. This script hard-fails if the page's
// y1 header differs from EXPECTED_FIRST_SEASON below. To roll the app to a
// new season: update EXPECTED_FIRST_SEASON + SEASONS here, lib/cba.ts CAP
// constants, and lib/capProjections.ts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const EXPECTED_FIRST_SEASON = '2025-26';
const SEASONS = ['2025-26', '2026-27', '2027-28', '2028-29', '2029-30', '2030-31'];
const TWO_WAY_MAX = 700_000;
const CAP = { salaryCap: 154_647_000, taxLine: 187_895_000, firstApron: 195_945_000, secondApron: 207_824_000 };

const TRICODES = 'ATL BOS BRK CHO CHI CLE DAL DEN DET GSW HOU IND LAC LAL MEM MIA MIL MIN NOP NYK OKC ORL PHI PHO POR SAC SAS TOR UTA WAS'.split(' ');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const cacheDirArg = process.argv.indexOf('--cache-dir');
const cacheDir = cacheDirArg !== -1 ? process.argv[cacheDirArg + 1] : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();

async function fetchTeam(tri) {
  if (cacheDir) {
    const f = path.join(cacheDir, `${tri}.html`);
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  }
  const res = await fetch(`https://www.basketball-reference.com/contracts/${tri}.html`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`${tri}: HTTP ${res.status}`);
  const html = await res.text();
  if (html.length < 50_000) throw new Error(`${tri}: page suspiciously small (${html.length} bytes) — blocked?`);
  if (cacheDir) fs.writeFileSync(path.join(cacheDir, `${tri}.html`), html);
  return html;
}

function assertSeason(html, tri) {
  // The y1 column header must be the season this app is built around.
  const m = html.match(/data-stat="y1"[^>]*>([^<]*20\d\d-\d\d[^<]*)</);
  const label = m ? strip(m[1]) : null;
  if (label !== EXPECTED_FIRST_SEASON) {
    throw new Error(
      `${tri}: B-Ref's first salary column is "${label}", expected "${EXPECTED_FIRST_SEASON}".\n` +
      `Basketball-Reference has rolled to a new league year. Follow the SEASON ROLLOVER\n` +
      `steps at the top of this script before refreshing.`,
    );
  }
}

function parseTeam(html, tri) {
  const tStart = html.indexOf('id="contracts"');
  const tableStart = html.lastIndexOf('<table', tStart);
  const end = html.indexOf('</table>', tStart);
  if (tStart === -1 || end === -1) throw new Error(`${tri}: contracts table not found`);
  const table = html.slice(tableStart, end);

  const rows = table.split('<tr ').filter((r) => r.includes('data-stat="player"'));
  const players = [];
  for (const row of rows) {
    const idM = row.match(/data-stat="player"[^>]*csk="([a-z0-9]+)"/i);
    if (!idM) continue; // totals / cap rows
    const nameM = row.match(/data-stat="player"[^>]*>(?:<[^>]+>)*([^<]+)</);
    const ageM = row.match(/data-stat="age_today"[^>]*>(\d+)/);

    const salaries = {};
    const options = {};
    for (let i = 1; i <= 6; i++) {
      const cellM = row.match(new RegExp(`<td class="([^"]*)" data-stat="y${i}"[^>]*?(?:csk="(\\d+)")?\\s*>([^<]*)</td>`));
      if (!cellM || !cellM[2]) continue;
      const season = SEASONS[i - 1];
      salaries[season] = Number(cellM[2]);
      if (cellM[1].includes('salary-pl')) options[season] = 'player';
      else if (cellM[1].includes('salary-tm')) options[season] = 'team';
      else if (cellM[1].includes('salary-et')) options[season] = 'eto';
    }
    const gtdM = row.match(/data-stat="remain_gtd"[^>]*?csk="(\d+)"/);

    const name = nameM ? strip(nameM[1]) : null;
    if (!name || !salaries[SEASONS[0]]) continue; // camp deals with no cap hit
    players.push({
      bbrefId: idM[1],
      name,
      team: tri,
      age: ageM ? Number(ageM[1]) : null,
      salaries,
      options,
      guaranteedRemaining: gtdM ? Number(gtdM[1]) : 0,
    });
  }
  if (players.length < 8) throw new Error(`${tri}: only ${players.length} contracts parsed — page layout changed?`);
  return players;
}

// ---- main ----
const all = [];
for (const tri of TRICODES) {
  const html = await fetchTeam(tri);
  assertSeason(html, tri);
  const players = parseTeam(html, tri);
  all.push(...players);
  process.stdout.write(`${tri}:${players.length} `);
  if (!cacheDir) await sleep(3000); // be polite to B-Ref
}
console.log('\n');

// A player on two teams = dead money on the team paying the smaller figure.
const byId = {};
for (const p of all) (byId[p.bbrefId] ??= []).push(p);

const players = all.map((p) => {
  const cur = p.salaries[SEASONS[0]] ?? 0;
  const dupes = byId[p.bbrefId];
  const deadMoney = dupes.length > 1 && cur < Math.max(...dupes.map((d) => d.salaries[SEASONS[0]] ?? 0));
  return {
    id: p.bbrefId,
    name: p.name,
    team: p.team,
    age: p.age,
    salary: cur,
    salaries: p.salaries,
    options: p.options,
    guaranteedRemaining: p.guaranteedRemaining,
    twoWay: cur > 0 && cur <= TWO_WAY_MAX,
    deadMoney,
  };
});

const teamSalary = {};
for (const p of players) {
  if (p.twoWay) continue;
  teamSalary[p.team] = (teamSalary[p.team] ?? 0) + p.salary;
}
const classify = (s) =>
  s > CAP.secondApron ? 'second' : s > CAP.firstApron ? 'first' : s > CAP.taxLine ? 'tax' : s > CAP.salaryCap ? 'over' : 'under';
const teams = Object.fromEntries(
  TRICODES.map((t) => [t, { salary: teamSalary[t] ?? 0, tier: classify(teamSalary[t] ?? 0) }]),
);

// Sanity print before writing
console.log('Team salaries:');
console.log(
  Object.entries(teams)
    .sort((a, b) => b[1].salary - a[1].salary)
    .map(([t, f]) => `  ${t} $${(f.salary / 1e6).toFixed(1)}M (${f.tier})`)
    .join('\n'),
);

const dataDir = path.join(ROOT, 'data');
fs.writeFileSync(path.join(dataDir, 'players.json'), JSON.stringify(players));
fs.writeFileSync(path.join(dataDir, 'teams.json'), JSON.stringify(teams, null, 2));
fs.writeFileSync(
  path.join(dataDir, 'meta.json'),
  JSON.stringify({ season: EXPECTED_FIRST_SEASON, source: 'basketball-reference per-team contract pages', updatedAt: new Date().toISOString() }, null, 2),
);
console.log(`\nWrote ${players.length} players (${players.filter((p) => p.deadMoney).length} dead-money, ${players.filter((p) => p.twoWay).length} two-way) → data/`);
