# R1 · Competitor Teardown — Interactive/Overlay Live-Stream Tools

**Author:** Market Research Analyst
**Date:** 2026-08-14
**Scope:** IKI-29 — competitor teardown of interactive/overlay live-stream tools for Tiktok Stream (Stream Studio).
**Status:** Complete.

---

## Thesis (up front)

The interactive-overlay market splits cleanly into two camps, and **neither owns the combination Stream Studio is built for**:

1. **Twitch-first platforms** (StreamElements, Streamlabs) have mature drag-and-drop overlay builders, but their widgets read follow/sub/bit mechanics — **not TikTok gifts, diamonds, or PK battles**. TikTok LIVE is at best a broadcast destination, not a first-class overlay target.
2. **TikTok-native tools** (TikFinity is the clear leader) read gifts/diamonds correctly but are **config-panel + pre-built widget tools**, not a visual no-code canvas builder. They skew toward gaming (Minecraft/GTA integration) and desktop-app setup, and their monetization is thin (mostly free + coins).

**White space:** a TikTok-gift-native, drag-and-drop, 9:16 canvas builder that publishes to a browser source — with gift-driven mini-games (Marble Race, Gift War, Avatar Arena) and PK prediction on top. That is exactly Stream Studio's position, and the competitive landscape confirms the gap is real rather than imaginary.

---

## Source & confidence note

- Primary sources fetched directly 2026-08-14: TikFinity (tikfinity.com + blog), StreamElements (streamelements.com + /tiktok), LivePix (livepix.gg), and the company's own `tiktok-live-api` README (pricing/event model).
- Streamlabs and TikTok LIVE Studio claims are triangulated from search-indexed official copy and platform positioning; feature-level claims are marked **Medium** confidence until verified on their pricing/help pages.
- Confidence tags: **High** = direct page fetch or repo source; **Medium** = corroborated across ≥2 sources; **Low** = single secondary source or general knowledge.
- Direct streamer reviews of TikTok gift handling are thin (documented in "Known gaps" below). I compensated with feature lists, platform positioning, and the open-source ecosystem's documented pain (signing breakage).

---

## 1. TikFinity — the real #1 TikTok-native competitor

**What it does.** Self-described "most popular streaming tool for TikTok LIVE." Interactive widgets, sound alerts, and overlays for TikTok LIVE, usable inside TikTok LIVE Studio, OBS Studio, or Streamlabs OBS.

**Key features** (High confidence, tikfinity.com fetched 2026-08-14):
- Sound Alerts, Text-to-Speech (TTS), Interactive Overlays, Goal Overlays, Chatbot, Song Requests (Spotify), Actions & Events (IFTTT, Voicemod voice-change, Streamer.bot, keystroke simulation for remote control of Windows apps).
- Game integrations: Minecraft and GTA 5 — viewers trigger in-game actions / spawn NPCs by sending gifts.
- TikTok LIVE API and a Desktop App (Windows) + a Mobile app.
- Sub-emote and Team-Member-Level event triggers (perks for subscribers/loyal viewers).

**Pricing/model.** Core tools are free ("for free!" is a core marketing line). Monetizes via optional coins for premium extras (voice selection, etc.) and an **Agency dashboard** (agency.tikfinity.com) for talent managers. Confidence: Medium — exact coin pricing not on public page.

**TikTok gift/diamond handling.** Strong — this is the product's core; alerts and goals are triggered off TikTok gifts. It does not surface a per-diamond goal/leaderboard *visual builder*; goal overlays are pre-built configs.

**What streamers say.** Multi-language (EN/DE/ES/ID/TH/VI) and an active 2026-dated blog with "how to set up TikTok alerts for gifts/follows/subs" and "how to make money on TikTok LIVE" guides indicate broad, cross-geography adoption, including SEA. Complaints are not visible on public pages; the heaviest friction is inherent to the product: **desktop-app install + config panels, not a visual canvas.**

