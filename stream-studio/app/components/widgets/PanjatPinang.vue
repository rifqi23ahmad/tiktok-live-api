<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
//
// Gerakan di-smooth pakai rAF: `target` adalah progress tujuan, `progress`
// adalah posisi yang ditampilkan — setiap frame di-lerp mendekati target,
// jadi naik/melorot terlihat mulus, bukan melompat.
// ─────────────────────────────────────────────────────────────────────────────

interface Climber {
  key: string
  user: string
  nickname: string
  avatarUrl: string
  lane: number       // jalur vertikal (0..LANES-1) → posisi horizontal
  progress: number   // posisi tampil (0..100), di-lerp tiap frame
  target: number     // posisi tujuan (0..100)
  slipUntil: number  // sedang melorot (efek goyang)
  climbUntil: number // baru dapat like/gift → animasi merangkak
  celebrate: boolean // sampai puncak
}

const LANES = 5 // slot tempel di tiang (max pendaki tampil menempel sekaligus)
const TOP = 100
const MAX_CLIMBERS = 12

const climbers = ref<Climber[]>([])
const winner = ref<string | null>(null)
const round = ref(1)
let winTimer: ReturnType<typeof setTimeout> | null = null
let slipTimer: ReturnType<typeof setInterval> | null = null
let raf = 0
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
    const sorted = [...climbers.value].sort((a, b) => a.target - b.target)
    climbers.value = climbers.value.filter((x) => x.key !== sorted[0].key)
  }
  c = {
    key,
    user,
    nickname: nickname || user || 'anon',
    avatarUrl: avatarUrl || fallbackAvatar(key),
    lane: climbers.value.length % LANES,
    progress: 0,
    target: 0,
    slipUntil: 0,
    climbUntil: 0,
    celebrate: false
  }
  climbers.value = [...climbers.value, c]
  return c
}

function climb(c: Climber, amount: number) {
  if (winner.value) return
  c.target = Math.min(TOP, c.target + amount)
  c.climbUntil = Date.now() + 1400 // animasi merangkak selama baru naik
  if (c.target >= TOP && !c.celebrate) {
    c.celebrate = true
    winner.value = c.nickname
    sfx.trigger('win', { enabled: sfxOn.value })
    winTimer = setTimeout(resetRound, 4500)
  }
}

function resetRound() {
  for (const c of climbers.value) {
    c.target = 0
    c.celebrate = false
    c.slipUntil = 0
    c.climbUntil = 0
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

// Slip / melorot acak — tiangnya licin! Kadang satu pendaki turun sedikit.
function startSlip() {
  slipTimer = setInterval(() => {
    if (winner.value) return
    const live = climbers.value.filter((c) => c.target > 2 && !c.celebrate)
    if (!live.length) return
    const c = live[Math.floor(Math.random() * live.length)]
    c.target = Math.max(0, c.target - (1 + Math.random() * 2.5))
    c.slipUntil = Date.now() + 900
  }, 2200)
}

// Smooth movement loop — lerp posisi tampil ke target tiap frame.
let lastFrame = 0
function tick(now: number) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0)
  lastFrame = now
  for (const c of climbers.value) {
    const diff = c.target - c.progress
    if (Math.abs(diff) > 0.01) {
      // ease-out: makin dekat target makin pelan → gerakan terasa natural
      c.progress += diff * Math.min(1, dt * 3.2)
    } else if (c.progress !== c.target) {
      c.progress = c.target
    }
  }
  raf = requestAnimationFrame(tick)
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
  // pendaki menempel di tiang (tengah) — tiap lane menempel di sisi tiang yang
  // berbeda supaya tidak tumpuk, dengan jitter kecil biar natural.
  const slots = [-7.5, 0, 7.5, -4.5, 4.5]
  const base = 50 + (slots[lane % slots.length] || 0)
  return base + (Math.random() - 0.5) * 1.5
}

function isSlipping(c: Climber) {
  return Date.now() < c.slipUntil
}
function isClimbing(c: Climber) {
  return !c.celebrate && !isSlipping(c) && Date.now() < c.climbUntil
}

const sorted = computed(() => [...climbers.value].sort((a, b) => b.target - a.target))
const leader = computed(() => sorted.value[0] || null)

