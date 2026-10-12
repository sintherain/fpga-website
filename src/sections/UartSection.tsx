import React from "react";
import LearningDiagram from "../components/LearningDiagram";
import CodeWalkthrough from "../components/CodeWalkthrough";
import {
  uartTxSteps,
  uartCounterSteps,
  uartRxSteps,
} from "../content/walkthroughs";
import extRxCode from "../content/rtl/uart_rx.v?raw";
import uartTxCntCode from "../content/rtl/uart_tx_cnt.v?raw";
import uartTxCode from "../content/rtl/uart_tx.v?raw";
import { SectionHeader, H3, H4, Lead, P, IC, LD } from "../components/Section";
import Waveform, { type WaveSegment } from "../components/Waveform";
import CodeBlock from "../components/CodeBlock";
import UartSimulator from "../components/UartSimulator";

const extParityCode = `// 偶校验：校验位 = 8 位数据逐位异或（Verilog 缩减运算 ^）
wire parity = ^register;

case (counter2)
    4'd8:  tx <= register[7];
    4'd9:  tx <= parity;     // 新增：校验位
    4'd10: tx <= 1'b1;       // 停止位顺延
    default: tx <= tx;
endcase
// 回绕条件同步改为 counter2 == 4'd10`;

const extParityFsmCode = `// 在发送器中增加 parity_bit，复位时清零
reg parity_bit;

// 接受新字节的同一拍，保存原始数据的校验位
if (state == IDLE && start)
    parity_bit <= ^data;  // 偶校验；奇校验用 ~^data

// DATA 位计时结束且 bit_cnt == 7：转入 PARITY
// 此处先不输出停止位；tx 改为 parity_bit，保持一个位周期
PARITY: begin
    if (baud_cnt == BAUD_DIV - 1) begin
        baud_cnt <= 0;
        tx <= 1'b1;
        state <= STOP;
    end else baud_cnt <= baud_cnt + 1'b1;
end
// 状态位宽改为 3 位，并添加 PARITY 状态定义`;

const extParamCode = `parameter DATA_BITS = 8;    // 数据位个数
parameter STOP_BITS = 1;    // 停止位个数
parameter PARITY_EN = 0;    // 1 = 带校验

// 整帧位数：起始 1 + 数据 + 校验 + 停止
localparam BIT_LAST = 1 + DATA_BITS + PARITY_EN + STOP_BITS - 1;

if (counter2 == BIT_LAST) counter2 <= 4'd0;   // 回绕值参数化`;

const extFifoCode = `// 对本书的寄存读 FIFO，发送器空闲且 FIFO 非空时：
REQUEST: begin
    fifo_rd <= 1'b1;  // 下一拍 FIFO 接受读请求
    state <= WAIT_DATA;
end
WAIT_DATA: begin
    fifo_rd <= 1'b0;  // 此沿 FIFO 更新 rd_data
    state <= LOAD;
end
LOAD: begin
    register <= fifo_rdata;  // 此时才读取已经更新的数据
    state <= TRANSMIT;
end
// 这里是控制流程片段；接入 uart_tx 时，LOAD 后再拉 start`;

const extDoneCode = `wire w_Tx_done = (counter2 == 4'd9) && (counter0 == BAUD_DIV - 1);

reg Tx_done;
always @(posedge clk or negedge rst_n)
    if (!rst_n) Tx_done <= 1'b0;
    else Tx_done <= w_Tx_done;   // 打一拍，输出一个时钟周期的脉冲`;

// —— RX 波形：接收 0x5A（LSB 先收）——
const rxFrameSegments: WaveSegment[] = [
  { d: 1, v: 1, label: "空闲" },
  { d: 1, v: 0, label: "起始" },
  { d: 1, v: 0, label: "D0" },
  { d: 1, v: 1, label: "D1" },
  { d: 1, v: 0, label: "D2" },
  { d: 1, v: 1, label: "D3" },
  { d: 1, v: 1, label: "D4" },
  { d: 1, v: 0, label: "D5" },
  { d: 1, v: 1, label: "D6" },
  { d: 1, v: 0, label: "D7" },
  { d: 1, v: 1, label: "停止" },
  { d: 1, v: 1, label: "空闲" },
];

// 采样点脉冲：每位位中点的采样时刻（起始 1.5、D0 2.5 …… 停止 10.5）
const rxSampleSegments: WaveSegment[] = (() => {
  const segs: WaveSegment[] = [];
  const mids = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5];
  let pos = 0;
  for (const m of mids) {
    if (m - 0.125 > pos) segs.push({ d: m - 0.125 - pos, v: 0 });
    segs.push({ d: 0.25, v: 1 });
    pos = m + 0.125;
  }
  if (12 - pos > 0) segs.push({ d: 12 - pos, v: 0 });
  return segs;
})();

