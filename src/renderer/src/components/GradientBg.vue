<template>
  <div class="gradient-bg" ref="gradientRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'


const gradientRef = ref<HTMLDivElement>()

onMounted(() => {
  if (!gradientRef.value) return

  
})
</script>

<style scoped>

</style>
