import React from "react";
import { SectionHeader, H3, P, IC, LD } from "../components/Section";

const resources = [
  {
    name: "LUT 查找表",
    en: "Look-Up Table",
    desc: "组合逻辑的基本单元。本质是一块 64×1 的 SRAM——把真值表存进去，任意 6 输入的布尔函数都能实现。",
  },
  {
    name: "FF 触发器",
    en: "Flip-Flop",
    desc: "每个时钟沿锁存一次数据。LUT 负责算，FF 负责记，合起来就是寄存器和状态机。",
  },
  {
    name: "BRAM 块存储",
    en: "Block RAM",
    desc: "片内硬化存储块（如 36 Kb/块），可配置为 RAM、ROM、FIFO。做数据缓冲、查找表、帧存都离不开它。",
  },
  {
    name: "DSP 切片",
    en: "DSP Slice",
    desc: "硬化的乘加单元（如 27×18 乘法器 + 累加器），专为滤波、FFT、矩阵运算等数字信号处理任务加速。",
  },
  {
    name: "PLL / MMCM",
    en: "时钟管理",
    desc: "对输入时钟做倍频、分频、移相，生成系统需要的各种时钟域。跨时钟域设计是 FPGA 进阶的必修课。",
  },
  {
    name: "IO 资源",
    en: "I/O Bank",
    desc: "支持 LVDS、LVCMOS 等多种电平标准，部分还有 SerDes 高速收发器（GTP/GTX），可跑到数 Gbps。",
  },
];

const flow = [
  { step: "RTL 设计", desc: "用 Verilog / VHDL 描述电路行为" },
  { step: "功能仿真", desc: "Testbench 验证逻辑正确性" },
  { step: "综合 Synthesis", desc: "RTL → 门级网表（LUT/FF 映射）" },
  { step: "实现 Implement", desc: "布局布线，时序收敛" },
  { step: "生成比特流", desc: "产生 .bit 配置文件" },
  { step: "下载调试", desc: "烧录到开发板，ILA 在线调试" },
];

const FpgaBasics: React.FC = () => (
  <section id="fpga" className="section-anchor px-6 py-24 md:px-14">
    <SectionHeader
      index="01"
      en="WHAT IS FPGA"
      title="先认识 FPGA"
      lead="FPGA（Field-Programmable Gate Array，现场可编程门阵列）是一块可以通过编程反复改变内部电路结构的芯片。与 CPU「按指令顺序执行」不同，FPGA 里的一切都是并行运行的真实硬件。"
    />

    <H3>FPGA 和单片机有什么本质区别？</H3>
    <P>
      用单片机做串口，是 CPU 执行一条条指令去翻转引脚；用 FPGA 做串口，
      是用查找表和触发器「搭」出一个真正的串口电路。所以 FPGA 擅长
      <strong className="text-[#d7dde4]">精确时序、并行处理、纳秒级响应</strong>，
      而 CPU 擅长复杂的流程控制。理解这一点，是理解后面所有接口协议的前提——
      协议在 FPGA 里不是「程序」，而是「状态机 + 计数器搭出来的硬件」。
    </P>

    <div className="my-8 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-3 pr-4 font-normal">维度</th>
            <th className="py-3 pr-4 font-normal">MCU / CPU</th>
            <th className="py-3 font-normal">FPGA</th>
          </tr>
        </thead>
        <tbody className="text-[#a8b0ba]">
          {[
            ["执行方式", "指令串行执行", "硬件并行运行"],
            ["时序精度", "受中断/流水线影响，µs 级抖动", "时钟级精确，ns 级"],
            ["开发语言", "C / C++ / 汇编", "Verilog / VHDL（描述电路）"],
            ["典型场景", "流程控制、协议栈、人机交互", "高速采集、接口桥接、实时信号处理"],
            ["灵活性", "功能靠软件改", "连「芯片是什么」都可以改"],
          ].map((row) => (
            <tr key={row[0]} className="border-b border-border/60">
              <td className="py-3 pr-4 font-medium text-[#d7dde4]">{row[0]}</td>
              <td className="py-3 pr-4">{row[1]}</td>
              <td className="py-3">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <H3>芯片内部有什么？</H3>
    <P>
      写 Verilog 时心中有数：你写的每一行代码，最终都会映射到下面这些物理资源上。
    </P>
    <div className="my-8 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
      {resources.map((r) => (
        <div key={r.name} className="bg-[#0a0d12] p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium text-[#d7dde4]">{r.name}</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {r.en}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#8d97a3]">{r.desc}</p>
        </div>
      ))}
    </div>

    <H3>一块典型的开发板</H3>
    <figure className="my-8">
      <img
        src="/images/dev-board.png"
        alt="FPGA 开发板"
        className="w-full rounded-md border border-border"
      />
      <figcaption className="mt-2 text-center text-[13px] text-muted-foreground">
        图：典型的教学用 FPGA 开发板——板载晶振、LED、按键、数码管与排针，足够完成本站全部实验
      </figcaption>
    </figure>

    <H3>从代码到电路：开发流程</H3>
    <div className="my-8 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
      {flow.map((f, i) => (
        <div key={f.step} className="bg-[#0a0d12] p-5">
          <div className="font-mono text-xs text-[#22d3ee]">
            {String(i + 1).padStart(2, "0")}
          </div>
          <div className="mt-2 font-medium text-[#d7dde4]">{f.step}</div>
          <p className="mt-1 text-sm leading-6 text-[#8d97a3]">{f.desc}</p>
        </div>
      ))}
    </div>

    <H3>一个反复出现的构件：移位寄存器</H3>
    <P>
      数字设计里有个构件会反复出现——<IC>移位寄存器</IC>：一串触发器排成一排，
      每个时钟沿把数据整体往左或右挪一格。它最经典的用途是<IC>串行 ↔ 并行</IC>转换：
      发送时把并行的字节「摊开」，一位一位推出去；接收时把进来的位一位一位「收拢」，凑成字节。
    </P>
    <P>
      为什么几乎所有串行接口都离不开它？因为串行通信的本质就是「每次只挪一个位」——
      这正是移位寄存器在做的事。后面 UART、SPI、I2C 的收发代码里，你都会看到同一套模式：
    </P>
    <div className="my-6 space-y-px overflow-hidden rounded-md border border-border">
      {[
        ["发送（摊开）", "并行字节 → 每拍退出一位：tx <= shift[0]（UART 退低位）"],
        ["接收（收拢）", "每拍挤进一位：rx_shift <= {rx_shift[6:0], rx_d2}（先到的位待在低位）"],
      ].map(([t, d]) => (
        <div key={t} className="bg-[#0a0d12] p-4">
          <div className="font-medium text-[#d7dde4]">{t}</div>
          <p className="mt-1 font-mono text-sm leading-6 text-[#8d97a3]">{d}</p>
        </div>
      ))}
    </div>
    <P>
      <LD>一个小规律：</LD>移位方向决定位序——UART 右移退低位（LSB 先发），SPI 左移退高位（MSB 先发）；
      接收端统一把进来的位挤进最低位，正好和「先发低位」对上。记住「串行 = 传送带，一次一格」，
      这几个协议就通了一半。
    </P>

    <P>
      日常开发中最常用的循环是「改 RTL → 仿真 → 上板用 ILA 抓波形」。
      本站介绍的每个协议，都建议按照这个流程亲手做一遍：
      先用仿真看波形，再用开发板 + 逻辑分析仪（或 ILA 核）对照真实信号。
    </P>
  </section>
);

export default FpgaBasics;
