<script setup lang="ts">
const { config, hasConfig } = useStreamConfig()
const { session, start, end, topGifters, avgDiamondsPerGift } = useStreamSession()

const live = ref(false)
const liveUsername = ref('')
const liveApiKey = ref('')
const endedByUser = ref(false)

const startLive = () => {
  if (!hasConfig.value) return
  liveUsername.value = config.value.username.trim().replace(/^@/, '')
  liveApiKey.value = config.value.apiKey
  start(liveUsername.value, config.value.goal || 5000)
  endedByUser.value = false
  live.value = true
}

const endLive = () => {
  endedByUser.value = true
  end()
  live.value = false
  navigateTo('/recap')
}

const s = computed(() => session.value)

const fmt = (n: number) => n.toLocaleString('id-ID')

const timelineBars = computed(() => {
  if (!s.value) return []
  const buckets = s.value.timeline.slice(-40)
  const max = Math.max(1, ...buckets.map((b) => b.diamonds))
  return buckets.map((b) => ({
    t: new Date(b.t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    h: Math.round((b.diamonds / max) * 100),
    diamonds: b.diamonds,
    chat: b.chat
  }))
})

const widgetRows = computed(() => {
  if (!s.value) return []
  const w = s.value.widgets
  const goalPct = w.goal.target > 0 ? Math.min(100, Math.round((w.goal.diamonds / w.goal.target) * 100)) : 0
  return [
    { name: 'Goal Bar', metric: `${fmt(w.goal.diamonds)} / ${fmt(w.goal.target)} 💎`, pct: goalPct },
    { name: 'Gift Leaderboard', metric: `${fmt(w.leaderboard.gifts)} gift`, pct: Math.min(100, w.leaderboard.gifts * 5) },
    { name: 'Gift Alert', metric: `${fmt(w.alert.triggers)} trigger · tier ${w.alert.topTier}`, pct: Math.min(100, w.alert.triggers * 10) },
    { name: 'Like Combo', metric: `${fmt(w.likes.total)} likes`, pct: Math.min(100, w.likes.total / 20) },
    { name: 'Hype Meter', metric: `peak ${w.hype.peak} · ${w.hype.onFire}× on-fire`, pct: w.hype.peak }
  ]
})

const commandRows = computed(() => {
  if (!s.value) return []
  return Object.entries(s.value.commands).sort((a, b) => b[1] - a[1])
})
</script>

<template>
  <main class="shell">
    <section style="padding: 36px 0 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px">
      <div>
        <h1 style="margin: 0 0 6px; font-size: 1.8rem; font-weight: 800">Dashboard Analitik</h1>
        <p style="margin: 0; color: var(--ink-dim)">Pantau interaksi stream secara real-time.</p>
      </div>
      <div style="display: flex; align-items: center; gap: 12px">
        <span v-if="live" class="pill on"><span class="dot"></span>LIVE · @{{ liveUsername }}</span>
        <span v-else-if="s && s.endedAt" class="pill off"><span class="dot"></span>Selesai</span>
        <button v-if="!live" class="btn btn-primary" :disabled="!hasConfig" @click="startLive">
          ▶ Mulai Sesi
        </button>
        <button v-else class="btn" style="background: var(--red); color: #fff" @click="endLive">
          ⏹ Akhiri Stream
        </button>
      </div>
    </section>

    <p v-if="!hasConfig && !live && !s" class="empty" style="margin-top: 32px">
      <span class="big">🎛️</span><br />
      Belum ada konfigurasi stream. <NuxtLink to="/" style="color: var(--cyan)">Atur konfigurasi dulu</NuxtLink>, lalu kembali untuk mulai sesi.
    </p>

    <template v-else>
      <div v-if="live">
        <ClientOnly>
          <LiveTracker :username="liveUsername" :api-key="liveApiKey" />
        </ClientOnly>
      </div>

      <div class="kpi-grid" style="margin-top: 20px">
        <div class="kpi"><div class="label">Penonton</div><div class="value">{{ fmt(s?.viewers.current || 0) }}</div><div class="sub">puncak {{ fmt(s?.viewers.peak || 0) }}</div></div>
        <div class="kpi"><div class="label">Chat</div><div class="value">{{ fmt(s?.counts.chat || 0) }}</div><div class="sub">total pesan</div></div>
        <div class="kpi"><div class="label">Likes</div><div class="value">{{ fmt(s?.counts.totalLikes || 0) }}</div><div class="sub">{{ fmt(s?.counts.like || 0) }} event</div></div>
        <div class="kpi"><div class="label">Gift</div><div class="value">{{ fmt(s?.counts.gift || 0) }}</div><div class="sub">dari {{ Object.keys(s?.topGifters || {}).length }} gifter</div></div>
        <div class="kpi"><div class="label">Diamonds</div><div class="value" style="color: var(--gold)">{{ fmt(s?.counts.diamonds || 0) }}</div><div class="sub">💎</div></div>
        <div class="kpi"><div class="label">Konversi</div><div class="value">{{ fmt(avgDiamondsPerGift) }}</div><div class="sub">💎 / gift rata-rata</div></div>
      </div>

      <div class="grid-2" style="margin-top: 20px">
        <!-- per-widget -->
        <div class="card card-pad">
          <h2 class="section-title">Interaksi per Widget</h2>
          <div v-if="widgetRows.length" style="display: flex; flex-direction: column; gap: 14px">
            <div v-for="row in widgetRows" :key="row.name">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px">
                <span style="font-weight: 600; font-size: 0.88rem">{{ row.name }}</span>
                <span style="color: var(--ink-dim); font-size: 0.82rem">{{ row.metric }}</span>
              </div>
              <div class="bar-track"><div class="bar-fill" :style="{ width: row.pct + '%' }"></div></div>
            </div>
          </div>
          <div v-else class="empty" style="padding: 24px">Belum ada data. Mulai sesi untuk melihat interaksi per widget.</div>
        </div>

        <!-- top gifters -->
        <div class="card card-pad">
          <h2 class="section-title">Top Gifter</h2>
          <div v-if="topGifters.length" class="rank-list">
            <div v-for="(g, i) in topGifters.slice(0, 8)" :key="g.name" class="rank-item">
              <span class="pos">{{ ['👑', '2', '3', '4', '5', '6', '7', '8'][i] }}</span>
              <span class="nm">@{{ g.name }}</span>
              <span class="val">{{ fmt(g.diamonds) }} 💎 · {{ g.gifts }} gift</span>
            </div>
          </div>
          <div v-else class="empty" style="padding: 24px">Belum ada gift.</div>
        </div>
      </div>

      <div class="grid-2" style="margin-top: 20px">
        <!-- timeline -->
        <div class="card card-pad">
          <h2 class="section-title">Aktivitas (per menit)</h2>
          <div v-if="timelineBars.length" style="display: flex; align-items: flex-end; gap: 3px; height: 120px">
            <div
              v-for="(b, i) in timelineBars"
              :key="i"
              :title="`${b.t} — ${fmt(b.diamonds)} 💎`"
              style="flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end"
            >
              <div style="width: 100%; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, var(--gold), var(--pink)); opacity: 0.9" :style="{ height: b.h + '%' }"></div>
            </div>
          </div>
          <div v-else class="empty" style="padding: 24px">Belum ada timeline.</div>
        </div>

        <!-- commands -->
        <div class="card card-pad">
          <h2 class="section-title">Perintah Chat</h2>
          <div v-if="commandRows.length" class="rank-list">
            <div v-for="[cmd, n] in commandRows" :key="cmd" class="rank-item" style="grid-template-columns: 1fr auto">
              <span class="nm" style="font-family: monospace">{{ cmd }}</span>
              <span class="val" style="color: var(--cyan)">{{ fmt(n) }}×</span>
            </div>
          </div>
          <div v-else class="empty" style="padding: 24px">Belum ada perintah chat.</div>
        </div>
      </div>

      <!-- live feed -->
      <div class="card card-pad" style="margin-top: 20px">
        <h2 class="section-title">Feed Langsung</h2>
        <div v-if="s && s.feed.length" class="feed">
          <div v-for="(e, i) in s.feed" :key="i" class="feed-item" :class="e.type">
            <span class="t">{{ new Date(e.t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}</span>
            <span>{{ e.text }}</span>
          </div>
        </div>
        <div v-else class="empty" style="padding: 24px">Menunggu event…</div>
      </div>
    </template>
  </main>
</template>
