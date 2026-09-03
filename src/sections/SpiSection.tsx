import React from "react";
import { SectionHeader, H3, H4, P, IC, LD } from "../components/Section";
import CodeBlock from "../components/CodeBlock";
import SpiExplorer from "../components/SpiExplorer";

const spiCode = `// SPI 主机(模式 0):CPOL=0, CPHA=0;MSB 先发;全双工
module spi_master #(
    parameter CLK_DIV = 4        // SCK = clk / (2*CLK_DIV)
)(
    input  wire       clk,
    input  wire       rst_n,
    input  wire [7:0] data,      // 待发送字节
    input  wire       start,
    // —— 四条 SPI 线 ——
    output reg        sck,       // 时钟
    output reg        mosi,      // 主出从入
    input  wire       miso,      // 主入从出
    output reg        cs_n,      // 片选(低有效)
    // 收的字节(由 miso 采得)
    output reg  [7:0] rx_data
);

    reg [7:0]  tx_shift;         // 发送移位寄存器
    reg [7:0]  rx_shift;         // 接收移位寄存器
    reg [3:0]  bit_cnt;
    reg [15:0] div_cnt;          // 分频计数器
    reg        active;
    /*注意，通常输入主机的start信号只是一个脉冲信号，不能作为div_cnt、bit_cnt等运行的使能信号*/

    // —— 1. 分频计数:div_cnt 每 CLK_DIV 个时钟走完一圈 ——
    always @(posedge clk or negedge rst_n) begin
        // TODO(1) 复位清零;active 时数到 CLK_DIV-1 回绕,否则 +1;空闲归零
        if(!rst_n)
            div_cnt <= 16'd0;
        else if(active==1)begin
            if(div_cnt==CLK_DIV-1)
                div_cnt <= 16'd0;
            else 
                div_cnt <= div_cnt + 1'b1;
        end
    end

    // 一圈走满的「节拍」脉冲(组合逻辑,已给出)
    wire sck_tick = active && (div_cnt == CLK_DIV-1);   /*这是一种常见写法，用于某个计数器计满瞬间产生控制信号*/

    // —— 2. SCK 生成:每个节拍翻转一次 ——
    always @(posedge clk or negedge rst_n) begin
        // TODO(2) 复位 sck=0;否则 sck_tick 时翻转 sck<=~sck
        if(!rst_n)
            sck <= 1'b0;
        else if(sck_tick)
            sck <= ~sck;
    end

    // —— 3. 主控:启动、位序号、收发移位 ——
    always @(posedge clk or negedge rst_n) begin
        // TODO(3) 复位:cs_n/mosi/active/bit_cnt/tx_shift/rx_shift/rx_data 清零
        if(!rst_n)begin
            cs_n <= 1'b1;
            mosi <= 1'b0;
            active <= 1'b0;
            bit_cnt <= 4'd0;
            tx_shift <= 8'd0;
            rx_shift <= 8'd0;
            rx_data <= 8'd0;
        end else if(start && active==0)begin    // TODO(4) start 且空闲 → active=1;cs_n=0;tx_shift<=data;mosi<=data[7];bit_cnt=0
            active <= 1'b1;
            cs_n <=  1'b0;
            tx_shift <= data;
            mosi <= data[7];
            bit_cnt <= 4'd0;
        end else if(active==1)begin   
        // TODO(5) active 且 sck_tick:
        // sck==0(上升沿)→ rx_shift <= {rx_shift[6:0], miso}
        // sck==1(下降沿)→ bit_cnt==7 则收工(cs_n=1;rx_data<=rx_shift);
        // 否则 bit_cnt+1;tx_shift 左移;mosi<=tx_shift[6]
            if(sck_tick)begin
                //发送逻辑
                if(sck==0)  //上升沿，应该接收从机发送的数据
                    rx_shift <= {rx_shift[6:0],miso};
                else if(sck==1)begin  //下降沿，应该更新发送的数据
                    if(bit_cnt==4'd7)begin   //发送满想要发送的8位数据，收工
                        cs_n <= 1'b1;
                        rx_data <= rx_shift;
                        active <= 1'b0;
                        bit_cnt <= 4'd0;
                    end else begin //移位，并更新主机发送数据
                        bit_cnt <= bit_cnt + 1'b1;
                        mosi <= tx_shift[6];
                        tx_shift <= {tx_shift[6:0],1'b0};
                    end
                end

                //接收逻辑
                
            end
        end
    end

endmodule`;