onMounted(() => {
  raf = requestAnimationFrame(tick)
  startSlip()
})

onBeforeUnmount(() => {
  if (winTimer) clearTimeout(winTimer)
  if (slipTimer) clearInterval(slipTimer)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="pp">
    <div class="pp-head">
      <span class="pp-title">🇮🇩 Panjat Pinang <span class="pp-round">#{{ round }}</span></span>
      <span class="pp-sub">like = naik · gift = lompat</span>
    </div>

    <div class="pp-field">
      <!-- langit + awan -->
      <div class="pp-cloud c1">☁️</div>
      <div class="pp-cloud c2">☁️</div>
      <div class="pp-cloud c3">☁️</div>

      <!-- umbul-umbul / bunting segitiga -->
      <div class="pp-bunting">
        <i v-for="n in 14" :key="n" :style="{ '--i': n }"></i>
      </div>

      <!-- tiang pinang + bendera merah putih -->
      <div class="pp-pole">
        <div class="pp-flag">
          <div class="pp-flag-wave">
            <div class="pp-flag-red"></div>
            <div class="pp-flag-white"></div>
          </div>
        </div>
        <div class="pp-pole-body"></div>
        <div class="pp-base"></div>
      </div>

      <!-- tanah -->
      <div class="pp-ground"></div>

      <!-- pendaki (menempel di tiang) -->
      <div
        v-for="c in climbers"
        :key="c.key"
        class="pp-climber"
        :class="{ slip: isSlipping(c), win: c.celebrate, climbing: isClimbing(c) }"
        :style="{ left: laneX(c.lane) + '%', bottom: 'calc(2% + ' + c.progress + '% * 0.82)' }"
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
        <span class="pp-win-sub">MERDEKA! 🇮🇩 Ronde {{ round + 1 }} mulai…</span>
      </div>
    </div>

    <div class="pp-foot" v-if="leader">
      <span class="pp-lead-label">Terdepan:</span>
      <span class="pp-lead">@{{ leader.nickname }} {{ Math.round(leader.target) }}%</span>
      <div class="pp-lead-track"><div class="pp-lead-fill" :style="{ width: leader.target + '%' }"></div></div>
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
  background: linear-gradient(180deg, oklch(80% 0.13 230 / 0.35), oklch(55% 0.1 250 / 0.2) 60%, oklch(35% 0.06 280 / 0.3));
  overflow: hidden;
}

/* awan melayang */
.pp-cloud {
  position: absolute;
  font-size: 5cqw;
  opacity: 0.7;
  z-index: 1;
  animation: drift linear infinite;
}
.pp-cloud.c1 { top: 8%; left: -10%; animation-duration: 26s; }
.pp-cloud.c2 { top: 20%; left: -14%; animation-duration: 38s; animation-delay: -12s; font-size: 4cqw; }
.pp-cloud.c3 { top: 4%; left: -8%; animation-duration: 32s; animation-delay: -22s; font-size: 3.4cqw; }
@keyframes drift {
  from { transform: translateX(0); }
  to { transform: translateX(130cqw); }
}

/* umbul-umbul merah-putih di atas */
.pp-bunting {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3.2cqw;
  display: flex;
  justify-content: space-around;
  z-index: 2;
  pointer-events: none;
}
.pp-bunting i {
  width: 0;
  height: 0;
  border-left: 1.6cqw solid transparent;
  border-right: 1.6cqw solid transparent;
  border-top: 2.6cqw solid oklch(62% 0.22 25);
  transform-origin: top center;
  animation: sway 2.4s ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.18s);
}
.pp-bunting i:nth-child(even) { border-top-color: oklch(96% 0.02 90); }
@keyframes sway {
  0%, 100% { transform: rotate(-7deg); }
  50% { transform: rotate(7deg); }
}

