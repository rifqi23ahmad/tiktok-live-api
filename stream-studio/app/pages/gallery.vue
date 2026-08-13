<script setup lang="ts">
import { templates } from '~/data/templates'

function url(file: string) {
  return `/templates/${file}?demo=1`
}
</script>

<template>
  <div>
    <h1 class="page-title">Template Gallery</h1>
    <p class="page-sub">
      Overlay siap pakai — buka dengan <code class="mono">?demo=1</code> untuk preview tanpa stream,
      atau tempel URL-nya sebagai <b>Browser Source</b> di OBS.
    </p>

    <div class="grid-3">
      <div v-for="t in templates" :key="t.id" class="card tmpl">
        <div class="tmpl-preview" :style="{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})` }">
          <span class="tmpl-mark">{{ t.name.split(' ')[0] }}</span>
        </div>
        <div class="tmpl-body">
          <h3 style="margin: 0 0 6px">{{ t.name }}</h3>
          <p style="margin: 0 0 12px; color: var(--ink-dim); font-size: 0.85rem">{{ t.description }}</p>
          <div class="wrap" style="display: flex; gap: 6px; margin-bottom: 16px">
            <span v-for="f in t.features" :key="f" class="pill">{{ f }}</span>
          </div>
          <div class="row">
            <a class="btn primary" :href="url(t.file)" target="_blank">Preview (demo)</a>
            <a class="btn ghost" :href="'/templates/' + t.file" target="_blank">Buka file</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tmpl {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.tmpl-preview {
  height: 120px;
  display: grid;
  place-items: center;
}
.tmpl-mark {
  font-size: 2rem;
  font-weight: 700;
  color: oklch(0% 0 0 / 0.55);
}
.tmpl-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
</style>
