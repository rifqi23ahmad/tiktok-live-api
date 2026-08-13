<script setup lang="ts">
const { session, topGifters, avgDiamondsPerGift, durationMs, clear } = useStreamSession()

const fmt = (n: number) => n.toLocaleString('id-ID')

const s = computed(() => session.value)

const durationText = computed(() => {
  const ms = durationMs.value
  const mins = Math.floor(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}j ${m}m` : `${m} menit`
})

const startedText = computed(() => {
  if (!s.value) return ''
  return new Date(s.value.startedAt).toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
})

const highlights = computed(() => {
  if (!s.value) return []
  const h: { icon: string; text: string }[] = []
  const c = s.value.counts
  if (c.diamonds > 0) h.push({ icon: '💎', text: `${fmt(c.diamonds)} diamonds terkumpul dari ${fmt(c.gift)} gift` })
  if (topGifters.value[0]) h.push({ icon: '👑', text: `Top gifter: @${topGifters.value[0].name} (${fmt(topGifters.value[0].diamonds)} 💎)` })
  if (s.value.viewers.peak > 0) h.push({ icon: '👀', text: `Puncak penonton: ${fmt(s.value.viewers.peak)}` })
  if (s.value.widgets.hype.peak >= 100) h.push({ icon: '🔥', text: 'Hype meter mencapai CHAT ON FIRE!' })
  if (c.totalLikes > 0) h.push({ icon: '❤️', text: `${fmt(c.totalLikes)} likes diterima` })
  const cmdTop = Object.entries(s.value.commands).sort((a, b) => b[1] - a[1])[0]
  if (cmdTop) h.push({ icon: '💬', text: `Perintah terpopuler: ${cmdTop[0]} (${cmdTop[1]}×)` })
  return h
})

const newStream = () => {
  clear()
  navigateTo('/')
}
</script>

<template>
  <main class="shell">
    <section style="padding: 36px 0 8px">
      <h1 style="margin: 0 0 6px; font-size: 1.8rem; font-weight: 800">Recap Pasca-Stream</h1>
      <p style="margin: 0; color: var(--ink-dim)">Ringkasan performa sesi terakhir.</p>
    </section>

    <div v-if="s" class="card card-pad" style="margin-top: 20px">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px">
        <div>
          <h2 style="margin: 0 0 4px; font-size: 1.4rem">@{{ s.username }}</h2>
          <p style="margin: 0; color: var(--ink-dim); font-size: 0.9rem">{{ startedText }} · {{ durationText }}</p>
        </div>
        <div style="display: flex; gap: 10px">
          <button class="btn btn-ghost" @click="newStream">Mulai Stream Baru</button>
        </div>
      </div>
    </div>

    <div v-if="s" class="kpi-grid" style="margin-top: 20px">
      <div class="kpi"><div class="label">Durasi</div><div class="value">{{ durationText }}</div><div class="sub">sesi</div></div>
      <div class="kpi"><div class="label">Diamonds</div><div class="value" style="color: var(--gold)">{{ fmt(s.counts.diamonds) }}</div><div class="sub">{{ fmt(s.counts.gift) }} gift</div></div>
      <div class="kpi"><div class="label">Penonton Puncak</div><div class="value">{{ fmt(s.viewers.peak) }}</div><div class="sub">viewers</div></div>
      <div class="kpi"><div class="label">Chat</div><div class="value">{{ fmt(s.counts.chat) }}</div><div class="sub">pesan</div></div>
      <div class="kpi"><div class="label">Likes</div><div class="value">{{ fmt(s.counts.totalLikes) }}</div><div class="sub">❤️</div></div>
      <div class="kpi"><div class="label">Gifter Unik</div><div class="value">{{ Object.keys(s.topGifters).length }}</div><div class="sub">pengirim</div></div>
    </div>

    <div v-if="s" class="card card-pad" style="margin-top: 20px">
      <h2 class="section-title">Sorotan Sesi</h2>
      <div v-if="highlights.length" class="rank-list">
        <div v-for="(h, i) in highlights" :key="i" class="rank-item" style="grid-template-columns: 32px 1fr">
          <span style="text-align: center">{{ h.icon }}</span>
          <span>{{ h.text }}</span>
        </div>
      </div>
      <div v-else class="empty" style="padding: 24px">Tidak ada aktivitas tercatat pada sesi ini.</div>
    </div>

    <div v-if="s" class="grid-2" style="margin-top: 20px">
      <div class="card card-pad">
        <h2 class="section-title">Top Gifter</h2>
        <div v-if="topGifters.length" class="rank-list">
          <div v-for="(g, i) in topGifters.slice(0, 5)" :key="g.name" class="rank-item">
            <span class="pos">{{ ['👑', '2', '3', '4', '5'][i] }}</span>
            <span class="nm">@{{ g.name }}</span>
            <span class="val">{{ fmt(g.diamonds) }} 💎</span>
          </div>
        </div>
        <div v-else class="empty" style="padding: 24px">Belum ada gift.</div>
      </div>

      <div class="card card-pad">
        <h2 class="section-title">Rincian</h2>
        <table class="recap">
          <tbody>
            <tr><td>Diamonds / gift</td><td class="num">{{ fmt(avgDiamondsPerGift) }} 💎</td></tr>
            <tr><td>Gift Alert</td><td class="num">{{ fmt(s.widgets.alert.triggers) }}× · tier {{ s.widgets.alert.topTier }}</td></tr>
            <tr><td>Hype Meter</td><td class="num">puncak {{ s.widgets.hype.peak }}</td></tr>
            <tr><td>Goal</td><td class="num">{{ fmt(s.widgets.goal.diamonds) }} / {{ fmt(s.widgets.goal.target) }} 💎{{ s.widgets.goal.complete ? ' · tercapai ✓' : '' }}</td></tr>
            <tr><td>Member Join</td><td class="num">{{ fmt(s.counts.member) }}</td></tr>
            <tr><td>Follow</td><td class="num">{{ fmt(s.counts.follow) }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="card card-pad" style="margin-top: 20px; text-align: center; padding: 56px 24px">
      <div class="empty" style="padding: 0">
        <span class="big">📊</span><br />
        Belum ada sesi yang selesai.
        <div style="margin-top: 16px">
          <NuxtLink to="/dashboard" class="btn btn-primary">Mulai Sesi &amp; Rekam Analitik</NuxtLink>
        </div>
      </div>
    </div>
  </main>
</template>
