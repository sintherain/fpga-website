import { useState } from "react";
import { burstAddresses, crosses4KiB } from "../lib/axi-burst";
import type { BurstKind } from "../lib/axi-burst";

const hex = (value: number) =>
  `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;

export default function AxiBurstExplorer() {
  const [start, setStart] = useState(0x100);
  const [beats, setBeats] = useState(4);
  const [bytes, setBytes] = useState(4);
  const [kind, setKind] = useState<BurstKind>("INCR");
  const [ready, setReady] = useState(true);
  const [accepted, setAccepted] = useState(0);
  const [cycles, setCycles] = useState(0);
  const addresses = burstAddresses(start, beats, bytes, kind);
  const crossed = crosses4KiB(start, beats, bytes, kind);
  const valid = accepted < beats;
  const lengths =
    kind === "INCR"
      ? [1, 2, 4, 8, 16, 256]
      : kind === "WRAP"
        ? [2, 4, 8, 16]
        : [1, 2, 4, 8, 16];
  function reset() {
    setAccepted(0);
    setCycles(0);
  }
  return (
    <div className="experiment axi-burst-experiment">
      <div className="experiment-label">
        突发实验 · 拍数、字节数和时钟数是三件事
      </div>
      <div className="axi-burst-controls">
        <label>
          起始字节地址
          <select
            value={start}
            onChange={(e) => {
              setStart(Number(e.target.value));
              reset();
            }}
          >
            {[0, 0x100, 0x10c, 0xffc].map((value) => (
              <option key={value} value={value}>
                {hex(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          传输拍数
          <select
            value={beats}
            onChange={(e) => {
              setBeats(Number(e.target.value));
              reset();
            }}
          >
            {lengths.map((value) => (
              <option key={value} value={value}>
                {value} 拍
              </option>
            ))}
          </select>
        </label>
        <label>
          每拍字节数
          <select
            value={bytes}
            onChange={(e) => {
              setBytes(Number(e.target.value));
              reset();
            }}
          >
            {[1, 2, 4].map((value) => (
              <option key={value} value={value}>
                {value} 字节
              </option>
            ))}
          </select>
        </label>
        <label>
          突发类型
          <select
            value={kind}
            onChange={(e) => {
              const next = e.target.value as BurstKind;
              setKind(next);
              if (
                next !== "INCR" &&
                (beats > 16 || (next === "WRAP" && beats === 1))
              )
                setBeats(4);
              reset();
            }}
          >
            <option>INCR</option>
            <option>FIXED</option>
            <option>WRAP</option>
          </select>
        </label>
      </div>
      <div className="axi-burst-formula">
        <span>
          AxLEN = <strong>{beats - 1}</strong> → {beats} 拍
        </span>
        <span>
          AxSIZE = <strong>{Math.log2(bytes)}</strong> → {bytes} 字节 / 拍
        </span>
        <span>
          标称传输量 = <strong>{beats * bytes} 字节</strong>
        </span>
      </div>
      <div className="axi-figure-scroll">
        <svg
          viewBox="0 0 760 175"
          role="img"
          aria-label={`${kind} 突发地址序列，${beats} 拍，每拍 ${bytes} 字节`}
        >
          {addresses.slice(0, beats > 8 ? 6 : 8).map((address, i) => (
            <g key={i}>
              <rect
                x={15 + i * 91}
                y={35}
                width={80}
                height={74}
                rx={7}
                fill={
                  i < accepted
                    ? "#e2ebd9"
                    : i === accepted
                      ? "#f6eadc"
                      : "#f5f3ed"
                }
                stroke={i === accepted ? "#a16435" : "#b9c4aa"}
                strokeWidth={i === accepted ? 2 : 1}
              />
              <text
                x={55 + i * 91}
                y={60}
                textAnchor="middle"
                fontSize={13}
                fill="#737d64"
              >
                第 {i + 1} 拍
              </text>
              <text
                x={55 + i * 91}
                y={86}
                textAnchor="middle"
                fontSize={14}
                fill="#43624f"
              >
                {hex(address)}
              </text>
              {i < Math.min(beats - 1, beats > 8 ? 5 : 7) && (
                <path
                  d={`M${98 + i * 91} 73 h7 l-3 -3 m3 3 l-3 3`}
                  stroke="#737d64"
                  fill="none"
                />
              )}
            </g>
          ))}
          {beats > 8 && (
            <>
              <text
                x={587}
                y={79}
                textAnchor="middle"
                fontSize={18}
                fill="#737d64"
              >
                …
              </text>
              <rect
                x={625}
                y={35}
                width={120}
                height={74}
                rx={7}
                fill="#f5f3ed"
                stroke="#b9c4aa"
              />
              <text
                x={685}
                y={60}
                textAnchor="middle"
                fontSize={13}
                fill="#737d64"
              >
                第 {beats} 拍
              </text>
              <text
                x={685}
                y={86}
                textAnchor="middle"
                fontSize={14}
                fill="#43624f"
              >
                {hex(addresses[beats - 1])}
              </text>
            </>
          )}
          <text x={20} y={145} fontSize={13} fill="#737d64">
            地址按成功的数据握手推进；LAST 只在最后一拍为 1。
          </text>
        </svg>
      </div>
      {crossed && (
        <p className="axi-boundary-warning" role="alert">
          这个请求跨过 4 KiB 边界，不能作为一笔合法 AXI4 突发发出。应在 0x1000
          处分成两笔请求。
        </p>
      )}
      <div className="handshake-cells">
        <span>VALID = {Number(valid)}</span>
        <span>READY = {Number(ready)}</span>
        <span>当前地址 = {valid ? hex(addresses[accepted]) : "完成"}</span>
        <span>LAST = {Number(valid && accepted === beats - 1)}</span>
      </div>
      <div className="experiment-controls">
        <button
          className="experiment-button"
          aria-pressed={ready}
          onClick={() => setReady(!ready)}
        >
          {ready ? "让接收方等待" : "让接收方就绪"}
        </button>
        <button
          className="experiment-button primary"
          disabled={!valid || crossed}
          onClick={() => {
            setCycles(cycles + 1);
            if (ready) setAccepted(accepted + 1);
          }}
        >
          时钟前进一步
        </button>
        <button className="experiment-button" onClick={reset}>
          重新开始
        </button>
      </div>
      <p className="experiment-status mt-5" aria-live="polite">
        经历 {cycles} 个时钟上升沿，完成 {accepted} / {beats} 拍。
        {valid && !ready
          ? "背压：当前拍和 LAST 都保持，计数不增加。"
          : !valid
            ? "突发的数据阶段完成。"
            : "下一次握手才推进一拍。"}
      </p>
      <p className="axi-experiment-note">
        此实验解释对齐地址的协议规则；下方 Verilog 实例只实现 4 字节 / 拍的
        INCR。32 位总线上的 1、2 字节窄传输还需按地址选择字节通道。
      </p>
    </div>
  );
}
