# R2 — Creator Jobs-to-be-Done: TikTok LIVE Streamer Interview Plan + Initial JTBD Map

**Owner:** UX Researcher (d1c4128f)
**Ticket:** IKI-30
**Status:** Interview plan ready to run; JTBD map is a first-pass hypothesis map to validate.
**Date:** 2026-08-14

---

## 0. What this document is (and isn't)

This is a **plan + hypothesis map**, not finished findings. No interviews have been run yet. The JTBD map below is built from three sources, in priority order:

1. **Product context** — `docs/.agents/product-marketing.md` (personas, pain points, customer-language quotes) and the widget set the team has already shipped.
2. **Revealed assumptions** — the 7 widgets + 3 templates already built encode the team's current guesses about what streamers need.
3. **Competitive gap** — the known mismatch between Twitch-first overlay tools (StreamElements/Streamlabs) and TikTok LIVE gift mechanics.

Every job below is a **hypothesis to validate** through the interview protocol in §3. Jobs are ranked by *hypothesized* unmet need, not by measured demand. Confidence is low-to-medium until interviews run.

---

## 1. Method & Sample (plan)

**Method:** 45–60 min semi-structured interviews, remote (TikTok DM → voice/video or WhatsApp). Exploratory, not evaluative — we are mapping jobs and pain points, not testing our UI yet.

**Sample target (first wave):**
- **8–12 streamers**, small-to-mid TikTok LIVE, Indonesia-first.
  - 3–4 stream with **no overlay** (raw screen or TikTok filters only) — highest unmet-need signal.
  - 3–4 stream with **Twitch-port overlays** (StreamElements/Streamlabs) — migration pain signal.
  - 1–2 who **tried DIY/open-source** connectors and gave up — breakage pain signal.
  - 1–2 who already **monetize via gifts** and care about the gift loop.
- **2–3 talent managers / agency owners** — the "manage many streamers" job (segment-specific).

**Sample size rationale:** this is directional, not statistical. 8–12 is enough to saturate the top 4–6 JTBD themes in a first map; we are looking for recurring jobs, not frequencies.

**Where to find them:**
- TikTok LIVE itself: watch small streamers live, then DM after stream with a short, specific ask.
- Indonesian streamer Discord/Telegram/WhatsApp groups (streamer and "live seller" communities).
- TikTok LIVE **seller/affiliate** groups — many go live to sell and already think about retention.
- The product's own TikTok account comments (CMO content plan, `docs/rencana-tiktok.md`) — inbound signal.
- Snowball: ask each recruit for 1–2 referrals.

**Screener (5 questions, 60 seconds):**
1. Seberapa sering kamu live di TikTok? (target: minimal 2x/minggu)
2. Sekarang layar kamu pakai apa saat live? (pilihan: polos / filter TikTok bawaan / overlay Twitch / custom dari orang)
3. Kira-kira berapa penonton bersamaan biasanya? (bucket: <50 / 50–200 / 200+)
4. Apakah gift jadi sumber penghasilan buat kamu? (ya / tidak / mulai)
5. Kamu live sendiri atau dikelola agency/manager? (sendiri / agency)

**Compensation (optional):** 15–30 menit kredit/pulsa atau share hasil riset; for agencies, a free early-access studio account.

---

## 2. Interview Protocol (organized by JTBD)

Frame every block with the structure: **"when I [situation], I want to [motivation], so I can [outcome]"**. Start each block with a concrete recent-stream recount (behavior beats abstraction), then probe the job.

**Opening (5 min) — recent-stream recount**
- "Ceritakan live terakhirmu dari awal sampai selesai. Apa yang terjadi di layar, apa yang terjadi di chat?"

**Block A — gift moments (5–8 min)**
- "Ceritakan momen terakhir ada yang kasih gift. Apa yang muncul di layarmu? Apa yang kamu lakukan?"
- "Ketika ada yang gift, aku ingin ____ supaya ____." (isian JTBD)
- Probe: apakah kamu tahu siapa top gifter-mu? Kamu sebut namanya? Bagaimana perasaanmu saat gift besar masuk tapi layar tidak berubah?

