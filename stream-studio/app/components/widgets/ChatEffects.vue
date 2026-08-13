<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { EMOJI_RE } from '~/utils/stream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()

interface Fx {
  id: number
  char: string
  left: number
  dur: number
  sway: number
  rot: number
  fs: number
}

const floaters = ref<Fx[]>([])
const raindrops = ref<Fx[]>([])
const shout = ref<{ text: string; from: string } | null>(null)
const hype = ref(0)
const onFire = ref(false)

let seq = 0
let lastMsg = ''
let floatBudget = 24
let shoutTimer: ReturnType<typeof setTimeout> | null = null
let decayTimer: ReturnType<typeof setInterval> | null = null
let onFireTimer: ReturnType<typeof setTimeout> | null = null

const floatEnabled = computed(() => props.settings.floatEmoji !== false)
const rainEnabled = computed(() => props.settings.rain !== false)
const hypeEnabled = computed(() => props.settings.hype !== false)

function spawnFloater(char: string) {
  if (floatBudget <= 0) return
  floatBudget--
  const id = ++seq
  floaters.value.push({
    id,
    char,
    left: 5 + Math.random() * 85,
    dur: 2.6 + Math.random() * 2,
    sway: Math.random() * 30 - 15,
    rot: Math.random() * 60 - 30,
    fs: 5 + Math.random() * 5
  })
  setTimeout(() => {
    floaters.value = floaters.value.filter((f) => f.id !== id)
    floatBudget++
  }, 4800)
}

function spawnRain(char: string) {
  const id = ++seq
  raindrops.value.push({
    id,
    char,
    left: Math.random() * 100,
    dur: 2.2 + Math.random() * 1.8,
    sway: 0,
    rot: Math.random() * 90 - 45,
    fs: 6
  })
  setTimeout(() => {
    raindrops.value = raindrops.value.filter((r) => r.id !== id)
  }, 4500)
}

function doRain() {
  const emojis = ['🌧️', '💧', '⭐', '✨', '❤️', '🔥']
  for (let i = 0; i < 24; i++) {
    setTimeout(() => spawnRain(emojis[Math.floor(Math.random() * emojis.length)]), i * 70)
  }
}

function addHype(n: number) {
  if (!hypeEnabled.value) return
  hype.value = Math.min(100, hype.value + n)
  if (hype.value >= 100 && !onFire.value) {
    onFire.value = true
    doRain()
    onFireTimer = setTimeout(() => {
      onFire.value = false
      hype.value = 0
    }, 4000)
  }
}

function onNewMessage(m: { id: string; comment: string; user: string }) {
  if (!m || m.id === lastMsg) return
  lastMsg = m.id
  const c = (m.comment || '').trim()
  const lower = c.toLowerCase()

  if (lower === '!hujan' || lower === '!rain') {
    if (rainEnabled.value) doRain()
    addHype(6)
    return
  }
  if (lower.startsWith('!sapa ')) {
    shout.value = { text: c.slice(6).slice(0, 80), from: m.user }
    clearTimeout(shoutTimer!)
    shoutTimer = setTimeout(() => {
      shout.value = null
    }, 3000)
    addHype(6)
    return
  }

  const emojis = c.match(EMOJI_RE)
  if (floatEnabled.value && emojis) {
    emojis.slice(0, 3).forEach((e, i) => setTimeout(() => spawnFloater(e), i * 150))
  }
  addHype(emojis ? 5 : 3)
}

watch(() => stream.messages.value[0], onNewMessage)

onMounted(() => {
  decayTimer = setInterval(() => {
    hype.value = Math.max(0, hype.value - 3)
  }, 1500)
})

onUnmounted(() => {
  if (decayTimer) clearInterval(decayTimer)
  if (onFireTimer) clearTimeout(onFireTimer)
  if (shoutTimer) clearTimeout(shoutTimer)
})
</script>

<template>
  <div class="ce" :class="{ fire: onFire }">
    <div class="ce-stage">
      <div
        v-for="f in floaters"
        :key="'f' + f.id"
        class="fx float-up"
        :style="{
          left: f.left + '%',
          '--dur': f.dur + 's',
          '--sway': f.sway + 'cqw',
          '--rot': f.rot + 'deg',
          '--fs': f.fs + 'cqw'
        }"
      >{{ f.char }}</div>

      <div
        v-for="r in raindrops"
        :key="'r' + r.id"
        class="fx rain"
        :style="{
          left: r.left + '%',
          '--dur': r.dur + 's',
          '--rot': r.rot + 'deg',
          '--fs': r.fs + 'cqw'
        }"
      >{{ r.char }}</div>

      <div v-if="shout" class="shout">
        <div class="shout-text">{{ shout.text }}</div>
        <div class="shout-from">— @{{ shout.from }}</div>
      </div>

      <div v-if="onFire" class="onfire">
        <div class="big">🔥 CHAT ON FIRE 🔥</div>
      </div>
    </div>

    <div v-if="hypeEnabled" class="hype">
      <div class="hype-fill" :style="{ height: hype + '%' }"></div>
      <span class="hype-label">🔥</span>
    </div>
  </div>
</template>

<style scoped>
.ce {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 2cqw;
}
.ce.fire { animation: fireGlow 0.4s ease-in-out 4; }
@keyframes fireGlow { 50% { filter: brightness(1.4); } }

.ce-stage {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.fx {
  position: absolute;
  font-size: var(--fs, 7cqw);
  pointer-events: none;
}

.float-up {
  bottom: -12cqw;
  animation: floatUp var(--dur, 3.4s) cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}
@keyframes floatUp {
  20% { opacity: 1; }
  to {
    transform: translateY(-112cqh) translateX(var(--sway, 0px)) rotate(var(--rot, 0deg));
    opacity: 0;
  }
}

.rain {
  top: -10cqw;
  animation: rainFall var(--dur, 3s) linear forwards;
}
@keyframes rainFall {
  to { transform: translateY(112cqh) rotate(var(--rot, 20deg)); opacity: 0.9; }
}

.shout {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 92%;
  animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop { from { transform: translate(-50%, -50%) scale(0.8); } to { transform: translate(-50%, -50%) scale(1); } }
.shout-text {
  font-size: 5cqw;
  font-weight: 700;
  color: oklch(82% 0.15 195);
  text-shadow: 0 2px 1cqw oklch(0% 0 0 / 0.8);
  overflow-wrap: anywhere;
}
.shout-from { font-size: 2.6cqw; color: oklch(80% 0.02 90); margin-top: 0.6cqw; }

.onfire {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 100%;
}
.onfire .big {
  font-size: 7cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  text-shadow: 0 0 4cqw oklch(75% 0.19 350 / 0.8);
}

.hype {
  position: absolute;
  top: 6%;
  right: 4%;
  width: 4cqw;
  height: 40cqh;
  background: oklch(15% 0.02 280 / 0.7);
  border: 1px solid oklch(60% 0.05 280 / 0.35);
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}
.hype-fill {
  width: 100%;
  height: 0%;
  background: linear-gradient(0deg, oklch(75% 0.19 350), oklch(85% 0.16 90));
  transition: height 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.hype-label {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 3cqw;
}
</style>
