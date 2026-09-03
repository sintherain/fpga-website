import React from "react";
import { SectionHeader, H3, P, IC } from "../components/Section";
import Waveform from "../components/Waveform";
import CodeBlock from "../components/CodeBlock";
import I2cStepper from "../components/I2cStepper";

const i2cCode = `// I2C 起始条件与停止条件（SCL/SDA 均为开漏输出）
// 开漏的关键：输出 0 时拉低，输出 1 时释放总线（靠上拉电阻拉高）
assign scl = scl_oe ? 1'b0 : 1'bz;
assign sda = sda_oe ? 1'b0 : 1'bz;

// START：SCL 高电平期间，SDA 由高 → 低
task i2c_start;
    begin
        sda_oe <= 1'b0;   // 释放 SDA（上拉为高）
        scl_oe <= 1'b0;   // 释放 SCL
        #(T_HALF);
        sda_oe <= 1'b1;   // 拉低 SDA  ← 起始条件
        #(T_HALF);
        scl_oe <= 1'b1;   // 拉低 SCL，准备传第一位
    end
endtask

// STOP：SCL 高电平期间，SDA 由低 → 高
task i2c_stop;
    begin
        sda_oe <= 1'b1;   // 拉低 SDA
        #(T_HALF);
        scl_oe <= 1'b0;   // 释放 SCL
        #(T_HALF);
        sda_oe <= 1'b0;   // 释放 SDA（上拉为高）← 停止条件
    end
endtask`;

const I2cSection: React.FC = () => (
  <section id="i2c" className="section-anchor border-t border-border px-6 py-24 md:px-14">
    <SectionHeader
      index="04"
      en="I2C · INTER-INTEGRATED CIRCUIT"
      title="I2C：两根线挂一串设备"
      lead="I2C 只用 SCL、SDA 两根线，却能在总线上挂几十个设备——每个设备有自己的地址，主机按地址呼叫。EEPROM、温度传感器、RTC 时钟、加速度计都是典型的 I2C 器件。"
    />

    <H3>开漏输出 + 上拉电阻：I2C 的物理基础</H3>
    <P>
      I2C 的两根线都是<IC>开漏（open-drain）</IC>结构：任何设备都只能把线「拉低」或「放手」，
      线上的高电平靠外部上拉电阻提供。这带来两个重要特性：
      <strong className="text-[#d7dde4]">线与</strong>（任何设备拉低，全线就是低，不会短路打架）和
      <strong className="text-[#d7dde4]">应答机制</strong>（发送方第 9 拍放手，接收方拉低表示 ACK）。
      在 FPGA 里实现开漏，就是输出 <IC>1'bz</IC>（高阻）而不是 <IC>1'b1</IC>。
    </P>

    <H3>起始与停止条件</H3>
    <P>
      正常传输时 SDA 只在 SCL 低电平期间变化。反过来，
      <strong className="text-[#d7dde4]">SCL 高电平期间 SDA 发生变化</strong>就是特殊信号：
      下降沿是 START，上升沿是 STOP。所有从机都靠这两个条件来同步事务边界。
    </P>
    <Waveform
      channels={[
        {
          name: "SCL",
          color: "#fbbf24",
          segments: [
            { d: 1, v: 1 },
            { d: 1, v: 1 },
            { d: 1, v: 0 },
            { d: 1, v: 1 },
            { d: 1, v: 0 },
            { d: 1, v: 1 },
            { d: 1, v: 1 },
          ],
        },
        {
          name: "SDA",
          color: "#a78bfa",
          segments: [
            { d: 1, v: 1 },
            { d: 0.5, v: 1 },
            { d: 0.5, v: 0, label: "START" },
            { d: 1, v: 0 },
            { d: 1, v: 1 },
            { d: 1, v: 0 },
            { d: 0.5, v: 0 },
            { d: 0.5, v: 1, label: "STOP" },
            { d: 1, v: 1 },
          ],
        },
      ]}
      unit={64}
      grid={false}
      caption="图：START（SCL 高时 SDA 下降）与 STOP（SCL 高时 SDA 上升）"
    />

    <H3>一次完整的写事务</H3>
    <P>
      主机写一个字节到从机的完整流程：START → 7 位地址 + 写位 → 从机 ACK →
      8 位数据 → 从机 ACK → STOP。点击「下一步」逐段走一遍：
    </P>
    <I2cStepper />

    <H3>Verilog 实现要点</H3>
    <P>
      I2C 的状态机比 UART/SPI 复杂：除了收发数据，还要处理 ACK 检测、时钟拉伸
      （从机可以拉住 SCL 让主机等待）。下面是最核心的开漏输出和起止条件写法：
    </P>
    <CodeBlock title="i2c_start_stop.v（片段）" code={i2cCode} />

    <H3>I2C vs SPI</H3>
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-3 pr-4 font-normal">维度</th>
            <th className="py-3 pr-4 font-normal">I2C</th>
            <th className="py-3 font-normal">SPI</th>
          </tr>
        </thead>
        <tbody className="text-[#a8b0ba]">
          {[
            ["线数", "2（挂多设备不加线）", "4 + 每从机 1 根 CS"],
            ["寻址", "7/10 位地址，协议内呼叫", "硬件片选"],
            ["速率", "标准 100k / 快速 400k / 高速 3.4 Mbps", "轻松上 10 MHz+"],
            ["确认机制", "每字节 ACK/NACK", "无（靠器件自定义）"],
            ["双工", "半双工", "全双工"],
            ["典型器件", "EEPROM、传感器、RTC", "Flash、ADC、屏幕"],
          ].map((row) => (
            <tr key={row[0]} className="border-b border-border/60">
              <td className="py-3 pr-4 font-medium text-[#d7dde4]">{row[0]}</td>
              <td className="py-3 pr-4">{row[1]}</td>
              <td className="py-3">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default I2cSection;
