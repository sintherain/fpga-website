import React from "react";
import CodeWalkthrough from "../components/CodeWalkthrough";
import { fifoSteps } from "../content/walkthroughs";
import FifoExplorer from "../components/FifoExplorer";
import syncFifoCode from "../content/rtl/sync_fifo.v?raw";
import { SectionHeader, H3, H4, P, IC, LD } from "../components/Section";

const FifoSection: React.FC = () => (
  <section id="fifo" className="chapter-content">
    <SectionHeader
      index="06"
      en="FIFO · FIRST IN FIRST OUT"
      title="FIFO：先入先出的数据缓冲"
      lead="FIFO（First In First Out）是 FPGA 里最常用的数据缓冲模块：一端写入、一端读出，先写进去的数据先读出来。速率匹配、突发缓冲、跨时钟域，都靠它。"
    />

    <H3>为什么需要 FIFO</H3>
    <P>
      想象两条速率不同的流水线：上游每 2 拍产出一个字节，下游每 5 拍才消费一个。
      直接对接的话，下游来不及收，数据就丢了。FIFO 就像一个<IC>蓄水池</IC>：
      上游在未满时写入，下游在未空时读取。有限的 FIFO
      只能缓冲一段时间；上游长期比下游快，最终仍需要暂停上游或降低平均速率。
    </P>
    <P>
      <LD>速率匹配：</LD>快慢两侧直接对接会丢数据，FIFO 负责暂存，谁快谁多等。
    </P>
    <P>
      <LD>突发缓冲：</LD>上游一口气来一串数据（比如一次 DMA
      搬运），下游来不及实时处理，先整串存下再慢慢消化。
    </P>
    <P>
      <LD>跨时钟域：</LD>两个模块用不同的时钟（比如 50 MHz 与 100
      MHz），数据不能直接跨时钟传送，异步 FIFO 是标准做法。
    </P>

    <H3>动手试试：让数据排队</H3>
    <P>
      依次写入几个字节，再读出它们。试试读空、写满，以及在边界处同时请求读写：数量只由成功的操作决定。
    </P>
    <FifoExplorer />
    <H3>同步 FIFO 的组成</H3>
    <H4>1 · 存储阵列 + 读写指针</H4>
    <P>
      FIFO 内部是一块<IC>存储阵列</IC>（一段 RAM）+ 两个指针：
      <IC>写指针 wr_ptr</IC> 指向下一个写入位置，<IC>读指针 rd_ptr</IC>{" "}
      指向下一个读出位置。 写入时数据落在 wr_ptr 处、指针 +1；读出时取 rd_ptr
      处的数据、指针 +1——
      读写指针按相同的顺序循环，最早写入的数据先被取出，「先入先出」就是指针按顺序转圈的结果。
    </P>
    <H4>2 · 空 / 满怎么判断</H4>
    <P>
      最直观的办法：用一个<IC>计数器 count</IC> 记录「当前存了几个数据」——
      写入成功 +1，读出成功 -1。count == 0 就是<IC>空</IC>，count == DEPTH 就是
      <IC>满</IC>。 空的时候不能读，满的时候不能写，读写都要先看这个标志。
    </P>
    <CodeWalkthrough
      title="sync_fifo.v"
      code={syncFifoCode}
      steps={fifoSteps}
    />
    <P>
      指针 + 计数器的写法是同步 FIFO 的入门版本，逻辑直白、不易错；
      工业实现常用「指针相等判空/满 +
      指针多一位扩展」来省掉计数器，属于进阶内容，后续补充。
    </P>

    <H3>异步 FIFO（跨时钟域）</H3>
    <P>
      读写两侧时钟不同（频率或相位不同）时，<IC>同步 FIFO 就不成立了</IC>——
      计数器和指针本身是跨时钟的信号，直接跨时钟域传递会采样到不确定的值。 异步
      FIFO 的经典做法是：读写指针各自用<IC>格雷码</IC>编码后，
      在对方时钟域里用两级触发器同步，再比较判断空满。
    </P>
    <P>
      <LD>待补充：</LD>异步 FIFO
      的完整设计（格雷码转换、指针同步、空满判定）将在本节的后续版本展开。
    </P>

    <H3>常用参数与接口</H3>
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-4 font-normal">名字</th>
            <th className="py-2 pr-4 font-normal">方向</th>
            <th className="py-2 font-normal">说明</th>
          </tr>
        </thead>
        <tbody className="text-[#535b50]">
          {[
            ["DEPTH", "参数", "深度：能存几个数据（如 16）"],
            ["WIDTH", "参数", "位宽：每个数据多少位（如 8）"],
            ["wr_en / rd_en", "输入", "写 / 读使能，为高且未满 / 未空时有效"],
            ["wr_data / rd_data", "输入 / 输出", "写入 / 读出数据"],
            ["full", "输出", "满标志：count == DEPTH，此时不能写"],
            ["empty", "输出", "空标志：count == 0，此时不能读"],
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

    <H3>和 UART 发送器配合</H3>
    <P>
      UART 章节拓展 3 的「多字节连续发送」就是 FIFO 的典型用法：每帧发完，
      发送器从 FIFO 取下一个字节。本站示例的 rd_data
      是寄存输出，要先请求读取，等读输出更新后再装载；不能按首字直通 FIFO
      的方式直接取旧数据。配合代码见
      <a className="text-[#42624e] underline underline-offset-2" href="#/uart">
        「UART 拓展 3」
      </a>
      。
    </P>
  </section>
);

export default FifoSection;
