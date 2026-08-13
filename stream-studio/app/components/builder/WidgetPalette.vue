<script setup lang="ts">
import { widgetDefs } from '~/composables/useWidgetRegistry'
import { useStudio } from '~/composables/useStudio'

const { addWidget } = useStudio()

function onDragStart(e: DragEvent, type: string) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/widget', type)
    e.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<template>
  <div class="palette">
    <div class="palette-head">Widget</div>
    <div
      v-for="def in widgetDefs"
      :key="def.type"
      class="palette-item"
      draggable="true"
      @dragstart="onDragStart($event, def.type)"
      @click="addWidget(def.type)"
      title="Klik untuk menambah, atau drag ke kanvas"
    >
      <span class="pi-icon">{{ def.icon }}</span>
      <div class="pi-body">
        <div class="pi-name">{{ def.name }}</div>
        <div class="pi-desc">{{ def.description }}</div>
      </div>
    </div>
    <div class="palette-tip">Klik untuk menambah · drag ke kanvas untuk posisi.</div>
  </div>
</template>

<style scoped>
.palette {
  width: 264px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}
.palette-head {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
  padding: 0 2px;
}
.palette-item {
  display: flex;
  gap: 11px;
  padding: 12px;
  border: 1px solid var(--edge);
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
  cursor: grab;
  transition: border-color 0.12s, transform 0.08s;
}
.palette-item:hover {
  border-color: var(--accent-2);
  transform: translateY(-1px);
}
.palette-item:active { cursor: grabbing; }
.pi-icon { font-size: 1.35rem; line-height: 1.2; }
.pi-name { font-size: 0.86rem; font-weight: 600; }
.pi-desc { font-size: 0.74rem; color: var(--ink-dim); line-height: 1.4; margin-top: 2px; }
.palette-tip {
  font-size: 0.72rem;
  color: var(--ink-faint);
  padding: 4px 2px;
}
</style>
