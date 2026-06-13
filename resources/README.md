# MiMo Code Desktop - 构建脚本

## 图标说明

应用需要以下图标文件：

- `resources/icon.ico` - Windows 图标 (256x256, 128x128, 48x48, 32x32, 16x16)
- `resources/icon.icns` - macOS 图标
- `resources/icon.png` - Linux 图标 (512x512)

### 生成图标

1. 准备一张 512x512 的 PNG 图片
2. 使用以下工具转换：

**Windows ICO:**
```bash
# 使用在线工具如 https://convertico.com/
# 或使用 electron-icon-maker
npx electron-icon-maker --input=resources/icon.png --output=resources/
```

**macOS ICNS:**
```bash
# 使用 iconutil 或在线工具
iconutil -c icns resources/icon.iconset
```

## 构建命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 打包 Windows 安装程序
npm run package

# 打包 macOS 版本
npm run package:mac

# 打包 Linux 版本
npm run package:linux
```

## 输出目录

构建产物位于 `release/` 目录：
- `release/MiMo Code Setup x.x.x.exe` - Windows 安装程序
- `release/MiMo Code x.x.x.exe` - Windows 便携版
- `release/MiMo Code-x.x.x.dmg` - macOS 磁盘映像
- `release/MiMo Code-x.x.x.AppImage` - Linux 应用镜像
