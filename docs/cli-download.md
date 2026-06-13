# MiMo CLI 自动下载功能

## 概述

MiMo Code Desktop 现在支持在首次运行时自动下载 MiMo CLI 组件，用户无需手动安装。

## 工作原理

1. 应用启动时检查是否已下载 MiMo CLI
2. 如果未下载，自动从配置的 URL 下载
3. 下载完成后保存到 `~/.mimo-desktop/bin/` 目录
4. 后续运行直接使用已下载的 CLI

## 配置

在 `package.json` 中配置下载 URL：

```json
{
  "mimoCli": {
    "downloadUrl": "https://github.com/mimo-code/mimocode/releases/download/v0.1.0/mimocode-windows-x64.zip",
    "filename": "mimo.exe"
  }
}
```

## 上传 CLI 文件

### 方法 1: 使用上传脚本

```bash
# 设置环境变量
export UPLOAD_URL="https://your-upload-server.com/upload"
export UPLOAD_API_KEY="your-api-key"

# 运行上传脚本
node scripts/upload-cli.js
```

### 方法 2: 手动上传

1. 将 `D:\桌面\mimocode-windows-x64\mimo.exe` 上传到您的服务器
2. 更新 `package.json` 中的 `downloadUrl` 为实际下载地址

## 文件结构

```
~/.mimo-desktop/
├── bin/
│   └── mimo.exe          # 下载的 CLI 文件
├── temp/
│   └── *.tmp             # 下载临时文件
└── config.json           # 应用配置
```

## API 接口

### 主进程 IPC

- `mimo:download:status` - 获取下载状态
- `mimo:download:start` - 开始下载
- `mimo:download:progress` - 下载进度事件

### Preload API

```typescript
window.mimo.download.status()
window.mimo.download.start(url?, filename?)
window.mimo.download.onProgress(callback)
```

## UI 组件

`DownloadProgress.vue` 组件显示下载进度：
- 下载进度条
- 已下载/总大小显示
- 百分比显示

## 注意事项

1. 下载的文件存储在用户目录下，不会随应用卸载而删除
2. 支持断点续传（如果服务器支持）
3. 下载超时时间为 30 秒
4. 支持 HTTP/HTTPS 重定向

## 故障排除

### 下载失败

1. 检查网络连接
2. 验证下载 URL 是否正确
3. 检查服务器是否支持 Range 请求

### 文件损坏

1. 删除 `~/.mimo-desktop/bin/mimo.exe`
2. 重新启动应用，触发重新下载

### 权限问题

确保应用有权限写入 `~/.mimo-desktop/` 目录。