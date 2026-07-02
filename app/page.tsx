import { TradeMachine } from '@/components/TradeMachine';
import { getPlayers, getMeta } from '@/lib/data';

export default function Home() {
  const players = getPlayers();
  const meta = getMeta();

  return (
    <main className="min-h-screen">
      <TradeMachine initialPlayers={players} meta={meta} />
      <footer className="border-t border-line/60 px-4 py-6 text-center text-[11px] leading-relaxed text-muted">
        Salary &amp; contract figures are publicly available factual data. Team and player names are used for
        identification only. This app is <span className="text-text/70">not affiliated with, endorsed, sponsored, or
        approved by</span> the National Basketball Association, any of its teams, or any player.
      </footer>
    </main>
  );
}
