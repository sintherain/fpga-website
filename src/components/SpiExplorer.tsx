import React, { useMemo, useState } from "react";
import Waveform, { type WaveChannel, type WaveSegment } from "./Waveform";

const DATA = 0b10110010; // 示例字节，MSB 先发

const MODE_DESC = [
  "模式 0：时钟空闲为低（CPOL=0），在第一个上升沿采样数据（CPHA=0）。最常用。",
  "模式 1：时钟空闲为低（CPOL=0），在第二个沿（下降沿）采样数据（CPHA=1）。",
  "模式 2：时钟空闲为高（CPOL=1），在第一个下降沿采样数据（CPHA=0）。",
  "模式 3：时钟空闲为高（CPOL=1），在第二个沿（上升沿）采样数据（CPHA=1）。",
];

function buildChannels(cpol: 0 | 1, cpha: 0 | 1): WaveChannel[] {
  // 时间轴以半格为最小单位;每位 2 格;CS 拉低后留 1 格 t_lead(引导时间)才出现第一个时钟沿
  const HIGH = (cpol ^ 1) as 0 | 1;

  // CS:空闲高 → 拉低(选中,此刻不采样)→ 结束拉高
  const csSegs: WaveSegment[] = [
    { d: 1, v: 1 },                    // 空闲
    { d: 1 + 8 * 2, v: 0 },            // 拉低:含 t_lead 与 8 位周期
    { d: 1, v: 1 },                    // 结束拉高
  ];

  // SCK:空闲 + t_lead 共 2 格,然后 8 个时钟周期,最后回空闲
  const sckSegs: WaveSegment[] = [{ d: 2, v: cpol }];
  for (let i = 0; i < 8; i++) {
    sckSegs.push({ d: 1, v: HIGH });
    sckSegs.push({ d: 1, v: cpol });
  }
  sckSegs.push({ d: 1, v: cpol });

  // MOSI:CPHA=0 时 D7 在 t_lead 里就准备好(第一个沿采样);
  // CPHA=1 时第一个沿才移出数据,第二个沿采样
  const mosiSegs: WaveSegment[] = [{ d: 1, v: "x" }];
  if (cpha === 0) {
    for (let i = 0; i < 8; i++) {
      const bit = (DATA >> (7 - i)) & 1;
      mosiSegs.push({ d: 2, v: bit as 0 | 1, label: `D${7 - i}` });
    }
    mosiSegs.push({ d: 2, v: "x" });
  } else {
    mosiSegs.push({ d: 1, v: "x" });   // t_lead 期间数据未就绪
    for (let i = 0; i < 8; i++) {
      const bit = (DATA >> (7 - i)) & 1;
      mosiSegs.push({ d: 2, v: bit as 0 | 1, label: `D${7 - i}` });
    }
    mosiSegs.push({ d: 1, v: "x" });
  }

  return [
    { name: "CS", color: "#fb7185", segments: csSegs },
    { name: "SCK", color: "#fbbf24", segments: sckSegs },
    { name: "MOSI", color: "#34d399", segments: mosiSegs },
  ];
}

const SpiExplorer: React.FC = () => {
  const [cpol, setCpol] = useState<0 | 1>(0);
  const [cpha, setCpha] = useState<0 | 1>(0);
  const mode = cpol * 2 + cpha;

  const channels = useMemo(() => buildChannels(cpol, cpha), [cpol, cpha]);

  const Toggle = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: 0 | 1;
    onChange: (v: 0 | 1) => void;
  }) => (
    <div>
      <div className="readout mb-2">{label}</div>
      <div className="inline-flex rounded border border-border p-0.5">
        {([0, 1] as const).map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`rounded px-4 py-1 font-mono text-sm transition-colors ${
              value === v
                ? "bg-[#fbbf24]/15 text-[#fbbf24]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="my-8 rounded-md border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-end gap-8">
        <Toggle label="CPOL（时钟极性）" value={cpol} onChange={setCpol} />
        <Toggle label="CPHA（时钟相位）" value={cpha} onChange={setCpha} />
        <div className="ml-auto font-mono text-sm">
          <span className="text-muted-foreground">MODE </span>
          <span className="text-2xl text-[#fbbf24]">{mode}</span>
        </div>
      </div>

      <Waveform
        channels={channels}
        unit={40}
        caption={`图：SPI 模式 ${mode} 发送 0xB2（MSB 先发），注意采样沿随 CPOL/CPHA 变化`}
      />

      <p className="border-t border-border pt-3 text-sm leading-6 text-muted-foreground">
        {MODE_DESC[mode]}
      </p>
    </div>
  );
};

export default SpiExplorer;
