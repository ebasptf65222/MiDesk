import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/highlight.css'
import { useUpdateStore } from './stores/update'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize update store
const updateStore = useUpdateStore()

// Auto-check for updates on startup
setTimeout(async () => {
  try {
    const result = await window.mimo.update.check()
    if (result.available) {
      updateStore.setUpdateInfo({
        available: true,
        version: result.version,
        releaseDate: result.releaseDate,
        releaseNotes: result.releaseNotes
      })
    }
  } catch (err) {
    console.error('Failed to check for updates on startup:', err)
  }
}, 5000) // Check after 5 seconds

app.mount('#app')
