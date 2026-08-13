<script setup lang="ts">
import { ref } from 'vue'
import type { WidgetType } from '~/composables/useWidgetRegistry'
import { widgetDef } from '~/composables/useWidgetRegistry'
import { useStudio } from '~/composables/useStudio'
import WidgetRenderer from './WidgetRenderer.vue'

const { instances, selectedId, addWidget, select, updateLayout } = useStudio()

const canvasRef = ref<HTMLElement | null>(null)

interface DragState {
  id: string
  mode: 'move' | 'resize'
  startX: number
  startY: number
  origX: number
  origY: number
  origW: number
  origH: number
}

const drag = ref<DragState | null>(null)

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function onDrop(e: DragEvent) {
  const type = e.dataTransfer?.getData('text/widget')
  if (!type) return
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  addWidget(type as WidgetType, clamp(x, 0, 95), clamp(y, 0, 95))
}

function startDrag(e: PointerEvent, id: string, mode: 'move' | 'resize') {
  const inst = instances.value.find((i) => i.id === id)
  if (!inst) return
  select(id)
  const rect = canvasRef.value!.getBoundingClientRect()
  drag.value = {
    id,
    mode,
    startX: e.clientX,
    startY: e.clientY,
    origX: inst.x,
    origY: inst.y,
    origW: inst.w,
    origH: inst.h
  }
  window.addEventListener('pointermove', onWindowMove)
  window.addEventListener('pointerup', onWindowUp)
  e.preventDefault()
}

function onWindowMove(e: PointerEvent) {
  if (!drag.value) return
  const rect = canvasRef.value!.getBoundingClientRect()
  const dxPct = ((e.clientX - drag.value.startX) / rect.width) * 100
  const dyPct = ((e.clientY - drag.value.startY) / rect.height) * 100
  if (drag.value.mode === 'move') {
    updateLayout(drag.value.id, {
      x: clamp(drag.value.origX + dxPct, 0, 100 - drag.value.origW),
      y: clamp(drag.value.origY + dyPct, 0, 100 - drag.value.origH)
    })
  } else {
    updateLayout(drag.value.id, {
      w: clamp(drag.value.origW + dxPct, 8, 100),
      h: clamp(drag.value.origH + dyPct, 8, 100)
    })
  }
}

function onWindowUp() {
  drag.value = null
  window.removeEventListener('pointermove', onWindowMove)
  window.removeEventListener('pointerup', onWindowUp)
}

function boxStyle(inst: { x: number; y: number; w: number; h: number }) {
  return {
    left: inst.x + '%',
    top: inst.y + '%',
    width: inst.w + '%',
    height: inst.h + '%'
  }
}

function labelOf(type: WidgetType) {
  return widgetDef(type).name
}
</script>

<template>
  <div class="canvas-wrap">
    <div
      ref="canvasRef"
      class="canvas"
      @dragover.prevent
      @drop.prevent="onDrop"
      @pointerdown.self="select(null)"
    >
      <div
        v-for="inst in instances"
        :key="inst.id"
        class="widget-box"
        :class="{ selected: selectedId === inst.id }"
        :style="boxStyle(inst)"
        @pointerdown="startDrag($event, inst.id, 'move')"
        @click.stop="select(inst.id)"
      >
        <WidgetRenderer :type="inst.type" :settings="inst.props" />
        <div
          class="resize-handle"
          @pointerdown.stop="startDrag($event, inst.id, 'resize')"
        ></div>
        <div v-if="selectedId === inst.id" class="widget-chip">
          {{ labelOf(inst.type) }}
        </div>
      </div>

      <div v-if="instances.length === 0" class="empty-hint">
        <div class="eh-icon">🎬</div>
        <div class="eh-title">Kanvas kosong</div>
        <div class="eh-sub">Drag widget dari kiri, atau klik widget untuk menambah.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
}
.canvas {
  position: relative;
  aspect-ratio: 9 / 16;
  height: 100%;
  max-height: calc(100vh - 140px);
  max-width: 100%;
  background:
    radial-gradient(120% 80% at 50% -10%, oklch(28% 0.04 280 / 0.6), transparent 60%),
    oklch(16% 0.02 280);
  border: 1px solid var(--edge-strong);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
  touch-action: none;
}

.widget-box {
  position: absolute;
  container-type: size;
  cursor: grab;
}
.widget-box:active { cursor: grabbing; }
.widget-box.selected {
  outline: 1px solid oklch(82% 0.15 195 / 0.7);
  outline-offset: 1px;
}
.widget-box.selected::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: oklch(82% 0.15 195 / 0.04);
}
.resize-handle {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: oklch(82% 0.15 195);
  border: 2px solid oklch(16% 0.02 280);
  cursor: nwse-resize;
  opacity: 0;
  transition: opacity 0.1s;
  z-index: 5;
}
.widget-box.selected .resize-handle { opacity: 1; }
.widget-chip {
  position: absolute;
  top: -22px;
  left: -1px;
  font-size: 0.66rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px 6px 0 0;
  background: oklch(82% 0.15 195);
  color: #0b0b0b;
  white-space: nowrap;
  pointer-events: none;
  z-index: 5;
}

.empty-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ink-faint);
  text-align: center;
  padding: 20px;
}
.eh-icon { font-size: 2rem; }
.eh-title { font-weight: 600; color: var(--ink-dim); }
.eh-sub { font-size: 0.8rem; }
</style>