/* tiang + bendera */
.pp-pole {
  position: absolute;
  left: 50%;
  top: 3%;
  bottom: 2%;
  transform: translateX(-50%);
  width: 6cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

/* bendera merah putih berkibar */
.pp-flag {
  position: relative;
  margin-bottom: -0.4cqw;
  z-index: 2;
}
.pp-flag-wave {
  width: 9cqw;
  height: 5.4cqw;
  border-radius: 0.5cqw;
  overflow: hidden;
  transform-origin: left center;
  animation: flagWave 1.6s ease-in-out infinite;
  box-shadow: 0 0.3cqw 0.8cqw oklch(0% 0 0 / 0.35);
}
.pp-flag-red {
  height: 50%;
  background: linear-gradient(90deg, oklch(55% 0.22 25), oklch(62% 0.24 25), oklch(55% 0.22 25));
  background-size: 200% 100%;
  animation: ripple 1.6s linear infinite;
}
.pp-flag-white {
  height: 50%;
  background: linear-gradient(90deg, oklch(92% 0.02 90), oklch(98% 0.01 90), oklch(92% 0.02 90));
  background-size: 200% 100%;
  animation: ripple 1.6s linear infinite;
}
@keyframes flagWave {
  0%, 100% { transform: skewY(-3deg) scaleX(1); }
  50% { transform: skewY(3deg) scaleX(0.96); }
}
@keyframes ripple {
  from { background-position: 0% 0; }
  to { background-position: 200% 0; }
}

.pp-pole-body {
  position: relative;
  flex: 1;
  width: 3.6cqw;
  border-radius: 2cqw 2cqw 0 0;
  background: linear-gradient(90deg, oklch(45% 0.09 40), oklch(62% 0.11 55), oklch(45% 0.09 40));
  box-shadow: inset 0 0 1cqw oklch(0% 0 0 / 0.4), 0 0 1.2cqw oklch(90% 0.15 90 / 0.25);
}
/* kilau minyak di tiang */
.pp-pole-body::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, transparent, oklch(95% 0.05 90 / 0.18) 45%, transparent 55%),
    linear-gradient(180deg, transparent, oklch(95% 0.05 90 / 0.14) 70%, transparent 80%);
  animation: oilSheen 3s ease-in-out infinite;
}
@keyframes oilSheen {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.pp-base {
  width: 6cqw;
  height: 2cqw;
  border-radius: 999px;
  background: oklch(30% 0.05 40);
}

/* tanah rumput */
.pp-ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6%;
  background: linear-gradient(180deg, oklch(62% 0.15 140 / 0.7), oklch(45% 0.12 140 / 0.8));
  z-index: 1;
}

/* pendaki mungil: kepala = foto profil, badan = rangka lucu */
.pp-climber {
  position: absolute;
  transform: translate(-50%, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
  /* posisi bottom dikontrol rAF (bukan transition) supaya super smooth */
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
.pp-legs { top: 9.4cqw; }
.pp-legs i {
  width: 1.2cqw; height: 2.6cqw; border-radius: 999px;
  background: oklch(45% 0.1 260);
  transform-origin: top;
}

/* animasi merangkak — hanya saat baru dapat like/gift */
.pp-climber.climbing .pp-body { animation: climbBounce 0.55s ease-in-out infinite; }
.pp-climber.climbing .pp-arms i:first-child { animation: armL 0.55s ease-in-out infinite; }
.pp-climber.climbing .pp-arms i:last-child { animation: armR 0.55s ease-in-out infinite; }
.pp-climber.climbing .pp-legs i:first-child { animation: legL 0.55s ease-in-out infinite; }
.pp-climber.climbing .pp-legs i:last-child { animation: legR 0.55s ease-in-out infinite; }
@keyframes climbBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.9cqw); }
}
@keyframes armL { 0%, 100% { transform: rotate(40deg); } 50% { transform: rotate(10deg); } }
@keyframes armR { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(-40deg); } }
@keyframes legL { 0%, 100% { transform: rotate(22deg); } 50% { transform: rotate(6deg); } }
@keyframes legR { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(-22deg); } }

/* diam: napas halus biar tetap hidup */
.pp-climber:not(.climbing):not(.win):not(.slip) .pp-body { animation: idleBreath 2.6s ease-in-out infinite; }
@keyframes idleBreath {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-0.3cqw) scale(1.02); }
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
  color: oklch(90% 0.05 280);
  z-index: 4;
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
  background: linear-gradient(90deg, oklch(62% 0.22 25), oklch(96% 0.02 90));
  transition: width 0.5s;
}
</style>
