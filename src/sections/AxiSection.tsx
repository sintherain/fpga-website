import type { ReactNode } from "react";
import { SectionHeader, H3, H4, P, IC, LD, Lead } from "../components/Section";
import Waveform from "../components/Waveform";
import AxiHandshake from "../components/AxiHandshake";
import AxiBurstExplorer from "../components/AxiBurstExplorer";
import {
  AxiChannelsDiagram,
  AxiTransactionDiagram,
  AxiStrobeDiagram,
  AxiRamDiagram,
} from "../components/AxiDiagrams";
import CodeWalkthrough from "../components/CodeWalkthrough";
import CodeBlock from "../components/CodeBlock";
import { axiRamSteps } from "../content/walkthroughs";
import ramCode from "../content/rtl/axi4_burst_ram.v?raw";
import testbench from "../../tests/rtl/axi_tb.v?raw";
import { downloadCode } from "../lib/download-code";

function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="axi-table-scroll">
      <table className="axi-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AxiSection() {
  return (
    <section id="axi" className="chapter-content">
      <SectionHeader
        index="05"
        en="AXI4 · BURSTS & IMPLEMENTATION"
        title="AXI4：从一次握手，到一笔突发读写"
        lead="先读懂一笔访问如何走过五个通道，再亲手写一个小存储器从机。把地址、拍数、字节数与时钟数分开，AXI4 就不再是一大排陌生的信号名。"
      />
      <div className="axi-part-links">
        <a href="#/axi#第一部分-读懂-axi4-协议">
          <span>01 · 协议原理</span>五通道、突发、背压与响应
        </a>
        <a href="#/axi#第二部分-写一个-axi4-存储器从机">
          <span>02 · 模块实作</span>读写控制、分段源码与仿真
        </a>
      </div>

      <H3>第一部分：读懂 AXI4 协议</H3>
      <H4>先分清三种 AXI 接口</H4>
      <P>
        AXI 是芯片内部模块的通信接口。在 FPGA 中，可以把 CPU、DMA 看作发起访问的
        <LD>主机</LD>，把 RAM 或寄存器模块看作提供服务的<LD>从机</LD>
        。这里的“主从”描述谁发起访问；读数据返回时，从机同样是数据的发送方。
      </P>
      <Table
        headers={["接口", "它传的是什么", "适合做什么"]}
        rows={[
          ["AXI4", "有地址，支持多拍突发读写", "DDR、存储器窗口、DMA 搬运"],
          [
            "AXI4-Lite",
            "有地址，每笔单拍，没有 AxLEN / LAST 突发机制",
            "控制寄存器、状态寄存器",
          ],
          [
            "AXI4-Stream",
            "没有存储器地址；TDATA 随 TVALID / TREADY 传送",
            "视频像素、采样数据、处理流水线",
          ],
        ]}
      />
      <P>
        本章实现的是<LD>带地址和多拍突发的 AXI4 从机子集</LD>。AXI4 的{" "}
        <IC>WLAST / RLAST</IC> 标记一笔存储器突发的末拍；AXI4-Stream 的{" "}
        <IC>TLAST</IC> 常用于包或帧边界，具体含义由应用约定，不能直接混用。
      </P>

      <H4>五个通道：把请求、数据与结果分开</H4>
      <AxiChannelsDiagram />
      <Table
        headers={["通道", "谁发送 payload + VALID", "谁给 READY", "关键内容"]}
        rows={[
          ["AW · 写地址", "主机", "从机", "从哪里写、写几拍、每拍多少字节"],
          [
            "W · 写数据",
            "主机",
            "从机",
            "这一拍的数据、哪些字节有效、是否末拍",
          ],
          ["B · 写响应", "从机", "主机", "整笔写事务的完成状态与 ID"],
          ["AR · 读地址", "主机", "从机", "从哪里读、读几拍、每拍多少字节"],
          ["R · 读数据", "从机", "主机", "这一拍的数据、状态、ID 与末拍标记"],
        ]}
      />
      <P>
        <LD>独立通道不等于没有依赖。</LD>AW 和 W
        不必同一周期握手，主机可以先给写数据，也可以先给地址；从机可以用
        WREADY=0 等待地址。B 响应必须等 AW 已被接受且最后一拍 W
        数据也已被接受。读侧先接受 AR，再产生 R
        数据。读与写可以并行，但同一地址的读写先后仍需系统安排。
      </P>

      <H4>握手与背压：一拍不一定只等一个时钟</H4>
      <P>
        把通道想成递交一张卡片：发送方的 <IC>VALID=1</IC>{" "}
        表示卡片已准备好，接收方的 <IC>READY=1</IC> 表示愿意接。在 <IC>ACLK</IC>{" "}
        的同一个上升沿两者都为 1，才算交接成功。RTL 常写成{" "}
        <IC>fire = VALID &amp;&amp; READY</IC>，计数器、地址和状态只在 fire
        对应的时钟沿推进。
      </P>
      <Waveform
        channels={[
          {
            name: "CLK",
            color: "#777c6c",
            segments: Array.from({ length: 8 }, () => [
              { d: 0.5, v: 0 as const },
              { d: 0.5, v: 1 as const },
            ]).flat(),
          },
          {
            name: "VALID",
            color: "#43624f",
            segments: [
              { d: 1, v: 0 },
              { d: 2, v: 1 },
              { d: 5, v: 0 },
            ],
          },
          {
            name: "READY",
            color: "#a16435",
            segments: [
              { d: 2, v: 0 },
              { d: 1, v: 1 },
              { d: 5, v: 0 },
            ],
          },
          {
            name: "DATA",
            color: "#46725f",
            segments: [
              { d: 1, v: "x" },
              { d: 2, v: "x", label: "D0（保持）" },
              { d: 5, v: "x" },
            ],
          },
        ]}
        unit={70}
        highlight={[2, 3]}
        samplePoints={[{ at: 2.5, label: "传输" }]}
        caption="VALID 先准备好，遇到 READY=0 就保持；标记的上升沿才完成一拍。"
      />
      <P>
        <LD>背压就是接收方暂时不收。</LD>当 VALID=1、READY=0，发送方要保持 VALID
        和整组 payload。例如读通道不仅 RDATA，RID、RRESP、RLAST
        也要保持。发送方不能等 READY 出现才拉
        VALID，否则可能互等；接收方可以先拉 READY，也可以看到 VALID 后再准备。
      </P>
      <AxiHandshake />
      <P>
        连续几个上升沿都满足 VALID &amp;&amp; READY，就会连续接收几拍；VALID
        不需要在拍与拍之间先降为 0。反过来，等了三个周期却没有
        fire，一拍也没有传完。事件发生在时钟沿，不是在 VALID 刚变高的一瞬间。
      </P>

      <H4>突发长度：AxLEN、AxSIZE、AxBURST 各管什么</H4>
      <P>
        <LD>突发（burst）是一份地址描述，配一串数据拍。</LD>主机只在 AW 或 AR
        请求中给出起始地址和规则；后续每拍的地址按规则推算，W 通道不为每拍再携带
        WADDR。<LD>拍（beat）</LD>是一次成功的数据通道握手，
        <LD>事务（transaction）</LD>则包含地址、所有数据拍以及相应完成信息。
      </P>
      <Table
        headers={["字段", "编码含义", "例子"]}
        rows={[
          [
            "AWLEN / ARLEN",
            "8 位，传输拍数 = AxLEN + 1",
            "LEN=3 → 4 拍；LEN=0 → 1 拍；LEN=255 → 256 拍",
          ],
          [
            "AWSIZE / ARSIZE",
            "每拍字节数 = 2 的 AxSIZE 次方",
            "SIZE=2 → 4 字节 / 拍；SIZE=0 → 1 字节 / 拍",
          ],
          [
            "AWBURST / ARBURST",
            "00=FIXED，01=INCR，10=WRAP；11 保留",
            "BURST=01 → 递增地址",
          ],
          [
            "WDATA / RDATA 位宽",
            "接口能承载的最大一拍宽度",
            "32 位接口有 4 个字节通道，SIZE 不能大于 2",
          ],
        ]}
      />
      <Lead>
        LEN 决定拍数，SIZE 决定每拍字节数，BURST
        决定地址怎样走。突发长度既不是字节数，也不是从开始到结束经历的时钟数。
      </Lead>
      <P>
        例如 AWADDR=0x0100、AWLEN=3、AWSIZE=2、AWBURST=01，表示从字节地址 0x0100
        开始，递增写 4 拍，每拍 4 字节。满字节使能时标称传输量是{" "}
        <IC>(3+1) × 2² = 16 字节</IC>。背压会增加耗时；WSTRB
        关闭部分字节会减少真正更新的字节数，拍数仍然是 4。
      </P>
      <Table
        headers={["数据拍", "字节地址", "覆盖的字节", "末拍标记"]}
        rows={[
          ["第 1 拍", "0x0100", "0x0100～0x0103", "LAST=0"],
          ["第 2 拍", "0x0104", "0x0104～0x0107", "LAST=0"],
          ["第 3 拍", "0x0108", "0x0108～0x010B", "LAST=0"],
          ["第 4 拍", "0x010C", "0x010C～0x010F", "LAST=1"],
        ]}
      />
      <AxiBurstExplorer />

      <H4>地址怎样走：递增、固定、回绕与 4 KiB 边界</H4>
      <P>
        下面都取对齐起始地址 0x010C、4 拍、4 字节 / 拍。对齐的 INCR 可用{" "}
        <IC>地址[i] = 起始地址 + i × 每拍字节数</IC>{" "}
        计算；非对齐起始地址的首拍字节通道与后续地址规则更复杂，本例不实现。
      </P>
      <Table
        headers={["类型", "四拍地址序列", "理解方式"]}
        rows={[
          [
            "FIXED",
            "010C → 010C → 010C → 010C",
            "始终访问同一地址，如具有特殊语义的端口",
          ],
          ["INCR", "010C → 0110 → 0114 → 0118", "沿连续存储空间向前走"],
          ["WRAP", "010C → 0100 → 0104 → 0108", "在 16 字节窗口里回到窗口起点"],
        ]}
      />
      <P>
        WRAP 的窗口大小是“拍数 ×
        每拍字节数”，窗口起点向下对齐到这个大小；起始地址必须按每拍大小对齐，拍数只允许
        2、4、8、16。AXI4 的 INCR 可以有 1～256 拍，FIXED 最多 16 拍。WRAP
        不是走到 RAM 末端就随意回零，而是按这笔事务的窗口回绕。
      </P>
      <P>
        <LD>突发不能跨过 4 KiB 地址边界。</LD>0x0FF8 起始、4 拍 × 4 字节，会访问
        0x0FF8、0x0FFC、0x1000、0x1004，越过边界。主机应拆成两笔：第一笔从
        0x0FF8 传 2 拍（LEN=1），第二笔从 0x1000 再传 2
        拍（LEN=1）。最后一个字节正好在 0x0FFF 可以；跨到 0x1000 就不可以。
      </P>

      <H4>走完一笔写入与一笔读取</H4>
      <AxiTransactionDiagram />
      <P>
        <LD>写路径：</LD>AW 握手保存地址描述；每个 WVALID &amp;&amp; WREADY
        接受一拍，WLAST 在第 AWLEN+1 拍为
        1。地址已接受、末拍数据也已接受后，从机才拉 BVALID，并保持
        BID/BRESP，直到 BREADY 完成握手。B 是<LD>整笔突发一次响应</LD>
        ，不是每写一拍就回一次 B。
      </P>
      <P>
        <LD>读路径：</LD>AR 握手后，从机逐拍给 RDATA，每拍都带 RID/RRESP；第
        ARLEN+1 拍给 RLAST=1。即使 RLAST 已为 1，如果
        RREADY=0，末拍仍未被拿走，必须保持全部读输出。只有最后一拍 RVALID
        &amp;&amp; RREADY，整笔读事务才完成。
      </P>
      <P>
        协议不允许提前终止突发。写入时即使某些拍
        WSTRB=0，也要完成规定拍数；发生访问错误时也不能随意少给读响应。LAST 应和
        LEN 的拍数一致，它不是“随时结束”的取消按钮。
      </P>

      <H4>字节使能、响应码与事务 ID</H4>
      <AxiStrobeDiagram />
      <P>
        32 位接口中，WSTRB[0] 控制 WDATA[7:0]，WSTRB[1] 控制
        WDATA[15:8]，以此类推。全为 0
        的一拍不更新字节，但仍参与长度计数。窄传输需根据地址选择正确字节通道，不能只改
        AWSIZE 就把数据摆在任意位置。
      </P>
      <Table
        headers={["RESP", "含义", "本例用法"]}
        rows={[
          ["00 · OKAY", "正常访问成功", "支持范围内的突发读写"],
          ["01 · EXOKAY", "独占访问相关成功状态", "不实现独占访问"],
          [
            "10 · SLVERR",
            "访问到从机，但处理失败",
            "大小、类型、对齐或范围不受支持",
          ],
          [
            "11 · DECERR",
            "通常由互连报告地址无法译码",
            "本例作为已选中的端点，不产生 DECERR",
          ],
        ]}
      />
      <P>
        ID 给事务贴标签：AWID 随写事务保存，BID 返回同一标签；ARID 保存后，各拍
        RID 都返回同一标签。AXI4 支持多笔在途事务和一定条件下的乱序完成，但
        <LD>不同 ID 不意味着可以随意交错写数据</LD>：AXI4 没有
        WID，写数据按写地址事务顺序传送，同一 ID
        的相关顺序规则也要遵守。本例只允许每方向一笔在途事务，保留 ID
        往返，先不做重排序器。
      </P>
      <P>
        基础规则可对照{" "}
        <a
          className="axi-source-link"
          href="https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/IHI0022H_amba_axi_protocol_spec.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Arm 官方 AXI 规范：A3 握手、突发与通道依赖；A5 事务顺序
        </a>
        。本章图与实验为独立绘制的教学示意。
      </P>

      <H3>第二部分：写一个 AXI4 存储器从机</H3>
      <H4>实验目标与支持范围</H4>
      <P>
        把 4 KiB 存储空间接到 AXI4：主机用一笔 4 拍写入填入四个 32
        位字，再用一笔 4 拍读取取回来。本例处理 AW/W/B 和
        AR/R，有实际地址推进、字节写使能、ID、背压与错误响应，不是只画握手信号的空壳。
      </P>
      <Table
        headers={["项目", "这个模块的约定"]}
        rows={[
          [
            "地址与存储器",
            "16 位字节地址；0x0000～0x0FFF，mem[0:1023] 每项 32 位",
          ],
          ["突发能力", "INCR，1～256 拍，SIZE=2，起始地址四字节对齐"],
          [
            "并发能力",
            "一笔写 + 一笔读可并行；各方向完成前不收下一笔同方向地址",
          ],
          ["字节与 ID", "四位 WSTRB；四位 ID 原样返回"],
          [
            "不支持的请求",
            "不写 RAM，收完写拍回 SLVERR；读按规定拍数返回 0 + SLVERR",
          ],
          [
            "上游约定",
            "正确产生 WLAST；独占、缓存/保护属性、USER 等 sideband 未实现",
          ],
        ]}
      />
      <Lead>
        这是可综合的 AXI4 教学子集，不是涵盖全部属性的通用 AXI
        IP。接入系统时，应限制主机请求或使用已验证的适配器。错误 WLAST
        来自主机违反协议，本例不承诺从这种输入恢复。
      </Lead>
      <AxiRamDiagram />

      <H4>从信号到寄存器：保存什么，何时推进</H4>
      <P>
        AWADDR 是字节地址，mem 索引是整个 32 位字。对齐访问用{" "}
        <IC>wr_addr[11:2]</IC> 选择存储单元，每成功一拍地址加 4。拍数计数器要有{" "}
        <IC>9 位</IC>：AWLEN 最大为 255，加一后是 256，不能仍塞进 8 位寄存器。
      </P>
      <Table
        headers={["状态 / 寄存器", "为什么需要它", "什么时候变化"]}
        rows={[
          [
            "wr_active / wr_addr / wr_left / wr_id",
            "保存只出现一次的 AW 描述",
            "AW fire 装载；W fire 推进地址与拍数",
          ],
          [
            "wr_error",
            "整笔请求不支持，屏蔽写 RAM",
            "AW 检查时保存，最后用于 BRESP",
          ],
          [
            "BVALID / BID / BRESP",
            "响应可能被主机背压",
            "末拍 W fire 产生，B fire 才撤回 VALID",
          ],
          [
            "rd_addr / rd_left / rd_error",
            "保存读位置与剩余拍数",
            "AR fire 装载，R fire 后准备下一拍",
          ],
          [
            "RVALID / RID / RDATA / RRESP / RLAST",
            "保存尚未接走的读输出",
            "AR fire 准备首拍，R fire 推进，否则保持",
          ],
        ]}
      />

      <H4>逐段实现：请求、写入、响应与读取</H4>
      <P>
        五通道各有 VALID/READY；W 是输入，B 和 R
        是输出。完整接口声明保留在源码中。下面从控制行为的八段逻辑开始，每段对应同一份可下载的模块。
      </P>
      <CodeWalkthrough
        title="axi4_burst_ram.v"
        code={ramCode}
        steps={axiRamSteps}
      />
      <P>
        <LD>W 先到时：</LD>本例先收 AW 才拉 WREADY，提前给 WVALID
        会被背压。这是允许的实现；主机应先表明数据就绪并保持，不能反过来等
        AWREADY 才决定发 WVALID。高吞吐实现可以加独立 AW/W
        缓冲，但最终须配成同一笔事务。
      </P>
      <P>
        <LD>吞吐：</LD>当前 R 拍被接收后，下一拍可立刻装进输出寄存器；RREADY
        连续为 1 时，数据阶段可以每周期一拍。新 AR 要等旧读末拍完成，写侧还需等
        B 完成，因此事务间有空隙。这降低了复杂度，两侧状态仍彼此独立。
      </P>

      <H4>跟一次四拍访问：把变量对回波形</H4>
      <Table
        headers={["事件", "写侧状态", "观察要点"]}
        rows={[
          [
            "AW fire：0x0100、LEN=3",
            "wr_addr=0x0100、wr_left=4、保存 AWID",
            "随后地址输入变化不能影响此事务",
          ],
          [
            "第一拍 W fire",
            "写 mem[64]；地址 0x0104；剩 3 拍",
            "WSTRB 决定哪些字节更新",
          ],
          [
            "WVALID=1、WREADY=0",
            "没有 W fire，地址与计数保持",
            "一般背压规则；本例在地址前/响应期间背压 W",
          ],
          [
            "第四拍 W fire 且 WLAST=1",
            "写 mem[67]，产生 BVALID / BID / BRESP",
            "LAST 与剩余计数 1 必须一致",
          ],
          ["BREADY=0", "BVALID、BID、BRESP 保持", "写完不等于主机已接走响应"],
          ["B fire", "清除 BVALID，随后可收下一个 AW", "整笔写完成"],
        ]}
      />
      <P>
        再发 ARADDR=0x0100、ARLEN=3、ARSIZE=2、ARBURST=01。AR fire 准备 mem[64]
        的首拍；每次 R fire 再取下一个字。当 <IC>rd_left==2</IC>{" "}
        的当前拍被接走，下一拍是末拍，所以给下一拍设置
        RLAST=1。若接收停住，数据、ID、状态和 LAST 一起停住。
      </P>

      <H4>运行仿真：正确数据之外，还要检查等待</H4>
      <P>
        测试平台直接实例化页面这份模块，由任务扮演主机。它会延迟
        BREADY/RREADY，检查整组响应是否保持；还会在 AW/AR
        握手后改变地址输入，确认从机使用已锁存的描述。
      </P>
      <Table
        headers={["测试", "验证机制"]}
        rows={[
          ["1、4、16、256 拍写后读", "LEN+1、九位计数、地址、WLAST/RLAST"],
          ["WVALID 比 AW 先到", "独立通道与等待地址"],
          ["R、B 多周期背压", "VALID、DATA、RESP、ID、LAST 保持"],
          ["16 种 WSTRB 掩码", "包括全零拍计数与未选字节保留"],
          [
            "边界、类型、大小、对齐、越界",
            "正好到 0x0FFF 合法；错误请求不污染原数据",
          ],
          ["读写并行、途中复位", "独立状态，取消响应，已写 RAM 不清空"],
        ]}
      />
      <P>
        下载模块和测试平台到同一目录，安装 Icarus Verilog
        后执行下面两条命令。成功打印 <IC>PASS AXI4 RAM</IC>，失败用{" "}
        <IC>$fatal</IC> 报告原因。测试平台的 <IC>#5</IC>{" "}
        是仿真时钟，不在可综合模块里。
      </P>
      <button
        className="axi-download-link"
        onClick={() => downloadCode(testbench, "axi_tb.v")}
      >
        下载仿真平台 axi_tb.v
      </button>
      <CodeBlock
        title="在模块与测试平台所在目录运行"
        code={`iverilog -g2012 -s tb -o axi_tb.vvp axi4_burst_ram.v axi_tb.v\nvvp axi_tb.vvp`}
      />
      <P>
        运行后会生成 <IC>axi_tb.vcd</IC>，可用 GTKWave 打开，添加
        AWVALID/AWREADY、WVALID/WREADY/WLAST、BVALID/BREADY 与 AR/R
        信号，放大一次四拍事务。先找 fire
        对应的上升沿，再核对地址计数、末拍与响应；不要仅按波形横坐标数周期。
      </P>
      <details className="full-code">
        <summary>展开测试平台 · axi_tb.v</summary>
        <CodeBlock title="axi_tb.v" code={testbench} />
      </details>

      <H4>从教学模块走到实际工程</H4>
      <P>
        数组不做复位，不承诺推断成特定 BRAM；读未写过的单元没有约定值。接 FPGA
        块 RAM
        时应按同步读延迟重做读流水线，并确认字节写使能与端口冲突行为。同地址读写结果可能受
        RAM 模式影响，本章并行测试使用不同地址。
      </P>
      <P>
        接 Zynq 或 DMA 还需核对位宽、时钟、复位、地址映射及 sideband
        属性、多笔在途事务与 CDC。下一步可在 AXI VIP
        或协议检查器下增加随机等待，再做综合、时序分析和上板验证。当前完成的是功能仿真，尚未针对具体
        FPGA 实现与硬件验证。
      </P>
    </section>
  );
}
