import type { ReactNode } from "react";

function Sheet({
  title,
  label,
  height,
  caption,
  children,
}: {
  title: string;
  label: string;
  height: number;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="axi-figure">
      <div className="axi-figure-card">
        <p className="axi-figure-title">{title}</p>
        <div className="axi-figure-scroll">
          <svg viewBox={`0 0 760 ${height}`} role="img" aria-label={label}>
            {children}
          </svg>
        </div>
      </div>
      <figcaption>
        {caption}
        <span className="axi-figure-hint">小屏幕可左右滑动查看完整图。</span>
      </figcaption>
    </figure>
  );
}

function Box({
  x,
  y,
  width,
  height = 60,
  title,
  sub,
  color = "#43624f",
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
  title: string;
  sub?: string;
  color?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={7}
        fill="#f5f3ed"
        stroke={color}
        strokeOpacity={0.45}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - (sub ? 4 : -5)}
        textAnchor="middle"
        fontSize={16}
        fill={color}
      >
        {title}
      </text>
      {sub && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 19}
          textAnchor="middle"
          fontSize={12}
          fill="#737d64"
        >
          {sub}
        </text>
      )}
    </g>
  );
}
function Arrow({
  x1,
  x2,
  y,
  color = "#43624f",
  dashed = false,
}: {
  x1: number;
  x2: number;
  y: number;
  color?: string;
  dashed?: boolean;
}) {
  const direction = x2 > x1 ? 1 : -1;
  return (
    <g stroke={color} fill={color}>
      <line
        x1={x1}
        x2={x2}
        y1={y}
        y2={y}
        strokeWidth={1.7}
        strokeDasharray={dashed ? "4 4" : undefined}
      />
      <path
        d={`M${x2 - direction * 8} ${y - 4} L${x2} ${y} L${x2 - direction * 8} ${y + 4}`}
      />
    </g>
  );
}

export function AxiChannelsDiagram() {
  const channels = [
    {
      name: "AW · 写地址",
      payload: "ADDR / LEN / SIZE / BURST / ID",
      forward: true,
      color: "#43624f",
    },
    {
      name: "W · 写数据",
      payload: "DATA / STRB / LAST",
      forward: true,
      color: "#46725f",
    },
    {
      name: "B · 写响应",
      payload: "RESP / ID",
      forward: false,
      color: "#ac574d",
    },
    {
      name: "AR · 读地址",
      payload: "ADDR / LEN / SIZE / BURST / ID",
      forward: true,
      color: "#a16435",
    },
    {
      name: "R · 读数据与响应",
      payload: "DATA / RESP / LAST / ID",
      forward: false,
      color: "#746087",
    },
  ];
  return (
    <Sheet
      title="五个通道，各自有一对 VALID / READY"
      label="AXI4 五通道方向与返回的 READY"
      height={390}
      caption="实线表示 payload 与 VALID 的方向，虚线表示 READY 的返回方向。主机负责发起访问；在 B、R 通道上，从机才是发送方。"
    >
      <Box
        x={14}
        y={40}
        width={120}
        height={300}
        title="主机"
        sub="CPU / DMA"
      />
      <Box
        x={626}
        y={40}
        width={120}
        height={300}
        title="从机"
        sub="RAM / 寄存器"
      />
      {channels.map((channel, i) => {
        const y = 67 + i * 61;
        return (
          <g key={channel.name}>
            <Arrow
              x1={channel.forward ? 144 : 616}
              x2={channel.forward ? 616 : 144}
              y={y}
              color={channel.color}
            />
            <Arrow
              x1={channel.forward ? 616 : 144}
              x2={channel.forward ? 144 : 616}
              y={y + 18}
              color="#aab29b"
              dashed
            />
            <rect
              x={255}
              y={y - 17}
              width={250}
              height={47}
              rx={5}
              fill="#fffdf8"
            />
            <text
              x={380}
              y={y}
              textAnchor="middle"
              fontSize={15}
              fill={channel.color}
            >
              {channel.name}
            </text>
            <text
              x={380}
              y={y + 21}
              textAnchor="middle"
              fontSize={11}
              fill="#737d64"
            >
              {channel.payload}
            </text>
          </g>
        );
      })}
      <text x={380} y={375} textAnchor="middle" fontSize={13} fill="#737d64">
        AWREADY、WREADY、BREADY、ARREADY、RREADY 都是独立信号
      </text>
    </Sheet>
  );
}

