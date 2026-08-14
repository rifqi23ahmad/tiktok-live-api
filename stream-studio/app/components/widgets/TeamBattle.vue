<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { useSfx } from '~/composables/useSfx'
import { hashStr, fmtNum } from '~/utils/stream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()
const sfx = useSfx()

const sfxOn = computed(() => props.settings.sfx !== false)

// ── config ──
const teamA = computed(() => props.settings.teamA || 'Kubu Merah')
const teamB = computed(() => props.settings.teamB || 'Kubu Biru')
const keyA = computed<string[]>(() => (Array.isArray(props.settings.keyA) ? props.settings.keyA : ['merah']).map((s: string) => s.toLowerCase()))
const keyB = computed<string[]>(() => (Array.isArray(props.settings.keyB) ? props.settings.keyB : ['biru']).map((s: string) => s.toLowerCase()))
const roundSec = computed(() => Math.max(0, Number(props.settings.roundSec) || 0))
const auto = computed(() => props.settings.auto !== false)

// ── membership (persists across rounds → team identity) ──
interface Member {
  user: string
  nickname: string
  avatarUrl: string
  team: 0 | 1
}
const roster = ref<Record<string, Member>>({})

function joinTeam(user: string, nickname: string, avatarUrl: string, team: 0 | 1) {
  const prev = roster.value[user]
  roster.value = {
    ...roster.value,
    [user]: {
      user,
      nickname: nickname || prev?.nickname || user,
      avatarUrl: avatarUrl || prev?.avatarUrl || '',
      team
    }
  }
}

function teamOf(user: string): 0 | 1 {
  const m = roster.value[user]
  if (m) return m.team
  return hashStr(user) % 2
}

const sideA = computed(() => Object.values(roster.value).filter((m) => m.team === 0))
const sideB = computed(() => Object.values(roster.value).filter((m) => m.team === 1))

// ── round state ──
const roundA = ref(0)
const roundB = ref(0)
const active = ref(false)
const timeLeft = ref(0)
const winner = ref<0 | 1 | -1 | null>(null)
const roundNo = ref(1)

let ticker: ReturnType<typeof setInterval> | null = null
let restartTimer: ReturnType<typeof setTimeout> | null = null
let lastGift = ''

function clearTicker() {
  if (ticker) clearInterval(ticker)
  ticker = null
}

function endRound() {
  clearTicker()
  active.value = false
  winner.value = roundA.value === roundB.value ? -1 : roundA.value > roundB.value ? 0 : 1
  sfx.trigger('win', { enabled: sfxOn.value })
  if (auto.value) {
    restartTimer = setTimeout(() => {
      roundNo.value += 1
      startRound()
    }, 5000)
  }
}

function startRound() {
  if (restartTimer) clearTimeout(restartTimer)
  restartTimer = null
  roundA.value = 0
  roundB.value = 0
  winner.value = null
  active.value = true
  timeLeft.value = roundSec.value
  clearTicker()
  if (roundSec.value > 0) {
    ticker = setInterval(() => {
      timeLeft.value -= 1
      if (timeLeft.value <= 0) endRound()
    }, 1000)
  }
}

// ── ingest ──
watch(
  () => stream.gifts.value[0],
  (g) => {
    if (!g || g.id === lastGift) return
    lastGift = g.id
    if (!active.value) return
    const t = teamOf(g.user)
    if (t === 0) roundA.value += g.diamondCount
    else roundB.value += g.diamondCount
    sfx.trigger('score', { enabled: sfxOn.value })
  }
)

watch(() => stream.messages.value[0], (m) => {
  if (!m) return
  const c = (m.comment || '').toLowerCase().trim()
  if (c === '!mulai' || c === '!start' || c === '!battle') {
    if (!active.value) {
      roundNo.value += 1
      startRound()
    } else if (winner.value !== null) {
      roundNo.value += 1
      startRound()
    }
    return
  }
  const a = keyA.value.some((k) => c.includes(k))
  const b = keyB.value.some((k) => c.includes(k))
  if (a === b) return
  joinTeam(m.user, m.nickname, m.avatarUrl, a ? 0 : 1)
})

