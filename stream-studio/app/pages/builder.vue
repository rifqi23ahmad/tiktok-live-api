<script setup lang="ts">
import BuilderCanvasStage from '~/components/builder/CanvasStage.vue'
import BuilderInspectorPanel from '~/components/builder/InspectorPanel.vue'
import BuilderWidgetPalette from '~/components/builder/WidgetPalette.vue'

definePageMeta({ layout: 'builder' })

const { instances, loadClassicPreset } = useStudio()

onMounted(() => {
  if (instances.value.length === 0) loadClassicPreset()
})
</script>

<template>
  <div class="builder-page">
    <BuilderToolbar />
    <div class="builder-body">
      <BuilderWidgetPalette />
      <BuilderCanvasStage />
      <BuilderInspectorPanel />
    </div>
  </div>
</template>

<style scoped>
.builder-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.builder-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}
</style>