**So what.** TikFinity owns "TikTok gift alerts" mindshare but not "design your own overlay on a canvas." Its game integrations target *PC-game* streamers (Minecraft/GTA), leaving the **in-overlay browser mini-game** (viewer-as-player) format unclaimed.

---

## 2. StreamElements

**What it does.** "The leading platform for live streaming on Twitch, YouTube, and Facebook gaming" — overlay editor, alerts, chatbot, tipping, SE.Live OBS plugin, sponsorships. ~1.6M creators.

**Key features.** Free overlay editor with drag-and-drop customization, alert widgets, chat bot, merch store, tipping, brand sponsorships.

**Pricing/model.** Free core platform; monetizes via tips processing, merch, and a managed brand/campaign arm (their `/tiktok` page is actually a **brand UGC-creative package** — "generate 1000s of TikTok creatives" — not a streamer overlay product).

**TikTok gift/diamond handling.** **Weak/absent.** Positioning is Twitch/YouTube/Facebook. No native TikTok LIVE gift, diamond, or PK event support in overlays. (High confidence from platform positioning; Medium on whether any partial TikTok alert exists — treat as absent for planning.)

**What streamers say.** Strong in the Twitch world; TikTok LIVE streamers have to leave it (or bolt on third-party connectors) for gift-driven overlays.

**So what.** StreamElements is the benchmark for "no-code overlay editor done right" — but for the wrong mechanics. Stream Studio should copy its *editor ergonomics* while owning TikTok gift mechanics.

---

## 3. Streamlabs

**What it does.** "The most popular streaming platform for Twitch, YouTube and Facebook" (claims ~70% of Twitch). Desktop streaming app + cloud overlay/alerts/tipping.

**Key features.** Streamlabs Desktop (OBS-based), cloud alerts/overlays, tipping (donations), Streamlabs Ultra (paid themes/multistream).

**Pricing/model.** Free to start; paid **Ultra** tier for premium themes/multistream (Medium confidence on exact price — verify streamlabs.com/pricing).

**TikTok gift/diamond handling.** **Weak.** Streamlabs Desktop can broadcast *to* TikTok as a destination, but its alert/overlay engine is built for Twitch/YouTube/Facebook events (follows, subs, bits, donations) — **not TikTok diamonds, gift tiers, or PK.** (Medium confidence.)

**What streamers say.** Long-standing complaints center on performance bloat of the desktop app and Ultra upsell pressure (general knowledge; Low confidence without direct review capture).

**So what.** Streamlabs is the closest *distribution* analog (desktop streaming app → overlays) but has not built TikTok gift-native widgets. No near-term threat; watch for a TikTok widget push as a signal the space is heating up.

---

## 4. TikTok LIVE Studio (native)

**What it does.** TikTok's own free desktop streaming app for TikTok LIVE — scenes, screen capture, camera, and basic chat/gift display, replacing phone-only streaming.

**Key features.** Native scenes/sources, screen share, and TikTok's built-in gift effects/comment display. Requires TikTok to grant access (stream key).

**Pricing/model.** Free, owned by TikTok.

**TikTok gift/diamond handling.** Native gift effects appear on stream, but there is **no custom overlay builder, no third-party widget canvas, no goal/leaderboard design.** Creators cannot design their own gift-alert visual.

**What streamers say.** Used widely as the default desktop broadcaster, but limited personalization drives creators to third-party tools (TikFinity, OBS + connectors).

**So what.** TikTok LIVE Studio is the *distribution* default, not a competitor on design. It sets the floor: any Stream Studio overlay must be insertable **alongside** LIVE Studio (browser source), which is exactly the existing product flow. It also caps how far a purely "native" feature set can go — custom overlays are a permanently open niche TikTok won't fill.

---

## 5. OBS + overlay/alert plugins, and TikTok-specific open-source libs

