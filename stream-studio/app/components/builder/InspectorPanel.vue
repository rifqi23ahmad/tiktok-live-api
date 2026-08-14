<script setup lang="ts">
import { computed } from 'vue'
import { useStudio } from '~/composables/useStudio'
import { widgetDef } from '~/composables/useWidgetRegistry'
import type { GiftTier } from '~/utils/stream'

const { instances, selectedId, updateProps, updateLayout, removeWidget, duplicateWidget } = useStudio()

const inst = computed(() => instances.value.find((i) => i.id === selectedId.value) || null)
const def = computed(() => (inst.value ? widgetDef(inst.value.type) : null))

function setProp(key: string, val: any) {
  if (!inst.value) return
  updateProps(inst.value.id, { [key]: val })
}

function setNumProp(key: string, val: string) {
  setProp(key, Number(val) || 0)
}

function setLayout(key: 'x' | 'y' | 'w' | 'h', val: string) {
  if (!inst.value) return
  const n = Math.min(100, Math.max(0, Number(val) || 0))
  updateLayout(inst.value.id, { [key]: n })
}

function setOption(idx: number, val: string) {
  if (!inst.value) return
  const options = Array.isArray(inst.value.props.options) ? [...inst.value.props.options] : ['Tim A', 'Tim B']
  options[idx] = val
  updateProps(inst.value.id, { options })
}
</script>

