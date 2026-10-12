import { useEffect, useId, useRef } from "react";
import { totalUnits } from "../lib/waveform-types";
import type { WaveChannel } from "../lib/waveform-types";
export type { WaveSegment, WaveChannel } from "../lib/waveform-types";
interface Props {
  channels: WaveChannel[];
  unit?: number;
  grid?: boolean;
  highlight?: [number, number] | null;
  cursor?: number | null;
  caption?: string;
  samplePoints?: { at: number; label?: string }[];
}
const LABEL_W = 66,
  ROW_H = 54,
  PAD_T = 28,
  PAD_B = 25;
export default function Waveform({
  channels,
  unit = 44,
  grid = true,
  highlight = null,
  cursor = null,
  caption,
  samplePoints = [],
}: Props) {
  const hatch = useId(),
    scroller = useRef<HTMLDivElement>(null);
  const units = totalUnits(channels),
    width = LABEL_W + units * unit + 18,
    height = PAD_T + channels.length * ROW_H + PAD_B;
  const highlightStart = highlight?.[0],
    highlightEnd = highlight?.[1];
  useEffect(() => {
    const el = scroller.current;
    if (
      el &&
      highlightStart !== undefined &&
      highlightEnd !== undefined &&
      el.scrollWidth > el.clientWidth
    ) {
      el.scrollTo({
        left: Math.max(
          0,
          LABEL_W +
            ((highlightStart + highlightEnd) * unit) / 2 -
            el.clientWidth / 2,
        ),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  }, [highlightStart, highlightEnd, unit]);
  function pathFor(channel: WaveChannel, top: number) {
    let x = LABEL_W,
      previous: number | null = null;
    let path = "";
    for (const segment of channel.segments) {
      const y = top + (segment.v === 1 ? 9 : segment.v === 0 ? 36 : 22.5);
      path +=
        previous === null ? `M${x} ${y}` : ` L${x} ${previous} L${x} ${y}`;
      x += segment.d * unit;
      path += ` L${x} ${y}`;
      previous = y;
    }
    return path;
  }
  return (
    <figure className="waveform-figure">
      <div className="wave-legend">
        <span>时间从左向右 →</span>
        <span className="wave-scroll-hint">左右滑动查看完整波形</span>
      </div>
      <div
        ref={scroller}
        className="wave-scroller"
        tabIndex={0}
        aria-label="时序波形，可左右滚动"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={caption ?? "时序波形图"}
        >
          <defs>
            <pattern
              id={hatch}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="#dce2d3"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          {grid &&
            Array.from({ length: Math.floor(units) + 1 }, (_, i) => (
              <g key={i}>
                <line
                  x1={LABEL_W + i * unit}
                  y1={PAD_T - 4}
                  x2={LABEL_W + i * unit}
                  y2={height - PAD_B}
                  stroke="#e6e7dd"
                  strokeDasharray="2 4"
                />
                <text
                  x={LABEL_W + i * unit}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#a1a794"
                >
                  {i}
                </text>
              </g>
            ))}
          {highlight && (
            <rect
              x={LABEL_W + highlight[0] * unit}
              y={PAD_T - 6}
              width={(highlight[1] - highlight[0]) * unit}
              height={channels.length * ROW_H + 6}
              fill="#e4ecd5"
              fillOpacity=".6"
              stroke="#b9caa6"
              rx={4}
            />
          )}
          {channels.map((ch, ci) => {
            const top = PAD_T + ci * ROW_H;
            let x = LABEL_W;
            return (
              <g key={ch.name}>
                <text
                  x={LABEL_W - 10}
                  y={top + 27}
                  textAnchor="end"
                  fill={ch.color}
                  fontSize="12"
                >
                  {ch.name}
                </text>
                {ch.segments.map((seg, i) => {
                  const x0 = x;
                  x += seg.d * unit;
                  return (
                    <g key={i}>
                      {seg.v === "x" && (
                        <rect
                          x={x0}
                          y={top + 9}
                          width={seg.d * unit}
                          height="27"
                          fill={`url(#${hatch})`}
                          stroke={ch.color}
                          strokeOpacity=".4"
                        />
                      )}
                      {seg.label && (
                        <text
                          x={x0 + (seg.d * unit) / 2}
                          y={top + 27}
                          textAnchor="middle"
                          fill="#7b846c"
                          fontSize="11"
                        >
                          {seg.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                <path
                  d={pathFor(ch, top)}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
          {samplePoints.map((p, i) => (
            <g key={i}>
              <line
                x1={LABEL_W + p.at * unit}
                y1="23"
                x2={LABEL_W + p.at * unit}
                y2={height - PAD_B}
                stroke="#849c70"
                strokeDasharray="3 3"
              />
              <circle cx={LABEL_W + p.at * unit} cy="20" r="3" fill="#688955" />
              {p.label && (
                <text
                  x={LABEL_W + p.at * unit}
                  y="12"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6d8157"
                >
                  {p.label}
                </text>
              )}
            </g>
          ))}
          {cursor !== null && (
            <line
              x1={LABEL_W + cursor * unit}
              y1="16"
              x2={LABEL_W + cursor * unit}
              y2={height - PAD_B + 5}
              stroke="#ad7751"
              strokeWidth="1.5"
            />
          )}
        </svg>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
