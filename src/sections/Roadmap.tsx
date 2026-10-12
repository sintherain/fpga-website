import React from "react";
import { SectionHeader, H3, P, LD } from "../components/Section";

const stages = [
  {
    phase: "第一阶段 · 点亮逻辑",
    items: [
      "Verilog 语法基础与可综合写法",
      "组合逻辑：选择器、译码器、加法器",
      "时序逻辑：计数器、状态机、按键消抖",
      "仿真：写 Testbench，学会看波形",
    ],
  },
  {
    phase: "第二阶段 · 拿下接口（本站内容）",
    items: [
      "UART 收发，与电脑互发数据",
      "SPI 读一颗 Flash 或 ADC 的 ID",
      "I2C 读温度传感器 / 写 EEPROM",
      "用 ILA 或逻辑分析仪对照真实波形",
    ],
  },
  {
    phase: "第三阶段 · 系统思维",
    items: [
      "跨时钟域处理：双触发同步、异步 FIFO",
      "AXI4-Lite 寄存器 + AXI-Stream 数据流",
      "DDR 控制器与 DMA 数据搬运",
      "时序约束 XDC 与时序分析",
    ],
  },
];

const links = [
  {
    name: "HDLBits",
    url: "https://hdlbits.01xz.net",
    desc: "在线 Verilog 闯关练习，从门电路到状态机，自动判题",
  },
  {
    name: "Nandland",
    url: "https://nandland.com",
    desc: "英文教程站，UART/SPI/I2C 都有完整的 Verilog/VHDL 实现讲解",
  },
  {
    name: "ZipCPU Blog",
    url: "https://zipcpu.com",
    desc: "深入讲解 AXI 握手、形式化验证的博客，进阶必读",
  },
  {
    name: "AMD/Xilinx 文档",
    url: "https://docs.amd.com",
    desc: "UG 系列官方手册，查器件资源和 IP 核用法的最终依据",
  },
];

const Roadmap: React.FC = () => (
  <section id="roadmap" className="chapter-content">
    <SectionHeader
      index="07"
      en="LEARNING PATH & RESOURCES"
      title="学习路线与资源"
      lead="学 FPGA 不用急，按顺序来就行：先把时序和状态机练熟，再啃接口协议，最后进入系统级设计。"
    />

    <H3>一步一步，搭出自己的电路</H3>
    <div className="my-8 space-y-px overflow-hidden rounded-md border border-border">
      {stages.map((s, i) => (
        <div key={s.phase} className="bg-[#f5f3ed] p-6">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs text-[#43624f]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-medium text-[#30382f]">{s.phase}</span>
          </div>
          <ul className="mt-3 grid gap-2 pl-10 sm:grid-cols-2">
            {s.items.map((it) => (
              <li
                key={it}
                className="flex items-start gap-2 text-sm leading-6 text-[#687060]"
              >
                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#43624f]/60" />
                {it}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <H3>练习与参考资料</H3>
    <P>
      <LD>推荐搭配本站使用的练习与参考资料：</LD>
    </P>
    <div className="my-6 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
      {links.map((l) => (
        <a
          key={l.name}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          className="group bg-[#f5f3ed] p-5 transition-colors hover:bg-[#0e131b]"
        >
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-[#30382f] group-hover:text-[#43624f]">
              {l.name}
            </span>
            <span className="font-mono text-xs text-muted-foreground">↗</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-[#687060]">{l.desc}</p>
        </a>
      ))}
    </div>
  </section>
);

export default Roadmap;
