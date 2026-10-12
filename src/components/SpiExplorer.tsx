import { useMemo, useState } from "react";
import Waveform from "./Waveform";
import { buildSpiChannels } from "../lib/protocols";
const descriptions = [
  "空闲低电平，第一个沿（上升沿）采样；下降沿换下一位。",
  "空闲低电平，第一个沿（上升沿）准备数据，第二个沿（下降沿）采样。",
  "空闲高电平，第一个沿（下降沿）采样；上升沿换下一位。",
  "空闲高电平，第一个沿（下降沿）准备数据，第二个沿（上升沿）采样。",
];
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: 0 | 1;
  onChange: (v: 0 | 1) => void;
}) {
  return (
    <div>
      <span className="control-label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {([0, 1] as const).map((v) => (
          <button
            key={v}
            aria-label={`${label} ${v}`}
            aria-pressed={value === v}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
export default function SpiExplorer() {
  const [cpol, setCpol] = useState<0 | 1>(0),
    [cpha, setCpha] = useState<0 | 1>(0);
  const mode = cpol * 2 + cpha,
    channels = useMemo(() => buildSpiChannels(cpol, cpha), [cpol, cpha]);
  return (
    <div className="experiment">
      <div className="experiment-label">
        波形实验 · 换一个模式，采样沿就不同了
      </div>
      <div className="control-row">
        <Toggle label="CPOL · 时钟极性" value={cpol} onChange={setCpol} />
        <Toggle label="CPHA · 时钟相位" value={cpha} onChange={setCpha} />
        <span className="ml-auto text-sm text-[#62794e]">模式 {mode}</span>
      </div>
      <Waveform
        channels={channels}
        unit={42}
        samplePoints={Array.from({ length: 8 }, (_, i) => ({
          at: 2 + i * 2 + cpha,
          label: i === 0 ? "采样点" : undefined,
        }))}
        caption={`SPI 模式 ${mode} · 发送 0xB2，高位先发。绿色虚线是采样时刻。`}
      />
      <div className="experiment-status">
        <p>{descriptions[mode]}</p>
        <p>
          片选拉低后留出准备时间；CPHA=0 时，第一位必须在首个采样沿之前就绪。
        </p>
      </div>
    </div>
  );
}