const UartSection: React.FC = () => (
  <section id="uart" className="chapter-content">
    <SectionHeader
      index="02"
      en="UART · UNIVERSAL ASYNCHRONOUS RECEIVER / TRANSMITTER"
      title="UART：最简单的异步串口"
      lead="UART 只有 TX、RX 两根线，没有时钟线——收发双方事先约定好波特率，各自数着自己的时钟采样数据。它是 FPGA 与电脑通信（打印调试信息）最常用的接口。"
    />

    <LearningDiagram type="uart" />
    <H3>一帧数据长什么样？</H3>
    <P>
      线空闲时为<IC>高电平</IC>。发送方先把线拉低 1 位时间（起始位），
      然后按「低位先行（LSB first）」依次发出 5~9 个数据位（最常用 8 位）， 可选
      1 位奇偶校验，最后用至少 1 位高电平（停止位）结束一帧。
    </P>

    <Waveform
      channels={[
        {
          name: "TX",
          color: "#43624f",
          segments: [
            { d: 1, v: 1, label: "空闲" },
            { d: 1, v: 0, label: "起始" },
            { d: 1, v: 1, label: "D0" },
            { d: 1, v: 0, label: "D1" },
            { d: 1, v: 1, label: "D2" },
            { d: 1, v: 0, label: "D3" },
            { d: 1, v: 1, label: "D4" },
            { d: 1, v: 0, label: "D5" },
            { d: 1, v: 1, label: "D6" },
            { d: 1, v: 0, label: "D7" },
            { d: 1, v: 1, label: "停止" },
            { d: 1, v: 1, label: "空闲" },
          ],
        },
      ]}
      unit={52}
      caption="图：UART 帧结构示意（8N1 格式：8 数据位、无校验、1 停止位）"
    />

    <H3>动手试试：发送一个字节</H3>
    <P>
      修改十六进制字节，观察每一位如何映射到波形上；切换波特率，看位周期如何变化。
      接收方就是在每一位的<IC>中点</IC>
      采样电平——这也是为什么双方波特率误差不能太大。
    </P>
    <UartSimulator />

    <H3>核心功能的实现</H3>
    <H4>Verilog 实现（1/2）：状态机 + 波特率计数器</H4>
    <P>
      <LD>核心思路：</LD>
      <IC>BAUD_DIV = 时钟频率 ÷ 波特率</IC>
      ，数满一个位周期的时钟数就推进状态机。 四个状态 IDLE → START → DATA → STOP
      正好对应波形的四个阶段。
    </P>
    <P>
      发送数据靠的是一个<IC>移位寄存器 shift</IC>：进入 DATA
      后每个位周期右移一位， 起始位结束时先送出 <IC>shift[0]</IC>
      ，之后在位边界送出下一位——LSB 先发的 8 个数据位就这样一位一位送出去。
      代码里还有两个计数器，各管一件事：
    </P>
    <div className="my-6 space-y-px overflow-hidden rounded-md border border-border">
      {[
        [
          "shift",
          "移位寄存器",
          "装载待发字节；每结束一位右移一位，shift[0] 是当前位；换位时读旧 shift[1] 并右移",
        ],
        [
          "baud_cnt",
          "位内节拍器",
          "每一位内部从 0 数到 BAUD_DIV-1，数满 = 这一位结束（管「一位多久」）",
        ],
        [
          "bit_cnt",
          "位序号",
          "只在 DATA 状态里、只在一位数满时 +1，数已发送的数据位（0~7）；发满 8 位就清零进 STOP（管「发到第几位」）",
        ],
      ].map(([n, c, d]) => (
        <div key={n} className="bg-[#f5f3ed] p-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[#43624f]">{n}</span>
            <span className="text-sm text-muted-foreground">{c}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-[#687060]">{d}</p>
        </div>
      ))}
    </div>
    <P>
      bit_cnt 的计数节奏——它只在 DATA 状态里出现，且只在「一位数满」的那一拍
      +1， 所以它的值恰好等于当前正在发送的数据位下标：
    </P>
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-4 font-normal">位周期</th>
            <th className="py-2 pr-4 font-normal">bit_cnt 的值</th>
            <th className="py-2 font-normal">正在发送的位</th>
          </tr>
        </thead>
        <tbody className="text-[#535b50]">
          {[
            ["第 1 位", "0", "D0（shift[0]）"],
            ["第 2 位", "1", "D1"],
            ["…", "…", "…"],
            ["第 8 位", "7", "D7"],
            ["第 8 位结束", "判断到 7", "→ 进 STOP"],
          ].map((row) => (
            <tr key={row[0]} className="border-b border-border/60">
              <td className="py-2 pr-4">{row[0]}</td>
              <td className="py-2 pr-4 font-mono text-[#43624f]">{row[1]}</td>
              <td className="py-2">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <P>
      它和 shift 在同一拍（baud_cnt 数满时）联动：shift 右移一位，同时 tx 取旧
      shift[1] 输出下一位， bit_cnt 同步 +1 记「这是第几位」。baud_cnt
      每位数完都会清零重数，记不住总共发了多少位，
      所以「发到第几位」这份账只能由 bit_cnt 来记。
    </P>
    <P>
      START 和 STOP 各只占一个位周期，只需要 baud_cnt 计时；只有 DATA 要连续发 8
      位， 才需要 bit_cnt 记住「发到第几位」，数到 7 就收工进 STOP。
    </P>
    <CodeWalkthrough title="uart_tx.v" code={uartTxCode} steps={uartTxSteps} />

    <H4>Verilog 实现（2/2）：计数器译码</H4>
    <Lead>
      本小节给出同一功能的另一种等价实现——计数器译码：不用状态机， 而是用{" "}
      <IC>counter2</IC>（0~9）直接编码「发到第几位」——0=起始位、 1~8=数据位（LSB
      先发）、9=停止位，<IC>tx</IC> 通过 case 按位查表输出； 波特率仍由{" "}
      <IC>counter0</IC> 节拍器控制。两种实现都输出相同的 8N1 帧，但寄存输出与
      busy 的边界关系需要分别验证， 区别只在「用状态跳转表达流程」还是「用数值 +
      查表表达状态」。
    </Lead>
    <div className="my-6 space-y-px overflow-hidden rounded-md border border-border">
      {[
        [
          "register",
          "数据锁存",
          "start 到来时把 data 存入，防止发送中途数据变化",
        ],
        [
          "counter0",
          "位内节拍器",
          "每一位内部从 0 数到 BAUD_DIV - 1，数满 = 这一位结束（管「一位多久」）",
        ],
        [
          "counter2",
          "位序号",
          "每一位结束 +1，0~9 循环：0=起始，1~8=数据，9=停止（管「发到第几位」）",
        ],
        [
          "en",
          "计数使能",
          "start 拉高开始、停止位最后一拍自动关闭；同时作为 busy 输出",
        ],
      ].map(([n, c, d]) => (
        <div key={n} className="bg-[#f5f3ed] p-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[#43624f]">{n}</span>
            <span className="text-sm text-muted-foreground">{c}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-[#687060]">{d}</p>
        </div>
      ))}
    </div>
    <CodeWalkthrough
      title="uart_tx_cnt.v"
      code={uartTxCntCode}
      steps={uartCounterSteps}
    />
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-3 pr-4 font-normal">对比项</th>
            <th className="py-3 pr-4 font-normal">实现 1 · 状态机</th>
            <th className="py-3 font-normal">实现 2 · 计数器译码</th>
          </tr>
        </thead>
        <tbody className="text-[#535b50]">
          {[
            [
              "状态表达",
              "state：IDLE / START / DATA / STOP",
              "counter2：0~9 直接编码位数",
            ],
            ["输出方式", "每个状态分别驱动 tx", "case(counter2) 按位查表"],
            [
              "空闲时 tx",
              "IDLE 状态持续驱动为 1",
              "en=0 时保持上一值（停止位后为 1）",
            ],
            ["忙标志", "busy 寄存器", "busy = en（组合输出）"],
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

    <H3>拓展功能实现</H3>
    <Lead>
      核心发送讲完后，下面是几个常见的扩展。每个都沿用上面的结构：
      先讲实现原理，再给核心代码——只列关键片段，不是完整模块。
    </Lead>

    <H4>1 · 奇偶校验位</H4>
    <P>
      <LD>帧格式记法：</LD>三个字符分别表示「数据位个数 + 校验方式 +
      停止位个数」， 中间字母 <IC>N</IC> / <IC>E</IC> / <IC>O</IC> = 无校验 /
      偶校验 / 奇校验。 本站默认的 <IC>8N1</IC> 即 8 数据位、无校验、1
      停止位（一帧 10 位）； 本节在数据位后插入 1 位校验，帧格式变成{" "}
      <IC>8E1</IC> / <IC>8O1</IC>（一帧 11 位）。
    </P>
    <P>
      <LD>偶校验：</LD>校验位 = 8 位数据逐位异或（让整帧「1
      的个数为偶数」），奇校验取反。
      发送端只需在数据位后多输出一拍校验位、再进停止位——两种实现的改法分别见下面的代码片段。
    </P>
    <CodeBlock
      title="奇偶校验 · PARITY 状态（状态机版）"
      code={extParityFsmCode}
    />
    <CodeBlock
      title="奇偶校验 · case 片段（计数器译码版）"
      code={extParityCode}
    />

    <H4>2 · 可变帧格式（参数化）</H4>
    <P>
      把「几位数据、几位停止、带不带校验」做成 parameter，一套代码适配 8N1 / 7E1
      / 8O2 等格式。发送器只需知道两件事：每位多久（BAUD_DIV）
      和整帧多少位（BIT_LAST）——计数器版把回绕值由参数算出；
      状态机版则用参数控制 DATA 状态停留的位数。
    </P>
    <CodeBlock title="帧格式参数化 · 位序号回绕（片段）" code={extParamCode} />

    <H4>3 · 多字节连续发送（FIFO）</H4>
    <P>
      单帧发送器一次只发一个字节，外部要等 busy 拉低再拉 start，逐帧握手很啰嗦。
      思路是加一个小 FIFO
      缓存待发字节：每帧结束自动取下一字节接着发，外部只管写入——
      发送器自动调度字节，适合连续打印调试信息。要留意 FIFO
      的读取延迟：本站的同步 FIFO 是寄存读输出，读请求和取数据必须分开。
    </P>
    <P>
      <LD>说明：</LD>FIFO
      的完整设计（深度参数化、读写指针、空满标志）属于常用模块的范畴，
      相关知识详见
      <a className="text-[#42624e] underline underline-offset-2" href="#/fifo">
        「常用模块：FIFO」章节 →
      </a>
      。 本节只讲发送器与 FIFO 的配合思路。
    </P>
    <CodeBlock title="FIFO 自动续发 · 帧末判断（片段）" code={extFifoCode} />

    <H4>4 · 帧完成信号 Tx_done</H4>
    <P>
      把「完成时刻」打一拍输出成单周期脉冲，外部用它的上升沿做「发完再发」的握手，
      比轮询 busy 更直接。
    </P>
    <CodeBlock title="Tx_done · 完成脉冲（片段）" code={extDoneCode} />

    <H4>5 · 接收端 RX</H4>
    <P>
      接收比发送难在不知道位边界：发送方自己数着拍子发，接收方却连「这一位从哪开始」
      都不知道。常见办法是<IC>16 倍过采样</IC>——把每一位分成 16 个采样节拍：
      <strong className="text-[#30382f]">
        检测到起始位下降沿后，在第 8 个采样点（位中点）取值， 之后每 16
        个采样点采一次，正好落在每一位的中心。
      </strong>
      即使收发双方时钟有 ±2% 偏差，
      采样点也只会绕着中点小幅滑动，不会滑出位区间。
    </P>
    <P>
      一个容易踩的坑：起始位下降沿也可能是毛刺。所以收到下降沿先别当真—— 等第 8
      个采样点（起始位中点）再确认一次仍是低电平，才认定是真的起始位；
      中点已是高电平就按毛刺放弃，回到空闲。外部输入先过两级触发器同步，防亚稳态。
    </P>
    <P>下面以接收 0x5A（8N1，LSB 先收）为例，看采样点都踩在什么时刻：</P>
    <Waveform
      channels={[
        { name: "RX", color: "#43624f", segments: rxFrameSegments },
        { name: "采样点", color: "#a16435", segments: rxSampleSegments },
      ]}
      unit={52}
      caption="图：接收 0x5A（LSB 先收）时，琥珀色脉冲 = 每一位位中点的采样时刻"
    />
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[460px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-4 font-normal">采样点</th>
            <th className="py-2 pr-4 font-normal">时刻</th>
            <th className="py-2 font-normal">动作</th>
          </tr>
        </thead>
        <tbody className="text-[#535b50]">
          {[
            ["0", "起始位下降沿", "检测到，启动 16 倍计数"],
            ["8", "起始位中点", "仍为低 → 确认是起始位"],
            ["24", "D0 中点", "采样得 0"],
            ["40", "D1 中点", "采样得 1"],
            ["56", "D2 中点", "采样得 0"],
            ["72", "D3 中点", "采样得 1"],
            ["88", "D4 中点", "采样得 1"],
            ["104", "D5 中点", "采样得 0"],
            ["120", "D6 中点", "采样得 1"],
            ["136", "D7 中点", "采样得 0"],
            ["152", "停止位中点", "应为高；rx_done 脉冲，收到 0x5A"],
          ].map((row) => (
            <tr key={row[0]} className="border-b border-border/60">
              <td className="py-2 pr-4 font-mono text-[#43624f]">{row[0]}</td>
              <td className="py-2 pr-4">{row[1]}</td>
              <td className="py-2">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <P>
      上面用 16
      倍采样网格说明位中点。下面模块直接在系统时钟域计数，「每位数到一半
      （BAUD_DIV /
      2）时采样一次」——同样把目标采样位置放在位中点，但本例并没有生成独立的 16
      倍采样节拍，也没有进行多点多数表决。模块如下：
    </P>
    <CodeWalkthrough title="uart_rx.v" code={extRxCode} steps={uartRxSteps} />
  </section>
);

export default UartSection;
