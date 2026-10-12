import type { WaveChannel, WaveSegment } from "./waveform-types";
const DATA = 0xb2;
const ADDR = 0x50;
interface FrameInfo {
  channels: WaveChannel[];
  /** 每个时隙的名称与起始格 */
  slots: { name: string; start: number; end: number }[];
  total: number;
}

export function buildFrame(byte: number): FrameInfo {
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
    channels: [{ name: "TX", color: "#43624f", segments }],
    slots,
    total: 12,
  };
}

export function buildSpiChannels(cpol: 0 | 1, cpha: 0 | 1): WaveChannel[] {
  // 时间轴以半格为最小单位;每位 2 格;CS 拉低后留 1 格 t_lead(引导时间)才出现第一个时钟沿
  const HIGH = (cpol ^ 1) as 0 | 1;

  // CS:空闲高 → 拉低(选中,此刻不采样)→ 结束拉高
  const csSegs: WaveSegment[] = [
    { d: 1, v: 1 }, // 空闲
    { d: 1 + 8 * 2, v: 0 }, // 拉低:含 t_lead 与 8 位周期
    { d: 1, v: 1 }, // 结束拉高
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
    mosiSegs.push({ d: 1, v: "x" }); // t_lead 期间数据未就绪
    for (let i = 0; i < 8; i++) {
      const bit = (DATA >> (7 - i)) & 1;
      mosiSegs.push({ d: 2, v: bit as 0 | 1, label: `D${7 - i}` });
    }
    mosiSegs.push({ d: 1, v: "x" });
  }

  return [
    { name: "CS", color: "#ac574d", segments: csSegs },
    { name: "SCK", color: "#a16435", segments: sckSegs },
    { name: "MOSI", color: "#46725f", segments: mosiSegs },
  ];
}

interface Step {
  name: string;
  desc: string;
  range: [number, number];
}

export function buildI2cTransaction(): {
  channels: WaveChannel[];
  steps: Step[];
} {
  const DATA = 0xa5;
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
  mark(
    "START 起始条件",
    "SCL 保持高电平时，SDA 由高跳变到低，总线上所有从机开始监听。",
    t + 0.25,
    t + 0.75,
  );
  push(sda, 0.5, 0);
  push(scl, 0.5, 1);
  t += 1;
  push(scl, 0.5, 0);
  push(sda, 0.5, 0);
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
    t,
  );

  // 4. R/W 位
  const rwStart = t;
  bit(0, "W");
  mark(
    "读/写位",
    "第 8 位为方向位：0 = 主机写，1 = 主机读。本例为写操作。",
    rwStart,
    t,
  );

  // 5. ACK
  const ackStart = t;
  bit(0, "ACK");
  mark(
    "从机应答 ACK",
    "第 9 个时钟主机释放 SDA（上拉为高），被寻址的从机把 SDA 拉低表示收到。若为高电平则是 NACK。",
    ackStart,
    t,
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
    t,
  );

  // 7. 数据 ACK
  const ack2Start = t;
  bit(0, "ACK");
  mark(
    "从机再次应答",
    "从机确认收到数据字节，主机可继续发送下一字节或结束事务。",
    ack2Start,
    t,
  );

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
  mark(
    "STOP 停止条件",
    "SCL 保持高电平时，SDA 由低跳变到高，事务结束，总线回到空闲。",
    stopStart + 0.25,
    t + 0.25,
  );
  t += 0.5;

  // 9. 空闲
  push(scl, 1, 1);
  push(sda, 1, 1);

  return {
    channels: [
      { name: "SCL", color: "#a16435", segments: scl },
      { name: "SDA", color: "#746087", segments: sda },
    ],
    steps,
  };
}
