import type { ReactNode } from "react";

const colors = {
  clock: "#a16435",
  output: "#43624f",
  input: "#46725f",
  select0: "#ac574d",
  select1: "#746087",
};

function Diagram({ title, caption, children }: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="spi-figure">
      <div className="spi-figure-card">
        <p className="spi-figure-title">{title}</p>
        <div className="spi-figure-scroll">{children}</div>
      </div>
      <figcaption>
        {caption}
        <span className="spi-figure-hint">小屏幕可左右滑动查看完整图。</span>
      </figcaption>
    </figure>
  );
}

function Device({ x, y, height, title, subtitle }: {
  x: number;
  y: number;
  height: number;
  title: string;
  subtitle: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={160} height={height} rx={8} fill="#eeeae1" stroke="#d5d7c9" />
      <text x={x + 80} y={y + height / 2 - 3} textAnchor="middle" fontSize={19} fontWeight={600} fill="#30382f">{title}</text>
      <text x={x + 80} y={y + height / 2 + 22} textAnchor="middle" fontSize={12} fill="#777c6c">{subtitle}</text>
    </g>
  );
}

/** 接线图只表达连接与方向；分叉圆点表示同一根共享总线。 */
export function SpiTopologyDiagram() {
  const wires = [
    { name: "SCLK", y: 160, color: colors.clock, path: "M184 160 H430 V84 H570 M430 160 V292 H570", arrows: [84, 292], junction: 430 },
    { name: "MOSI", y: 192, color: colors.output, path: "M184 192 H460 V108 H570 M460 192 V316 H570", arrows: [108, 316], junction: 460 },
    { name: "MISO", y: 224, color: colors.input, path: "M570 132 H490 V224 H184 M570 340 H490 V224", arrows: [], junction: 490 },
    { name: "CS0", y: 256, color: colors.select0, path: "M184 256 H398 V60 H570", arrows: [60] },
    { name: "CS1", y: 288, color: colors.select1, path: "M184 288 H376 V268 H570", arrows: [268] },
  ];
  return (
    <Diagram title="01 · 接线结构：共享总线，独立片选" caption="SCLK / MOSI 从主机发出；MISO 向主机回传，只有被选中的从机可以驱动它。CS0、CS1 分别选择对应从机。">
      <svg viewBox="0 0 760 390" role="img" aria-label="SPI 一主多从接线图：SCLK、MOSI、MISO 共享，CS0 与 CS1 独立">
        <Device x={24} y={128} height={190} title="主机" subtitle="MASTER" />
        <Device x={570} y={24} height={132} title="从机 0" subtitle="SLAVE 0" />
        <Device x={570} y={232} height={132} title="从机 1" subtitle="SLAVE 1" />
        {wires.map(({ name, y, color, path, arrows, junction }) => (
          <g key={name}>
            <path d={path} stroke={color} strokeWidth={2} fill="none" />
            <text x={226} y={y - 10} fontSize={14} fill={color}>{name}</text>
            {junction && <circle cx={junction} cy={y} r={3.5} fill={color} />}
            {arrows.map((arrowY) => <polygon key={arrowY} points={`560,${arrowY - 4} 572,${arrowY} 560,${arrowY + 4}`} fill={color} />)}
          </g>
        ))}
        <polygon points="194,220 182,224 194,228" fill={colors.input} />
      </svg>
    </Diagram>
  );
}

/** 模式 0 的起始时序：量尺、波形、采样说明分别占用独立的行。 */
export function SpiStartTimingDiagram() {
  return (
    <Diagram title="02 · 起始时序：先选中，再在时钟沿采样" caption="以模式 0（CPOL=0、CPHA=0）为例。t_lead 是 CS 拉低到首个时钟沿之间的准备时间，具体要求查看从机手册；此图仅表示先后关系，不按比例绘制。">
      <svg viewBox="0 0 760 340" role="img" aria-label="SPI 模式 0 起始时序：CS 拉低，等待 t_lead，SCLK 第一个上升沿采样">
        {/* 注释置于顶部，与量尺和信号线保持间隔。 */}
        <text x={110} y={30} fontSize={14} fill="#777c6c">模式 0 · 时钟空闲为低 · 第一个上升沿采样</text>
        <g stroke="#c6cabb" strokeWidth={1} strokeDasharray="4 5">
          <line x1={240} y1={56} x2={240} y2={300} />
          <line x1={420} y1={56} x2={420} y2={300} />
        </g>
        {/* t_lead 不叠在 CS / SCLK 波形中间，文字与量尺也各占一行。 */}
        <text x={330} y={64} textAnchor="middle" fontSize={16} fill="#6b7163">t_lead · 准备时间</text>
        <line x1={240} y1={82} x2={420} y2={82} stroke="#6b7163" strokeWidth={1.5} />
        <path d="M248 78 L240 82 L248 86 M412 78 L420 82 L412 86" stroke="#6b7163" strokeWidth={1.5} fill="none" />
        <g fill="none" strokeWidth={2.2} strokeLinejoin="round">
          <path d="M110 118 H240 V146 H720" stroke={colors.select0} />
          <path d="M110 230 H420 V196 H462 V230 H504 V196 H546 V230 H588 V196 H630 V230 H672 V196 H714 V230 H720" stroke={colors.clock} />
        </g>
        <text x={78} y={136} textAnchor="end" fontSize={16} fill={colors.select0}>CS</text>
        <text x={78} y={218} textAnchor="end" fontSize={16} fill={colors.clock}>SCLK</text>
        <text x={150} y={110} textAnchor="middle" fontSize={12} fill="#777c6c">未选中</text>
        <text x={570} y={167} textAnchor="middle" fontSize={12} fill="#777c6c">低电平：从机已选中</text>
        <circle cx={420} cy={213} r={5} fill={colors.input} />
        <path d="M426 213 H450 V266 H468" stroke={colors.input} strokeWidth={1.5} fill="none" />
        <text x={480} y={270} fontSize={15} fill={colors.input}>首个采样沿（上升沿）</text>
        <text x={240} y={322} textAnchor="middle" fontSize={13} fill={colors.select0}>CS 拉低：选中从机</text>
        <text x={420} y={322} fontSize={13} fill={colors.input}>在时钟沿采样，不在 CS 沿采样</text>
      </svg>
    </Diagram>
  );
}