<template>
  <aside class="inspector">
    <template v-if="inst && def">
      <div class="insp-head">
        <div class="insp-title">{{ def.icon }} {{ def.name }}</div>
        <div class="insp-actions">
          <button class="mini" title="Duplicate" @click="duplicateWidget(inst.id)">⧉</button>
          <button class="mini danger" title="Hapus" @click="removeWidget(inst.id)">✕</button>
        </div>
      </div>

      <div class="insp-section">
        <div class="insp-label">Posisi & Ukuran</div>
        <div class="grid4">
          <label class="mini-field">X
            <input type="number" :value="Math.round(inst.x)" @input="setLayout('x', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field">Y
            <input type="number" :value="Math.round(inst.y)" @input="setLayout('y', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field">W
            <input type="number" :value="Math.round(inst.w)" @input="setLayout('w', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field">H
            <input type="number" :value="Math.round(inst.h)" @input="setLayout('h', ($event.target as HTMLInputElement).value)" />
          </label>
        </div>
      </div>

      <div class="insp-section">
        <div class="insp-label">Pengaturan</div>

        <label class="mini-field check">
          <input type="checkbox" :checked="inst.props.sfx !== false" @change="setProp('sfx', ($event.target as HTMLInputElement).checked)" />
          🔊 Efek suara widget
        </label>

        <template v-if="inst.type === 'goal-bar'">
          <label class="mini-field">Judul
            <input type="text" :value="inst.props.title" @input="setProp('title', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field">Target diamond
            <input type="number" :value="inst.props.target" @input="setNumProp('target', ($event.target as HTMLInputElement).value)" />
          </label>
        </template>

        <template v-else-if="inst.type === 'gift-alert'">
          <label class="mini-field check">
            <input type="checkbox" :checked="inst.props.showCombo !== false" @change="setProp('showCombo', ($event.target as HTMLInputElement).checked)" />
            Tampilkan combo meter
          </label>
          <label class="mini-field">Tier minimum
            <select :value="inst.props.minTier" @change="setProp('minTier', Number(($event.target as HTMLSelectElement).value) as GiftTier)">
              <option :value="1">1 — semua gift</option>
              <option :value="2">2 — ≥ 10 💎</option>
              <option :value="3">3 — ≥ 100 💎</option>
              <option :value="4">4 — ≥ 1000 💎</option>
            </select>
          </label>
        </template>

        <template v-else-if="inst.type === 'mini-game'">
          <label class="mini-field">Game
            <select :value="inst.props.game" @change="setProp('game', ($event.target as HTMLSelectElement).value)">
              <option value="marble">Marble Race</option>
              <option value="war">Gift War</option>
            </select>
          </label>
        </template>

        <template v-else-if="inst.type === 'poll-prediction'">
          <label class="mini-field">Pertanyaan
            <input type="text" :value="inst.props.question" @input="setProp('question', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field">Opsi A
            <input type="text" :value="inst.props.options?.[0]" @input="setOption(0, ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field">Opsi B
            <input type="text" :value="inst.props.options?.[1]" @input="setOption(1, ($event.target as HTMLInputElement).value)" />
          </label>
          <div class="grid2">
            <label class="mini-field">Keyword A
              <input type="text" :value="inst.props.keysA?.join(',')" @input="setProp('keysA', ($event.target as HTMLInputElement).value.split(',').map(s => s.trim()))" />
            </label>
            <label class="mini-field">Keyword B
              <input type="text" :value="inst.props.keysB?.join(',')" @input="setProp('keysB', ($event.target as HTMLInputElement).value.split(',').map(s => s.trim()))" />
            </label>
          </div>
        </template>

        <template v-else-if="inst.type === 'gift-leaderboard'">
          <label class="mini-field">Judul
            <input type="text" :value="inst.props.title" @input="setProp('title', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field">Jumlah baris
            <input type="number" :value="inst.props.maxRows" @input="setNumProp('maxRows', ($event.target as HTMLInputElement).value)" />
          </label>
        </template>

        <template v-else-if="inst.type === 'chat-effects'">
          <label class="mini-field check">
            <input type="checkbox" :checked="inst.props.floatEmoji !== false" @change="setProp('floatEmoji', ($event.target as HTMLInputElement).checked)" />
            Emoji melayang
          </label>
          <label class="mini-field check">
            <input type="checkbox" :checked="inst.props.rain !== false" @change="setProp('rain', ($event.target as HTMLInputElement).checked)" />
            Hujan emoji (!hujan)
          </label>
          <label class="mini-field check">
            <input type="checkbox" :checked="inst.props.hype !== false" @change="setProp('hype', ($event.target as HTMLInputElement).checked)" />
            Hype meter
          </label>
        </template>

        <template v-else-if="inst.type === 'avatar-arena'">
          <label class="mini-field">Mode
            <select :value="inst.props.mode" @change="setProp('mode', ($event.target as HTMLSelectElement).value)">
              <option value="beyblade">Beyblade Arena</option>
              <option value="arena">Audience Arena</option>
              <option value="marble">Avatar Race</option>
              <option value="war">Avatar War</option>
            </select>
          </label>
          <label class="mini-field check">
            <input type="checkbox" :checked="inst.props.ai !== false" @change="setProp('ai', ($event.target as HTMLInputElement).checked)" />
            🤖 AI host (sapa penonton & balas komentar)
          </label>
          <label class="mini-field">Model Tarogo (opsional)
            <input type="text" :value="inst.props.aiModel" placeholder="deepseek-v4-flash@deepseek" @input="setProp('aiModel', ($event.target as HTMLInputElement).value)" />
          </label>
          <p class="mini-hint">API key Tarogo diambil dari server (env TAROGO_API_KEY) — tidak disimpan di overlay.</p>
          <label class="mini-field check">
            <input type="checkbox" :checked="inst.props.tts !== false" @change="setProp('tts', ($event.target as HTMLInputElement).checked)" />
            🔊 Suara host (text-to-speech)
          </label>
          <label class="mini-field">Bahasa suara host
            <select :value="inst.props.aiVoice || 'id-ID'" @change="setProp('aiVoice', ($event.target as HTMLSelectElement).value)">
              <option value="id-ID">Indonesia</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="ms-MY">Melayu</option>
              <option value="ja-JP">日本語</option>
              <option value="ko-KR">한국어</option>
              <option value="ar-SA">العربية</option>
            </select>
          </label>
        </template>

        <template v-else-if="inst.type === 'team-battle'">
          <div class="grid2">
            <label class="mini-field">Nama Kubu A
              <input type="text" :value="inst.props.teamA" @input="setProp('teamA', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="mini-field">Nama Kubu B
              <input type="text" :value="inst.props.teamB" @input="setProp('teamB', ($event.target as HTMLInputElement).value)" />
            </label>
          </div>
          <div class="grid2">
            <label class="mini-field">Keyword A
              <input type="text" :value="inst.props.keyA?.join(',')" @input="setProp('keyA', ($event.target as HTMLInputElement).value.split(',').map(s => s.trim()))" />
            </label>
            <label class="mini-field">Keyword B
              <input type="text" :value="inst.props.keyB?.join(',')" @input="setProp('keyB', ($event.target as HTMLInputElement).value.split(',').map(s => s.trim()))" />
            </label>
          </div>
          <label class="mini-field">Durasi ronde (detik, 0 = tanpa batas)
            <input type="number" :value="inst.props.roundSec" @input="setNumProp('roundSec', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field check">
            <input type="checkbox" :checked="inst.props.auto !== false" @change="setProp('auto', ($event.target as HTMLInputElement).checked)" />
            Auto lanjut ronde
          </label>
        </template>

        <template v-else-if="inst.type === 'loyalty-points'">
          <label class="mini-field">Judul
            <input type="text" :value="inst.props.title" @input="setProp('title', ($event.target as HTMLInputElement).value)" />
          </label>
          <div class="grid2">
            <label class="mini-field">Jumlah baris
              <input type="number" :value="inst.props.maxRows" @input="setNumProp('maxRows', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="mini-field">Biaya !spin
              <input type="number" :value="inst.props.spinCost" @input="setNumProp('spinCost', ($event.target as HTMLInputElement).value)" />
            </label>
          </div>
        </template>

        <template v-else-if="inst.type === 'lucky-wheel'">
          <label class="mini-field">Judul
            <input type="text" :value="inst.props.title" @input="setProp('title', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field">Ambang diamond (trigger putaran)
            <input type="number" :value="inst.props.threshold" @input="setNumProp('threshold', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="mini-field">Segmen (pisahkan dengan koma)
            <input type="text" :value="inst.props.segments?.join(',')" @input="setProp('segments', ($event.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean))" />
          </label>
        </template>
      </div>
    </template>

    <div v-else class="insp-empty">
      <div class="ie-icon">🖱️</div>
      <p>Pilih widget di kanvas untuk mengatur propertinya.</p>
    </div>
  </aside>
