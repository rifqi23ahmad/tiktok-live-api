<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { useSfx } from '~/composables/useSfx'
import { fallbackAvatar } from '~/utils/stream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()
const sfx = useSfx()
const sfxOn = computed(() => props.settings.sfx !== false)

// ─────────────────────────────────────────────────────────────────────────────
// Panjat Pinang — spesial 17 Agustusan. Penonton jadi pendaki bertubuh mungil
// berkepala foto profil TikTok yang memanjat tiang pinang berminyak.
//   like  = langkah naik (merangkak ke atas)
//   chat  = semangat / dorong kecil
//   gift  = semprotan WD-40 → lompat besar ke atas
//   slip  = melorot kadang-kadang biar seru (khas pinang berminyak)
// Siapa sampai puncak duluan = menang, lalu ronde baru.
// ─────────────────────────────────────────────────────────────────────────────

interface Climber {
  key: string
  user: string
  nickname: string
  avatarUrl: string
  lane: number       // jalur vertikal (0..LANES-1) → posisi horizontal
  progress: number   // 0 (dasar) .. 100 (puncak)
  slipUntil: number  // sedang melorot (efek goyang)
  celebrate: boolean // sampai puncak
}

const LANES = 5
const TOP = 100
const MAX_CLIMBERS = 12

const climbers = ref<Climber[]>([])
const winner = ref<string | null>(null)
const round = ref(1)
let winTimer: ReturnType<typeof setTimeout> | null = null
let slipTimer: ReturnType<typeof setInterval> | null = null
let lastLike = ''
let lastGift = ''
let lastChat = ''

function ensureClimber(user: string, nickname: string, avatarUrl: string): Climber {
  const key = user || 'anon'
  let c = climbers.value.find((x) => x.key === key)
  if (c) {
    c.nickname = nickname || c.nickname
    c.avatarUrl = avatarUrl || c.avatarUrl
    return c
  }
  if (climbers.value.length >= MAX_CLIMBERS) {
    // tendang yang paling bawah biar tetap 12
    const sorted = [...climbers.value].sort((a, b) => a.progress - b.progress)
    climbers.value = climbers.value.filter((x) => x.key !== sorted[0].key)
  }
  c = {
    key,
    user,
    nickname: nickname || user || 'anon',
    avatarUrl: avatarUrl || fallbackAvatar(key),
    lane: climbers.value.length % LANES,
    progress: 0,
    slipUntil: 0,
    celebrate: false
  }
  climbers.value = [...climbers.value, c]
  return c
}

function climb(c: Climber, amount: number) {
  if (winner.value) return
  c.progress = Math.min(TOP, c.progress + amount)
  if (c.progress >= TOP && !c.celebrate) {
    c.celebrate = true
    winner.value = c.nickname
    sfx.trigger('win', { enabled: sfxOn.value })
    winTimer = setTimeout(resetRound, 4500)
  }
}

function resetRound() {
  for (const c of climbers.value) {
    c.progress = 0
    c.celebrate = false
    c.slipUntil = 0
  }
  winner.value = null
  round.value++
}

function onLike(l: { id: string; user: string; nickname: string; avatarUrl: string; likeCount: number }) {
  const c = ensureClimber(l.user, l.nickname, l.avatarUrl)
  climb(c, Math.min(6, (l.likeCount || 1) * 0.5))
  sfx.trigger('reaction', { enabled: sfxOn.value })
}

function onChat(m: { id: string; user: string; nickname: string; avatarUrl: string; comment: string }) {
  const c = ensureClimber(m.user, m.nickname, m.avatarUrl)
  climb(c, 0.6)
}

function onGift(g: { id: string; user: string; nickname: string; avatarUrl: string; diamondCount: number }) {
  const c = ensureClimber(g.user, g.nickname, g.avatarUrl)
  const d = g.diamondCount || 1
  climb(c, Math.min(30, 4 + d * 0.15))
  sfx.trigger(d >= 100 ? 'gift-big' : 'gift', { enabled: sfxOn.value })
}

// Slip / melorot acak — tiangnya licin! Kadang semua turun sedikit.
function startSlip() {
  slipTimer = setInterval(() => {
    if (winner.value) return
    const live = climbers.value.filter((c) => c.progress > 2 && !c.celebrate)
    if (!live.length) return
    const c = live[Math.floor(Math.random() * live.length)]
    c.progress = Math.max(0, c.progress - (1 + Math.random() * 2.5))
    c.slipUntil = Date.now() + 900
  }, 1800)
}

