# MiMo Code Desktop

<div align="center">

![MiMo Code](resources/icon.svg)

**AI-Powered Intelligent Code Editor**

[![Electron](https://img.shields.io/badge/Electron-28+-47848F?logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.4+-42B883?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

English | [简体中文](README.md)

</div>

---

## ✨ Features

### 🤖 AI Assistant
- **Multi-Model Support** - OpenAI / Anthropic / Google / Ollama / Xiaomi MiMo
- **Streaming Chat** - Real-time streaming responses with Markdown rendering
- **Inline Editing** - `Cmd+K` for quick AI-assisted code editing
- **Plan/Act Modes** - Smart planning and execution mode switching

### 📁 Code Editing
- **File Explorer** - Tree-structure project file browsing
- **Multi-Tab Editing** - Edit multiple files simultaneously
- **Syntax Highlighting** - Full syntax support based on Monaco Editor
- **Diff View** - Code diff comparison with one-click apply

### 🛠 Developer Tools
- **Built-in Terminal** - Multi-functional terminal based on xterm.js
- **Git Integration** - Branch management, change viewing, quick commits
- **Global Search** - `Ctrl+Shift+F` project-wide text search
- **Command Palette** - `Ctrl+Shift+P` quick command execution

### 🔌 Extensibility
- **MCP Protocol** - Model Context Protocol support for external tool invocation
- **Skills Management** - Install/uninstall AI skill extensions
- **Rules System** - Project-level/global custom AI behavior rules

### 🎨 User Experience
- **Theme System** - Light/dark theme switching
- **GSAP Animations** - Smooth and elegant interface effects
- **Status Bar** - Real-time line numbers, encoding, branch info
- **Toast Notifications** - Lightweight operation feedback

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Installation

```bash
# Clone the repository
git clone https://gitee.com/chang-zhi-qiang/mi-desk.git

# Enter project directory
cd mi-desk

# Install dependencies
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
# Windows
pnpm package

# macOS
pnpm package:mac

# Linux
pnpm package:linux
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Inline AI Edit |
| `Ctrl+S` | Save File |
| `Ctrl+P` | Quick Open File |
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+Shift+F` | Global Search |
| `` Ctrl+` `` | Toggle Terminal |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+G` | Go to Line |
| `Ctrl+,` | Open Settings |

---

## 📁 Project Structure

```
mimo-desktop/
├── src/
│   ├── main/               # Electron Main Process
│   │   ├── ipc/            # IPC Communication
│   │   └── services/       # Core Services
│   ├── preload/            # Preload Scripts
│   └── renderer/           # Vue 3 Renderer Process
│       └── src/
│           ├── components/ # UI Components
│           ├── stores/     # Pinia State Management
│           └── styles/     # Styles
├── resources/              # App Resources
├── docs/                   # Documentation
└── scripts/                # Build Scripts
```

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Electron 28 |
| Frontend | Vue 3 + TypeScript |
| Build Tool | electron-vite |
| Editor | Monaco Editor |
| Terminal | xterm.js |
| Animation | GSAP |
| State Management | Pinia |
| Styling | SCSS |

---

## 📝 Configuration

App configuration is stored in the user directory:

- **Windows**: `%USERPROFILE%\.mimo-desktop\config.json`
- **macOS**: `~/.mimo-desktop/config.json`
- **Linux**: `~/.mimo-desktop/config.json`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

<div align="center">

**If you find this useful, please give it a ⭐ Star!**

</div>