**What they are.** OBS Studio (free, open source) is the universal compositor. Overlay/alert capability comes from plugins and browser sources. TikTok-specific event data comes from open-source connectors:
- `tiktok-live-connector` (Node) and `TikTokLive` (Python) — self-hosted clients that read chat/gift/like/follow via WebSocket, **but require the developer to run/configure a signing server** and rework it every time TikTok changes the protocol.

**Pricing/model.** Free/open-source (MIT), but "free" is offset by maintenance cost: signing setup + breakage risk.

**TikTok gift/diamond handling.** These libs *do* read gifts/diamonds — they're the raw material most DIY overlays use. Their weakness is **not** data coverage; it's **hosting/signing/maintenance and no UI.** This is precisely the pain the company's own `tiktok-live-api` + TikTool managed signing removes (repo README: "no third-party sign server, no keys to configure").

**What streamers (who DIY) say.** The ecosystem's documented failure mode is "TikTok changed the protocol, my overlay broke." Survivorship bias note: the visible DIY overlays are the ones whose authors kept patching; the invisible majority abandoned them.

**So what.** Open-source libs are a *capability* competitor only for developers. They validate the data layer but are not a product threat. Stream Studio's moat is pairing the managed data layer (tik.tools) with a visual builder — the DIY crowd is a *conversion* opportunity, not a competitor.

---

## 6. LivePix (adjacent — donation/alert platform)

**What it does.** Brazilian donation + subscription platform (Pix / credit card) with on-stream alerts, integrating into StreamElements, Streamlabs, and OBS. Stats on site: 200K+ partners, 12M+ messages, R$140M+ transacted (Medium confidence — self-reported).

**Pricing/model.** Transaction-fee based; instant Pix withdrawals.

**TikTok gift/diamond handling.** **None** — it's a *fiat donation* rail (Pix), not a TikTok diamond reader. Adjacent, not direct.

**What streamers say.** Trustpilot reviews (Feb–Mar 2026) praise low fees and instant payout; the value is *off-platform* monetization.

**So what.** LivePix proves the *monetization-adjacent* opportunity: a niche (Brazilian Pix) donation-alert product reached 200K partners. It is a template for how a regional, localized payment/alert product wins — relevant to Stream Studio's Indonesia-first strategy and any future revenue-share/gift-tier monetization.

---

## Positioning map

Axes: **X** = Twitch/YouTube mechanics → TikTok gift-native mechanics. **Y** = pre-built/config-only → visual drag-and-drop no-code builder.

| Tool | TikTok gift-native? | Visual builder? | Sweet spot |
|---|---|---|---|
| StreamElements | ✗ | ✓ (Twitch/YT mechanics) | Twitch/YouTube overlays |
| Streamlabs | ✗ | ✓ (Twitch/YT mechanics) | Twitch/YouTube + desktop app |
| TikTok LIVE Studio | ✓ (native only, not designable) | ✗ | Default broadcaster |
| TikFinity | ✓ | ✗ (config + widgets) | TikTok gift alerts + PC-game integration |
| OSS libs (tiktok-live-connector, TikTokLive) | ✓ | ✗ (code-only) | Developer DIY |
| LivePix | ✗ (fiat Pix, not diamonds) | ✗ | BR donation rail |
| **Stream Studio** | **✓** | **✓** | **TikTok gift-native canvas builder + mini-games** |

**Takeaway:** the bottom-right quadrant (TikTok gift-native × visual no-code builder) is empty except Stream Studio. TikFinity is the nearest rival and the main competitive risk — its edge is depth (TTS, actions, game hooks); its gap is *no visual canvas* and *gaming-first focus*.

---

## Opportunity shortlist — gaps Stream Studio can own

