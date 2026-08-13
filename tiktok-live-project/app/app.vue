<script setup lang="ts">
const route = useRoute()

const links = [
  { to: '/', label: 'Studio' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/recap', label: 'Recap' }
]
</script>

<template>
  <div>
    <header class="nav">
      <NuxtLink to="/" class="nav-brand">
        <span class="logo">▶</span>
        <span>Stream&nbsp;Studio</span>
      </NuxtLink>
      <nav class="nav-links">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav-link"
          :class="{ active: route.path === l.to }"
        >
          {{ l.label }}
        </NuxtLink>
      </nav>
    </header>

    <NuxtPage />
  </div>
</template>
