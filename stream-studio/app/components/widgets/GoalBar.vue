<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { useSfx } from '~/composables/useSfx'
import { fmtNum } from '~/utils/stream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()
const sfx = useSfx()

const sfxOn = computed(() => props.settings.sfx !== false)

const target = computed(() => Number(props.settings.target) || 0)
const title = computed(() => props.settings.title || 'Target')

const pct = computed(() =>
  target.value > 0 ? Math.min(100, (stream.totalDiamonds.value / target.value) * 100) : 0
)
const done = computed(() => target.value > 0 && stream.totalDiamonds.value >= target.value)

watch(done, (isDone) => {
  if (isDone) sfx.trigger('goal-complete', { enabled: sfxOn.value })
})
</script>

<template>
  <div class="gb" :class="{ complete: done }">
    <div class="gb-label">
      <span class="gb-title">{{ title }}</span>
      <span class="gb-count">
        <b>{{ fmtNum(stream.totalDiamonds.value) }}</b> / {{ fmtNum(target) }} 💎
      </span>
    </div>
    <div class="gb-track">
      <div class="gb-fill" :style="{ width: pct + '%' }"></div>
    </div>
    <div v-if="done" class="gb-done">🎉 Target tercapai!</div>
  </div>
</template>

<style scoped>
.gb {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.4cqw;
  padding: 2cqw 3cqw;
  border-radius: 2cqw;
  background: oklch(15% 0.02 280 / 0.72);
  border: 1px solid oklch(60% 0.05 280 / 0.35);
  backdrop-filter: blur(10px);
}
.gb-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.gb-title {
  font-size: 3.4cqw;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.gb-count {
  font-family: var(--font-mono);
  font-size: 3cqw;
  color: oklch(80% 0.02 90);
}
.gb-count b { color: oklch(85% 0.16 90); font-weight: 700; }
.gb-track {
  height: 2.6cqw;
  border-radius: 999px;
  background: oklch(30% 0.03 280 / 0.8);
  overflow: hidden;
  position: relative;
}
.gb-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, oklch(82% 0.15 195), oklch(70% 0.2 350));
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.gb.complete .gb-fill { background: oklch(85% 0.16 90); }
.gb.complete { animation: pulse 0.8s ease-in-out 3; }
@keyframes pulse {
  50% { border-color: oklch(85% 0.16 90); box-shadow: 0 0 3cqw oklch(85% 0.16 90 / 0.5); }
}
.gb-done {
  font-size: 3cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  text-align: center;
}
</style>
