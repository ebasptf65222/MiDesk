<template>
  <div class="gradient-bg" ref="gradientRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'

const gradientRef = ref<HTMLDivElement>()

onMounted(() => {
  if (!gradientRef.value) return

  // Animate gradient position
  const tl = gsap.timeline({ repeat: -1, yoyo: true })

  tl.to(gradientRef.value, {
    backgroundPosition: '100% 50%',
    duration: 8,
    ease: 'none'
  })

  // Subtle scale pulse
  gsap.to(gradientRef.value, {
    scale: 1.02,
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  })
})
</script>

<style scoped>
.gradient-bg {
  position: fixed;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  z-index: -2;
  background: linear-gradient(
    135deg,
    var(--bg-primary, rgba(15, 23, 42, 1)) 0%,
    var(--bg-secondary, rgba(30, 41, 59, 1)) 25%,
    var(--bg-primary, rgba(15, 23, 42, 1)) 50%,
    var(--bg-tertiary, rgba(51, 65, 85, 0.8)) 75%,
    var(--bg-primary, rgba(15, 23, 42, 1)) 100%
  );
  background-size: 200% 200%;
  background-position: 0% 50%;
  pointer-events: none;
}
</style>
