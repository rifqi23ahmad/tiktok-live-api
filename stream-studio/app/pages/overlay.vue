<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTikTokStream, TIKTOOL_API_KEY } from '~/composables/useTikTokStream'
import type { WidgetType } from '~/composables/useWidgetRegistry'
import { decodeOverlayConfig, type OverlayConfig, type OverlayWidget } from '~/utils/overlay'
import WidgetRenderer from '~/components/builder/WidgetRenderer.vue'

definePageMeta({ layout: false })

const stream = useTikTokStream()

const cfg = ref<OverlayConfig>({ instances: [] })

const widgets = computed<Array<OverlayWidget & { type: WidgetType }>>(() =>
  (cfg.value.instances || []).map((i) => ({ ...i, type: i.type as WidgetType }))
)

function styleOf(inst: OverlayWidget) {
  return {
    left: inst.x + '%',
    top: inst.y + '%',
    width: inst.w + '%',
    height: inst.h + '%'
  }
}

onMounted(() => {
  const raw = new URLSearchParams(window.location.search).get('config')
  const decoded = raw ? decodeOverlayConfig(raw) : null
  if (decoded) cfg.value = decoded

  const c = cfg.value
  if (c.username) stream.username.value = c.username
  // Pakai key hardcoded kalau config tidak bawa key — overlay tinggal butuh username.
  if (c.apiKey) stream.apiKey.value = c.apiKey
  else stream.apiKey.value = TIKTOOL_API_KEY

  const hasCreds = !!c.username && !!stream.apiKey.value && stream.apiKey.value !== 'demo'
  if (c.demo === true || !hasCreds) stream.startDemo()
  else stream.connect()
})
</script>

<template>
  <div class="ov">
    <div v-for="inst in widgets" :key="inst.id" class="ov-widget" :style="styleOf(inst)">
      <WidgetRenderer :type="inst.type" :settings="inst.props" />
    </div>
  </div>
</template>

<style scoped>
.ov {
  position: fixed;
  inset: 0;
  background: transparent;
}
.ov-widget {
  position: absolute;
  container-type: size;
}
</style>
