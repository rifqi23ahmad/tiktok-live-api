<template>
  <div class="shell shell-builder">
    <AppSidebar />
    <main class="main-builder">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.main-builder {
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.shell-builder {
  height: 100vh;
}
</style>
