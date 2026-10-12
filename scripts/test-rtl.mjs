import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const temp = mkdtempSync(join(tmpdir(), "fpga-classroom-"));
const suites = {
  uart: ["uart_tx", "uart_tx_cnt", "uart_rx"],
  uart_rx: ["uart_rx"],
  spi: ["spi_master", "spi_slave"],
  fifo: ["sync_fifo"],
  i2c: ["i2c_start_stop"],
};
const compiler = process.env.IVERILOG ?? "iverilog";
const runtime = process.env.VVP ?? "vvp";
try {
  for (const [name, modules] of Object.entries(suites)) {
    const output = join(temp, name + ".vvp");
    const sources = modules.map((m) => resolve("src/content/rtl/" + m + ".v"));
    const build = spawnSync(
      compiler,
      [
        "-g2012",
        "-s",
        "tb",
        "-o",
        output,
        ...sources,
        resolve("tests/rtl/" + name + "_tb.v"),
      ],
      { encoding: "utf8" },
    );
    if (build.error)
      throw new Error(
        "需要 Icarus Verilog（iverilog / vvp）：" + build.error.message,
      );
    if (build.status !== 0) throw new Error(build.stderr || "RTL 编译失败");
    const run = spawnSync(runtime, [output], {
      encoding: "utf8",
      timeout: 30000,
    });
    if (run.error || run.status !== 0)
      throw new Error(run.stdout + "\n" + run.stderr);
    console.log(
      run.stdout
        .split("\n")
        .filter((line) => line.startsWith("PASS"))
        .join("\n"),
    );
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
