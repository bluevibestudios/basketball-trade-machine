// Renders a shareable 1080x1080 trade-card PNG from a TradeResult.
// Watermarked with the app name — per PAID-APP-STRATEGY.md this is the
// organic growth loop (every posted card is an ad).

import type { TradeResult, TeamResult } from './engine';
import { TEAM_BY_TRICODE } from './teams';
import { fmtShort } from './cba';

const W = 1080;
const H = 1080;

const BG = '#0a0a0b';
const PANEL = '#141315';
const LINE = '#2c2a2e';
const TEXT = '#f1ece6';
const MUTED = '#9a948c';
const ACCENT = '#f86b1e';
const GREEN = '#34d399';
const RED = '#fb7185';

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function textOn(hex: string): string {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#0b0e14' : '#ffffff';
}

function ellipsize(ctx: CanvasRenderingContext2D, s: string, max: number): string {
  if (ctx.measureText(s).width <= max) return s;
  while (s.length > 1 && ctx.measureText(s + '…').width > max) s = s.slice(0, -1);
  return s + '…';
}

function drawTeamPanel(ctx: CanvasRenderingContext2D, t: TeamResult, x: number, y: number, w: number, h: number) {
  const team = TEAM_BY_TRICODE[t.tricode];

  rr(ctx, x, y, w, h, 22);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  // team-color top edge
  ctx.save();
  rr(ctx, x, y, w, h, 22);
  ctx.clip();
  ctx.fillStyle = team.primary;
  ctx.fillRect(x, y, w, 8);
  ctx.restore();

  // badge
  const bs = 56;
  rr(ctx, x + 22, y + 26, bs, bs, 12);
  ctx.fillStyle = team.primary;
  ctx.fill();
  ctx.strokeStyle = team.secondary;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = textOn(team.primary);
  ctx.font = '700 19px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(t.tricode, x + 22 + bs / 2, y + 26 + bs / 2 + 1);

  // name + payroll delta
  ctx.textAlign = 'left';
  ctx.fillStyle = TEXT;
  ctx.font = '600 26px Oswald, sans-serif';
  ctx.fillText(ellipsize(ctx, team.name.toUpperCase(), w - bs - 66), x + 22 + bs + 14, y + 44);
  const delta = t.postSalary - t.preSalary;
  ctx.font = '400 19px Oswald, sans-serif';
  ctx.fillStyle = MUTED;
  const deltaStr = Math.abs(delta) > 1 ? `${fmtShort(t.postSalary)} (${delta > 0 ? '▲' : '▼'}${fmtShort(Math.abs(delta))})` : fmtShort(t.postSalary);
  ctx.fillText(deltaStr, x + 22 + bs + 14, y + 70);

  // acquires list
  let cy = y + 122;
  ctx.font = '600 17px Oswald, sans-serif';
  ctx.fillStyle = GREEN;
  ctx.fillText('ACQUIRES', x + 22, cy);
  cy += 30;

  const rows: { name: string; val: string }[] = [
    ...t.inPlayers.map((p) => ({ name: p.name, val: fmtShort(p.salary) })),
    ...t.inPicks.map((p) => ({ name: `${p.year} ${p.round === 1 ? '1st' : '2nd'}-round pick`, val: '' })),
    ...(t.cashIn > 0 ? [{ name: 'Cash', val: fmtShort(t.cashIn) }] : []),
  ];
  if (rows.length === 0) rows.push({ name: '—', val: '' });

  const maxRows = 7;
  for (const [i, row] of rows.slice(0, maxRows).entries()) {
    if (i === maxRows - 1 && rows.length > maxRows) {
      ctx.fillStyle = MUTED;
      ctx.font = '400 19px Oswald, sans-serif';
      ctx.fillText(`+ ${rows.length - maxRows + 1} more…`, x + 22, cy);
      break;
    }
    ctx.fillStyle = TEXT;
    ctx.font = '500 21px Oswald, sans-serif';
    ctx.fillText(ellipsize(ctx, row.name, w - 44 - (row.val ? 92 : 0)), x + 22, cy);
    if (row.val) {
      ctx.textAlign = 'right';
      ctx.fillStyle = MUTED;
      ctx.font = '400 19px Oswald, sans-serif';
      ctx.fillText(row.val, x + w - 22, cy);
      ctx.textAlign = 'left';
    }
    cy += 34;
  }
}

export async function renderTradeCard(result: TradeResult): Promise<Blob> {
  // Best effort: make sure the brand fonts are ready before drawing.
  try {
    await Promise.all([
      document.fonts.load('700 80px Anton'),
      document.fonts.load('600 26px Oswald'),
    ]);
  } catch { /* draw with fallbacks */ }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.8, -80, 60, W * 0.8, -80, 900);
  glow.addColorStop(0, 'rgba(248,107,30,0.22)');
  glow.addColorStop(1, 'rgba(248,107,30,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // verdict header
  const legal = result.legal;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = legal ? GREEN : RED;
  ctx.font = '80px Anton, sans-serif';
  ctx.fillText(legal ? 'TRADE IS LEGAL' : 'TRADE NOT ALLOWED', W / 2, 128);
  ctx.fillStyle = MUTED;
  ctx.font = '600 22px Oswald, sans-serif';
  ctx.fillText('2025-26 SEASON · CHECKED AGAINST THE FULL CBA', W / 2, 168);

  // team panels — 1-2 across, wrap to a second row for 3-4 team deals
  const teams = result.teams;
  const perRow = teams.length <= 2 ? teams.length : 2;
  const rows = Math.ceil(teams.length / perRow);
  const gap = 24;
  const marginX = 48;
  const top = 216;
  const availH = 980 - top;
  const panelW = (W - marginX * 2 - gap * (perRow - 1)) / perRow;
  // Single-row (2-team) cards get taller panels so the card doesn't feel empty.
  const panelH = Math.min(rows === 1 ? 620 : 390, (availH - gap * (rows - 1)) / rows);

  teams.forEach((t, i) => {
    const r = Math.floor(i / perRow);
    const c = i % perRow;
    const rowCount = r === rows - 1 ? teams.length - r * perRow : perRow;
    const rowW = rowCount * panelW + (rowCount - 1) * gap;
    const startX = (W - rowW) / 2;
    drawTeamPanel(ctx, t, startX + c * (panelW + gap), top + r * (panelH + gap), panelW, panelH);
  });

  // watermark footer
  ctx.textAlign = 'center';
  ctx.fillStyle = ACCENT;
  ctx.font = '34px Anton, sans-serif';
  ctx.fillText('BASKETBALL TRADE MACHINE', W / 2, H - 42);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

/** Share the card via the native sheet when available, else download it. */
export async function shareTradeCard(result: TradeResult): Promise<'shared' | 'downloaded'> {
  const blob = await renderTradeCard(result);
  const file = new File([blob], 'trade.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Basketball Trade Machine' });
      return 'shared';
    } catch { /* user cancelled — fall through to download */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trade.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}
