<template>
  <div class="orbs-container" ref="orbsRef">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import gsap from 'gsap'

const orbsRef = ref<HTMLDivElement>()

onMounted(() => {
  if (!orbsRef.value) return

  const orbs = orbsRef.value.querySelectorAll('.orb')

  orbs.forEach((orb, i) => {
    // Floating animation
    gsap.to(orb, {
      x: `random(-50, 50)`,
      y: `random(-50, 50)`,
      duration: `random(8, 15)`,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 2
    })

    // Scale pulse
    gsap.to(orb, {
      scale: `random(0.8, 1.2)`,
      duration: `random(4, 8)`,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 1.5
    })

    // Opacity pulse
    gsap.to(orb, {
      opacity: `random(0.15, 0.35)`,
      duration: `random(3, 6)`,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i
    })
  })
})
</script>

<style scoped>
.orbs-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.2;
}

.orb-1 {
  width: 400px;
  height: 400px;
  top: 10%;
  left: 15%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%);
}

.orb-2 {
  width: 350px;
  height: 350px;
  top: 60%;
  right: 10%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
}

.orb-3 {
  width: 300px;
  height: 300px;
  bottom: 15%;
  left: 40%;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, transparent 70%);
}
</style>
