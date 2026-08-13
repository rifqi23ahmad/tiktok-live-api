<script setup lang="ts">
const props = defineProps<{ username: string; apiKey: string }>()

const { record, persist } = useStreamSession()

const tiktok = useTikTokLive(props.username, { apiKey: props.apiKey, autoConnect: false })

onMounted(() => {
  tiktok.on('event', (evt: any) => {
    if (evt && evt.event) record(evt.event, evt.data || {})
  })
  tiktok.connect()
})

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => persist(), 2000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
  persist()
  tiktok.disconnect()
})
</script>

<template>
  <div style="display: none" aria-hidden="true" />
</template>
