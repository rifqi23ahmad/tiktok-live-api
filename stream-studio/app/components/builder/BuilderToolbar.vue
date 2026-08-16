<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudio } from '~/composables/useStudio'
import { useTikTokStream, TIKTOOL_API_KEY } from '~/composables/useTikTokStream'
import { useSfx } from '~/composables/useSfx'
import { encodeOverlayConfig } from '~/utils/overlay'

const { loadClassicPreset, clearAll, instances } = useStudio()
const stream = useTikTokStream()
const sfx = useSfx()

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
  const key = stream.apiKey.value.trim() || TIKTOOL_API_KEY
  const hasCreds = !!cleanId && !!key && key !== 'demo'
  const config = {
    username: cleanId,
    apiKey: key,
    demo: !hasCreds,
    instances: instances.value.map((i) => ({
      id: i.id,
      type: i.type,
      x: i.x,
      y: i.y,
      w: i.w,
      h: i.h,
      props: i.props
    }))
  }
  const origin = import.meta.client ? window.location.origin : ''
  return `${origin}/overlay?config=${encodeOverlayConfig(config)}`
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

const sfxOpen = ref(false)
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
      <div class="sfx-wrap">
        <button class="btn" :class="{ 'sfx-muted': sfx.muted.value }" @click="sfxOpen = !sfxOpen">
          {{ sfx.muted.value ? '🔇 SFX' : '🔊 SFX' }}
        </button>
        <div v-if="sfxOpen" class="sfx-pop">
          <div class="pp-title">Efek Suara (SFX)</div>
          <p class="pp-sub">Petakan suara ke event interaktif. Suara disintesis langsung (tanpa file audio).</p>

          <label class="sfx-mute check">
            <input type="checkbox" :checked="!sfx.muted.value" @change="sfx.setMuted(!($event.target as HTMLInputElement).checked)" />
            Aktifkan suara (global)
          </label>

          <div class="sfx-list">
            <div v-for="ev in sfx.events" :key="ev.id" class="sfx-row">
              <span class="sfx-ev" :title="ev.id">{{ ev.emoji }} {{ ev.name }}</span>
              <select
                :value="sfx.eventMap.value[ev.id]"
                @change="sfx.setEventSound(ev.id, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="s in sfx.sounds" :key="s.id" :value="s.id">{{ s.emoji }} {{ s.name }}</option>
              </select>
              <button class="sfx-play" title="Tes suara" @click="sfx.preview(sfx.eventMap.value[ev.id] || ev.default)">▶</button>
            </div>
          </div>

          <div class="pp-actions">
            <button class="btn ghost" @click="sfx.resetMapping()">Reset default</button>
            <button class="btn primary" @click="sfxOpen = false">Selesai</button>
          </div>
          <p class="pp-hint">Browser source (OBS) biasanya auto-mute. Klik area overlay sekali (atau aktifkan audio source di OBS) untuk menyalakan suara.</p>
        </div>
      </div>
      <div class="publish-wrap">
        <button class="btn publish" @click="publishOpen = !publishOpen">🔗 Publish</button>
        <div v-if="publishOpen" class="publish-pop">
          <div class="pp-title">Browser Source URL</div>
          <p class="pp-sub">Tempel URL ini sebagai <b>Browser Source</b> di OBS / Streamlabs / TikTok Live Studio (1080 × 1920). Semua widget di kanvas ({{ instances.length }}) dirender sekaligus.</p>
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
.sfx-wrap { position: relative; }
.btn.sfx-muted { opacity: 0.6; }
.sfx-pop {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 340px;
  max-height: 70vh;
  overflow-y: auto;
  background: oklch(13% 0.02 280);
  border: 1px solid var(--edge-strong);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 12px 40px oklch(0% 0 0 / 0.6);
  z-index: 50;
}
.sfx-mute.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  background: oklch(20% 0.03 280);
  cursor: pointer;
}
.sfx-mute input { accent-color: var(--accent); }
.sfx-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 2px;
}
.sfx-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
}
.sfx-ev { color: var(--ink-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sfx-row select {
  background: var(--bg-deep);
  border: 1px solid var(--edge);
  color: var(--ink);
  border-radius: 7px;
  padding: 5px 6px;
  font-size: 0.76rem;
  max-width: 150px;
}
.sfx-row select:focus { outline: none; border-color: var(--accent); }
.sfx-play {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 1px solid var(--edge-strong);
  background: var(--bg-raise);
  color: var(--ink);
  font-size: 0.7rem;
}
.sfx-play:hover { background: oklch(20% 0.03 280); }
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