// 从完整模块里截出「判断边沿」有关的片段，放在解释前面单独展示
const spiEdgeCode = `// —— 摘自上方的 spi_master.v，只留与「判断边沿」有关的两段 ——

// ① SCK 生成块：SCK 是本模块自己翻转的，每个 sck_tick 翻一次
//    sck_tick = active && (div_cnt == CLK_DIV-1)：分频器走满一圈的节拍脉冲
always @(posedge clk or negedge rst_n) begin
    if(!rst_n)
        sck <= 1'b0;
    else if(sck_tick)
        sck <= ~sck;
end

// ② 主控块里判断边沿的部分（复位/启动分支省略）：
//    sck_tick = active && 计满，本身已含 active 门控；与 ① 触发在同一个 sck_tick
//    这一拍读 sck —— ① 的翻转要到时钟沿末尾才生效，读到的必然是翻转前的电平
if(sck_tick)begin
    if(sck==0)  //上升沿，应该接收从机发送的数据
        rx_shift <= {rx_shift[6:0],miso};
    else if(sck==1)begin  //下降沿，应该更新发送的数据
        if(bit_cnt==4'd7)begin   //发送满想要发送的8位数据，收工
            cs_n <= 1'b1;
            rx_data <= rx_shift;
            active <= 1'b0;
            bit_cnt <= 4'd0;
        end else begin //移位，并更新主机发送数据
            bit_cnt <= bit_cnt + 1'b1;
            mosi <= tx_shift[6];
            tx_shift <= {tx_shift[6:0],1'b0};
        end
    end
end`;

// SPI 从机:与上方 spi_master 配套的实现(来自用户练习文件 spi_slave_practice.v)
const spiSlaveCode = `// SPI 从机(模式 0):CPOL=0, CPHA=0;MSB 先发;全双工
// SCK/MOSI/CS_n 由主机送来,MISO 由从机驱动;帧由 CS 决定,无需 bit_cnt
module spi_slave (
    input  wire       clk,       // 从机本地时钟
    input  wire       rst_n,
    // —— 四条 SPI 线(从机方向) ——
    input  wire       sck,       // 时钟(主机送来)
    input  wire       mosi,      // 主出从入
    output reg        miso,      // 主入从出
    input  wire       cs_n,      // 片选(低有效,主机送来)
    // 要发给主机的字节 + 收到主机的字节
    input  wire [7:0] tx_data,
    output reg  [7:0] rx_data
);

    // SCK/CS_n 来自主机,和本地 clk 不同源,先打两拍同步,再检测边沿
    reg sck_d1, sck_d2;
    reg cs_d1, cs_d2;
    always @(posedge clk or negedge rst_n) begin
        if(!rst_n) begin
            sck_d1 <= 1'b0;
            sck_d2 <= 1'b0;
            cs_d1  <= 1'b1;   // CS 空闲为高
            cs_d2  <= 1'b1;
        end else begin
            sck_d1 <= sck;
            sck_d2 <= sck_d1;
            cs_d1  <= cs_n;
            cs_d2  <= cs_d1;
        end
    end

    wire sck_fall = sck_d2 & ~sck_d1;   // 同步后的下降沿
    wire sck_rise = ~sck_d2 & sck_d1;   // 同步后的上升沿
    wire start    = cs_d2 & ~cs_d1;     // CS 拉低 = 主机开始一次通信
    wire done     = ~cs_d2 & cs_d1;     // CS 拉高 = 本次通信结束

    reg [7:0] tx_shift;                 // 发送移位寄存器
    reg [7:0] rx_shift;                 // 接收移位寄存器

    // —— 主控:CS 选通 + SCK 边沿驱动收发(帧由 CS 决定,无需位计数) ——
    always @(posedge clk or negedge rst_n) begin
        if(!rst_n) begin
            // TODO(1) 复位:tx_shift/rx_shift/rx_data 清 0,miso 置 0
            tx_shift <= 8'd0;
            rx_shift <= 8'd0;
            rx_data <= 8'd0;
            miso <= 1'b0;
        end else begin

            if(start) begin
            // TODO(2) CS 拉低:装载要发的字节并先摆出最高位
            // tx_shift<=tx_data; miso<=tx_data[7]; rx_shift=0
            tx_shift <= tx_data;
            miso <= tx_data[7];
            rx_shift <= 8'd0;
        end else if(sck_rise) begin
            // TODO(3) 上升沿:采样主机送来的 MOSI(MSB 先收)
            // rx_shift <= {rx_shift[6:0], mosi}
            rx_shift <= {rx_shift[6:0],mosi};
        end else if(done) begin
            // TODO(5) CS 拉高:把收好的字节交给 rx_data
            // rx_data <= rx_shift
            rx_data <= rx_shift;
        end else if(sck_fall) begin
            // TODO(4) 下降沿:移位发送并更新 miso(MSB 先发)
            // miso<=tx_shift[6]; tx_shift<={tx_shift[6:0],1'b0}
            miso <= tx_shift[6];
            tx_shift <= {tx_shift[6:0],1'b0};
        end

        end
    end

endmodule`;