</template>

<style scoped>
.inspector {
  width: 280px;
  flex-shrink: 0;
  overflow-y: auto;
  border-left: 1px solid var(--edge);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.insp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.insp-title { font-weight: 700; font-size: 0.95rem; }
.insp-actions { display: flex; gap: 6px; }
.mini {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--edge-strong);
  background: var(--bg-raise);
  color: var(--ink);
  font-size: 0.85rem;
}
.mini:hover { background: oklch(20% 0.03 280); }
.mini.danger:hover { background: oklch(35% 0.12 25); border-color: oklch(60% 0.15 25); }

.insp-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--edge);
}
.insp-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
.mini-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--ink-dim);
}
.mini-field input, .mini-field select {
  background: var(--bg-deep);
  border: 1px solid var(--edge);
  color: var(--ink);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 0.88rem;
}
.mini-field input:focus, .mini-field select:focus {
  outline: none;
  border-color: var(--accent);
}
.mini-field.check { flex-direction: row; align-items: center; gap: 8px; }
.mini-hint { margin: 0; font-size: 0.72rem; color: var(--ink-faint); line-height: 1.4; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.grid4 input { padding: 6px; font-size: 0.82rem; }

.insp-empty {
  text-align: center;
  color: var(--ink-faint);
  margin-top: 40px;
  font-size: 0.85rem;
}
.ie-icon { font-size: 2rem; margin-bottom: 10px; }
</style>