export function AxiTransactionDiagram() {
  return (
    <Sheet
      title="同样是 4 拍：写有一条 B 响应，读每拍自带 RRESP"
      label="AXI4 四拍写事务和读事务流程"
      height={305}
      caption="这是便于理解的事务流程，不是固定周期时序。AW 与 W 可以先后或同时到达；B 必须等地址和最后一拍写数据都被接受。"
    >
      {[
        {
          y: 52,
          address: "AW",
          data: "W",
          last: "WLAST",
          name: "写：主机发地址和数据，从机确认整笔写入",
        },
        {
          y: 207,
          address: "AR",
          data: "R",
          last: "RLAST",
          name: "读：主机发地址，从机返回四拍数据",
        },
      ].map((row) => (
        <g key={row.address}>
          <text x={20} y={row.y - 23} fontSize={14} fill="#43624f">
            {row.name}
          </text>
          <Box
            x={20}
            y={row.y}
            width={155}
            title={`${row.address} · 一个请求`}
            sub="LEN=3，SIZE=2"
          />
          <Arrow x1={178} x2={208} y={row.y + 30} />
          {Array.from({ length: 4 }, (_, i) => (
            <g key={i}>
              <Box
                x={214 + i * 98}
                y={row.y}
                width={88}
                title={`${row.data}${i}`}
                sub={i === 3 ? `${row.last}=1` : `${row.last}=0`}
              />
              {i < 3 && (
                <Arrow x1={303 + i * 98} x2={310 + i * 98} y={row.y + 30} />
              )}
            </g>
          ))}
          {row.address === "AW" ? (
            <>
              <Arrow x1={601} x2={632} y={row.y + 30} color="#ac574d" />
              <Box
                x={638}
                y={row.y}
                width={100}
                title="B · 一次"
                sub="BRESP / BID"
                color="#ac574d"
              />
            </>
          ) : (
            <text x={625} y={row.y + 36} fontSize={13} fill="#746087">
              每拍含 RRESP
            </text>
          )}
        </g>
      ))}
    </Sheet>
  );
}

export function AxiStrobeDiagram() {
  return (
    <Sheet
      title="WSTRB 是每个字节的写入开关"
      label="32 位 WDATA 的四个字节与 WSTRB 对应关系"
      height={150}
      caption="WDATA=0xAABBCCDD，WSTRB=0011：只更新低两个字节。原值 0x11223344 会变成 0x1122CCDD；每拍仍占一次握手。"
    >
      {[3, 2, 1, 0].map((lane, i) => (
        <g key={lane}>
          <Box
            x={65 + i * 175}
            y={18}
            width={150}
            title={["AA", "BB", "CC", "DD"][i]}
            sub={`WDATA[${lane * 8 + 7}:${lane * 8}]`}
            color={lane < 2 ? "#43624f" : "#8b8f81"}
          />
          <text
            x={140 + i * 175}
            y={108}
            textAnchor="middle"
            fontSize={14}
            fill={lane < 2 ? "#43624f" : "#8b8f81"}
          >
            WSTRB[{lane}] = {lane < 2 ? "1 · 写入" : "0 · 保留"}
          </text>
        </g>
      ))}
    </Sheet>
  );
}

export function AxiRamDiagram() {
  return (
    <Sheet
      title="把五个通道落到两个控制器与一块存储器"
      label="AXI4 RAM 从机内部结构，写控制和读控制独立"
      height={340}
      caption="写侧保存地址、剩余拍数和 ID；读侧保存同样的信息并持有当前 R 输出。B 和 R 寄存器负责在背压时保持响应。"
    >
      <Box x={15} y={50} width={130} title="AW / W" sub="主机 → 从机" />
      <Arrow x1={150} x2={200} y={80} />
      <Box
        x={207}
        y={30}
        width={245}
        height={100}
        title="写控制器"
        sub="wr_addr · wr_left · wr_id"
      />
      <Arrow x1={460} x2={550} y={80} />
      <Box
        x={560}
        y={50}
        width={180}
        height={210}
        title="mem[0:1023]"
        sub="1024 × 32 bit"
      />
      <Box x={15} y={215} width={130} title="AR" sub="读请求" color="#a16435" />
      <Arrow x1={150} x2={200} y={245} color="#a16435" />
      <Box
        x={207}
        y={195}
        width={245}
        height={100}
        title="读控制器 + R 输出"
        sub="rd_addr · rd_left · RID / LAST"
        color="#746087"
      />
      <Arrow x1={550} x2={460} y={245} color="#746087" />
      <path
        d="M329 130 V155 H207"
        fill="none"
        stroke="#ac574d"
        strokeWidth={1.7}
      />
      <Arrow x1={200} x2={150} y={155} color="#ac574d" />
      <text x={80} y={160} textAnchor="middle" fontSize={14} fill="#ac574d">
        B → 主机
      </text>
      <text x={329} y={179} textAnchor="middle" fontSize={13} fill="#ac574d">
        末拍写入后产生 B，等待 BREADY
      </text>
      <path
        d="M329 295 V315 H207"
        fill="none"
        stroke="#746087"
        strokeWidth={1.7}
      />
      <Arrow x1={200} x2={150} y={315} color="#746087" />
      <text x={80} y={320} textAnchor="middle" fontSize={14} fill="#746087">
        R → 主机
      </text>
    </Sheet>
  );
}
