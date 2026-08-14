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
const title = computed(() => props.settings.title || 'Poin Penonton')
const maxRows = computed(() => Number(props.settings.maxRows) || 5)
const chatPts = computed(() => Number(props.settings.chatPts) || 1)
const followPts = computed(() => Number(props.settings.followPts) || 20)
const giftMul = computed(() => Number(props.settings.giftMul) || 2)
const spinCost = computed(() => Number(props.settings.spinCost) || 20)

interface Fan {
  user: string
  nickname: string
  avatarUrl: string
  points: number
  chats: number
}

const fans = ref<Record<string, Fan>>({})

function ensure(user: string, nickname: string, avatarUrl: string): Fan {
  const prev = fans.value[user]
  if (prev) {
    prev.nickname = nickname || prev.nickname
    prev.avatarUrl = avatarUrl || prev.avatarUrl
    return prev
  }
  const f: Fan = { user, nickname: nickname || user, avatarUrl: avatarUrl || '', points: 0, chats: 0 }
  fans.value = { ...fans.value, [user]: f }
  return f
}

function addPoints(user: string, nickname: string, avatarUrl: string, pts: number) {
  if (pts <= 0) return
  const f = ensure(user, nickname, avatarUrl)
  f.points += pts
}

// ── redeem state ──
const toast = ref<{ icon: string; text: string } | null>(null)
const party = ref(false)
const spot = ref<{ nickname: string; avatarUrl: string } | null>(null)
const spin = ref<{ nickname: string; amount: number; spinning: boolean } | null>(null)

let toastTimer: ReturnType<typeof setTimeout> | null = null
let partyTimer: ReturnType<typeof setTimeout> | null = null
let spotTimer: ReturnType<typeof setTimeout> | null = null
let spinTimer: ReturnType<typeof setTimeout> | null = null
let lastMsg = ''

function showToast(icon: string, text: string) {
  toast.value = { icon, text }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 3000)
}

function tryRedeem(user: string, nickname: string, avatarUrl: string, cost: number): boolean {
  const f = ensure(user, nickname, avatarUrl)
  if (f.points < cost) {
    showToast('⛔', `@${f.nickname} poin kurang (${fmtNum(f.points)}/${cost})`)
    return false
  }
  f.points -= cost
  return true
}

function doSpin(user: string, nickname: string, avatarUrl: string) {
  spin.value = { nickname: nickname || user, amount: 0, spinning: true }
  sfx.trigger('redeem', { enabled: sfxOn.value })
  if (spinTimer) clearTimeout(spinTimer)
  spinTimer = setTimeout(() => {
    const rewards = [5, 10, 10, 20, 20, 50, 100]
    const amount = rewards[Math.floor(Math.random() * rewards.length)]
    addPoints(user, nickname, avatarUrl, amount)
    spin.value = { nickname: nickname || user, amount, spinning: false }
    spinTimer = setTimeout(() => (spin.value = null), 2600)
  }, 1400)
}

function onMessage(m: { id: string; user: string; nickname: string; avatarUrl: string; comment: string }) {
  if (!m || m.id === lastMsg) return
  lastMsg = m.id
  const c = (m.comment || '').trim()
  const lower = c.toLowerCase()

  // every message earns chat points (commands too, then redeemed below)
  addPoints(m.user, m.nickname, m.avatarUrl, chatPts.value)

  if (lower === '!poin') {
    const f = ensure(m.user, m.nickname, m.avatarUrl)
    showToast('💰', `@${f.nickname} punya ${fmtNum(f.points)} poin`)
    return
  }
  if (lower === '!spin') {
    if (spin.value?.spinning) return
    if (tryRedeem(m.user, m.nickname, m.avatarUrl, spinCost.value)) doSpin(m.user, m.nickname, m.avatarUrl)
    return
  }
  if (lower === '!party' || lower === '!pesta') {
    if (tryRedeem(m.user, m.nickname, m.avatarUrl, 40)) {
      party.value = true
      sfx.trigger('redeem', { enabled: sfxOn.value })
      if (partyTimer) clearTimeout(partyTimer)
      partyTimer = setTimeout(() => (party.value = false), 4000)
    }
    return
  }
  if (lower === '!spot') {
    if (tryRedeem(m.user, m.nickname, m.avatarUrl, 30)) {
      spot.value = { nickname: m.nickname || m.user, avatarUrl: m.avatarUrl }
      sfx.trigger('redeem', { enabled: sfxOn.value })
      if (spotTimer) clearTimeout(spotTimer)
      spotTimer = setTimeout(() => (spot.value = null), 5000)
    }
    return
  }
}

watch(() => stream.messages.value[0], onMessage)
watch(
  () => stream.likes.value[0],
  (l) => {
    if (!l) return
    addPoints(l.user, l.nickname, l.avatarUrl, Math.min(l.likeCount || 1, 5))
  }
)
watch(
  () => stream.follows.value[0],
  (f) => {
    if (!f) return
    addPoints(f.user, f.nickname, f.avatarUrl, followPts.value)
  }
)
watch(
  () => stream.gifts.value[0],
  (g) => {
    if (!g) return
    addPoints(g.user, g.nickname, g.avatarUrl, Math.round(g.diamondCount * giftMul.value))
  }
)

const top = computed(() =>
  Object.values(fans.value)
    .sort((a, b) => b.points - a.points)
    .slice(0, maxRows.value)
)

