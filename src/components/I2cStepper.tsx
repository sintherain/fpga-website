import React, { useMemo, useState } from "react";
import Waveform, { type WaveChannel, type WaveSegment } from "./Waveform";

const ADDR = 0x50; // 7 位地址，如 EEPROM 24Cxx
const DATA = 0xa5;

interface Step {
  name: string;
  desc: string;
  range: [number, number];
}

function buildTransaction(): { channels: WaveChannel[]; steps: Step[] } {
  const scl: WaveSegment[] = [];
  const sda: WaveSegment[] = [];
  const steps: Step[] = [];
  let t = 0; // 当前时间（格），最小分辨率 0.5 格

  const push = (arr: WaveSegment[], d: number, v: 0 | 1, label?: string) => {
    arr.push({ d, v, label });
  };
  const mark = (name: string, desc: string, start: number, end: number) => {
    steps.push({ name, desc, range: [start, end] });
  };

  // 1. 空闲
  push(scl, 1, 1);
  push(sda, 1, 1);
  t += 1;

  // 2. START：SCL 高期间 SDA 下降
  push(scl, 0.5, 1);
  push(sda, 0.5, 1);
  mark("START 起始条件", "SCL 保持高电平时，SDA 由高跳变到低，总线上所有从机开始监听。", t, t + 0.5);
  push(sda, 0.5, 0);
  push(scl, 0.5, 1);
  t += 1;
  push(scl, 0.5, 0);
  t += 0.5;

  // 位传输辅助：每位 = SCL 低 0.5 + 高 1 + 低 0.5（共 2 格）
  const bit = (v: 0 | 1, label?: string) => {
    push(scl, 0.5, 0);
    push(sda, 0.5, v);
    push(scl, 1, 1);
    push(sda, 1, v, label);
    push(scl, 0.5, 0);
    push(sda, 0.5, v);
    t += 2;
  };

  // 3. 地址 7 位
  const addrStart = t;
  for (let i = 6; i >= 0; i--) {
    bit(((ADDR >> i) & 1) as 0 | 1, `A${i}`);
  }
  mark(
    "发送 7 位从机地址",
    `主机逐位发送地址 0x${ADDR.toString(16).toUpperCase()}（A6…A0），SCL 高电平期间 SDA 必须保持稳定。`,
    addrStart,
    t
  );

  // 4. R/W 位
  const rwStart = t;
  bit(0, "W");
  mark("读/写位", "第 8 位为方向位：0 = 主机写，1 = 主机读。本例为写操作。", rwStart, t);

  // 5. ACK
  const ackStart = t;
  bit(0, "ACK");
  mark(
    "从机应答 ACK",
    "第 9 个时钟主机释放 SDA（上拉为高），被寻址的从机把 SDA 拉低表示收到。若为高电平则是 NACK。",
    ackStart,
    t
  );

  // 6. 数据字节
  const dataStart = t;
  for (let i = 7; i >= 0; i--) {
    bit(((DATA >> i) & 1) as 0 | 1, `D${i}`);
  }
  mark(
    "发送数据字节",
    `主机发送数据 0x${DATA.toString(16).toUpperCase()}（MSB 先发）。`,
    dataStart,
    t
  );

  // 7. 数据 ACK
  const ack2Start = t;
  bit(0, "ACK");
  mark("从机再次应答", "从机确认收到数据字节，主机可继续发送下一字节或结束事务。", ack2Start, t);

  // 8. STOP：SCL 先拉高，然后 SDA 在 SCL 高期间上升
  push(scl, 0.5, 0);
  push(sda, 0.5, 0);
  t += 0.5;
  push(scl, 0.5, 1);
  push(sda, 0.5, 0);
  const stopStart = t;
  t += 0.5;
  push(scl, 0.5, 1);
  push(sda, 0.5, 1);
  mark("STOP 停止条件", "SCL 保持高电平时，SDA 由低跳变到高，事务结束，总线回到空闲。", stopStart, t);
  t += 0.5;

  // 9. 空闲
  push(scl, 1, 1);
  push(sda, 1, 1);

  return {
    channels: [
      { name: "SCL", color: "#fbbf24", segments: scl },
      { name: "SDA", color: "#a78bfa", segments: sda },
    ],
    steps,
  };
}

const I2cStepper: React.FC = () => {
  const { channels, steps } = useMemo(buildTransaction, []);
  const [idx, setIdx] = useState(0);
  const step = steps[idx];

  return (
    <div className="my-8 rounded-md border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="readout">I2C 写事务逐步演示（主机 → 从机 0x50）</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            ← 上一步
          </button>
          <span className="font-mono text-xs text-muted-foreground">
            {idx + 1} / {steps.length}
          </span>
          <button
            onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
            disabled={idx === steps.length - 1}
            className="rounded border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            下一步 →
          </button>
        </div>
      </div>

      <Waveform
        channels={channels}
        unit={26}
        highlight={step.range}
        caption="图：一次完整的 I2C 写事务（地址 0x50 + 写位 + 数据 0xA5）"
      />

      <div className="border-t border-border pt-3">
        <div className="font-mono text-sm text-[#a78bfa]">
          ▸ {step.name}
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {step.desc}
        </p>
      </div>
    </div>
  );
};

export default I2cStepper;
