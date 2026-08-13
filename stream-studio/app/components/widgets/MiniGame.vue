<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { hashStr, fmtNum } from '~/utils/stream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()

const game = computed<'marble' | 'war'>(() => (props.settings.game === 'war' ? 'war' : 'marble'))

// ---------- Marble Race ----------
const RACERS = [
  { color: '#ff5252', emoji: '🔴' },
  { color: '#42a5f5', emoji: '🔵' },
  { color: '#66bb6a', emoji: '🟢' },
  { color: '#ffca28', emoji: '🟡' }
]

const positions = ref([0, 0, 0, 0])
const winner = ref<number | null>(null)
let lastGift = ''
let resetTimer: ReturnType<typeof setTimeout> | null = null

function advanceMarble() {
  const i = Math.floor(Math.random() * 4)
  positions.value[i] = Math.min(100, positions.value[i] + 2 + Math.random() * 9)
  if (positions.value[i] >= 100) {
    winner.value = i
    resetTimer = setTimeout(() => {
      positions.value = [0, 0, 0, 0]
      winner.value = null
    }, 3500)
  }
}

// ---------- Gift War ----------
const teams = computed(() => {
  let a = 0
  let b = 0
  for (const g of stream.gifts.value) {
    if (hashStr(g.user) % 2 === 0) a += g.diamondCount
    else b += g.diamondCount
  }
  return { a, b }
})
const warTotal = computed(() => teams.value.a + teams.value.b)
const pctA = computed(() => (warTotal.value > 0 ? (teams.value.a / warTotal.value) * 100 : 50))

watch(
  () => stream.gifts.value[0],
  (g) => {
    if (!g || g.id === lastGift) return
    lastGift = g.id
    if (game.value === 'marble') advanceMarble()
  }
)
</script>

<template>
  <div class="mg">
    <div class="mg-head">
      <span class="mg-title">{{ game === 'marble' ? '🏁 Marble Race' : '⚔️ Gift War' }}</span>
      <span class="mg-hint">gift = {{ game === 'marble' ? 'dorong bola' : 'isi kubu' }}</span>
    </div>

    <!-- Marble Race -->
    <div v-if="game === 'marble'" class="track">
      <div v-for="(r, i) in RACERS" :key="i" class="lane">
        <div class="lane-track">
          <div
            class="marble"
            :style="{ left: positions[i] + '%', background: r.color }"
          >
            {{ r.emoji }}
          </div>
          <div v-if="winner === i" class="win-flag">🏆</div>
        </div>
      </div>
      <div v-if="winner !== null" class="win-banner">Racer {{ winner + 1 }} menang!</div>
    </div>

    <!-- Gift War -->
    <div v-else class="war">
      <div class="war-row">
        <span class="war-team">🔴 Kubu Merah</span>
        <span class="war-val">{{ fmtNum(teams.a) }} 💎</span>
      </div>
      <div class="war-bar">
        <div class="war-fill a" :style="{ width: pctA + '%' }"></div>
        <div class="war-fill b" :style="{ width: 100 - pctA + '%' }"></div>
      </div>
      <div class="war-row">
        <span class="war-team">🔵 Kubu Biru</span>
        <span class="war-val">{{ fmtNum(teams.b) }} 💎</span>
      </div>
      <div class="war-lead">
        {{ teams.a === teams.b ? 'Imbang!' : (teams.a > teams.b ? 'Kubu Merah unggul' : 'Kubu Biru unggul') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.mg {
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
.mg-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.5cqw;
}
.mg-title { font-size: 3.4cqw; font-weight: 700; }
.mg-hint { font-size: 2.2cqw; color: oklch(80% 0.02 90); }

.track {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.6cqw;
  justify-content: center;
}
.lane { position: relative; }
.lane-track {
  position: relative;
  height: 5cqw;
  border-radius: 999px;
  background: oklch(28% 0.03 280 / 0.8);
  border: 1px solid oklch(60% 0.05 280 / 0.25);
  overflow: visible;
}
.marble {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6cqw;
  height: 6cqw;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 3cqw;
  transition: left 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 0 1.5cqw oklch(0% 0 0 / 0.5);
}
.win-flag {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  font-size: 4cqw;
}
.win-banner {
  text-align: center;
  font-size: 3.4cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  animation: pulse 0.6s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 0.4; } }

.war {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.4cqw;
}
.war-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 2.8cqw;
}
.war-team { font-weight: 700; }
.war-val { font-family: var(--font-mono); color: oklch(85% 0.16 90); }
.war-bar {
  display: flex;
  height: 5cqw;
  border-radius: 999px;
  overflow: hidden;
}
.war-fill.a { background: linear-gradient(90deg, oklch(70% 0.2 25), oklch(75% 0.19 350)); transition: width 0.5s; }
.war-fill.b { background: linear-gradient(90deg, oklch(70% 0.17 230), oklch(82% 0.15 195)); transition: width 0.5s; }
.war-lead { text-align: center; font-size: 3cqw; font-weight: 700; color: oklch(82% 0.15 195); }
</style>