const medals = ['👑', '2', '3', '4', '5', '6', '7', '8', '9', '10']

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
  if (partyTimer) clearTimeout(partyTimer)
  if (spotTimer) clearTimeout(spotTimer)
  if (spinTimer) clearTimeout(spinTimer)
})
</script>

<template>
  <div class="lp">
    <div class="lp-stage">
      <div v-if="party" class="lp-party">
        <span v-for="n in 12" :key="n" class="cf" :style="{ '--i': n }">🎊</span>
      </div>
      <div v-if="spot" class="lp-spot">
        <img class="lp-spot-avatar" :src="spot.avatarUrl" :alt="spot.nickname" />
        <div class="lp-spot-name">⭐ @{{ spot.nickname }}</div>
      </div>
      <div v-if="spin" class="lp-spin" :class="{ done: !spin.spinning }">
        <div v-if="spin.spinning" class="lp-slot">🎰</div>
        <div v-else class="lp-slot-result">+{{ spin.amount }} poin → @{{ spin.nickname }}</div>
      </div>
      <div v-if="toast" class="lp-toast">{{ toast.icon }} {{ toast.text }}</div>
    </div>

    <div class="lp-head">
      <span class="lp-title">💰 {{ title }}</span>
      <span class="lp-cmd">ketik !poin / !spin</span>
    </div>

    <ol v-if="top.length" class="lp-list">
      <li v-for="(f, i) in top" :key="f.user" :class="{ first: i === 0 }">
        <span class="rank">{{ medals[i] }}</span>
        <span class="name">
          @{{ f.nickname }}
          <span v-if="f.chats >= 5" class="fire">🔥{{ f.chats }}</span>
        </span>
        <span class="pts">{{ fmtNum(f.points) }} pt</span>
      </li>
    </ol>
    <div v-else class="lp-empty">Menunggu aktivitas penonton…</div>
  </div>
</template>

<style scoped>
.lp {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2cqw;
  border-radius: 2cqw;
  background: oklch(15% 0.02 280 / 0.72);
  border: 1px solid oklch(60% 0.05 280 / 0.35);
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.lp-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.4cqw;
}
.lp-title { font-size: 3.4cqw; font-weight: 700; }
.lp-cmd { font-size: 2.1cqw; color: oklch(80% 0.02 90); }

.lp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9cqw;
  overflow: hidden;
}
.lp-list li {
  display: grid;
  grid-template-columns: 3cqw minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9cqw;
  padding: 0.7cqw 1cqw;
  border-radius: 1.2cqw;
  background: oklch(25% 0.03 280 / 0.5);
  font-size: 2.7cqw;
}
.lp-list li.first {
  background: oklch(35% 0.07 90 / 0.55);
  border: 1px solid oklch(85% 0.16 90 / 0.4);
}
.rank { font-family: var(--font-mono); font-weight: 700; text-align: center; color: oklch(80% 0.02 90); }
.first .rank { color: oklch(85% 0.16 90); }
.name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fire { color: oklch(75% 0.19 350); margin-left: 0.5cqw; font-size: 2.2cqw; }
.pts { font-family: var(--font-mono); font-weight: 700; color: oklch(85% 0.16 90); white-space: nowrap; }
.lp-empty { font-size: 2.7cqw; color: oklch(80% 0.02 90); padding: 1cqw; }

.lp-stage {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
  overflow: hidden;
  border-radius: 2cqw;
}
.lp-party { position: absolute; inset: 0; }
.cf {
  position: absolute;
  top: 40%;
  left: 50%;
  font-size: 3cqw;
  animation: cf 1.6s ease-out forwards;
  animation-delay: calc(var(--i) * 0.06s);
}
@keyframes cf {
  from { transform: translate(0, 0) scale(1); opacity: 1; }
  to {
    transform: translate(calc((var(--i) - 6) * 6cqw), calc(var(--i) * 1.5cqw - 10cqw)) rotate(calc((var(--i) - 6) * 60deg));
    opacity: 0;
  }
}
.lp-spot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6cqw;
  animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop { from { transform: translate(-50%, -50%) scale(0.6); } to { transform: translate(-50%, -50%) scale(1); } }
.lp-spot-avatar {
  width: 14cqw;
  height: 14cqw;
  border-radius: 50%;
  object-fit: cover;
  border: 0.6cqw solid oklch(85% 0.16 90);
  box-shadow: 0 0 4cqw oklch(85% 0.16 90 / 0.6);
}
.lp-spot-name {
  font-size: 3cqw;
  font-weight: 700;
  background: oklch(20% 0.03 280 / 0.85);
  border-radius: 999px;
  padding: 0.4cqw 1.4cqw;
}
.lp-spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.lp-slot { font-size: 10cqw; animation: shake 0.25s linear infinite; }
@keyframes shake { 50% { transform: translateX(0.4cqw); } }
.lp-slot-result {
  font-size: 3.6cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  text-shadow: 0 0 2cqw oklch(85% 0.16 90 / 0.5);
}
.lp-toast {
  position: absolute;
  bottom: 1.6cqw;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2.4cqw;
  font-weight: 600;
  background: oklch(20% 0.03 280 / 0.9);
  border: 1px solid oklch(60% 0.05 280 / 0.4);
  border-radius: 999px;
  padding: 0.8cqw 1.8cqw;
  white-space: nowrap;
  animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
