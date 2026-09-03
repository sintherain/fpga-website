import React, { useEffect, useState } from "react";
import Hero from "./sections/Hero";
import FpgaBasics from "./sections/FpgaBasics";
import UartSection from "./sections/UartSection";
import SpiSection from "./sections/SpiSection";
import I2cSection from "./sections/I2cSection";
import AxiSection from "./sections/AxiSection";
import FifoSection from "./sections/FifoSection";
import Roadmap from "./sections/Roadmap";

const NAV = [
  { id: "fpga", label: "认识 FPGA", num: "01" },
  { id: "uart", label: "UART 串口", num: "02" },
  { id: "spi", label: "SPI 总线", num: "03" },
  { id: "i2c", label: "I2C 总线", num: "04" },
  { id: "axi", label: "AXI 与握手", num: "05" },
  { id: "fifo", label: "FIFO 缓冲", num: "06" },
  { id: "roadmap", label: "学习路线", num: "07" },
];

const App: React.FC = () => {
  const [active, setActive] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="noise-bg min-h-screen bg-background">
      {/* 桌面侧边导航 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-border bg-[#04060a]/90 backdrop-blur lg:flex">
        <a href="#top" className="border-b border-border px-6 py-5">
          <div className="font-mono text-sm font-semibold tracking-wider text-[#e6eaef]">
            FPGA<span className="text-[#22d3ee]">_</span>LAB
          </div>
          <div className="readout mt-1">接口协议学习站</div>
        </a>
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`group flex items-baseline gap-3 border-l-2 px-6 py-2.5 text-sm transition-colors ${
                active === n.id
                  ? "border-[#22d3ee] text-[#22d3ee]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="font-mono text-[10px] opacity-60">{n.num}</span>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="border-t border-border px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          写 RTL → 看波形 → 烧板子
        </div>
      </aside>

      {/* 移动端顶部导航 */}
      <header className="sticky top-0 z-40 border-b border-border bg-[#04060a]/90 backdrop-blur lg:hidden">
        <div className="flex items-center gap-5 overflow-x-auto px-4 py-3">
          <a href="#top" className="shrink-0 font-mono text-sm font-semibold text-[#e6eaef]">
            FPGA<span className="text-[#22d3ee]">_</span>LAB
          </a>
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`shrink-0 text-xs ${
                active === n.id ? "text-[#22d3ee]" : "text-muted-foreground"
              }`}
            >
              {n.label}
            </a>
          ))}
        </div>
      </header>

      <main className="lg:pl-56">
        <Hero />
        <div className="mx-auto max-w-4xl">
          <FpgaBasics />
          <UartSection />
          <SpiSection />
          <I2cSection />
          <AxiSection />
          <FifoSection />
          <Roadmap />
        </div>

        <footer className="border-t border-border px-6 py-10 md:px-14">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
            <div className="font-mono text-xs text-muted-foreground">
              FPGA_LAB — 接口协议学习站
            </div>
            <div className="readout">
              有问题，先看波形。
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