**1. Gift-native drag-and-drop canvas (vs. TikFinity's config widgets).**
*Gap:* Nobody offers a visual 9:16 builder where a streamer composes gift alerts + goal bar + leaderboard + mini-games and publishes one browser-source URL. TikFinity and StreamElements/Streamlabs each have half.
*So what for Stream Studio:* Lead with the canvas. Position messaging as "baca gift beneran + susun sendiri" — the one thing every competitor lacks.

**2. Viewer-as-player mini-games (Marble Race, Gift War, Avatar Arena) — the in-overlay format.**
*Gap:* TikFinity's interactivity lives *outside* the overlay (Minecraft/GTA on PC). In-browser gift-driven games where viewers become players *on the stream itself* are unclaimed. TikTok's diamond engine + PK is the monetization surface; a game that turns gifts into visible competition is a direct lever on "many viewers + laris manis."
*So what for Stream Studio:* Make mini-games the flagship content pillar (see `docs/rencana-tiktok.md` — Marble Race/PK prediction are already #3/#6 posts). Ship PK prediction (tebak pemenang) as the entry wedge — it rides TikTok's native PK monetization and the `tiktok-live-api` already surfaces `battle`/`battleArmies`/`battleItemCard` events.

**3. Zero-friction onboarding (demo mode, no API key) vs. desktop-app install.**
*Gap:* TikFinity requires desktop app install + config. Stream Studio's "demo mode without API key → publish URL → paste in OBS" is a 4-step path that removes the setup wall.
*So what for Stream Studio:* Make the demo-to-publish flow the marketing hook ("coba penuh tanpa daftar"). Track publish-URL rate as the activation metric.

**4. Agency multi-streamer management + data intel.**
*Gap:* TikFinity has an agency dashboard, but nobody combines a reusable no-code overlay with agency-grade data (gifter leaderboards, recruiting, unmasked intel). The company already owns this via tik.tools' tier stack (Community → Global Agency).
*So what for Stream Studio:* Package "one builder reused across a roster + agency data" as the upsell tier for talent managers/agencies — this is the willingness-to-pay segment (the `product-marketing.md` "talent manager" persona).

**5. Indonesia/SEA-first localization.**
*Gap:* TikFinity is European-first (EN/DE/ES with ID/TH/VI as bolt-ons). Indonesia is a top-TikTok market by user base, and Stream Studio is already Indonesia-first (bahasa, "sultan" leaderboard, `rencana-tiktok.md` targeting streamer Indonesia). No competitor leads on Indonesia.
*So what for Stream Studio:* Own Indonesia as the beachhead — local gift catalog (diamond/IDR values), local gift names, bahasa support, local creator partnerships. This is a defensible wedge TikFinity would have to re-localize to attack.

---

## Known gaps & what would raise confidence

1. **Streamer reviews of TikTok gift handling** are thin on public pages. → Raise confidence by: mining TikFinity Discord + TikTok comments for "what's missing / what's broken" (hand off to Researcher, R3), and 2–3 creator interviews (UX Researcher, R2).
2. **Exact Streamlabs/StreamElements TikTok capabilities** need verification on their help/pricing pages (I could not fetch their support articles — 404/JS-gated). → Verify before making hard "they don't support X" claims in public marketing.
3. **TikFinity coin pricing** not on the public page. → Check the logged-in dashboard or their agency pricing; informs our own premium-tier design.
4. **Market sizing (TAM/SAM/SOM)** is out of scope for this ticket but is the natural next memo — needs TikTok LIVE creator counts by region (Indonesia specifically).

---

## Sources

- TikFinity homepage + features — tikfinity.com, fetched 2026-08-14 (High).
- TikFinity blog (2026-dated posts on alerts, go-live, monetization) — blog.tikfinity.com, fetched 2026-08-14 (High).
- StreamElements homepage + /tiktok (brand UGC packages) — streamelements.com, fetched 2026-08-14 (High).
- Streamlabs platform positioning ("Twitch, YouTube & Facebook", "70% of Twitch") — streamlabs.com via search index, 2026-08-14 (Medium).
- LivePix homepage (200K partners, Pix model, Trustpilot Feb–Mar 2026) — livepix.gg, fetched 2026-08-14 (High).
- `tiktok-live-api` README — repo, pricing tiers + 54 v3 event types incl. battle/PK (High, internal).
