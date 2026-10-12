import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import Waveform from "./Waveform";
import { buildI2cTransaction } from "../lib/protocols";
export default function I2cStepper() {
  const { channels, steps } = useMemo(() => buildI2cTransaction(), []),
    [idx, setIdx] = useState(0);
  const step = steps[idx];
  return (
    <div className="experiment">
      <div className="experiment-label">
        波形实验 · 给地址 0x50 的设备写一个字节
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[#7f8d6c]">
          第 {idx + 1} 步 / 共 {steps.length} 步
        </span>
        <div className="experiment-controls">
          <button
            className="experiment-button flex items-center gap-1"
            disabled={idx === 0}
            onClick={() => setIdx(idx - 1)}
          >
            <ArrowLeft size={12} />
            上一步
          </button>
          <button
            className="experiment-button primary flex items-center gap-1"
            disabled={idx === steps.length - 1}
            onClick={() => setIdx(idx + 1)}
          >
            下一步
            <ArrowRight size={12} />
          </button>
          <button
            className="experiment-button"
            aria-label="重新开始 I2C 演示"
            onClick={() => setIdx(0)}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
      <Waveform
        channels={channels}
        unit={30}
        highlight={step.range}
        caption="一次完整的 I2C 写事务 · 地址 0x50 + 写位 + 数据 0xA5"
      />
      <div className="experiment-status" aria-live="polite">
        <div>
          <strong className="text-sm text-[#667e52]">{step.name}</strong>
          <p className="mt-2">{step.desc}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        高亮区间会自动移到视野内；小屏幕也可以左右滑动波形。
      </p>
    </div>
  );
}
