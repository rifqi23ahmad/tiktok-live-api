<script setup lang="ts">
const { config, saveConfig, browserSourceUrl, hasConfig } = useStreamConfig()

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const onSave = () => saveConfig()

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(browserSourceUrl.value)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 2000)
  } catch {
    // fallback: select text manually
  }
}

const openPreview = () => {
  window.open(browserSourceUrl.value, '_blank', 'noopener')
}
</script>

<template>
  <main class="shell">
    <section class="hero">
      <h1>Terbitkan overlay interaktif<br /><span class="grad">dalam satu klik</span></h1>
      <p>
        Isi konfigurasi stream, salin URL browser source, tempel ke OBS / Streamlabs / TikTok Live Studio.
        Overlay langsung tersambung ke stream TikTok kamu — goal bar, gift alert, leaderboard & efek chat.
      </p>
    </section>

    <div class="grid-2">
      <!-- LEFT: configuration -->
      <div class="card card-pad">
        <h2 class="section-title">1 · Konfigurasi Stream</h2>
        <div class="form-grid" style="margin-bottom: 20px">
          <div class="field">
            <label>TikTok Username</label>
            <input v-model="config.username" placeholder="e.g. aljazeeraenglish" @blur="onSave" />
            <span class="hint">Username stream yang ingin dihubungkan.</span>
          </div>
          <div class="field">
            <label>API Key (TikTool)</label>
            <input v-model="config.apiKey" placeholder="api key" @blur="onSave" />
            <span class="hint">Dapatkan gratis di <a href="https://tik.tools" target="_blank" style="color: var(--cyan)">tik.tools</a>.</span>
          </div>
          <div class="field">
            <label>Target Diamond</label>
            <input v-model.number="config.goal" type="number" min="1" @blur="onSave" />
            <span class="hint">Target goal bar di overlay.</span>
          </div>
          <div class="field">
            <label>Judul Target</label>
            <input v-model="config.goalTitle" placeholder="Target Hari Ini" @blur="onSave" />
          </div>
        </div>

        <button class="btn btn-primary" @click="onSave" style="width: 100%; justify-content: center">
          Simpan &amp; Buat URL
        </button>
      </div>

      <!-- RIGHT: browser source URL + steps -->
      <div class="card card-pad">
        <h2 class="section-title">2 · Browser Source URL</h2>
        <div class="urlbox">
          <code>{{ browserSourceUrl }}</code>
        </div>
        <div style="display: flex; gap: 10px; margin: 16px 0 20px">
          <button class="btn btn-primary" @click="copyUrl" :disabled="!hasConfig">
            {{ copied ? '✓ Tersalin!' : '📋 Salin URL' }}
          </button>
          <button class="btn btn-cyan" @click="openPreview" :disabled="!hasConfig">▶ Preview</button>
        </div>

        <h2 class="section-title">3 · Tempel di OBS / Streamlabs</h2>
        <div class="steps">
          <div class="step"><span class="num"></span><p>Buka <b>Sources</b> → klik <b>+</b> → pilih <b>Browser</b> (OBS) / <b>Browser Source</b> (Streamlabs).</p></div>
          <div class="step"><span class="num"></span><p>Tempel URL di kolom <b>URL</b>, atur <b>Width 1080 × Height 1920</b>.</p></div>
          <div class="step"><span class="num"></span><p>Centang <b>Shutdown source when not visible</b> dihilangkan, lalu klik <b>OK</b>. Selesai — overlay tampil live.</p></div>
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: center; margin-top: 28px">
      <NuxtLink to="/dashboard" class="btn btn-ghost" style="font-size: 1rem; padding: 14px 26px">
        Buka Dashboard Analitik →
      </NuxtLink>
    </div>
  </main>
</template>
