# FPGA 小课堂 · 接口与电路笔记

面向初学者的 FPGA 教材网站。暖纸色界面、独立章节、连接示意图、交互波形与分段 Verilog 讲解。

- 技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS + React Router
- 面向人群：FPGA 初学者为主，工程师速查复习为辅

## 本地开发

```bash
npm ci
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

## 页面与内容维护

首页是课程目录；七个章节分别使用 `/#/fpga`、`/#/uart`、`/#/spi`、`/#/i2c`、`/#/axi`、`/#/fifo`、`/#/roadmap`。哈希路由使 GitHub Pages 的章节链接刷新时不会产生服务器 404。旧站的 `#uart` 等书签在打开时自动转换。

- `src/content/chapters.ts`：章节信息、本章目录与复习问题。
- `src/sections/`：章节正文。`H3` / `H4` 自动生成小节锚点。
- `src/content/rtl/*.v`：完整 Verilog 源码，Vite 以原文导入页面，复制、下载和测试均使用这份源码。
- `src/content/walkthroughs.ts`：每一段代码的摘录边界、解释与注意点。修改 RTL 后要同步更新摘录定位。
- `src/lib/protocols.ts`：UART/SPI/I2C 波形的纯函数模型；`fifo-model.ts` 是 FIFO 接受规则。
- `src/components/LearningDiagram.tsx`：原创 SVG 连接图、开发板和移位图，不依赖外部图片或字体服务。

## 验证

需要 Node.js 22.18+，完整测试还需要 Icarus Verilog（`iverilog` 和 `vvp` 在 PATH 中）。可用 `IVERILOG` / `VVP` 环境变量指定工具的绝对路径。

```bash
npm run lint
npm run test:content  # 目录、摘录、波形与 FIFO 模型
npm run test:rtl      # 实际页面使用的 Verilog 模块仿真
npm test             # 上述两项一起执行
npm run build
```

GitHub Actions 在部署前运行构建、测试和 Lint。仿真覆盖 UART 两种发送器的全部字节、接收毛刺/帧错误、SPI 主从收发与高阻、FIFO 边界/回绕、I2C 起止条件与 SCL 被拉低的等待。

这些是教学模块与功能仿真，尚未针对某块板完成布局布线和上板验证。SPI 从机使用低速过采样结构；I2C 示例只演示 START/STOP，并非完整 I2C 主机。相应限制在正文与源码中说明。
