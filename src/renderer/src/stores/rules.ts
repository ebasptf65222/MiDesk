import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ProjectRule {
  id: string
  name: string
  content: string
  filePath: string
  enabled: boolean
}

export const useRulesStore = defineStore('rules', () => {
  const projectRules = ref<ProjectRule[]>([])
  const globalRules = ref('')
  const activeRule = ref<ProjectRule | null>(null)
  const loading = ref(false)

  async function loadRules(dirPath: string) {
    loading.value = true
    try {
      await window.mimo.rules.setDir(dirPath)
      projectRules.value = await window.mimo.rules.list()
      globalRules.value = await window.mimo.rules.getGlobal()
    } finally {
      loading.value = false
    }
  }

  async function saveRule(filename: string, content: string) {
    await window.mimo.rules.save(filename, content)
    const rule = projectRules.value.find(r => r.id === filename)
    if (rule) {
      rule.content = content
    } else {
      projectRules.value.push({
        id: filename,
        name: filename,
        content,
        filePath: filename,
        enabled: true
      })
    }
  }

  async function deleteRule(filename: string) {
    await window.mimo.rules.delete(filename)
    projectRules.value = projectRules.value.filter(r => r.id !== filename)
  }

  async function saveGlobalRules(content: string) {
    await window.mimo.rules.saveGlobal(content)
    globalRules.value = content
  }

  function setActiveRule(rule: ProjectRule | null) {
    activeRule.value = rule
  }

  return {
    projectRules,
    globalRules,
    activeRule,
    loading,
    loadRules,
    saveRule,
    deleteRule,
    saveGlobalRules,
    setActiveRule
  }
})
