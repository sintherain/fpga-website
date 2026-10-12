import React from "react";
import { SectionHeader, H3, P, IC, LD } from "../components/Section";
import Waveform from "../components/Waveform";
import AxiHandshake from "../components/AxiHandshake";

/** AXI 五通道结构图（代码绘制） */
const AxiDiagram: React.FC = () => {
  const channels = [
    { name: "写地址 AW", color: "#43624f", dir: "→" },
    { name: "写数据 W", color: "#46725f", dir: "→" },
    { name: "写响应 B", color: "#ac574d", dir: "←" },
    { name: "读地址 AR", color: "#a16435", dir: "→" },
    { name: "读数据 R", color: "#746087", dir: "←" },
  ];
  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-md border border-border bg-[#fffdf8] p-6">
        <svg
          viewBox="0 0 640 300"
          className="mx-auto block min-w-[520px] max-w-2xl"
        >
          {/* 主机 */}
          <rect
            x="30"
            y="40"
            width="130"
            height="220"
            rx="6"
            fill="#eeeae1"
            stroke="#d5d7c9"
          />
          <text
            x="95"
            y="155"
            textAnchor="middle"
            fill="#30382f"
            fontSize="15"
            fontWeight="600"
          >
            主机
          </text>
          <text
            x="95"
            y="175"
            textAnchor="middle"
            fill="#777c6c"
            fontSize="11"
            fontFamily="monospace"
          >
            MASTER
          </text>
          {/* 从机 */}
          <rect
            x="480"
            y="40"
            width="130"
            height="220"
            rx="6"
            fill="#eeeae1"
            stroke="#d5d7c9"
          />
          <text
            x="545"
            y="155"
            textAnchor="middle"
            fill="#30382f"
            fontSize="15"
            fontWeight="600"
          >
            从机
          </text>
          <text
            x="545"
            y="175"
            textAnchor="middle"
            fill="#777c6c"
            fontSize="11"
            fontFamily="monospace"
          >
            SLAVE
          </text>
          {channels.map((c, i) => {
            const y = 66 + i * 44;
            const fwd = c.dir === "→";
            return (
              <g key={c.name}>
                <line
                  x1={fwd ? 170 : 470}
                  y1={y}
                  x2={fwd ? 470 : 170}
                  y2={y}
                  stroke={c.color}
                  strokeWidth="1.6"
                />
                <polygon
                  points={
                    fwd
                      ? `462,${y - 4} 474,${y} 462,${y + 4}`
                      : `178,${y - 4} 166,${y} 178,${y + 4}`
                  }
                  fill={c.color}
                />
                <rect
                  x="272"
                  y={y - 11}
                  width="96"
                  height="22"
                  rx="3"
                  fill="#fffdf8"
                  stroke={c.color}
                  strokeOpacity="0.5"
                />
                <text
                  x="320"
                  y={y + 4}
                  textAnchor="middle"
                  fill={c.color}
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {c.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-2 text-center text-[13px] text-muted-foreground">
        图：AXI4 的五个独立通道——读写完全分离，可同时进行
      </figcaption>
    </figure>
  );
};

const AxiSection: React.FC = () => (
  <section id="axi" className="chapter-content">
    <SectionHeader
      index="05"
      en="AXI · ADVANCED EXTENSIBLE INTERFACE"
      title="进阶：AXI 总线与握手"
      lead="前面三种协议用于连接「芯片外的器件」，AXI 则是 FPGA「芯片内部」模块之间互联的事实标准——Zynq 的 ARM 核与 PL 逻辑、DMA、各种 IP 核之间都靠 AXI 通信。"
    />

    <H3>五个独立通道</H3>
    <P>
      AXI4 把读写拆成五个独立通道，每个通道都是一组「VALID/READY 握手 + 数据」。
      各通道独立握手，读写可以并发；但地址、数据与响应仍有协议规定的依赖关系，不能把“独立”理解为没有任何关联。
    </P>
    <AxiDiagram />

    <H3>核心机制：VALID / READY 握手</H3>
    <P>
      <LD>AXI 靠的就是握手机制</LD>，先记住最基本的配合方式： 发送方拉高{" "}
      <IC>VALID</IC> 表示「数据已就绪」，接收方拉高 <IC>READY</IC>{" "}
      表示「我可以收」；
      <strong className="text-[#30382f]">
        在同一个时钟上升沿，两者都为高，才完成一次传输
      </strong>
      。 并且 VALID 一旦拉高，在握手完成前不允许撤回或改数据。 发送方不能等
      READY 拉高才决定是否拉高 VALID，否则双方互等可能导致死锁。
    </P>
    <Waveform
      channels={[
        {
          name: "CLK",
          color: "#777c6c",
          segments: Array.from({ length: 8 }, () => [
            { d: 0.5, v: 0 as const },
            { d: 0.5, v: 1 as const },
          ]).flat(),
        },
        {
          name: "VALID",
          color: "#43624f",
          segments: [
            { d: 1, v: 0 },
            { d: 2, v: 1 },
            { d: 5, v: 0 },
          ],
        },
        {
          name: "READY",
          color: "#a16435",
          segments: [
            { d: 2, v: 0 },
            { d: 1, v: 1 },
            { d: 5, v: 0 },
          ],
        },
        {
          name: "DATA",
          color: "#46725f",
          segments: [
            { d: 1, v: "x" },
            { d: 2, v: "x", label: "D0（保持）" },
            { d: 5, v: "x" },
          ],
        },
      ]}
      unit={70}
      highlight={[2, 3]}
      samplePoints={[{ at: 2.5, label: "传输" }]}
      caption="VALID 先就绪并保持数据；在标记的上升沿，VALID 与 READY 同为高，D0 完成一次传输。"
    />
    <P>
      注意波形中 VALID 先拉高，等待 READY 响应——这正是握手的意义：
      快慢两个模块无需事先约定速度，各按各的节奏，碰上就传。
      理解了这个，FIFO、流式数据处理（AXI-Stream）的设计都是同一套思想。
    </P>

    <H3>动手试试：控制接收节奏</H3>
    <P>
      先在 READY=0
      时推进几个时钟，再让接收方就绪。观察等待时数据是否保持，以及每个上升沿是否真正传输。
    </P>
    <AxiHandshake />
    <H3>三种常见变体</H3>
    <div className="my-6 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
      {[
        [
          "AXI4-Lite",
          "单次读写、无突发，用于配置寄存器。给你的 IP 核加几个可读写寄存器，选它就够了。",
        ],
        [
          "AXI4",
          "完整版，支持突发传输（一次地址发一长串数据），用于 DDR 访存、DMA 搬运。",
        ],
        [
          "AXI-Stream",
          "不带地址的流式接口，使用 TVALID/TREADY 配合 TDATA；TLAST 等边带信号按需要配置。常用于视频和信号处理。",
        ],
      ].map(([n, d]) => (
        <div key={n} className="bg-[#f5f3ed] p-5">
          <div className="font-mono text-sm text-[#43624f]">{n}</div>
          <p className="mt-2 text-sm leading-6 text-[#687060]">{d}</p>
        </div>
      ))}
    </div>
    <P>
      <LD>学习建议：</LD>先用 AXI4-Lite 给自己的模块做一个「LED 控制寄存器」，在
      Vitis 里写 C 代码读写它； 再试
      AXI-Stream，让数据从一个模块流向另一个模块。做完这两步，你基本就有「搭系统」的感觉了。
    </P>
  </section>
);

export default AxiSection;
