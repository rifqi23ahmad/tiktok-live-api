<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { useSfx } from '~/composables/useSfx'
import { tierOf, tierEmoji, tierColor, tierHold, fmtNum } from '~/utils/stream'
import type { GiftTier } from '~/utils/stream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()
const sfx = useSfx()

const sfxOn = computed(() => props.settings.sfx !== false)

interface AlertItem {
  user: string
  giftName: string
  diamondCount: number
  repeatCount: number
}

const queue = ref<AlertItem[]>([])
const current = ref<AlertItem | null>(null)
const tier = ref<GiftTier>(1)
const visible = ref(false)
let busy = false
let lastSeen = ''

const showCombo = computed(() => props.settings.showCombo !== false)
const minTier = computed<GiftTier>(() => (props.settings.minTier as GiftTier) || 1)

function pump() {
  if (busy || queue.value.length === 0) return
  busy = true
  const item = queue.value.shift()!
  current.value = item
  tier.value = tierOf(item.diamondCount)
  visible.value = true
  const hold = tierHold[tier.value]
  setTimeout(() => {
    visible.value = false
    setTimeout(() => {
      busy = false
      pump()
    }, 320)
  }, hold)
}

watch(
  () => stream.gifts.value[0],
  (g) => {
    if (!g || g.id === lastSeen) return
    lastSeen = g.id
    if (tierOf(g.diamondCount) < minTier.value) return
    const t = tierOf(g.diamondCount)
    if (t >= 4) sfx.trigger('gift-big', { enabled: sfxOn.value })
    else sfx.trigger('gift', { enabled: sfxOn.value })
    if (g.repeatCount > 1) sfx.trigger('combo', { enabled: sfxOn.value })
    queue.value.push({
      user: g.user,
      giftName: g.giftName,
      diamondCount: g.diamondCount,
      repeatCount: g.repeatCount
    })
    if (queue.value.length > 8) queue.value.shift()
    pump()
  }
)
</script>

<template>
  <div class="ga" :class="{ show: visible, ['t' + tier]: true }">
    <div class="ga-card">
      <div class="ga-emoji">{{ tierEmoji[tier] }}</div>
      <div class="ga-name" :style="{ color: tierColor[tier] }">@{{ current?.user }}</div>
      <div class="ga-gift">
        mengirim <b>{{ current?.giftName }}</b> ·
        <span class="d">{{ fmtNum(current?.diamondCount ?? 0) }} 💎</span>
      </div>
      <div v-if="showCombo && (current?.repeatCount ?? 1) > 1" class="ga-combo">
        🔥 x{{ current?.repeatCount }} combo
      </div>
    </div>
  </div>
</template>

<style scoped>
.ga {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0;
  transform: scale(0.6);
}
.ga.show {
  animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes pop {
  to { opacity: 1; transform: scale(1); }
}

.ga-card {
  text-align: center;
  padding: 3cqw 5cqw 4cqw;
  border-radius: 3cqw;
  background: oklch(15% 0.02 280 / 0.8);
  border: 1px solid oklch(70% 0.05 280 / 0.4);
  backdrop-filter: blur(10px);
  box-shadow: 0 0 8cqw oklch(0% 0 0 / 0.5);
}

.ga-emoji { font-size: 16cqw; line-height: 1; }
.t2 .ga-emoji { font-size: 19cqw; }
.t3 .ga-emoji { font-size: 23cqw; }
.t4 .ga-emoji { font-size: 28cqw; animation: float 1.6s ease-in-out infinite; }
@keyframes float { 50% { transform: translateY(-1.5cqw) rotate(6deg); } }

.ga-name {
  font-size: 6cqw;
  font-weight: 700;
  margin-top: 1.5cqw;
  text-shadow: 0 1px 1cqw oklch(0% 0 0 / 0.8);
}
.ga-gift {
  font-size: 4cqw;
  color: oklch(97% 0.01 90);
  margin-top: 0.6cqw;
}
.ga-gift .d {
  font-family: var(--font-mono);
  color: oklch(85% 0.16 90);
}
.ga-combo {
  margin-top: 1.5cqw;
  font-size: 4.4cqw;
  font-weight: 700;
  color: oklch(82% 0.15 195);
  letter-spacing: 0.04em;
}
</style>
