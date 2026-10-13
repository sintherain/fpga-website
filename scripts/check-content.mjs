import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chapters } from "../src/content/chapters.ts";
import { headingId } from "../src/lib/headings.ts";
import * as walkthroughs from "../src/content/walkthroughs.ts";
const sections = [
  "FpgaBasics",
  "UartSection",
  "SpiSection",
  "I2cSection",
  "AxiSection",
  "FifoSection",
  "Roadmap",
];
for (const [i, chapter] of chapters.entries()) {
  const source = readFileSync(
    new URL("../src/sections/" + sections[i] + ".tsx", import.meta.url),
    "utf8",
  );
  const headings = [...source.matchAll(/<H3>([^<]+)<\/H3>/g)].map((m) =>
    m[1].trim(),
  );
  assert.deepEqual(
    headings,
    chapter.headings,
    chapter.title + " 的目录必须与正文一致",
  );
  const ids = headings.map(headingId);
  assert.equal(new Set(ids).size, ids.length, "目录 ID 不能重复");
  const subheadings = [...source.matchAll(/<H4>([^<]+)<\/H4>/g)].map((m) =>
    m[1].trim(),
  );
  for (const sub of Object.values(chapter.subheadings ?? {}).flat())
    assert.ok(subheadings.includes(sub), "子目录必须对应正文：" + sub);
}
const groups = {
  uartTxSteps: "uart_tx.v",
  uartCounterSteps: "uart_tx_cnt.v",
  uartRxSteps: "uart_rx.v",
  spiMasterSteps: "spi_master.v",
  spiSlaveSteps: "spi_slave.v",
  fifoSteps: "sync_fifo.v",
  i2cSteps: "i2c_start_stop.v",
  axiRamSteps: "axi4_burst_ram.v",
};
let parts = 0;
for (const [name, file] of Object.entries(groups)) {
  const lines = readFileSync(
    new URL("../src/content/rtl/" + file, import.meta.url),
    "utf8",
  ).split("\n");
  for (const step of walkthroughs[name]) {
    const start = lines.findIndex((s) => s.includes(step.from));
    assert.ok(start >= 0, file + " 缺少摘录起点 " + step.from);
    const end = step.to
      ? lines.findIndex((s, i) => i > start && s.includes(step.to))
      : lines.length;
    assert.ok(end > start, file + " 缺少摘录终点 " + step.to);
    assert.ok(end - start <= 32, file + " 单段摘录太长");
    parts++;
  }
}
console.log(
  "PASS: 7 章目录与正文一致，" + parts + " 段代码摘录准确对应完整源码。",
);
