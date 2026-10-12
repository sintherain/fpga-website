import { useId } from "react";
import type { ReactNode } from "react";

function Box({
  x,
  y,
  w = 140,
  h = 84,
  title,
  sub,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  sub?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill="#fffdf7"
        stroke="#b8c6a6"
        strokeWidth={1.5}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 - 3}
        textAnchor="middle"
        fontSize={17}
        fill="#476440"
      >
        {title}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 20}
          textAnchor="middle"
          fontSize={11}
          fill="#8e997c"
        >
          {sub}
        </text>
      )}
    </g>
  );
}
function Sheet({
  children,
  label,
  height = 280,
}: {
  children: ReactNode;
  label: string;
  height?: number;
}) {
  return (
    <svg viewBox={`0 0 760 ${height}`} role="img" aria-label={label}>
      {children}
    </svg>
  );
}
export function NotebookArt() {
  return (
    <svg
      viewBox="0 0 460 355"
      role="img"
      aria-label="笔记本上画着芯片、信号线和时序波形"
    >
      <g transform="rotate(-6 220 180)">
        <rect x="65" y="52" width="305" height="247" rx="9" fill="#d9ddca" />
        <rect
          x="56"
          y="43"
          width="305"
          height="247"
          rx="7"
          fill="#fffdf4"
          stroke="#b8bfa3"
          strokeWidth="1.5"
        />
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={i}
            x1="78"
            x2="341"
            y1={70 + i * 24}
            y2={70 + i * 24}
            stroke="#e8eadc"
          />
        ))}
        <line x1="94" x2="94" y1="44" y2="290" stroke="#d5b99d" />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx="68" cy={60 + i * 26} r="3" fill="#d0d3bf" />
        ))}
        <rect
          x="131"
          y="87"
          width="94"
          height="71"
          rx="6"
          fill="#e6ecd9"
          stroke="#78946a"
          strokeWidth="2"
        />
        <text x="178" y="125" fontSize="17" fill="#526d45" textAnchor="middle">
          FPGA
        </text>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} stroke="#8e9d76" strokeWidth="2">
            <line x1={142 + i * 16} x2={142 + i * 16} y1="78" y2="87" />
            <line x1={142 + i * 16} x2={142 + i * 16} y1="158" y2="167" />
          </g>
        ))}
        <path
          d="M225 106 H269 V135 H302 M225 139 H256 V167 H302"
          fill="none"
          stroke="#a7875e"
          strokeWidth="2"
        />
        <circle cx="308" cy="135" r="7" fill="#ccaf7c" />
        <circle cx="308" cy="167" r="7" fill="#a9bb8e" />
        <path
          d="M114 229 H146 V207 H178 V229 H210 V207 H241 V229 H272 V207 H313"
          fill="none"
          stroke="#627e52"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text x="112" y="192" fontSize="11" fill="#9ba086">
          一拍，一拍，看清楚。
        </text>
      </g>
      <path
        d="M361 230 l46 -125 7 3 -42 126 -10 16z"
        fill="#c2a574"
        stroke="#a58b64"
      />
      <path d="M361 230 l11 4 -10 16z" fill="#e3d9bd" />
      <circle cx="51" cy="271" r="5" fill="#c0caa9" />
      <path d="M366 64 l12 -5 m-6 -6 v12" stroke="#a6b188" strokeWidth="2" />
    </svg>
  );
}
export default function LearningDiagram({
  type,
}: {
  type: "fpga" | "board" | "uart" | "i2c" | "shift";
}) {
  const id = useId();
  const defs = (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path
          d="M1 1 L9 5 L1 9"
          fill="none"
          stroke="#819569"
          strokeWidth="1.5"
        />
      </marker>
    </defs>
  );
  let drawing: ReactNode, caption: string;
  if (type === "fpga") {
    caption =
      "从描述逻辑到搭出电路：综合工具把 RTL 映射为芯片里已有的硬件资源。";
    drawing = (
      <Sheet label="RTL 经综合映射到 LUT、触发器、存储器，再连接到输出引脚">
        {defs}
        <Box x={25} y={98} w={120} title="RTL" sub="描述电路行为" />
        <path
          d="M145 140 H217"
          stroke="#819569"
          strokeWidth="2"
          markerEnd={`url(#${id})`}
        />
        <text x="178" y="122" textAnchor="middle" fontSize="11" fill="#8c9779">
          综合
        </text>
        <rect
          x="237"
          y="34"
          width="296"
          height="211"
          rx="13"
          fill="#e3e9d7"
          stroke="#acbc95"
        />
        <text x="385" y="60" textAnchor="middle" fill="#718361" fontSize="12">
          FPGA 芯片内部
        </text>
        <Box x={255} y={80} w={120} h={62} title="LUT" sub="计算" />
        <Box x={393} y={80} w={120} h={62} title="FF" sub="记住上一拍" />
        <Box x={255} y={163} w={120} h={62} title="BRAM" sub="存储数据" />
        <Box x={393} y={163} w={120} h={62} title="DSP" sub="乘加运算" />
        <path
          d="M533 140 H595"
          stroke="#819569"
          strokeWidth="2"
          markerEnd={`url(#${id})`}
        />
        <Box x={610} y={98} w={120} title="I/O" sub="连接外部世界" />
      </Sheet>
    );
  } else if (type === "board") {
    caption =
      "一块开发板的功能示意：时钟给电路节奏，接口把电路与外部器件连接起来。";
    drawing = (
      <Sheet label="FPGA 开发板功能示意，标注晶振、芯片、LED、按键、串口和扩展引脚">
        {defs}
        <rect
          x="93"
          y="23"
          width="573"
          height="237"
          rx="18"
          fill="#e1e8d3"
          stroke="#a3b58e"
          strokeWidth="2"
        />
        {[
          [109, 39],
          [650, 39],
          [109, 244],
          [650, 244],
        ].map(([x, y]) => (
          <circle
            key={x + "," + y}
            cx={x}
            cy={y}
            r="5"
            fill="#faf8f3"
            stroke="#b8c6a6"
          />
        ))}
        <Box x={270} y={82} w={183} h={104} title="FPGA" sub="可编程逻辑" />
        <Box x={118} y={70} w={108} h={58} title="晶振" sub="系统时钟" />
        <path d="M226 99 H267" stroke="#819569" markerEnd={`url(#${id})`} />
        <Box
          x={118}
          y={158}
          w={108}
          h={60}
          title="USB 串口"
          sub="电脑 ↔ FPGA"
        />
        <path d="M226 181 H267" stroke="#a28a61" />
        <Box x={502} y={78} w={128} h={56} title="LED / 按键" />
        <path d="M453 106 H501" stroke="#819569" />
        <Box
          x={502}
          y={162}
          w={128}
          h={56}
          title="扩展引脚"
          sub="SPI / I2C 等"
        />
        <path d="M453 175 H501" stroke="#a28a61" />
      </Sheet>
    );
  } else if (type === "uart") {
    caption =
      "UART 两端交叉连接：一端的 TX 接另一端的 RX，并连接共同的参考地。两端要约定相同的帧格式和波特率。";
    drawing = (
      <Sheet label="FPGA 与 USB 串口模块 TX RX 交叉连接，并共地">
        {defs}
        <Box
          x={45}
          y={60}
          w={195}
          h={150}
          title="FPGA"
          sub="用 RTL 实现收发器"
        />
        <Box
          x={520}
          y={60}
          w={195}
          h={150}
          title="USB 串口模块"
          sub="连接电脑"
        />
        <g fill="#687c53" fontSize="13">
          <text x="207" y="92">
            TX
          </text>
          <text x="207" y="158">
            RX
          </text>
          <text x="530" y="92">
            TX
          </text>
          <text x="530" y="158">
            RX
          </text>
        </g>
        <path
          d="M241 87 H292 L467 152 H519"
          stroke="#8b9f70"
          strokeWidth="2"
          fill="none"
          markerEnd={`url(#${id})`}
        />
        <path
          d="M519 87 H467 L292 152 H241"
          stroke="#b49064"
          strokeWidth="2"
          fill="none"
          markerEnd={`url(#${id})`}
        />
        <path
          d="M142 211 V239 H617 V211"
          stroke="#a4a98f"
          strokeWidth="1.5"
          fill="none"
        />
        <text x="380" y="263" fill="#8b927b" textAnchor="middle" fontSize="12">
          GND · 共同参考地
        </text>
        <rect x="325" y="104" width="107" height="27" rx="13" fill="#f0f2e7" />
        <text x="378" y="123" fill="#8b927b" textAnchor="middle" fontSize="11">
          没有时钟线
        </text>
      </Sheet>
    );
  } else if (type === "i2c") {
    caption =
      "所有设备共享 SCL、SDA。每根总线各有上拉电阻；设备只能拉低或释放，不能主动推高。";
    drawing = (
      <Sheet label="I2C 两根总线通过上拉电阻连接 VCC，主机与两个从机并联">
        {defs}
        <g fill="#768761" fontSize="12">
          <text x="26" y="80">
            SCL
          </text>
          <text x="26" y="116">
            SDA
          </text>
          <text x="644" y="20">
            VCC
          </text>
        </g>
        <path
          d="M77 75 H710 M77 111 H710 M650 28 H701"
          stroke="#93a780"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M655 28 V36 l-4 5 8 7 -8 7 8 7 -4 5 V75 M695 28 V36 l-4 5 8 7 -8 7 8 7 -4 5 V111"
          stroke="#ac8d61"
          strokeWidth="1.7"
          fill="none"
        />
        {[135, 340, 545].map((x, i) => (
          <g key={x}>
            <Box
              x={x - 50}
              y={170}
              w={150}
              h={68}
              title={i === 0 ? "主机" : `从机 ${i}`}
              sub={i === 0 ? "控制时序" : i === 1 ? "地址 0x50" : "地址 0x48"}
            />
            <path
              d={`M${x} 75 V170 M${x + 48} 111 V170`}
              stroke="#93a780"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx={x} cy="75" r="3" fill="#81966c" />
            <circle cx={x + 48} cy="111" r="3" fill="#81966c" />
          </g>
        ))}
        <text x="380" y="269" textAnchor="middle" fontSize="11" fill="#8b937c">
          任一设备拉低，整根线就为低。
        </text>
      </Sheet>
    );
  } else {
    caption =
      "UART 先收到 D0：新位从高位进入，每次右移；收到 8 位后，D0 正好落在最低位。";
    drawing = (
      <Sheet
        label="UART 接收移位寄存器从 D7 到 D0 的八个位置，新位从最高位进入"
        height={190}
      >
        {defs}
        <text x="32" y="43" fill="#8d795b" fontSize="13">
          新收到的一位
        </text>
        <path
          d="M72 59 V99 H148"
          stroke="#819569"
          strokeWidth="2"
          fill="none"
          markerEnd={`url(#${id})`}
        />
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i}>
            <rect
              x={170 + i * 66}
              y="70"
              width="53"
              height="55"
              rx="5"
              fill="#fffdf7"
              stroke="#b8c6a6"
            />
            <text
              x={196 + i * 66}
              y="103"
              textAnchor="middle"
              fill="#637d52"
              fontSize="15"
            >
              D{7 - i}
            </text>
            {i < 7 && (
              <path
                d={`M${225 + i * 66} 98 H${233 + i * 66}`}
                stroke="#819569"
                markerEnd={`url(#${id})`}
              />
            )}
          </g>
        ))}
        <text x="440" y="160" textAnchor="middle" fontSize="12" fill="#8b927b">
          rx_shift &lt;= {"{rx_d2, rx_shift[7:1]}"}
        </text>
      </Sheet>
    );
  }
  return (
    <figure className="learning-figure">
      <div className="illustration-surface">{drawing}</div>
      <figcaption>
        {caption}
        <span className="diagram-hint">小屏幕可左右滑动查看完整连接图。</span>
      </figcaption>
    </figure>
  );
}
