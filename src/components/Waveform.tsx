import React from "react";

export type WaveValue = 0 | 1 | "x";

export interface WaveSegment {
  /** 持续时长（单位：格） */
  d: number;
  /** 电平：0 / 1 / x（总线或未知态，渲染为交叉带） */
  v: WaveValue;
  /** 段内标注（如 D0、ACK） */
  label?: string;
}

export interface WaveChannel {
  name: string;
  color: string;
  segments: WaveSegment[];
}

interface WaveformProps {
  channels: WaveChannel[];
  /** 每格像素宽度 */
  unit?: number;
  /** 是否绘制竖直虚线网格 */
  grid?: boolean;
  /** 高亮区间 [start, end]（单位：格） */
  highlight?: [number, number] | null;
  /** 游标位置（单位：格），用于动画扫描 */
  cursor?: number | null;
  caption?: string;
}

const LABEL_W = 64;
const ROW_H = 52;
const PAD_T = 14;
const PAD_B = 18;
const HIGH_OFF = 9;
const LOW_OFF = 36;

export function totalUnits(channels: WaveChannel[]): number {
  return Math.max(
    ...channels.map((c) => c.segments.reduce((s, seg) => s + seg.d, 0))
  );
}

const Waveform: React.FC<WaveformProps> = ({
  channels,
  unit = 44,
  grid = true,
  highlight = null,
  cursor = null,
  caption,
}) => {
  const units = totalUnits(channels);
  const width = LABEL_W + units * unit + 16;
  const height = PAD_T + channels.length * ROW_H + PAD_B;

  const tracePath = (ch: WaveChannel, rowTop: number) => {
    const yHigh = rowTop + HIGH_OFF;
    const yLow = rowTop + LOW_OFF;
    let x = LABEL_W;
    let d = "";
    let prev: number | null = null;
    for (const seg of ch.segments) {
      const y = seg.v === 1 ? yHigh : seg.v === 0 ? yLow : (yHigh + yLow) / 2;
      if (prev === null) {
        d += `M ${x} ${y}`;
      } else if (y !== prev) {
        d += ` L ${x} ${prev} L ${x} ${y}`;
      }
      x += seg.d * unit;
      d += ` L ${x} ${y}`;
      prev = y;
    }
    return d;
  };

  return (
    <figure className="my-6">
      <div className="overflow-x-auto rounded-md border border-border bg-[#0b0e13]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block min-w-[540px] w-full"
          role="img"
          aria-label={caption ?? "时序波形图"}
        >
          <defs>
            <pattern
              id="wave-hatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill="transparent" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#334155" strokeWidth="1" />
            </pattern>
          </defs>

          {/* 网格 */}
          {grid &&
            Array.from({ length: units + 1 }, (_, i) => (
              <line
                key={`g${i}`}
                x1={LABEL_W + i * unit}
                y1={PAD_T - 4}
                x2={LABEL_W + i * unit}
                y2={height - PAD_B + 4}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray={i % 1 === 0 ? "2 4" : undefined}
              />
            ))}

          {/* 高亮区间 */}
          {highlight && (
            <rect
              x={LABEL_W + highlight[0] * unit}
              y={PAD_T - 6}
              width={(highlight[1] - highlight[0]) * unit}
              height={height - PAD_T - PAD_B + 12}
              fill="rgba(34,211,238,0.08)"
              stroke="rgba(34,211,238,0.35)"
              strokeDasharray="3 3"
              rx={4}
            />
          )}

          {channels.map((ch, ci) => {
            const rowTop = PAD_T + ci * ROW_H;
            const yHigh = rowTop + HIGH_OFF;
            const yLow = rowTop + LOW_OFF;
            let x = LABEL_W;
            return (
              <g key={ch.name}>
                <text
                  x={LABEL_W - 10}
                  y={(yHigh + yLow) / 2 + 4}
                  textAnchor="end"
                  fill={ch.color}
                  fontSize="12"
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                >
                  {ch.name}
                </text>
                {/* x 态填充带 */}
                {ch.segments.map((seg, si) => {
                  const x0 = x;
                  x += seg.d * unit;
                  if (seg.v !== "x") return null;
                  return (
                    <g key={`x${si}`}>
                      <rect
                        x={x0}
                        y={yHigh}
                        width={seg.d * unit}
                        height={yLow - yHigh}
                        fill="url(#wave-hatch)"
                        stroke={ch.color}
                        strokeOpacity="0.5"
                      />
                    </g>
                  );
                })}
                {/* 主轨迹 */}
                <path
                  d={tracePath(ch, rowTop)}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                {/* 段标注 */}
                {(() => {
                  let lx = LABEL_W;
                  return ch.segments.map((seg, si) => {
                    const cx = lx + (seg.d * unit) / 2;
                    lx += seg.d * unit;
                    if (!seg.label) return null;
                    return (
                      <text
                        key={`l${si}`}
                        x={cx}
                        y={(yHigh + yLow) / 2 + 4}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="11"
                        fontFamily="JetBrains Mono, ui-monospace, monospace"
                      >
                        {seg.label}
                      </text>
                    );
                  });
                })()}
              </g>
            );
          })}

          {/* 扫描游标 */}
          {cursor !== null && (
            <g>
              <line
                x1={LABEL_W + cursor * unit}
                y1={PAD_T - 6}
                x2={LABEL_W + cursor * unit}
                y2={height - PAD_B + 6}
                stroke="#f8fafc"
                strokeWidth="1.2"
                strokeOpacity="0.85"
              />
              <circle
                cx={LABEL_W + cursor * unit}
                cy={PAD_T - 6}
                r="3"
                fill="#f8fafc"
              />
            </g>
          )}
        </svg>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-[13px] text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default Waveform;
