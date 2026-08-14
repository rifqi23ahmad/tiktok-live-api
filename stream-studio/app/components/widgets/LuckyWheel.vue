<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { useSfx } from '~/composables/useSfx'
import { fmtNum } from '~/utils/stream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()
const sfx = useSfx()

const sfxOn = computed(() => props.settings.sfx !== false)

// ── config ──
const title = computed(() => props.settings.title || 'Roda Keberuntungan')
const threshold = computed(() => Number(props.settings.threshold) || 1000)
const segments = computed<string[]>(() => {
  const s = props.settings.segments
  return Array.isArray(s) && s.length >= 2
    ? s.slice(0, 8)
    : ['💎 x2', '🎁 10 💎', '🔥 Shoutout', '⭐ 50 💎', '💔 Zonk', '🏆 100 💎']
})

const WHEEL_COLORS = ['#ff5252', '#42a5f5', '#66bb6a', '#ffca28', '#ab47bc', '#26c6da', '#ff7043', '#ec407a']

const wheelGradient = computed(() => {
  const n = segments.value.length
  const stops: string[] = []
  for (let i = 0; i < n; i++) {
    const c = WHEEL_COLORS[i % WHEEL_COLORS.length]
    const start = (i / n) * 360
    const end = ((i + 1) / n) * 360
    stops.push(`${c} ${start}deg ${end}deg`)
  }
  return `conic-gradient(${stops.join(', ')})`
})

function labelStyle(i: number) {
  const n = segments.value.length
  const a = (i + 0.5) * (360 / n)
  return { transform: `rotate(${a}deg) translateY(-19cqw)` }
}

// ── ticket pool (weighted by diamond) ──
interface Ticket {
  user: string
  nickname: string
  avatarUrl: string
  weight: number
}

const tickets = ref<Record<string, Ticket>>({})
const accumulated = ref(0)
const spinning = ref(false)
const rotation = ref(0)
const result = ref<{ nickname: string; segment: string } | null>(null)

let resultTimer: ReturnType<typeof setTimeout> | null = null
let spinTimer: ReturnType<typeof setTimeout> | null = null
let lastGift = ''

function addTicket(user: string, nickname: string, avatarUrl: string, weight: number) {
  const prev = tickets.value[user]
  tickets.value = {
    ...tickets.value,
    [user]: {
      user,
      nickname: nickname || prev?.nickname || user,
      avatarUrl: avatarUrl || prev?.avatarUrl || '',
      weight: (prev?.weight || 0) + weight
    }
  }
}

function pickWinner(): Ticket | null {
  const pool = Object.values(tickets.value)
  if (!pool.length) return null
  const totalW = pool.reduce((s, t) => s + t.weight, 0)
  let r = Math.random() * totalW
  for (const t of pool) {
    r -= t.weight
    if (r <= 0) return t
  }
  return pool[pool.length - 1]
}

function targetRotationFor(i: number, n: number, current: number): number {
  const seg = 360 / n
  const center = (i + 0.5) * seg
  const base = (360 - (center % 360)) % 360
  return (Math.ceil(current / 360) + 5) * 360 + base
}

function spin() {
  if (spinning.value) return
  const winner = pickWinner()
  if (!winner) {
    accumulated.value = 0
    return
  }
  const n = segments.value.length
  const landed = Math.floor(Math.random() * n)
  spinning.value = true
  sfx.trigger('spin', { enabled: sfxOn.value })
  rotation.value = targetRotationFor(landed, n, rotation.value)
  spinTimer = setTimeout(() => {
    result.value = { nickname: winner.nickname, segment: segments.value[landed] }
    spinning.value = false
    sfx.trigger('wheel-win', { enabled: sfxOn.value })
    tickets.value = {}
    accumulated.value = 0
    resultTimer = setTimeout(() => (result.value = null), 4000)
  }, 3200)
}

watch(
  () => stream.gifts.value[0],
  (g) => {
    if (!g || g.id === lastGift) return
    lastGift = g.id
    if (spinning.value) return
    addTicket(g.user, g.nickname, g.avatarUrl, g.diamondCount)
    accumulated.value += g.diamondCount
    if (accumulated.value >= threshold.value) spin()
  }
)

