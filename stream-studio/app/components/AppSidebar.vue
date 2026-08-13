<script setup lang="ts">
const nav = [
  { to: '/', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10 0h8V3h-8v18z' },
  { to: '/builder', label: 'Builder', icon: 'M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25zM20.7 7.05a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' },
  { to: '/gallery', label: 'Template Gallery', icon: 'M4 5h3v14H4V5zm14 0h3v14h-3V5zM9 3h2v18H9V3zm6 0h2v18h-2V3zM4 3h1v2H4V3zm0 16h1v2H4v-2zM19 3h1v2h-1V3zm0 16h1v2h-1v-2z' },
  { to: '/live', label: 'Live Connect', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm1-13h-2v6l5.25 3.15L17 15.4l-4-2.4V7z' }
]
</script>

<template>
  <aside class="side">
    <NuxtLink to="/" class="brand">
      <div class="brand-mark">SS</div>
      <div>
        <div class="brand-name">Stream Studio</div>
        <div class="brand-tag">no-code overlay builder</div>
      </div>
    </NuxtLink>

    <NuxtLink
      v-for="item in nav"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: $route.path === item.to }"
    >
      <svg viewBox="0 0 24 24" fill="currentColor"><path :d="item.icon" /></svg>
      <span>{{ item.label }}</span>
    </NuxtLink>

    <div class="nav-foot">
      powered by <a class="accent2" href="https://tik.tools" target="_blank">tik.tools</a>
    </div>
  </aside>
</template>