watch(
  () => stream.likes.value[0],
  (l) => {
    if (!l || l.id === lastLike) return
    lastLike = l.id
    onLike(l)
  }
)
watch(
  () => stream.messages.value[0],
  (m) => {
    if (!m || m.id === lastChat) return
    lastChat = m.id
    onChat(m)
  }
)
watch(
  () => stream.gifts.value[0],
  (g) => {
    if (!g || g.id === lastGift) return
    lastGift = g.id
    onGift(g)
  }
)

function laneX(lane: number) {
  // spread climbers across the pole width
  const pad = 12
  return pad + (lane / (LANES - 1)) * (100 - pad * 2)
}

const sorted = computed(() => [...climbers.value].sort((a, b) => b.progress - a.progress))
const leader = computed(() => sorted.value[0] || null)

onBeforeUnmount(() => {
  if (winTimer) clearTimeout(winTimer)
  if (slipTimer) clearInterval(slipTimer)
})

startSlip()
</script>

<template>
  <div class="pp">
    <div class="pp-head">
      <span class="pp-title">🇮🇩 Panjat Pinang <span class="pp-round">#{{ round }}</span></span>
      <span class="pp-sub">like = naik · gift = lompat</span>
    </div>

    <div class="pp-field">
      <!-- tiang pinang -->
      <div class="pp-pole">
        <div class="pp-pole-body">
          <div class="pp-flag">🎁</div>
        </div>
        <div class="pp-base"></div>
      </div>

      <!-- puncak / bendera -->
      <div class="pp-top">🏆 PUNCAK</div>

      <!-- pendaki -->
      <div
        v-for="c in climbers"
        :key="c.key"
        class="pp-climber"
        :class="{ slip: Date.now() < c.slipUntil, win: c.celebrate }"
        :style="{ left: laneX(c.lane) + '%', bottom: c.progress + '%' }"
      >
        <div class="pp-body">
          <div class="pp-legs"><i></i><i></i></div>
          <div class="pp-arms"><i></i><i></i></div>
          <div class="pp-torso"></div>
          <img class="pp-head" :src="c.avatarUrl" :alt="c.nickname" loading="lazy" />
        </div>
        <div class="pp-tag">@{{ c.nickname }}</div>
      </div>

      <div v-if="!climbers.length" class="pp-empty">like / chat buat ikut panjat! 🧗</div>

      <div v-if="winner" class="pp-win">
        🏆 @{{ winner }} sampai puncak!<br />
        <span class="pp-win-sub">Merdeka! Ronde {{ round + 1 }} mulai…</span>
      </div>
    </div>

    <div class="pp-foot" v-if="leader">
      <span class="pp-lead-label">Terdepan:</span>
      <span class="pp-lead">@{{ leader.nickname }} {{ Math.round(leader.progress) }}%</span>
      <div class="pp-lead-track"><div class="pp-lead-fill" :style="{ width: leader.progress + '%' }"></div></div>
    </div>
  </div>
</template>

