import assert from "node:assert/strict";
import {
  buildFrame,
  buildSpiChannels,
  buildI2cTransaction,
} from "../src/lib/protocols.ts";
import { fifoOperation } from "../src/lib/fifo-model.ts";
const duration = (channel) => channel.segments.reduce((sum, s) => sum + s.d, 0);
function levelAt(channel, t) {
  let pos = 0;
  for (const s of channel.segments) {
    if (t >= pos && t < pos + s.d) return s.v;
    pos += s.d;
  }
  return undefined;
}
for (let value = 0; value < 256; value++) {
  const frame = buildFrame(value),
    ch = frame.channels[0];
  assert.equal(duration(ch), 12);
  assert.equal(levelAt(ch, 1.5), 0);
  assert.equal(levelAt(ch, 10.5), 1);
  for (let bit = 0; bit < 8; bit++)
    assert.equal(levelAt(ch, 2.5 + bit), (value >> bit) & 1);
}
for (const cpol of [0, 1])
  for (const cpha of [0, 1]) {
    const [cs, sck, mosi] = buildSpiChannels(cpol, cpha);
    assert.equal(levelAt(sck, 0), cpol);
    assert.equal(duration(cs), duration(sck));
    assert.equal(duration(mosi), duration(sck));
    for (let bit = 0; bit < 8; bit++) {
      const sample = 2 + bit * 2 + cpha;
      assert.equal(levelAt(cs, sample), 0);
      assert.notEqual(
        levelAt(sck, sample - 0.001),
        levelAt(sck, sample + 0.001),
      );
      assert.equal(levelAt(mosi, sample), (0xb2 >> (7 - bit)) & 1);
      assert.equal(levelAt(mosi, sample - 0.01), levelAt(mosi, sample + 0.01));
    }
  }
const txn = buildI2cTransaction(),
  [scl, sda] = txn.channels;
assert.equal(duration(scl), duration(sda));
let pos = 0,
  previous = 1;
const special = [];
for (const segment of sda.segments) {
  if (segment.v !== previous) {
    const before = levelAt(scl, pos - 0.001),
      after = levelAt(scl, pos + 0.001);
    if (before === 1 || after === 1) {
      assert.equal(before, 1, "SDA 不能与 SCL 上升沿同时变化");
      assert.equal(after, 1);
      special.push({ at: pos, type: segment.v === 0 ? "START" : "STOP" });
    }
  }
  previous = segment.v;
  pos += segment.d;
}
assert.deepEqual(
  special.map((x) => x.type),
  ["START", "STOP"],
);
for (const event of special) {
  const step = txn.steps.find((x) => x.name.startsWith(event.type));
  assert.ok(event.at > step.range[0] && event.at < step.range[1]);
}
assert.equal(txn.steps.length, 7);
assert.deepEqual(fifoOperation([], 0x11, true, true, 2), {
  queue: [0x11],
  wrote: true,
  read: null,
});
assert.deepEqual(fifoOperation([0x11, 0x22], 0x33, true, true, 2), {
  queue: [0x22],
  wrote: false,
  read: 0x11,
});
assert.deepEqual(fifoOperation([0x11], 0x33, true, true, 2), {
  queue: [0x33],
  wrote: true,
  read: 0x11,
});
console.log(
  "PASS: UART 全部 256 字节、SPI 四种模式采样沿、I2C 起止与等长对齐、FIFO 空满与同时读写。",
);

const { burstAddresses, crosses4KiB } = await import("../src/lib/axi-burst.ts");
assert.deepEqual(burstAddresses(0x100, 4, 4, "INCR"), [0x100, 0x104, 0x108, 0x10c]);
assert.deepEqual(burstAddresses(0x10c, 4, 4, "WRAP"), [0x10c, 0x100, 0x104, 0x108]);
assert.deepEqual(burstAddresses(0x10c, 4, 4, "FIXED"), [0x10c, 0x10c, 0x10c, 0x10c]);
assert.equal(burstAddresses(0x400, 256, 4, "INCR").at(-1), 0x7fc);
assert.equal(crosses4KiB(0xff8, 2, 4, "INCR"), false);
assert.equal(crosses4KiB(0xff8, 4, 4, "INCR"), true);
assert.equal(crosses4KiB(0xffc, 16, 4, "FIXED"), false);
assert.equal(crosses4KiB(0xffc, 16, 4, "WRAP"), false);
console.log("PASS: AXI4 对齐突发地址、回绕窗口、256 拍与 4 KiB 边界。");