const pct = computed(() => (threshold.value > 0 ? Math.min(100, (accumulated.value / threshold.value) * 100) : 0))

onUnmounted(() => {
  if (resultTimer) clearTimeout(resultTimer)
  if (spinTimer) clearTimeout(spinTimer)
})
</script>

<template>
  <div class="lw">
    <div class="lw-head">
      <span class="lw-title">🎡 {{ title }}</span>
      <span class="lw-sub">gift = tiket</span>
    </div>

    <div class="lw-body">
      <div class="lw-wheel-wrap">
        <div class="lw-pointer">▼</div>
        <div class="lw-rotor" :style="{ transform: 'rotate(' + rotation + 'deg)' }">
          <div class="lw-disc" :style="{ background: wheelGradient }"></div>
          <div v-for="(s, i) in segments" :key="i" class="lw-wedge" :style="labelStyle(i)">
            <span>{{ s }}</span>
          </div>
          <div class="lw-hub">🎁</div>
        </div>
      </div>

      <div v-if="result" class="lw-result">🏆 @{{ result.nickname }} menang {{ result.segment }}!</div>
      <div v-else-if="spinning" class="lw-result">🎰 Berputar…</div>
    </div>

    <div class="lw-foot">
      <div class="lw-track">
        <div class="lw-fill" :style="{ width: pct + '%' }"></div>
      </div>
      <span class="lw-count">{{ fmtNum(accumulated) }} / {{ fmtNum(threshold) }} 💎</span>
    </div>
  </div>
</template>

<style scoped>
.lw {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1cqw;
  padding: 2cqw;
  border-radius: 2cqw;
  background: oklch(15% 0.02 280 / 0.72);
  border: 1px solid oklch(60% 0.05 280 / 0.35);
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.lw-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.lw-title { font-size: 3.2cqw; font-weight: 700; }
.lw-sub { font-size: 2.1cqw; color: oklch(80% 0.02 90); }

.lw-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1cqw;
}
.lw-wheel-wrap {
  position: relative;
  width: 42cqw;
  height: 42cqw;
  flex-shrink: 0;
}
.lw-rotor {
  position: absolute;
  inset: 0;
  transition: transform 3.2s cubic-bezier(0.17, 0.89, 0.32, 1);
}
.lw-disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 0.6cqw solid oklch(85% 0.16 90);
  box-shadow: 0 0 3cqw oklch(0% 0 0 / 0.5), inset 0 0 2cqw oklch(0% 0 0 / 0.4);
}
.lw-wedge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
}
.lw-wedge span {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 2.2cqw;
  font-weight: 700;
  white-space: nowrap;
  color: #0b0b0b;
  text-shadow: 0 1px 0 oklch(100% 0 0 / 0.35);
}
.lw-hub {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10cqw;
  height: 10cqw;
  border-radius: 50%;
  background: oklch(20% 0.03 280);
  border: 0.5cqw solid oklch(85% 0.16 90);
  display: grid;
  place-items: center;
  font-size: 4cqw;
  z-index: 2;
}
.lw-pointer {
  position: absolute;
  top: -1.4cqw;
  left: 50%;
  transform: translateX(-50%);
  font-size: 4.6cqw;
  color: oklch(85% 0.16 90);
  z-index: 3;
  filter: drop-shadow(0 0.3cqw 0.4cqw oklch(0% 0 0 / 0.6));
}
.lw-result {
  font-size: 2.9cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  text-align: center;
  animation: pulse 0.6s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 0.45; } }

.lw-foot {
  display: flex;
  align-items: center;
  gap: 1.2cqw;
}
.lw-track {
  flex: 1;
  height: 2.4cqw;
  border-radius: 999px;
  background: oklch(28% 0.03 280 / 0.8);
  overflow: hidden;
}
.lw-fill {
  height: 100%;
  background: linear-gradient(90deg, oklch(82% 0.15 195), oklch(85% 0.16 90));
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.lw-count {
  font-family: var(--font-mono);
  font-size: 2.3cqw;
  color: oklch(80% 0.02 90);
  white-space: nowrap;
}
</style>