/** SPI 一主多从连接示意图（SVG 手绘） */
const SpiDiagram: React.FC = () => (
  <figure className="my-8">
    <div className="overflow-x-auto rounded-md border border-border bg-[#0b0e13] p-6">
      <svg
        viewBox="0 0 640 440"
        className="mx-auto block min-w-[560px] max-w-2xl"
        role="img"
        aria-label="SPI 一主多从连接示意"
      >
        {/* 主机 */}
        <rect x="20" y="120" width="140" height="100" rx="6" fill="#10151d" stroke="#2a3442" />
        <text x="90" y="166" textAnchor="middle" fill="#e6eaef" fontSize="15" fontWeight="600">主机</text>
        <text x="90" y="184" textAnchor="middle" fill="#7c8794" fontSize="11" fontFamily="monospace">MASTER</text>
        {/* 从机 0 */}
        <rect x="480" y="28" width="140" height="92" rx="6" fill="#10151d" stroke="#2a3442" />
        <text x="550" y="72" textAnchor="middle" fill="#e6eaef" fontSize="15" fontWeight="600">从机 0</text>
        <text x="550" y="90" textAnchor="middle" fill="#7c8794" fontSize="11" fontFamily="monospace">SLAVE 0</text>
        {/* 从机 1 */}
        <rect x="480" y="200" width="140" height="92" rx="6" fill="#10151d" stroke="#2a3442" />
        <text x="550" y="244" textAnchor="middle" fill="#e6eaef" fontSize="15" fontWeight="600">从机 1</text>
        <text x="550" y="262" textAnchor="middle" fill="#7c8794" fontSize="11" fontFamily="monospace">SLAVE 1</text>
        {/* 信号线 */}
        <g strokeWidth="1.6" fill="none">
          <path d="M160,150 H350 V60 H480" stroke="#fbbf24" />
          <path d="M350,150 V232 H480" stroke="#fbbf24" />
          <path d="M160,166 H360 V76 H480" stroke="#22d3ee" />
          <path d="M360,166 V248 H480" stroke="#22d3ee" />
          <path d="M480,92 H368 V182 H160" stroke="#34d399" />
          <path d="M480,264 H368 V182" stroke="#34d399" />
          <path d="M160,198 H312 V44 H480" stroke="#fb7185" />
          <path d="M160,214 H480" stroke="#a78bfa" />
        </g>
        {/* 箭头:进入从机(→)与进入主机(←) */}
        <g>
          <polygon points="472,56 484,60 472,64" fill="#fbbf24" />
          <polygon points="472,228 484,232 472,236" fill="#fbbf24" />
          <polygon points="472,72 484,76 472,80" fill="#22d3ee" />
          <polygon points="472,244 484,248 472,252" fill="#22d3ee" />
          <polygon points="168,178 156,182 168,186" fill="#34d399" />
          <polygon points="472,40 484,44 472,48" fill="#fb7185" />
          <polygon points="472,210 484,214 472,218" fill="#a78bfa" />
        </g>
        {/* 信号名 */}
        <g fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="11">
          <text x="252" y="142" fill="#fbbf24">SCLK</text>
          <text x="252" y="158" fill="#22d3ee">MOSI</text>
          <text x="252" y="174" fill="#34d399">MISO</text>
          <text x="240" y="190" fill="#fb7185">CS0</text>
          <text x="240" y="206" fill="#a78bfa">CS1</text>
        </g>
        {/* 空闲时刻状态标注 */}
        <line x1="40" y1="308" x2="600" y2="308" stroke="#2a3442" strokeWidth="1" strokeDasharray="3 3" />
        <text x="320" y="326" textAnchor="middle" fill="#7c8794" fontSize="11" fontFamily="JetBrains Mono, ui-monospace, monospace">
          空闲时刻：CS0/CS1 = 高（无效） · SCLK 电平由 CPOL 决定 · MOSI 保持/任意 · MISO 高阻
        </text>
        {/* 时序注记：采样发生在时钟沿，不是 CS 拉低瞬间 */}
        <line x1="40" y1="340" x2="600" y2="340" stroke="#2a3442" strokeWidth="1" strokeDasharray="3 3" />
        <text x="40" y="356" fill="#7c8794" fontSize="11" fontFamily="JetBrains Mono, ui-monospace, monospace">
          时序：CS 拉低后先经过 t_lead，第一个时钟沿（上升沿）才采样——采样点在时钟沿，不在 CS 沿
        </text>
        {/* CS 波形：空闲高 → 拉低（选中） */}
        <text x="58" y="378" textAnchor="end" fill="#fb7185" fontSize="11" fontFamily="JetBrains Mono, ui-monospace, monospace">CS</text>
        <polyline points="40,366 140,366 140,386 600,386" fill="none" stroke="#fb7185" strokeWidth="1.6" />
        {/* SCK 波形：空闲低 → 经过 t_lead 后出现第一个上升沿 */}
        <text x="58" y="422" textAnchor="end" fill="#fbbf24" fontSize="11" fontFamily="JetBrains Mono, ui-monospace, monospace">SCK</text>
        <polyline points="40,430 260,430 260,410 300,410 300,430 340,430 340,410 380,410 380,430 420,430 420,410 460,410 460,430 500,430 500,410 540,410 540,430 600,430" fill="none" stroke="#fbbf24" strokeWidth="1.6" />
        {/* t_lead 箭头：CS 拉低 → 首个时钟沿 */}
        <line x1="140" y1="398" x2="256" y2="398" stroke="#94a3b8" strokeWidth="1.2" />
        <polygon points="260,398 250,394 250,402" fill="#94a3b8" />
        <text x="200" y="393" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono, ui-monospace, monospace">t_lead</text>
        {/* 首个采样沿标记 */}
        <circle cx="260" cy="410" r="3.5" fill="#34d399" />
        <line x1="260" y1="410" x2="260" y2="398" stroke="#34d399" strokeWidth="1.2" />
        <text x="288" y="396" fill="#34d399" fontSize="11" fontFamily="JetBrains Mono, ui-monospace, monospace">首个采样沿（上升沿）</text>
      </svg>
    </div>
    <figcaption className="mt-2 text-center text-[13px] text-muted-foreground">
      图：SPI 一主多从连接——SCLK / MOSI 由主机广播给所有从机，MISO 是共享总线（只有被 CS 选中的从机才驱动），CS 一根线选中一个从机
    </figcaption>
  </figure>
);

