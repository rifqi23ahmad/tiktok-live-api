<script setup lang="ts">
import { computed } from 'vue'
import { useStudio } from '~/composables/useStudio'
import { useTikTokStream } from '~/composables/useTikTokStream'

const { loadClassicPreset, clearAll, instances } = useStudio()
const stream = useTikTokStream()

const statusLabel = computed(() => {
  if (stream.mode.value === 'demo') return 'Demo mode'
  if (stream.mode.value === 'live' && stream.connected.value) return 'Live'
  if (stream.mode.value === 'live') return 'Connecting…'
  return 'Belum terhubung'
})

const statusClass = computed(() => {
  if (stream.mode.value === 'demo') return 'warn'
  if (stream.mode.value === 'live' && stream.connected.value) return 'ok'
  return 'off'
})
</script>

<template>
  <header class="toolbar">
    <div class="tb-left">
      <div class="tb-title">Builder</div>
      <div class="tb-meta">{{ instances.length }} widget</div>
    </div>

    <div class="tb-center">
      <button class="btn" @click="loadClassicPreset">✨ Layout Klasik</button>
      <button class="btn ghost" @click="clearAll">Bersihkan</button>
    </div>

    <div class="tb-right">
      <span class="pill" :class="statusClass">
        <span class="dot" :class="statusClass === 'ok' ? 'live' : statusClass === 'off' ? 'off' : ''"></span>
        {{ statusLabel }}
      </span>
      <NuxtLink to="/live" class="btn primary">Hubungkan Stream</NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--edge);
  background: oklch(11% 0.02 280 / 0.6);
}
.tb-left { display: flex; align-items: baseline; gap: 10px; }
.tb-title { font-weight: 700; font-size: 1rem; }
.tb-meta { font-size: 0.78rem; color: var(--ink-faint); }
.tb-center { display: flex; gap: 8px; margin: 0 auto; }
.tb-right { display: flex; align-items: center; gap: 12px; }
</style>
