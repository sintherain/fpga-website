export interface Chapter {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  question: string;
  headings: string[];
  subheadings?: Record<string, string[]>;
}
export const chapters: Chapter[] = [
  {
    id: "fpga",
    num: "01",
    title: "认识 FPGA",
    subtitle: "从代码到电路",
    tag: "入门 · 建立硬件思维",
    description: "认识芯片里的查找表、触发器和存储器，理解代码如何变成电路。",
    question:
      "为什么同样一段逻辑，在 FPGA 中可以并行运行？UART 与 SPI 接收时的移位方向为什么不同？",
    headings: [
      "FPGA 和单片机有什么本质区别？",
      "芯片内部有什么？",
      "一块典型的开发板",
      "从代码到电路：开发流程",
      "一个反复出现的构件：移位寄存器",
    ],
  },
  {
    id: "uart",
    num: "02",
    title: "UART 串口",
    subheadings: {
      核心功能的实现: [
        "Verilog 实现（1/2）：状态机 + 波特率计数器",
        "Verilog 实现（2/2）：计数器译码",
      ],
      拓展功能实现: [
        "1 · 奇偶校验位",
        "2 · 可变帧格式（参数化）",
        "3 · 多字节连续发送（FIFO）",
        "4 · 帧完成信号 Tx_done",
        "5 · 接收端 RX",
      ],
    },
    subtitle: "没有时钟线的通信",
    tag: "接口 · 交互波形与分段代码",
    description: "发送一个字节，观察位序与采样点，再逐步搭建发送器和接收器。",
    question:
      "接收方没有时钟线，怎样找到数据位的中点？busy 和 rx_done 分别告诉外部什么？",
    headings: [
      "一帧数据长什么样？",
      "动手试试：发送一个字节",
      "核心功能的实现",
      "拓展功能实现",
    ],
  },
  {
    id: "spi",
    num: "03",
    title: "SPI 总线",
    subtitle: "跟着时钟传送数据",
    tag: "接口 · 四种模式与主从实现",
    description: "理解片选、采样沿与移位沿，看清四种模式怎样改变时序。",
    question:
      "模式 0 的第一位为什么要提前放好？未被选中的从机为什么必须释放 MISO？",
    headings: [
      "四根信号线",
      "主从连接：一主多从",
      "四种模式：CPOL 与 CPHA",
      "Verilog 实现：模式 0 主机",
      "Verilog 实现：模式 0 从机",
    ],
  },
  {
    id: "i2c",
    num: "04",
    title: "I2C 总线",
    subtitle: "两根线，多个设备",
    tag: "接口 · 开漏、寻址与应答",
    description:
      "从上拉电阻讲起，沿着起始、地址、应答、数据和停止走完一次写事务。",
    question: "为什么释放 SDA 不等于主动输出 1？第九个时钟是谁在驱动 SDA？",
    headings: [
      "开漏输出 + 上拉电阻：I2C 的物理基础",
      "起始与停止条件",
      "一次完整的写事务",
      "Verilog 实现要点",
      "I2C vs SPI",
    ],
  },
  {
    id: "axi",
    num: "05",
    title: "AXI 与握手",
    subtitle: "让模块配合工作",
    tag: "系统 · 理解背压与传输",
    description: "理解 VALID/READY 的配合，区分等待、完成一次传输和连续传输。",
    question:
      "VALID 已经为高，READY 还没准备好时，数据可以变化吗？什么时候算真正传了一拍？",
    headings: [
      "五个独立通道",
      "核心机制：VALID / READY 握手",
      "动手试试：控制接收节奏",
      "三种常见变体",
    ],
  },
  {
    id: "fifo",
    num: "06",
    title: "FIFO 缓冲",
    subtitle: "给数据一个等候区",
    tag: "模块 · 指针、容量与读写",
    description: "亲手把数据放入队列、依次取出，再看指针与计数器如何实现它。",
    question: "同时读写时数量一定不变吗？同步 FIFO 的读数据在哪个时刻才有效？",
    headings: [
      "为什么需要 FIFO",
      "动手试试：让数据排队",
      "同步 FIFO 的组成",
      "异步 FIFO（跨时钟域）",
      "常用参数与接口",
      "和 UART 发送器配合",
    ],
  },
  {
    id: "roadmap",
    num: "07",
    title: "学习路线",
    subtitle: "把知识用起来",
    tag: "实践 · 从仿真到上板",
    description: "把协议知识串起来，选择下一项实验，找到可靠的参考资料。",
    question:
      "你准备先做哪个最小实验？仿真波形中，哪些现象能证明它按预期工作？",
    headings: ["一步一步，搭出自己的电路", "练习与参考资料"],
  },
];
