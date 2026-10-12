import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import Waveform from "./Waveform";
import { buildFrame } from "../lib/protocols";
const BAUDS = [9600, 19200, 38400, 57600, 115200];
export default function UartSimulator() {
  const [hex, setHex] = useState("5A"),
    [baud, setBaud] = useState(115200),
    [playing, setPlaying] = useState(false),
    [cursor, setCursor] = useState<number | null>(null);
  const position = useRef(0);
  const byte = Math.min(255, Math.max(0, parseInt(hex, 16) || 0));
  const frame = useMemo(() => buildFrame(byte), [byte]);
  const duration = Math.min(5200 * Math.sqrt(115200 / baud), 18000);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const start =
      performance.now() - (position.current / frame.total) * duration;
    const tick = (now: number) => {
      position.current = Math.min(
        frame.total,
        ((now - start) / duration) * frame.total,
      );
      setCursor(position.current);
      if (position.current >= frame.total) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, frame.total]);
  function reset() {
    setPlaying(false);
    setCursor(null);
    position.current = 0;
  }
  function play() {
    if (position.current >= frame.total) position.current = 0;
    setPlaying(true);
  }
  const slot =
    cursor === null
      ? null
      : frame.slots.find((s) => cursor >= s.start && cursor < s.end);
  return (
    <div className="experiment">
      <div className="experiment-label">波形实验 · 让一个字节走过线路</div>
      <div className="control-row">
        <div>
          <label className="control-label" htmlFor="uart-hex">
            发送字节（十六进制）
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">0x</span>
            <input
              id="uart-hex"
              value={hex}
              maxLength={2}
              disabled={playing}
              onChange={(e) => {
                reset();
                setHex(e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 2));
              }}
            />
            <span className="text-xs text-muted-foreground">
              {byte.toString(2).padStart(8, "0")}
            </span>
          </div>
        </div>
        <div>
          <span className="control-label" id="baud-label">
            波特率
          </span>
          <div className="segmented" role="group" aria-labelledby="baud-label">
            {BAUDS.map((b) => (
              <button
                disabled={playing}
                aria-pressed={baud === b}
                key={b}
                onClick={() => {
                  reset();
                  setBaud(b);
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <div className="experiment-controls">
          <button
            className="experiment-button primary flex items-center gap-1.5"
            onClick={() => (playing ? setPlaying(false) : play())}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}{" "}
            {playing
              ? "暂停"
              : cursor !== null && cursor < frame.total
                ? "继续播放"
                : cursor === frame.total
                  ? "重新播放"
                  : "播放一帧"}
          </button>
          <button
            className="experiment-button flex items-center gap-1.5"
            onClick={reset}
          >
            <RotateCcw size={13} />
            重置
          </button>
        </div>
      </div>
      <Waveform
        channels={frame.channels}
        unit={52}
        cursor={cursor}
        caption={`UART 发送 0x${byte.toString(16).toUpperCase().padStart(2, "0")} · 8N1，低位先发`}
      />
      <div className="experiment-status">
        <span>
          每位 {(1e6 / baud).toFixed(2)} μs · 一帧 {(1e7 / baud).toFixed(1)} μs
          <br />
          动画为慢放示意，实际帧不含两端的空闲间隔。
        </span>
        <span>
          {cursor === frame.total
            ? "这一帧发送完成"
            : (slot?.name ?? "准备好后，播放一帧看看。")}
        </span>
      </div>
    </div>
  );
}