<style scoped>
.pp {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.8cqw;
  padding: 2cqw;
  border-radius: 2cqw;
  background: linear-gradient(180deg, oklch(72% 0.1 220 / 0.28), oklch(20% 0.02 280 / 0.72));
  border: 1px solid oklch(60% 0.05 280 / 0.35);
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.pp-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.pp-title { font-size: 3.1cqw; font-weight: 700; }
.pp-round { color: oklch(85% 0.16 90); font-size: 2.3cqw; }
.pp-sub { font-size: 2cqw; color: oklch(80% 0.02 90); }

.pp-field {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 1.4cqw;
  background: linear-gradient(180deg, oklch(78% 0.12 220 / 0.18), oklch(25% 0.03 280 / 0.2));
  overflow: hidden;
}

/* tiang */
.pp-pole {
  position: absolute;
  left: 50%;
  top: 4%;
  bottom: 0;
  transform: translateX(-50%);
  width: 6cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pp-pole-body {
  position: relative;
  flex: 1;
  width: 3.6cqw;
  border-radius: 2cqw 2cqw 0 0;
  background: linear-gradient(90deg, oklch(45% 0.09 40), oklch(62% 0.11 55), oklch(45% 0.09 40));
  box-shadow: inset 0 0 1cqw oklch(0% 0 0 / 0.4), 0 0 1.2cqw oklch(90% 0.15 90 / 0.25);
}
.pp-flag {
  position: absolute;
  top: -3cqw;
  left: 50%;
  transform: translateX(-50%);
  font-size: 4cqw;
}
.pp-base {
  width: 6cqw;
  height: 2cqw;
  border-radius: 999px;
  background: oklch(30% 0.05 40);
}
.pp-top {
  position: absolute;
  top: 0.6cqw;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2.1cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  z-index: 2;
}

/* pendaki mungil: kepala = foto profil, badan = rangka lucu */
.pp-climber {
  position: absolute;
  transform: translate(-50%, 0);
  transition: bottom 0.5s cubic-bezier(0.22, 1, 0.36, 1), left 0.4s;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
}
.pp-body {
  position: relative;
  width: 7cqw;
  height: 11cqw;
}
.pp-head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 6.4cqw;
  height: 6.4cqw;
  border-radius: 50%;
  border: 0.4cqw solid oklch(85% 0.16 90);
  object-fit: cover;
  background: oklch(30% 0.05 280);
  z-index: 2;
}
.pp-torso {
  position: absolute;
  top: 6cqw;
  left: 50%;
  transform: translateX(-50%);
  width: 4.4cqw;
  height: 3.6cqw;
  border-radius: 1.4cqw;
  background: linear-gradient(180deg, oklch(72% 0.18 25), oklch(58% 0.18 25));
}
.pp-arms, .pp-legs { position: absolute; left: 0; right: 0; display: flex; justify-content: space-between; }
.pp-arms { top: 6.4cqw; }
.pp-arms i {
  width: 1.2cqw; height: 3.4cqw; border-radius: 999px;
  background: oklch(82% 0.1 90);
  transform-origin: top;
}
.pp-arms i:first-child { transform: rotate(35deg); }
.pp-arms i:last-child { transform: rotate(-35deg); }
.pp-legs { top: 9.4cqw; }
.pp-legs i {
  width: 1.2cqw; height: 2.6cqw; border-radius: 999px;
  background: oklch(45% 0.1 260);
  transform-origin: top;
}
.pp-legs i:first-child { transform: rotate(18deg); }
.pp-legs i:last-child { transform: rotate(-18deg); }

/* animasi merangkak */
.pp-climber:not(.win):not(.slip) .pp-body { animation: climbBounce 0.9s ease-in-out infinite; }
@keyframes climbBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1cqw); }
}
.pp-climber.slip .pp-body { animation: slipShake 0.18s linear infinite; }
@keyframes slipShake {
  0%, 100% { transform: rotate(-8deg) translateY(0.6cqw); }
  50% { transform: rotate(8deg) translateY(1cqw); }
}
.pp-climber.win .pp-body { animation: celebrate 0.5s ease-in-out infinite; }
@keyframes celebrate {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2cqw) scale(1.15); }
}

.pp-tag {
  margin-top: 0.4cqw;
  font-size: 1.6cqw;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0.2cqw 0.4cqw oklch(0% 0 0 / 0.8);
  white-space: nowrap;
}

.pp-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 2.4cqw;
  color: oklch(85% 0.05 280);
}

.pp-win {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  font-size: 4cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  background: oklch(10% 0.02 280 / 0.55);
  z-index: 10;
  animation: pulse 0.6s ease-in-out infinite;
}
.pp-win-sub { font-size: 2.2cqw; color: oklch(90% 0.1 90); }
@keyframes pulse { 50% { opacity: 0.6; } }

.pp-foot {
  display: flex;
  align-items: center;
  gap: 1cqw;
}
.pp-lead-label { font-size: 1.9cqw; color: oklch(80% 0.02 90); }
.pp-lead { font-size: 2.1cqw; font-weight: 700; color: oklch(85% 0.16 90); white-space: nowrap; }
.pp-lead-track {
  flex: 1;
  height: 1.8cqw;
  border-radius: 999px;
  background: oklch(28% 0.03 280 / 0.8);
  overflow: hidden;
}
.pp-lead-fill {
  height: 100%;
  background: linear-gradient(90deg, oklch(72% 0.18 25), oklch(85% 0.16 90));
  transition: width 0.5s;
}
</style>
