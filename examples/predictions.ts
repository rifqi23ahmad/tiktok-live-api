/**
 * PK prediction example — run a "guess the PK winner" poll from chat.
 *
 * Viewers vote with `!pilih 1` / `!pilih 2` (or `!tebak`, `!vote`).
 * The engine opens a round when the PK starts, tracks live scores, and
 * awards points to everyone who predicted the winner.
 *
 * Usage:
 *   TIKTOOL_API_KEY=your_key TIKTOK_USERNAME=creator npx tsx predictions.ts
 */

import { TikTokLive, TikTokPKPredictions } from 'tiktok-live-api';

const username = process.env.TIKTOK_USERNAME || '';
if (!username) {
    console.error('Set TIKTOK_USERNAME env var (a creator currently in PK).');
    process.exit(1);
}

const client = new TikTokLive(username, { apiKey: process.env.TIKTOOL_API_KEY });
const pk = new TikTokPKPredictions(client);

pk.on('pollOpen', (p) => {
    console.log(`\n🔥 PK dimulai! Tebak pemenangnya:`);
    p.teams.forEach((t) => console.log(`   ${t.index + 1}. ${t.name}`));
    console.log(`   Ketik "!pilih 1" atau "!pilih 2" di chat.`);
});

pk.on('vote', (v) => {
    console.log(`   🗳️ @${v.uniqueId} pilih tim ${v.teamIndex + 1} (${v.votes[0]} vs ${v.votes[1]})`);
});

pk.on('pollClose', (r) => {
    const verdict = r.winnerIndex === -1 ? 'SERI' : `${r.winnerName} MENANG`;
    console.log(`\n🏁 PK selesai: ${verdict}`);
    console.log(`   Hasil: ${r.teams[0].name} ${r.teams[0].score} — ${r.teams[1].score} ${r.teams[1].name}`);
    console.log(`   Benar: ${r.correctPredictors.map((c) => '@' + c.uniqueId).join(', ') || '(tidak ada)'}`);
});

pk.on('leaderboard', (b) => {
    console.log('\n🏆 Leaderboard prediktor:');
    b.slice(0, 10).forEach((e, i) =>
        console.log(`   ${i + 1}. @${e.uniqueId} — ${e.points} poin (${e.correct}/${e.predictions})`),
    );
});

client.on('disconnected', (e) => console.log(`Disconnected: @${e.uniqueId}`));
client.on('error', (e) => console.error('Error:', e.error));

await pk.connect();
console.log(`Listening for PK battles on @${username}… Ctrl+C to stop.`);
