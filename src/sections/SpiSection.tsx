import React from "react";
import CodeWalkthrough from "../components/CodeWalkthrough";
import { spiMasterSteps, spiSlaveSteps } from "../content/walkthroughs";
import spiSlaveCode from "../content/rtl/spi_slave.v?raw";
import spiCode from "../content/rtl/spi_master.v?raw";
import { SectionHeader, H3, H4, P, IC, LD } from "../components/Section";
import CodeBlock from "../components/CodeBlock";
import SpiExplorer from "../components/SpiExplorer";
import { SpiTopologyDiagram, SpiStartTimingDiagram } from "../components/SpiDiagrams";

// 从完整模块里截出「判断边沿」有关的片段，放在解释前面单独展示
const spiEdgeCode = `// 两段逻辑在同一 posedge clk、同一个 sck_tick 上执行
if (sck_tick) sck <= ~sck;

if (sck_tick) begin
    if (sck == 0)  // 读的是旧值：这一拍将产生上升沿
        rx_shift <= {rx_shift[6:0], miso};
    else           // 旧值为高：这一拍将产生下降沿
        mosi <= tx_shift[6];
end`;

// SPI 从机:与上方 spi_master 配套的实现(来自用户练习文件 spi_slave_practice.v)

const SpiSection: React.FC = () => (
  <section id="spi" className="chapter-content">
    <SectionHeader
      index="03"
      en="SPI · SERIAL PERIPHERAL INTERFACE"
      title="SPI：全双工的同步串行总线"
      lead="SPI 有一根专门的时钟线 SCK，数据跟着时钟走，所以不怕波特率误差，速率可以轻松跑到几十 MHz。Flash 芯片、ADC、OLED 屏几乎都是 SPI 接口。"
    />

    <H3>四根信号线</H3>
    <div className="my-6 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
      {[
        ["SCK", "时钟", "由主机产生，所有数据都踩着它的边沿传输"],
        ["MOSI", "主出从入", "主机发送数据的线（Master Out Slave In）"],
        ["MISO", "主入从出", "从机回传数据的线，与 MOSI 同时传输（全双工）"],
        ["CS / SS", "片选", "低电平有效。总线上挂多个从机时，每个从机一根 CS"],
      ].map(([n, c, d]) => (
        <div key={n} className="bg-[#f5f3ed] p-5">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[#a16435]">{n}</span>
            <span className="text-sm text-muted-foreground">{c}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#687060]">{d}</p>
        </div>
      ))}
    </div>

    <H3>主从连接：一主多从</H3>
    <SpiTopologyDiagram />
    <SpiStartTimingDiagram />
    <P>
      <LD>空闲时刻：</LD>没有传输时，CS0/CS1 全部为<IC>高</IC>
      （低有效，全部无效）；SCLK 停在
      <IC>空闲电平</IC>（由 CPOL 决定，CPOL=0 为低、CPOL=1 为高）；MOSI
      无严格定义（通常保持上一值）； MISO 为<IC>高阻</IC>——未被 CS
      选中的从机都释放总线。
    </P>
    <P>
      <LD>连接关系：</LD>SCLK 与 MOSI 由主机<IC>广播</IC>
      给所有从机（一根线分叉出去，各从机共用）； MISO 是<IC>共享总线</IC>
      ——同一时刻只有被 CS 选中的从机才驱动它，其余从机释放（高阻）。 CS 是
      <IC>逐从机</IC>的：挂 N 个从机就需要 N 根 CS，低电平有效，选中谁谁响应。
    </P>

    <H3>四种模式：CPOL 与 CPHA</H3>
    <P>
      SPI 协议本身不规定「在哪个时钟沿采样」，于是有了两个参数：
      <IC>CPOL</IC> 决定时钟空闲时是高还是低，<IC>CPHA</IC>{" "}
      决定在第一个沿还是第二个沿采样。 两两组合出 4 种模式。
      <strong className="text-[#30382f]">主从双方模式必须一致</strong>，
      读芯片手册时第一件事就是确认它要求哪种模式。切换下面的开关，直观感受四种模式的差别：
    </P>
    <SpiExplorer />

    <H3>Verilog 实现：模式 0 主机</H3>
    <P>
      <LD>模式 0 的要点：</LD>CS 拉低后、第一个上升沿<IC>之前</IC>就要把 MSB
      放到 MOSI 上； 之后每个下降沿换下一位。上升沿同时把 <IC>miso</IC>{" "}
      采进接收移位寄存器—— 8 位收满、片选拉高时从 <IC>rx_data</IC>{" "}
      读出从机数据。用 <IC>CLK_DIV</IC> 分频产生 SCK。
    </P>
    <CodeWalkthrough
      title="spi_master.v"
      code={spiCode}
      steps={spiMasterSteps}
    />

    <H4>上升沿 / 下降沿：是「预知」出来的，不是「检测」出来的</H4>
    <CodeBlock title="spi_master.v · 截取：判断边沿的两段" code={spiEdgeCode} />
    <P>
      <LD>为什么能这么写：</LD>主控块判断边沿只有一句 <IC>if(sck==0)</IC>，
      没有像 UART 接收那样打两拍去比较前后值。因为 SCK 不是外部送进来的信号，
      而是第 2 个 always 块自己翻转出来的——每次 <IC>sck_tick</IC> 到来就执行一次
      <IC>sck &lt;= ~sck</IC>。主控块与它触发在同一个 <IC>posedge clk</IC>
      、同一个
      <IC>sck_tick</IC> 上，而非阻塞赋值 <IC>&lt;=</IC>{" "}
      要到这个时钟沿的末尾才真正生效， 所以主控块里此刻读 <IC>sck</IC>
      ，读到的必然是<IC>翻转前</IC>的电平—— 两个 always 块谁先执行，结果都一样。
    </P>
    <P>
      于是判断变成一句话：
      <LD>翻转前 sck 为低，这一拍产生上升沿；翻转前为高，这一拍产生下降沿。</LD>
      逐个节拍走一遍（中间若干拍往复相同，只列首尾）：
    </P>
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-4 font-normal">节拍</th>
            <th className="py-2 pr-4 font-normal">翻转前 sck</th>
            <th className="py-2 pr-4 font-normal">这一拍产生的边沿</th>
            <th className="py-2 font-normal">主控块动作</th>
          </tr>
        </thead>
        <tbody className="text-[#535b50]">
          {[
            [
              "第 1 拍",
              "0",
              "上升沿",
              "从机采样 MOSI（D7 早已摆好）；主机把 MISO 采进 rx_shift（第 7 位）",
            ],
            [
              "第 2 拍",
              "1",
              "下降沿",
              "bit_cnt 0→1；tx_shift 左移，MOSI 摆上 D6",
            ],
            ["…", "…", "…", "第 3~14 拍往复：上升沿收一位，下降沿摆下一位"],
            ["第 15 拍", "0", "上升沿", "采样 MISO 第 0 位，8 位收齐"],
            [
              "第 16 拍",
              "1",
              "下降沿",
              "bit_cnt 已到 7：拉高 CS、rx_data 锁存、结束",
            ],
          ].map((row) => (
            <tr key={row[0]} className="border-b border-border/60">
              <td className="py-2 pr-4">{row[0]}</td>
              <td className="py-2 pr-4 font-mono text-[#43624f]">{row[1]}</td>
              <td className="py-2 pr-4">{row[2]}</td>
              <td className="py-2">{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <P>
      <LD>为什么 UART 接收要打拍、这里不用：</LD>UART 的 <IC>rx</IC>{" "}
      是外部异步信号， 你无法预知它何时翻转，只能先打两拍记下旧值、比较同步输出{" "}
      <IC>rx_d2</IC> 与其历史值 <IC>rx_d3</IC>
      事后判断边沿；而这里 SCK
      的翻转时机由本模块自己决定，等于「掐着表」知道下一拍是
      上升还是下降，看翻转前的电平就够了。反过来，如果以后写 SPI 从机 （SCK
      由外部主机送来），低速时可以用过采样检测；高速时通常在 SCK
      时钟域收发，再处理跨时钟域的数据交接。
    </P>
    <H3>Verilog 实现：模式 0 从机</H3>
    <P>
      <LD>从机是被动的一方：</LD>SCK、MOSI、CS_n 全是主机送进来的输入，只有
      <IC>miso</IC> 是它自己的输出。CS 拉低 = 一次通信开始，拉高 =
      结束——帧的长短
      由主机说了算。本例按每次片选传一个字节来解释；若一次片选传多个字节，应添加位计数与字节完成信号。
    </P>
    <P>
      <LD>和主机最大的差别：</LD>SCK
      是外部异步信号，没法像主机那样「预知」边沿， 只能像 UART
      接收那样先打两拍、再比较前后值去「检测」。检测到边沿后做的事和主机
      对齐：上升沿收 <IC>mosi</IC>（MSB 先收），下降沿把 <IC>miso</IC>{" "}
      下一位摆出去 （MSB 先发），CS 拉高时把收满的字节交给 <IC>rx_data</IC>。
    </P>
    <P>
      这个从机采用本地时钟过采样，只用于低速单字节教学。建议 clk 至少为 SCK 的 8
      倍，并给片选前后留足系统时钟周期；高速设计须按器件与板级时序改用 SCK
      域收发及 CDC。
    </P>
    <CodeWalkthrough
      title="spi_slave.v"
      code={spiSlaveCode}
      steps={spiSlaveSteps}
    />
  </section>
);

export default SpiSection;
