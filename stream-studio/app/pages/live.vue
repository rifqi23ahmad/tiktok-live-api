<script setup lang="ts">
import { computed } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { fmtNum } from '~/utils/stream'

const {
  username,
  apiKey,
  mode,
  connected,
  error,
  viewers,
  messages,
  gifts,
  likes,
  connect,
  disconnect,
  startDemo,
  stopDemo,
  reset
} = useTikTokStream()

const isLive = computed(() => mode.value === 'live' && connected.value)
const isDemo = computed(() => mode.value === 'demo')
</script>

<template>
  <div>
    <h1 class="page-title">Live Connect</h1>
    <p class="page-sub">
      Hubungkan stream TikTok LIVE ke builder. Gunakan mode <b>Demo</b> untuk mencoba tanpa API key.
    </p>

    <div class="grid-2">
      <div class="card" style="padding: 22px">
        <h3 style="margin: 0 0 16px">Koneksi</h3>

        <div class="stack">
          <div class="field">
            <label>TikTok Username</label>
            <input v-model="username" type="text" placeholder="e.g. aljazeeraenglish" />
          </div>
          <div class="field">
            <label>API Key</label>
            <input v-model="apiKey" type="text" placeholder="api key dari tik.tools" />
            <span style="font-size: 0.75rem; color: var(--ink-faint)">
              Dapatkan key gratis di
              <a href="https://tik.tools" target="_blank" class="accent2">tik.tools</a>. Kosongkan untuk mode demo.
            </span>
          </div>

          <div class="row wrap">
            <button class="btn primary" :disabled="isLive" @click="connect()">Hubungkan</button>
            <button class="btn" :disabled="isDemo" @click="startDemo()">Mode Demo</button>
            <button class="btn ghost" :disabled="!isLive && !isDemo" @click="disconnect()">Putuskan</button>
            <button class="btn ghost" @click="reset()">Reset</button>
          </div>

          <p v-if="error" class="pill err">{{ error }}</p>
        </div>
      </div>

      <div class="card" style="padding: 22px">
        <h3 style="margin: 0 0 16px">Status</h3>
        <div class="stack">
          <div class="between">
            <span class="dim">Status</span>
            <span class="pill" :class="isLive ? 'ok' : isDemo ? 'warn' : 'err'">
              <span class="dot" :class="isLive || isDemo ? 'live' : 'off'"></span>
              {{ isLive ? 'Live' : isDemo ? 'Demo' : 'Offline' }}
            </span>
          </div>
          <div class="between">
            <span class="dim">Viewer</span>
            <b class="mono">{{ fmtNum(viewers) }}</b>
          </div>
          <div class="between">
            <span class="dim">Gift diterima</span>
            <b class="mono">{{ gifts.length }}</b>
          </div>
          <div class="between">
            <span class="dim">Chat</span>
            <b class="mono">{{ messages.length }}</b>
          </div>
          <div class="between">
            <span class="dim">Likes</span>
            <b class="mono">{{ likes.length }}</b>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 18px">
      <div class="card" style="padding: 18px">
        <h3 style="margin: 0 0 12px">🎁 Gift terbaru</h3>
        <div class="feed">
          <div v-for="g in gifts.slice(0, 10)" :key="g.id" class="feed-row">
            <span>@{{ g.user }}</span>
            <span class="dim">{{ g.giftName }}</span>
            <b class="mono accent3">{{ fmtNum(g.diamondCount) }} 💎</b>
          </div>
          <div v-if="!gifts.length" class="faint">Belum ada gift.</div>
        </div>
      </div>
      <div class="card" style="padding: 18px">
        <h3 style="margin: 0 0 12px">💬 Chat terbaru</h3>
        <div class="feed">
          <div v-for="m in messages.slice(0, 10)" :key="m.id" class="feed-row">
            <b>@{{ m.user }}</b>
            <span class="dim">{{ m.comment }}</span>
          </div>
          <div v-if="!messages.length" class="faint">Belum ada chat.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 0.85rem;
}
.feed-row {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--edge);
}
.accent3 { color: var(--accent-3); }
</style>
