# MiMo Code Desktop

<div align="center">

![MiMo Code](resources/icon.svg)

**AI 驱动的智能代码编辑器**

[![Electron](https://img.shields.io/badge/Electron-42+-47848F?logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5+-42B883?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README_EN.md) | 简体中文

</div>

---

## ✨ 功能特性

### 🤖 AI 智能助手
- **多模型支持** - OpenAI / Anthropic / Google / Ollama / 小米 MiMo / 自定义 API
- **流式对话** - 实时流式响应，支持 Markdown 渲染
- **内联编辑** - `Ctrl+K` 快速 AI 辅助代码编辑
- **多模式切换** - Build（完整工具权限）/ Plan（只读分析）/ Compose（技能编排）
- **会话管理** - 保存、导出、导入聊天会话
- **多模态支持** - 支持图像、文件等多模态输入

### 📁 代码编辑
- **文件管理器** - 树形结构浏览项目文件
- **多标签编辑** - 支持多文件同时编辑
- **语法高亮** - 基于 Monaco Editor 的完整语法支持
- **Diff 视图** - 代码差异对比与一键应用
- **智能补全** - AI 驱动的代码补全建议

### 🛠 开发工具
- **内置终端** - 基于 xterm.js 的多功能终端
- **Git 集成** - 分支管理、变更查看、快速提交
- **全局搜索** - `Ctrl+Shift+F` 全项目文本搜索
- **命令面板** - `Ctrl+Shift+P` 快速执行命令
- **CLI 工具** - 自动下载和管理 MiMo CLI 工具

### 🔌 扩展能力
- **MCP 协议** - 支持 Model Context Protocol 调用外部工具
- **技能管理** - 安装/卸载 AI 技能扩展
- **Rules 规则** - 项目级/全局自定义 AI 行为规则
- **自定义模型** - 支持配置自定义 OpenAI 兼容 API 端点

### 🎨 界面体验
- **主题系统** - 明暗主题自由切换
- **GSAP 动画** - 流畅优雅的界面动效
- **状态栏** - 实时显示行号、编码、分支等信息
- **Toast 通知** - 轻量级操作反馈
- **响应式布局** - 自适应不同屏幕尺寸

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
# 克隆项目
git clone https://gitee.com/chang-zhi-qiang/mi-desk.git

# 进入项目目录
cd mi-desk

# 安装依赖
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建打包

```bash
# Windows
pnpm package

# macOS
pnpm package:mac

# Linux
pnpm package:linux
```

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` | 内联 AI 编辑 |
| `Ctrl+S` | 保存文件 |
| `Ctrl+P` | 快速打开文件 |
| `Ctrl+Shift+P` | 命令面板 |
| `Ctrl+Shift+F` | 全局搜索 |
| `` Ctrl+` `` | 切换终端 |
| `Ctrl+B` | 切换侧边栏 |
| `Ctrl+G` | 跳转到行 |
| `Ctrl+,` | 打开设置 |

---

## 📁 项目结构

```
mimo-desktop/
├── src/
│   ├── main/               # Electron 主进程
│   │   ├── ipc/            # IPC 通信处理
│   │   └── services/       # 核心服务
│   ├── preload/            # 预加载脚本
│   └── renderer/           # Vue 3 渲染进程
│       └── src/
│           ├── components/ # UI 组件
│           ├── stores/     # Pinia 状态管理
│           └── styles/     # 样式文件
├── resources/              # 应用资源
├── docs/                   # 项目文档
└── scripts/                # 构建脚本
```

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Electron 42 |
| 前端 | Vue 3.5 + TypeScript 5.5 |
| 构建 | electron-vite 5 / Vite 7 |
| 编辑器 | Monaco Editor |
| 终端 | xterm.js 6 |
| 动画 | GSAP 3.15 |
| 状态管理 | Pinia 3 |
| 样式 | SCSS |

---

## 📝 配置说明

应用配置存储在用户目录下：

- **Windows**: `%USERPROFILE%\.mimo-desktop\config.json`
- **macOS**: `~/.mimo-desktop/config.json`
- **Linux**: `~/.mimo-desktop/config.json`

---

## 🤝 参与贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

<div align="center">

**如果觉得有用，请给个 ⭐ Star 支持一下！**

</div>
