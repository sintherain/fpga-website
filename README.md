# FPGA_LAB — FPGA 接口协议学习站

FPGA 入门教程站，重点讲 **UART / SPI / I2C / AXI** 等接口协议与常用模块（FIFO 等）。

- 技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS + shadcn/ui
- 面向人群：FPGA 初学者为主，工程师速查复习为辅

## 本地开发

```bash
npm install
npm run dev      # 打开 http://localhost:3000/
```

## 构建与预览

```bash
npm run build    # 构建产物输出到 dist/
npm run preview  # 本地预览构建产物
```

## 部署

仓库通过 GitHub Actions 在 push 到 `main` 分支时自动构建并部署到 GitHub Pages
（工作流见 `.github/workflows/deploy.yml`）。站点地址为该仓库对应的 Pages 地址。
