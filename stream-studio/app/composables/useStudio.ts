import { ref } from 'vue'
import type { WidgetType } from '~/composables/useWidgetRegistry'
import { widgetDef } from '~/composables/useWidgetRegistry'
import { uid } from '~/utils/stream'

export interface WidgetInstance {
  id: string
  type: WidgetType
  x: number // % left within 9:16 canvas
  y: number // % top
  w: number // % width
  h: number // % height
  props: Record<string, any>
}

// Module-scoped singleton: builder state shared across toolbar / palette / canvas / inspector.
const instances = ref<WidgetInstance[]>([])
const selectedId = ref<string | null>(null)

function addWidget(type: WidgetType, x = 4, y = 4): WidgetInstance {
  const def = widgetDef(type)
  const inst: WidgetInstance = {
    id: uid(),
    type,
    x,
    y,
    w: def.defaultW,
    h: def.defaultH,
    props: { ...def.defaultProps }
  }
  instances.value = [...instances.value, inst]
  selectedId.value = inst.id
  return inst
}

function removeWidget(id: string) {
  instances.value = instances.value.filter((i) => i.id !== id)
  if (selectedId.value === id) selectedId.value = null
}

function duplicateWidget(id: string) {
  const src = instances.value.find((i) => i.id === id)
  if (!src) return
  const copy: WidgetInstance = {
    ...src,
    id: uid(),
    x: Math.min(src.x + 3, 90),
    y: Math.min(src.y + 3, 90),
    props: { ...src.props }
  }
  instances.value = [...instances.value, copy]
  selectedId.value = copy.id
}

function select(id: string | null) {
  selectedId.value = id
}

function updateProps(id: string, patch: Record<string, any>) {
  const inst = instances.value.find((i) => i.id === id)
  if (!inst) return
  inst.props = { ...inst.props, ...patch }
}

function updateLayout(id: string, patch: Partial<Pick<WidgetInstance, 'x' | 'y' | 'w' | 'h'>>) {
  const inst = instances.value.find((i) => i.id === id)
  if (!inst) return
  inst.x = patch.x ?? inst.x
  inst.y = patch.y ?? inst.y
  inst.w = patch.w ?? inst.w
  inst.h = patch.h ?? inst.h
}

function clearAll() {
  instances.value = []
  selectedId.value = null
}

// Sensible 9:16 starter layout covering all six widgets.
function loadClassicPreset() {
  clearAll()
  const plan: Array<[WidgetType, number, number]> = [
    ['goal-bar', 9, 4],
    ['gift-leaderboard', 4, 22],
    ['mini-game', 7, 34],
    ['gift-alert', 11, 46],
    ['poll-prediction', 10, 60],
    ['chat-effects', 20, 72]
  ]
  for (const [type, x, y] of plan) addWidget(type, x, y)
  selectedId.value = null
}

export function useStudio() {
  return {
    instances,
    selectedId,
    addWidget,
    removeWidget,
    duplicateWidget,
    select,
    updateProps,
    updateLayout,
    clearAll,
    loadClassicPreset
  }
}
