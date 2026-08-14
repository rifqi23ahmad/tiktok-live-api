<script setup lang="ts">
import { computed } from 'vue'
import { widgetDefs } from '~/composables/useWidgetRegistry'
import { useTikTokStream } from '~/composables/useTikTokStream'

const stream = useTikTokStream()

const status = computed(() => {
  if (stream.mode.value === 'demo') return { label: 'Demo mode', cls: 'warn' }
  if (stream.mode.value === 'live' && stream.connected.value) return { label: 'Live', cls: 'ok' }
  return { label: 'Belum terhubung', cls: 'err' }
})

const steps = [
  { t: 'Susun widget', d: 'Drag-and-drop 10 widget ke kanvas 9:16.' },
  { t: 'Hubungkan stream', d: 'Masukkan username TikTok (atau pakai mode demo).' },
  { t: 'Atur & pratinjau', d: 'Edit properti tiap widget, lihat hasil real-time.' },
  { t: 'Publikasikan', d: 'Tempel URL overlay sebagai browser source di OBS.' }
]
</script>

<template>
  <div>
    <div class="hero">
      <div>
        <h1 class="hero-title">Stream Studio</h1>
        <p class="hero-sub">
          Bangun overlay TikTok LIVE interaktif tanpa kode. Susun widget drag-and-drop,
          hubungkan stream, dan publikasikan sebagai browser source.
        </p>
        <div class="row wrap" style="margin-top: 20px">
          <NuxtLink to="/builder" class="btn primary">Buka Builder</NuxtLink>
          <NuxtLink to="/gallery" class="btn">Template Gallery</NuxtLink>
          <span class="pill" :class="status.cls">
            <span class="dot" :class="status.cls === 'ok' ? 'live' : 'off'"></span>
            {{ status.label }}
          </span>
        </div>
      </div>
    </div>

    <h2 style="margin: 28px 0 4px">10 widget interaktif</h2>
    <p class="page-sub">Semua widget membaca stream secara real-time lewat WebSocket TikTok LIVE.</p>

    <div class="grid-3">
      <div v-for="w in widgetDefs" :key="w.type" class="card feature">
        <div class="feature-icon">{{ w.icon }}</div>
        <h3 style="margin: 0 0 6px">{{ w.name }}</h3>
        <p style="margin: 0; color: var(--ink-dim); font-size: 0.85rem">{{ w.description }}</p>
      </div>
    </div>

    <h2 style="margin: 28px 0 4px">Alur kerja</h2>
    <p class="page-sub">Dari ide ke overlay live dalam 4 langkah.</p>
    <div class="grid-2">
      <div v-for="(step, i) in steps" :key="i" class="card step">
        <div class="step-num">{{ i + 1 }}</div>
        <div>
          <h3 style="margin: 0 0 4px">{{ step.t }}</h3>
          <p style="margin: 0; color: var(--ink-dim); font-size: 0.85rem">{{ step.d }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  padding: 28px;
  border-radius: var(--radius);
  background:
    radial-gradient(700px 300px at 85% -20%, oklch(75% 0.19 350 / 0.3), transparent 60%),
    radial-gradient(600px 300px at 0% 120%, oklch(82% 0.15 195 / 0.25), transparent 55%),
    var(--bg-panel);
  border: 1px solid var(--edge);
}
.hero-title {
  font-size: 2.4rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 8px;
}
.hero-sub {
  color: var(--ink-dim);
  max-width: 620px;
  margin: 0;
  font-size: 1.05rem;
}

.feature {
  padding: 18px;
}
.feature-icon { font-size: 1.8rem; margin-bottom: 8px; }

.step {
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.step-num {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #0b0b0b;
}
</style>