**Block B — silent viewers (5–8 min)**
- "Ceritakan momen penonton diam saja. Apa yang kamu coba biar mereka ikut?"
- "Ketika penonton cuma nonton diam, aku ingin ____ supaya ____."
- Probe: pernah coba game/ajakan interaksi? Apa yang bikin penonton akhirnya ikut?

**Block C — looking professional (5 min)**
- "Pernah lihat layar streamer lain yang lebih 'hidup'? Apa yang kamu rasakan? Apa yang kamu lakukan?"
- "Ketika aku bandingkan layarku sama streamer besar, aku ingin ____ supaya ____."

**Block D — setup & reliability (5 min)**
- "Ceritakan persiapanmu sebelum live. Berapa lama? Apa yang paling sering bermasalah?"
- "Ketika overlay/tool-ku error pas live, aku ingin ____ supaya ____."
- Probe: pernah overlay rusak di tengah live? Apa yang terjadi?

**Block E — PK / battle (5 min, skip if they don't do PK)**
- "Ceritakan momen PK terakhirmu. Apa yang kamu lakukan supaya penonton ngepush?"
- "Ketika aku lagi PK, aku ingin ____ supaya ____."

**Block F — agency only (5 min)**
- "Ketika kamu nambah streamer baru, apa yang paling lambat/lama di setup layarnya?"
- "Ketika aku kelola banyak streamer, aku ingin ____ supaya ____."

**Closing (5 min)**
- Rank: "Dari semua yang kita bahas, kalau ada satu hal yang paling mengganggu saat live, apa itu?"
- "Kalau ada tool ajaib yang mengubah layarmu, apa satu hal yang harus dia lakukan?"

---

## 3. Initial JTBD Map (hypotheses, ranked by unmet need)

Confidence labels: **H = hypothesis** (unvalidated), **PM = product-context-derived**, **RA = revealed assumption** (already-built widget).

| Rank | Job (when I… want to… so I can…) | Functional / Emotional / Social | Kano | Evidence base | Hypothesis to validate |
|---|---|---|---|---|---|
| 1 | **A. Gift → on-screen recognition** — "Ketika ada yang gift, aku ingin itu langsung terlihat & disorot di layar, supaya si gifter merasa dihargai dan penonton lain ikut gift." | Functional (recognition loop) + Emotional (gifter feels seen) | Must-have baseline → Performance at tiered/combo | PM: *"Gift masuk tapi tidak ada yang disorot di layar."* RA: Gift Alert + Combo, Gift Leaderboard, Goal Bar already built. Gap: Twitch tools don't read diamond/gift tier. | Streamers feel losing real money when gifts go unrecognized; recognition drives repeat gifts. |
| 2 | **B. Turn viewers into participants** — "Ketika penonton cuma diam, aku ingin kasih mereka cara ikut main, supaya mereka tahan lebih lama dan rame." | Functional + Social (feel like an event, not a broadcast) | Delighter (mini-games) | PM: *"Layar saya polos, penonton cepat bosan."* *"Saya mau mainin penonton biar rame."* RA: Marble Race, Gift War, Avatar Arena. | Silence is the #1 pain; interactive games are the biggest perceived differentiator vs competitors. |
| 3 | **C. Look professional without resources** — "Ketika aku live, aku ingin layar terlihat kayak streamer besar, supaya kelihatan kredibel dan penonton nggak pindah." | Emotional + Social (fear of looking amateur) | Must-have | PM: *"kalau layar saya jelek, penonton pindah."* *"tapi nggak ngerti coding."* | Credibility anxiety is the emotional driver; no-code is the purchase trigger, not the deep need. |
| 4 | **D. Setup + reliability** — "Ketika aku siap live, aku ingin pasang overlay & percaya nggak rusak di tengah, supaya fokus entertain bukan ngoprek." | Functional (hygiene) | Must-have (hygiene) | PM: *"Takut TikTok ganti sistem lalu overlay rusak."* *"Butuh API key, ribet."* Gap: DIY libs break on protocol changes. | Setup friction and breakage risk are the top blockers to adoption, not to delight. |
| 5 | **E. Rally audience during PK/battle** — "Ketika lagi PK, aku ingin penonton kompak ngepush, supaya menang lebih banyak battle." | Social + Emotional (competition) | Delighter (PK-heavy niche) | RA: Poll/Prediction (tebak pemenang PK) already built. Gap: no Twitch analog for PK. | PK is a high-intensity, gift-spiking moment; prediction/vote is a strong retention hook for PK streamers. |
| 6 | **F. Set up many streamers consistently** — "Ketika aku kelola banyak streamer, aku ingin satu konfigurasi overlay yang bisa dipakai ulang, supaya onboarding cepat & konsisten." | Functional (scale) | Performance (agency segment) | PM: agency persona. *"Setup overlay manual per streamer lambat dan tidak konsisten."* | Agencies value reusable templates/configs over per-streamer custom design. |

**Kano readout (don't over-invest in the wrong thing):**
- **Must-haves (D, C, A-baseline):** reliable connection, gift alert, goal bar, leaderboard, decent default look. If these fail, no amount of mini-games saves us.
- **Performance (A-tiered, F):** richer tiered alerts, real-time leaderboard, reusable agency configs — satisfaction scales with how well these "just work."
- **Delighters (B, E):** mini-games and PK prediction — the "viewers are actually playing" moments no Twitch-first competitor has.

---

## 4. So-what for Stream Studio (per top job)

- **Job A →** Keep the gift loop front and center in onboarding: first-run should prove "gift in → visible, tiered, on screen." Add a "top sultan" readout that updates live and a combo meter. This is the revenue-relevant job — invest before breadth.
- **Job B →** Lead marketing and demo with the mini-games (Marble Race/Gift War/Avatar Arena), because "penonton jadi main" is our sharpest differentiation vs Twitch-port tools. Make one game the hero of every demo.
- **Job C →** Ship 3–5 more polished templates; "look professional in 4 steps" is the conversion argument for the no-code buyer. Template gallery = credibility anxiety antidote.
- **Job D →** The demo mode (no API key) directly answers the setup-friction objection — keep it and surface it early. Add a "won't break when TikTok updates" reassurance in onboarding (signing handled by TikTool).
- **Job E →** For PK-heavy streamers, put prediction/vote one click away. Consider a PK-specific template.
- **Job F →** Add "save template / duplicate overlay" as an agency feature; it is the single highest-leverage move for the agency segment.

---

## 5. Summary — Top 3 jobs + Top 3 recommendations

**Top 3 jobs (to validate first):**
1. **Gift → on-screen recognition loop** (rank 1) — the job that touches revenue directly.
2. **Turn viewers into participants** (rank 2) — the job that ties to the north star ("more viewers, longer").
3. **Look professional without resources** (rank 3) — the emotional driver behind every purchase decision.

**Top 3 product recommendations:**
1. Make **first-run onboarding prove the gift loop** (gift in → visible/tiered/leaderboard) before anything else — Job A.
2. **Lead every demo/marketing with one mini-game** (Marble Race/Gift War/Avatar Arena) — Job B.
3. **Ship more templates + keep the no-API-key demo mode prominent**, and add **reusable/duplicate overlays for agencies** — Jobs C, D, F.

---

## 6. Confidence & Known Gaps

- **Confidence: low-to-medium.** This is a hypothesis map built from product context and revealed assumptions, not from live interviews. No statistical claims are made.
- **Sample bias (explicit):** Indonesia-first, small-to-mid streamers recruited via TikTok DM/communities self-select toward streamers who already care about their screen; findings won't generalize to large creators, other markets, or streamers indifferent to overlays.
- **Triangulation plan:** validate each job across ≥3 independent sources — interviews (this plan), community/audience feedback mining (R3, IKI-31), and competitor teardown (R1, IKI-29). No recommendation should ship on a single source.
- **Next step after interviews:** convert validated jobs into a ranked JTBD map with verbatim quotes (Voice of Customer), then hand UX specs to the Designer and roadmap input to the PM.

---

## 7. Next Actions

1. **Run the interviews** (owner: UX Researcher; needs PM sign-off on recruiting + a named contact list). This is the live continuation of this ticket.
2. After 5–6 interviews, do a mid-flight check: are the top-3 jobs (A/B/C) recurring? Adjust protocol if a new job emerges.
3. Merge findings with R1 (IKI-29) and R3 (IKI-31) into one triangulated JTBD map for the PM.
