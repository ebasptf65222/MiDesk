<template>
  <div class="skills-view">
    <div class="skills-header">
      <div class="header-left">
        <h2>技能管理</h2>
        <span class="skill-count">{{ skills.length }} 个技能</span>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" @click="loadSkills" :disabled="loading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          刷新
        </button>
        <button class="install-btn" @click="installSkill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          安装技能
        </button>
      </div>
    </div>

    <div class="skills-content" v-if="skills.length > 0">
      <div
        v-for="skill in skills"
        :key="skill.id"
        :class="['skill-card', { expanded: expandedId === skill.id }]"
      >
        <div class="skill-header" @click="toggleExpand(skill.id)">
          <div class="skill-info">
            <div class="skill-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div class="skill-details">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-version">v{{ skill.version }}</span>
            </div>
          </div>
          <div class="skill-actions">
            <button class="delete-btn" @click.stop="removeSkill(skill.id)" title="删除">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              :class="['expand-icon', { rotated: expandedId === skill.id }]"
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>

        <div class="skill-description" v-if="skill.description">
          {{ skill.description }}
        </div>

        <div class="skill-content" v-if="expandedId === skill.id && skillContent">
          <pre>{{ skillContent }}</pre>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else-if="!loading">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <h3>暂无已安装技能</h3>
      <p>点击「安装技能」按钮添加新技能</p>
    </div>

    <div class="loading-state" v-else>
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Skill {
  id: string
  name: string
  description: string
  location: string
  version: string
  enabled: boolean
}

const skills = ref<Skill[]>([])
const loading = ref(false)
const expandedId = ref<string | null>(null)
const skillContent = ref<string | null>(null)

async function loadSkills() {
  loading.value = true
  try {
    skills.value = await window.mimo.skills.list()
  } catch (err) {
    console.error('Failed to load skills:', err)
  } finally {
    loading.value = false
  }
}

async function toggleExpand(skillId: string) {
  if (expandedId.value === skillId) {
    expandedId.value = null
    skillContent.value = null
  } else {
    expandedId.value = skillId
    try {
      skillContent.value = await window.mimo.skills.content(skillId)
    } catch {
      skillContent.value = null
    }
  }
}

async function installSkill() {
  try {
    const skill = await window.mimo.skills.install()
    if (skill) {
      await loadSkills()
    }
  } catch (err) {
    console.error('Failed to install skill:', err)
  }
}

async function removeSkill(skillId: string) {
  try {
    await window.mimo.skills.remove(skillId)
    await loadSkills()
  } catch (err) {
    console.error('Failed to remove skill:', err)
  }
}

onMounted(() => {
  loadSkills()
})
</script>

<style scoped>
.skills-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f172a;
}

.skills-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #1e293b;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
}

.skill-count {
  font-size: 12px;
  color: #64748b;
  background: #1e293b;
  padding: 2px 8px;
  border-radius: 10px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.refresh-btn,
.install-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.refresh-btn {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  border: 1px solid rgba(71, 85, 105, 0.5);
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(71, 85, 105, 0.9);
  color: #ffffff;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.install-btn {
  background: #3b82f6;
  color: #ffffff;
}

.install-btn:hover {
  background: #2563eb;
}

.skills-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.skill-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.15s;
}

.skill-card:hover {
  border-color: #475569;
}

.skill-card.expanded {
  border-color: #3b82f6;
}

.skill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
}

.skill-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skill-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  border-radius: 8px;
  color: #3b82f6;
}

.skill-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.skill-name {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.skill-version {
  font-size: 11px;
  color: #64748b;
}

.skill-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
}

.skill-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #ef444420;
  color: #ef4444;
}

.expand-icon {
  color: #64748b;
  transition: transform 0.2s;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.skill-description {
  padding: 0 16px 12px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

.skill-content {
  padding: 12px 16px;
  background: #0f172a;
  border-top: 1px solid #334155;
  max-height: 400px;
  overflow-y: auto;
}

.skill-content pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #94a3b8;
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.empty-icon {
  margin-bottom: 16px;
  color: #334155;
}

.empty-state h3 {
  font-size: 15px;
  color: #64748b;
  margin-bottom: 4px;
}

.empty-state p {
  font-size: 12px;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
