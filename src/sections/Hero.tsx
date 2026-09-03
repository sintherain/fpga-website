import React from "react";

const Hero: React.FC = () => (
  <section id="top" className="relative flex min-h-[92vh] items-end overflow-hidden">
    <img
      src="/images/fpga-hero.png"
      alt="FPGA 芯片晶圆微距"
      className="absolute inset-0 h-full w-full object-cover opacity-60"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#05070b] via-[#05070b]/55 to-[#05070b]/25" />

    <div className="relative z-10 w-full px-6 pb-16 md:px-14">
      <div className="readout mb-6">
        DIGITAL LOGIC · INTERFACE PROTOCOLS · WAVEFORMS
      </div>
      <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-[#eef2f6] md:text-7xl">
        FPGA
        <br />
        接口协议学习站
      </h1>
      <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#9aa4b0]">
        从 UART、SPI、I2C 到 AXI——用精确的时序波形图和可交互的演示，
        把 FPGA 最常用的接口协议讲清楚。边看波形，边写 Verilog。
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-6 font-mono text-xs uppercase tracking-widest">
        <a
          href="#fpga"
          className="border border-[#22d3ee] bg-[#22d3ee]/10 px-6 py-3 text-[#22d3ee] transition-colors hover:bg-[#22d3ee]/20"
        >
          开始学习 ↓
        </a>
        <span className="text-muted-foreground">
          04 个协议 · 12+ 张波形图 · 可交互演示
        </span>
      </div>
    </div>
  </section>
);

export default Hero;
