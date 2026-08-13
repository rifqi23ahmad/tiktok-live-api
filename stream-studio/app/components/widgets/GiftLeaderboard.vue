<script setup lang="ts">
import { computed } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { fmtNum } from '~/utils/stream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()

const title = computed(() => props.settings.title || 'Top Sultan')
const maxRows = computed(() => Number(props.settings.maxRows) || 5)

const top = computed(() => stream.gifters.value.slice(0, maxRows.value))

const medals = ['👑', '2', '3', '4', '5', '6', '7', '8', '9', '10']
</script>

<template>
  <div class="lb">
    <h2 class="lb-title">🏆 {{ title }}</h2>
    <ol v-if="top.length" class="lb-list">
      <li v-for="([name, d], i) in top" :key="name" :class="{ first: i === 0 }">
        <span class="rank">{{ medals[i] }}</span>
        <span class="name">@{{ name }}</span>
        <span class="d">{{ fmtNum(d) }} 💎</span>
      </li>
    </ol>
    <div v-else class="empty">Menunggu gift pertama…</div>
  </div>
</template>

<style scoped>
.lb {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2cqw;
  border-radius: 2cqw;
  background: oklch(15% 0.02 280 / 0.72);
  border: 1px solid oklch(60% 0.05 280 / 0.35);
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.lb-title {
  font-size: 3cqw;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: oklch(82% 0.15 195);
  margin: 0 0 1.4cqw;
}
.lb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1cqw;
  overflow: hidden;
}
.lb-list li {
  display: grid;
  grid-template-columns: 3.4cqw minmax(0, 1fr) auto;
  align-items: center;
  gap: 1cqw;
  padding: 0.7cqw 1cqw;
  border-radius: 1.2cqw;
  background: oklch(25% 0.03 280 / 0.5);
  font-size: 2.8cqw;
}
.lb-list li.first {
  background: oklch(35% 0.07 90 / 0.55);
  border: 1px solid oklch(85% 0.16 90 / 0.4);
}
.rank {
  font-family: var(--font-mono);
  font-weight: 700;
  text-align: center;
  color: oklch(80% 0.02 90);
}
.first .rank { color: oklch(85% 0.16 90); }
.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.d {
  font-family: var(--font-mono);
  font-weight: 700;
  color: oklch(85% 0.16 90);
  white-space: nowrap;
}
.empty {
  font-size: 2.8cqw;
  color: oklch(80% 0.02 90);
  padding: 1cqw;
}
</style>
