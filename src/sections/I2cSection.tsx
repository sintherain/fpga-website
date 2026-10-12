import React from "react";
import LearningDiagram from "../components/LearningDiagram";
import CodeWalkthrough from "../components/CodeWalkthrough";
import { i2cSteps } from "../content/walkthroughs";
import i2cCode from "../content/rtl/i2c_start_stop.v?raw";
import { SectionHeader, H3, P, IC, LD } from "../components/Section";
import Waveform from "../components/Waveform";
import I2cStepper from "../components/I2cStepper";

const I2cSection: React.FC = () => (
  <section id="i2c" className="chapter-content">
    <SectionHeader
      index="04"
      en="I2C · INTER-INTEGRATED CIRCUIT"
      title="I2C：两根线挂一串设备"
      lead="I2C 只用 SCL、SDA 两根线，却能在总线上挂几十个设备——每个设备有自己的地址，主机按地址呼叫。EEPROM、温度传感器、RTC 时钟、加速度计都是典型的 I2C 器件。"
    />

    <LearningDiagram type="i2c" />
    <H3>开漏输出 + 上拉电阻：I2C 的物理基础</H3>
    <P>
      <LD>I2C 用两根线：SCL（时钟）和 SDA（数据）。</LD>每根线都通过一个
      <IC>上拉电阻</IC>接到电源高电平。挂在总线上的每个设备，它的输出端都是
      <strong className="text-[#30382f]">开漏</strong>——设备只能做两个动作：
      把线<strong className="text-[#30382f]">接到地</strong>（拉低，输出
      0），或者
      <strong className="text-[#30382f]">断开</strong>
      （放手，让上拉电阻把线拉回高）。 设备
      <strong className="text-[#30382f]">没有办法主动输出高电平</strong>——
      高电平只能靠上拉电阻拉出来。
    </P>
    <P>
      <LD>于是两根线有这几个特点：</LD>第一，
      <strong className="text-[#30382f]">空闲时为高</strong>——
      没有设备拉低时，上拉电阻把线拉回高电平，这就是总线的空闲状态。第二，
      <strong className="text-[#30382f]">任一设备拉低，整根线就是低</strong>
      ——因为谁都能拉低、 谁也推不高，两个设备同时驱动也不会相冲，这叫
      <strong className="text-[#30382f]">线与</strong>。 第三，
      <strong className="text-[#30382f]">应答 ACK 就是"拉低"一下</strong>——第 9
      个时钟 发送方放手，被寻址的从机把 SDA 拉低，主机就确认"收到"。
    </P>
    <P>
      <LD>在 FPGA 里"放手"怎么写：</LD>把输出置为高阻 <IC>1'bz</IC>，而不是
      <IC>1'b1</IC>——让外部上拉电阻来决定这根线的电平。
    </P>

    <H3>起始与停止条件</H3>
    <P>
      正常传输时 SDA 只在 SCL 低电平期间变化。反过来，
      <strong className="text-[#30382f]">SCL 高电平期间 SDA 发生变化</strong>
      就是特殊信号： 下降沿是 START，上升沿是
      STOP。所有从机都靠这两个条件来同步事务边界。
    </P>
    <Waveform
      channels={[
        {
          name: "SCL",
          color: "#a16435",
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
          color: "#746087",
          segments: [
            { d: 1, v: 1 },
            { d: 0.5, v: 1 },
            { d: 0.5, v: 0, label: "START" },
            { d: 0.5, v: 0 },
            { d: 1.5, v: 1 },
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
      主机写一个字节到从机的完整流程：START → 7 位地址 + 写位 → 从机 ACK → 8
      位数据 → 从机 ACK → STOP。点击「下一步」逐段走一遍：
    </P>
    <I2cStepper />

    <H3>Verilog 实现要点</H3>
    <P>
      I2C 的状态机比 UART/SPI 复杂：除了收发数据，还要处理 ACK 检测、时钟拉伸
      （从机可以拉住 SCL 让主机等待）。下面是最核心的开漏输出和起止条件写法：
    </P>
    <P>
      下面只演示起止条件的可综合控制流程。tick
      是外部计数器给出的单周期节拍；SCL/SDA 的三态驱动应放在 FPGA 顶层
      I/O。完整事务还要实现地址、数据、ACK、异常超时与重复起始。
    </P>
    <CodeWalkthrough title="i2c_start_stop.v" code={i2cCode} steps={i2cSteps} />

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
        <tbody className="text-[#535b50]">
          {[
            ["线数", "2（挂多设备不加线）", "3 根共享信号 + 每从机 1 根 CS"],
            ["寻址", "7/10 位地址，协议内呼叫", "硬件片选"],
            ["速率", "标准 100k / 快速 400k / 高速 3.4 Mbps", "轻松上 10 MHz+"],
            ["确认机制", "每字节 ACK/NACK", "无（靠器件自定义）"],
            ["双工", "半双工", "全双工"],
            ["典型器件", "EEPROM、传感器、RTC", "Flash、ADC、屏幕"],
          ].map((row) => (
            <tr key={row[0]} className="border-b border-border/60">
              <td className="py-3 pr-4 font-medium text-[#30382f]">{row[0]}</td>
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
