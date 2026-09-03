import React, { useEffect, useMemo, useRef, useState } from "react";
import Waveform, { type WaveChannel } from "./Waveform";

const BAUDS = [9600, 19200, 38400, 57600, 115200];

interface FrameInfo {
  channels: WaveChannel[];
  /** 每个时隙的名称与起始格 */
  slots: { name: string; start: number; end: number }[];
  total: number;
}

function buildFrame(byte: number): FrameInfo {
  const bits: number[] = [];
  for (let i = 0; i < 8; i++) bits.push((byte >> i) & 1); // LSB first

  const segments = [
    { d: 1, v: 1 as const, label: "空闲" },
    { d: 1, v: 0 as const, label: "起始" },
    ...bits.map((b, i) => ({
      d: 1,
      v: b as 0 | 1,
      label: `D${i}=${b}`,
    })),
    { d: 1, v: 1 as const, label: "停止" },
    { d: 1, v: 1 as const, label: "空闲" },
  ];

  const slots: FrameInfo["slots"] = [
    { name: "空闲位（高电平）", start: 0, end: 1 },
    { name: "起始位（拉低，通知接收方）", start: 1, end: 2 },
    ...bits.map((b, i) => ({
      name: `数据位 D${i} = ${b}`,
      start: 2 + i,
      end: 3 + i,
    })),
    { name: "停止位（回到高电平）", start: 10, end: 11 },
    { name: "空闲位", start: 11, end: 12 },
  ];

  return {
    channels: [{ name: "TX", color: "#22d3ee", segments }],
    slots,
    total: 12,
  };
}

const UartSimulator: React.FC = () => {
  const [hex, setHex] = useState("5A");
  const [baud, setBaud] = useState(115200);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const byte = useMemo(() => {
    const v = parseInt(hex, 16);
    if (Number.isNaN(v)) return 0x5a;
    return Math.min(255, Math.max(0, v));
  }, [hex]);

  const frame = useMemo(() => buildFrame(byte), [byte]);

  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now();
    // 慢放示意:动画时长随波特率缩放,高波特率指针更快;
    // 平方根映射 + 18s 封顶,保证 9600~115200 各档速度肉眼可分辨
    const DURATION = Math.min(5200 * Math.sqrt(115200 / baud), 18000);
    const tick = (now: number) => {
      const t = (now - startRef.current) / DURATION;
      if (t >= 1) {
        setCursor(null);
        setPlaying(false);
        return;
      }
      setCursor(t * frame.total);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, frame.total, baud]);

  const currentSlot = useMemo(() => {
    if (cursor === null) return null;
    return frame.slots.find((s) => cursor >= s.start && cursor < s.end) ?? null;
  }, [cursor, frame.slots]);

  const bitPeriod = (1 / baud) * 1e6; // us

  return (
    <div className="my-8 rounded-md border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div>
          <div className="readout mb-2">发送字节 (HEX)</div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">0x</span>
            <input
              value={hex}
              onChange={(e) =>
                setHex(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 2))
              }
              className="w-20 rounded border border-input bg-background px-3 py-1.5 font-mono text-sm text-[#fbbf24] outline-none focus:border-[#22d3ee]"
            />
            <span className="font-mono text-xs text-muted-foreground">
              = 0b{byte.toString(2).padStart(8, "0")}
            </span>
          </div>
        </div>
        <div>
          <div className="readout mb-2">波特率</div>
          <div className="flex flex-wrap gap-1">
            {BAUDS.map((b) => (
              <button
                key={b}
                onClick={() => setBaud(b)}
                className={`rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
                  baud === b
                    ? "border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => {
              setCursor(0);
              setPlaying(true);
            }}
            disabled={playing}
            className="rounded border border-[#22d3ee] bg-[#22d3ee]/10 px-5 py-2 font-mono text-xs uppercase tracking-widest text-[#22d3ee] transition-colors hover:bg-[#22d3ee]/20 disabled:opacity-40"
          >
            {playing ? "发送中…" : "▶ 发送一帧"}
          </button>
        </div>
      </div>

      <Waveform
        channels={frame.channels}
        unit={52}
        cursor={cursor}
        caption={`图：UART 发送 0x${byte
          .toString(16)
          .toUpperCase()
          .padStart(2, "0")}（8 数据位、无校验、1 停止位，LSB 先发）`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 font-mono text-xs">
        <span className="text-muted-foreground">
          位周期 T = 1 / {baud} ≈{" "}
          <span className="text-[#fbbf24]">{bitPeriod.toFixed(2)} µs</span>
          ，一帧 10 位 ≈ {(bitPeriod * 10).toFixed(1)} µs · 动画为慢放示意
        </span>
        <span className="text-[#34d399]">
          {currentSlot ? `▸ ${currentSlot.name}` : "等待发送"}
        </span>
      </div>
    </div>
  );
};

export default UartSimulator;