const total = computed(() => roundA.value + roundB.value)
const pctA = computed(() => (total.value > 0 ? (roundA.value / total.value) * 100 : 50))
const timerLabel = computed(() => {
  const s = Math.max(0, timeLeft.value)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const winnerName = computed(() => (winner.value === 0 ? teamA.value : winner.value === 1 ? teamB.value : ''))

onMounted(() => startRound())
onUnmounted(() => {
  clearTicker()
  if (restartTimer) clearTimeout(restartTimer)
})
</script>

<template>
  <div class="tb">
    <div class="tb-head">
      <span class="tb-title">⚔️ Team Battle</span>
      <span class="tb-timer" :class="{ hot: active }">{{ active ? timerLabel : 'Selesai' }}</span>
    </div>

    <div class="tb-side">
      <div class="tb-avatars">
        <img v-for="p in sideA.slice(0, 5)" :key="'a' + p.user" class="tb-avatar a" :src="p.avatarUrl" :alt="p.nickname" loading="lazy" />
        <span v-if="!sideA.length" class="tb-empty a">?</span>
      </div>
      <div class="tb-row">
        <span class="tb-team">🔴 {{ teamA }}</span>
        <span class="tb-val">{{ fmtNum(roundA) }} 💎</span>
      </div>
    </div>

    <div class="tb-bar">
      <div class="tb-fill a" :style="{ width: pctA + '%' }"></div>
      <div class="tb-fill b" :style="{ width: 100 - pctA + '%' }"></div>
    </div>

    <div class="tb-side">
      <div class="tb-avatars">
        <img v-for="p in sideB.slice(0, 5)" :key="'b' + p.user" class="tb-avatar b" :src="p.avatarUrl" :alt="p.nickname" loading="lazy" />
        <span v-if="!sideB.length" class="tb-empty b">?</span>
      </div>
      <div class="tb-row">
        <span class="tb-team">🔵 {{ teamB }}</span>
        <span class="tb-val">{{ fmtNum(roundB) }} 💎</span>
      </div>
    </div>

    <div class="tb-foot">
      <span v-if="winner === null" class="tb-hint">ketik "{{ keyA[0] }}" / "{{ keyB[0] }}" untuk join</span>
      <span v-else-if="winner === -1" class="tb-win">🤝 SERI!</span>
      <span v-else class="tb-win">🏆 {{ winnerName }} menang!</span>
    </div>
  </div>
</template>

<style scoped>
.tb {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2cqw;
  padding: 2cqw;
  border-radius: 2cqw;
  background: oklch(15% 0.02 280 / 0.72);
  border: 1px solid oklch(60% 0.05 280 / 0.35);
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.tb-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.4cqw;
}
.tb-title { font-size: 3.4cqw; font-weight: 700; }
.tb-timer {
  font-family: var(--font-mono);
  font-size: 2.8cqw;
  font-weight: 700;
  color: oklch(80% 0.02 90);
}
.tb-timer.hot { color: oklch(85% 0.16 90); }

.tb-side { display: flex; flex-direction: column; gap: 0.5cqw; }
.tb-avatars { display: flex; gap: 0.8cqw; align-items: center; min-height: 4.8cqw; }
.tb-avatar {
  width: 4.4cqw;
  height: 4.4cqw;
  border-radius: 50%;
  object-fit: cover;
  background: oklch(25% 0.03 280);
}
.tb-avatar.a { border: 0.3cqw solid oklch(70% 0.2 25); }
.tb-avatar.b { border: 0.3cqw solid oklch(70% 0.17 230); }
.tb-empty {
  width: 4.4cqw;
  height: 4.4cqw;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #fff;
}
.tb-empty.a { background: oklch(55% 0.15 25); }
.tb-empty.b { background: oklch(55% 0.14 230); }

.tb-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 2.7cqw;
}
.tb-team { font-weight: 700; }
.tb-val { font-family: var(--font-mono); color: oklch(85% 0.16 90); }

.tb-bar {
  display: flex;
  height: 4.6cqw;
  border-radius: 999px;
  overflow: hidden;
}
.tb-fill.a { background: linear-gradient(90deg, oklch(70% 0.2 25), oklch(75% 0.19 350)); transition: width 0.5s; }
.tb-fill.b { background: linear-gradient(90deg, oklch(70% 0.17 230), oklch(82% 0.15 195)); transition: width 0.5s; }

.tb-foot { text-align: center; min-height: 3cqw; }
.tb-hint { font-size: 2.1cqw; color: oklch(80% 0.02 90); }
.tb-win {
  font-size: 3cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  text-shadow: 0 0 2cqw oklch(85% 0.16 90 / 0.5);
  animation: pulse 0.6s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 0.4; } }
</style>