const SpiSection: React.FC = () => (
  <section id="spi" className="section-anchor border-t border-border px-6 py-24 md:px-14">
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
        <div key={n} className="bg-[#0a0d12] p-5">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[#fbbf24]">{n}</span>
            <span className="text-sm text-muted-foreground">{c}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#8d97a3]">{d}</p>
        </div>
      ))}
    </div>

    <H3>主从连接：一主多从</H3>
    <SpiDiagram />
    <P>
      <LD>空闲时刻：</LD>没有传输时，CS0/CS1 全部为<IC>高</IC>（低有效，全部无效）；SCLK 停在
      <IC>空闲电平</IC>（由 CPOL 决定，CPOL=0 为低、CPOL=1 为高）；MOSI 无严格定义（通常保持上一值）；
      MISO 为<IC>高阻</IC>——未被 CS 选中的从机都释放总线。
    </P>
    <P>
      <LD>连接关系：</LD>SCLK 与 MOSI 由主机<IC>广播</IC>给所有从机（一根线分叉出去，各从机共用）；
      MISO 是<IC>共享总线</IC>——同一时刻只有被 CS 选中的从机才驱动它，其余从机释放（高阻）。
      CS 是<IC>逐从机</IC>的：挂 N 个从机就需要 N 根 CS，低电平有效，选中谁谁响应。
    </P>

    <H3>四种模式：CPOL 与 CPHA</H3>
    <P>
      SPI 协议本身不规定「在哪个时钟沿采样」，于是有了两个参数：
      <IC>CPOL</IC> 决定时钟空闲时是高还是低，<IC>CPHA</IC> 决定在第一个沿还是第二个沿采样。
      两两组合出 4 种模式。<strong className="text-[#d7dde4]">主从双方模式必须一致</strong>，
      读芯片手册时第一件事就是确认它要求哪种模式。切换下面的开关，直观感受四种模式的差别：
    </P>
    <SpiExplorer />

    <H3>Verilog 实现：模式 0 主机</H3>
    <P>
      <LD>模式 0 的要点：</LD>CS 拉低后、第一个上升沿<IC>之前</IC>就要把 MSB 放到 MOSI 上；
      之后每个下降沿换下一位。上升沿同时把 <IC>miso</IC> 采进接收移位寄存器——
      8 位收满、片选拉高时从 <IC>rx_data</IC> 读出从机数据。用 <IC>CLK_DIV</IC> 分频产生 SCK。
    </P>
    <CodeBlock title="spi_master.v" code={spiCode} />

    <H4>上升沿 / 下降沿：是「预知」出来的，不是「检测」出来的</H4>
    <CodeBlock title="spi_master.v · 截取：判断边沿的两段" code={spiEdgeCode} />
    <P>
      <LD>为什么能这么写：</LD>主控块判断边沿只有一句 <IC>if(sck==0)</IC>，
      没有像 UART 接收那样打两拍去比较前后值。因为 SCK 不是外部送进来的信号，
      而是第 2 个 always 块自己翻转出来的——每次 <IC>sck_tick</IC> 到来就执行一次
      <IC>sck &lt;= ~sck</IC>。主控块与它触发在同一个 <IC>posedge clk</IC>、同一个
      <IC>sck_tick</IC> 上，而非阻塞赋值 <IC>&lt;=</IC> 要到这个时钟沿的末尾才真正生效，
      所以主控块里此刻读 <IC>sck</IC>，读到的必然是<IC>翻转前</IC>的电平——
      两个 always 块谁先执行，结果都一样。
    </P>
    <P>
      于是判断变成一句话：<LD>翻转前 sck 为低，这一拍产生上升沿；翻转前为高，这一拍产生下降沿。</LD>
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
        <tbody className="text-[#a8b0ba]">
          {[
            ["第 1 拍", "0", "上升沿", "从机采样 MOSI（D7 早已摆好）；主机把 MISO 采进 rx_shift（第 7 位）"],
            ["第 2 拍", "1", "下降沿", "bit_cnt 0→1；tx_shift 左移，MOSI 摆上 D6"],
            ["…", "…", "…", "第 3~14 拍往复：上升沿收一位，下降沿摆下一位"],
            ["第 15 拍", "0", "上升沿", "采样 MISO 第 0 位，8 位收齐"],
            ["第 16 拍", "1", "下降沿", "bit_cnt 已到 7：拉高 CS、rx_data 锁存、结束"],
          ].map((row) => (
            <tr key={row[0]} className="border-b border-border/60">
              <td className="py-2 pr-4">{row[0]}</td>
              <td className="py-2 pr-4 font-mono text-[#22d3ee]">{row[1]}</td>
              <td className="py-2 pr-4">{row[2]}</td>
              <td className="py-2">{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <P>
      <LD>为什么 UART 接收要打拍、这里不用：</LD>UART 的 <IC>rx</IC> 是外部异步信号，
      你无法预知它何时翻转，只能先打两拍记下旧值、比较 <IC>rx_d1</IC> 与 <IC>rx_d2</IC>
      事后判断边沿；而这里 SCK 的翻转时机由本模块自己决定，等于「掐着表」知道下一拍是
      上升还是下降，看翻转前的电平就够了。反过来，如果以后写 SPI 从机
      （SCK 由外部主机送来），就得用回打拍检测那一套。
    </P>
    <H3>Verilog 实现：模式 0 从机</H3>
    <P>
      <LD>从机是被动的一方：</LD>SCK、MOSI、CS_n 全是主机送进来的输入，只有
      <IC>miso</IC> 是它自己的输出。CS 拉低 = 一次通信开始，拉高 = 结束——帧的长短
      由主机说了算，所以从机不像主机那样需要 bit_cnt 去数位。
    </P>
    <P>
      <LD>和主机最大的差别：</LD>SCK 是外部异步信号，没法像主机那样「预知」边沿，
      只能像 UART 接收那样先打两拍、再比较前后值去「检测」。检测到边沿后做的事和主机
      对齐：上升沿收 <IC>mosi</IC>（MSB 先收），下降沿把 <IC>miso</IC> 下一位摆出去
      （MSB 先发），CS 拉高时把收满的字节交给 <IC>rx_data</IC>。
    </P>
    <CodeBlock title="spi_slave.v" code={spiSlaveCode} />
  </section>
);

export default SpiSection;
