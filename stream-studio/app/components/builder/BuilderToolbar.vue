<script setup lang="ts">
import { computed, ref } from 'vue'
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

const publishOpen = ref(false)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const publishUrl = computed(() => {
  const cleanId = stream.username.value.trim().replace(/^@/, '')
  const key = stream.apiKey.value.trim()
  const params = new URLSearchParams()
  if (cleanId && key && key !== 'demo') {
    params.set('username', cleanId)
    params.set('apiKey', key)
  } else {
    params.set('demo', '1')
  }
  const origin = import.meta.client ? window.location.origin : ''
  return `${origin}/avatar-arena.html?${params.toString()}`
})

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(publishUrl.value)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* ignore */
  }
}

const openPreview = () => {
  window.open(publishUrl.value, '_blank', 'noopener')
}
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
      <div class="publish-wrap">
        <button class="btn publish" @click="publishOpen = !publishOpen">🔗 Publish</button>
        <div v-if="publishOpen" class="publish-pop">
          <div class="pp-title">Browser Source URL</div>
          <p class="pp-sub">Tempel URL ini sebagai <b>Browser Source</b> di OBS / Streamlabs / TikTok Live Studio (1080 × 1920).</p>
          <div class="urlbox">
            <code>{{ publishUrl }}</code>
          </div>
          <div class="pp-actions">
            <button class="btn primary" @click="copyUrl">{{ copied ? '✓ Tersalin!' : '📋 Salin URL' }}</button>
            <button class="btn ghost" @click="openPreview">▶ Preview</button>
          </div>
          <p class="pp-hint">Belum terhubung? URL otomatis memakai <b>mode demo</b>. Hubungkan stream di <NuxtLink to="/live" class="accent2">Live Connect</NuxtLink> untuk pakai username + API key asli.</p>
        </div>
      </div>
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
.publish-wrap { position: relative; }
.btn.publish { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #0b0b0b; font-weight: 700; }
.publish-pop {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 360px;
  background: oklch(13% 0.02 280);
  border: 1px solid var(--edge-strong);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 12px 40px oklch(0% 0 0 / 0.6);
  z-index: 50;
}
.pp-title { font-weight: 700; font-size: 1rem; }
.pp-sub { font-size: 0.8rem; color: var(--ink-dim); margin: 6px 0 12px; line-height: 1.5; }
.urlbox {
  background: oklch(20% 0.03 280);
  border: 1px solid var(--edge);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  word-break: break-all;
  color: var(--accent-2);
}
.pp-actions { display: flex; gap: 8px; margin-top: 12px; }
.pp-hint { font-size: 0.74rem; color: var(--ink-faint); margin-top: 12px; line-height: 1.5; }
.accent2 { color: var(--accent-2); }
</style>
