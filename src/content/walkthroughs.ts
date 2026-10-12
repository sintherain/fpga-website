export interface CodeStep {
  title: string;
  explanation: string;
  from: string;
  to?: string;
  tip?: string;
}
export const uartTxSteps: CodeStep[] = [
  {
    title: "先让所有寄存器回到已知状态",
    explanation:
      "复位不仅让线路回到高电平，也要把位计数器清零。否则第一次发送时，电路不知道自己正在发第几位。",
    from: "// ①",
    to: "// ②",
  },
  {
    title: "接到 start，锁存字节并拉低线路",
    explanation:
      "IDLE 是唯一接受 start 的状态。shift 保存这个字节，busy 告诉外部“暂时不要再给数据”，tx=0 则是起始位。",
    from: "// ②",
    to: "// ③",
  },
  {
    title: "起始位数满，再放上 D0",
    explanation:
      "baud_cnt 从 0 数到 BAUD_DIV−1，正好是一个位周期。起始位结束后，最低位 shift[0] 成为线路上的第一位数据。",
    from: "// ③",
    to: "// ④",
  },
  {
    title: "每个位周期，只推进一次",
    explanation:
      "bit_cnt 决定第几位，baud_cnt 决定一位多久。未到 D7 时右移；tx 读 shift[1]，因为非阻塞赋值此时还没更新 shift。",
    from: "// ④",
    to: "// ⑤",
    tip: "不能在同一拍写 shift <= 右移后的值，再假定 tx <= shift[0] 已经读到新值。",
  },
  {
    title: "留够停止位的时间，再回到空闲",
    explanation:
      "停止位为高，也要保持一个完整位周期。最后才撤下 busy，让外部知道这帧已经发完。",
    from: "// ⑤",
    to: "default:",
  },
];
export const uartCounterSteps: CodeStep[] = [
  {
    title: "用 en 标记发送，用 register 保存数据",
    explanation:
      "空闲时接受 start，发送期间保持原字节不变。停止位计时结束，关闭使能。",
    from: "// ①",
    to: "// ②",
  },
  {
    title: "把计数分成“位内”和“位间”",
    explanation:
      "counter0 每个周期回到 0；counter2 在位周期结束时前进一次。位序号 0～9 就是一帧的十个位置。",
    from: "// ②",
    to: "// ③",
  },
  {
    title: "按位序号译码输出",
    explanation:
      "0 是起始位，1～8 是 D0～D7，9 是停止位。它与状态机版提供相同的 8N1 帧；寄存输出的启动时刻相差一个系统时钟。",
    from: "// ③",
    to: "endmodule",
  },
];
export const uartRxSteps: CodeStep[] = [
  {
    title: "先同步，再检测下降沿",
    explanation:
      "rx_d1 是第一级，rx_d2 是可供后级使用的同步输出；rx_d3 只保存 rx_d2 的历史。比较后两级，识别由高到低的变化。",
    from: "// ①",
    to: "always @(posedge clk or negedge rst_n) begin",
  },
  {
    title: "rx_done 只亮一个时钟周期",
    explanation:
      "每一拍先给 rx_done 默认值 0，成功接收时再覆盖成 1。空闲阶段发现下降沿，才开始接收新的一帧。",
    from: "// ②",
    to: "// ③",
  },
  {
    title: "每个数据位都有自己的计时",
    explanation:
      "baud_cnt 数满就回绕，并推进 bit_cnt。0 是起始位，1～8 是数据位，9 是停止位。",
    from: "// ③",
    to: "// ④",
  },
  {
    title: "只在位中点读取线路",
    explanation:
      "起始位中点仍为低，才是真开始。数据位从高位移入、向右挪动。停止位为高才交付数据；为低则丢弃本帧。",
    from: "// ④",
    to: "endmodule",
    tip: "本例每位只采一次；与真正的 16 倍采样、多点表决接收器应区分。同步延迟与波特率误差也要纳入实际验证。",
  },
];
export const spiMasterSteps: CodeStep[] = [
  {
    title: "先建立一个半周期节拍",
    explanation:
      "active 决定计数器是否运行。div_cnt 数满 CLK_DIV−1 时产生 sck_tick，所以一个 SCK 完整周期需要两次节拍。",
    from: "// —— 1.",
    to: "// —— 2.",
  },
  {
    title: "每个节拍翻转一次 SCK",
    explanation:
      "SCK 是主机自己产生的信号。读到的旧值为低，说明这一拍要产生上升沿；旧值为高，则要产生下降沿。",
    from: "// —— 2.",
    to: "// —— 3.",
  },
  {
    title: "复位后，启动时先把 D7 放好",
    explanation:
      "start 只在空闲时有效。拉低 CS，保存发送数据并把最高位放上 MOSI；接收寄存器也从零开始。",
    from: "// 复位与启动",
    to: "// 边沿驱动收发",
  },
  {
    title: "上升沿接收，下降沿更新发送",
    explanation:
      "每次上升沿收一位 MISO；每次下降沿移出下一位 MOSI。第八位收齐后，锁存 rx_data，再释放片选。",
    from: "// 边沿驱动收发",
    to: "// 结束主控",
  },
];
export const spiSlaveSteps: CodeStep[] = [
  {
    title: "没被选中，就放开共享总线",
    explanation:
      "MISO 是多个从机可能共用的线。CS_n 为高时输出高阻态，才能避免多个器件同时驱动。FPGA 内部的多路选择不应靠三态完成。",
    from: "// ①",
    to: "// ②",
  },
  {
    title: "把外来的时钟与数据带入本地时钟域",
    explanation:
      "SCK、CS、MOSI 同步到本地 clk。第三级保存第二级的历史，比较这两个值判断边沿。",
    from: "// ②",
    to: "// ③",
    tip: "这是低速过采样教学结构，须满足源码开头列出的时钟比例与片选间隔。",
  },
  {
    title: "片选确定何时开始、何时交付",
    explanation:
      "CS 拉低时准备最高位并清空接收寄存器；CS 拉高时交付本次采集的数据。只有选中期间才响应 SCK。",
    from: "// ③",
    to: "// ④",
  },
  {
    title: "两个边沿各做一件事",
    explanation:
      "上升沿把 MOSI 收入最低位；下降沿准备下一位 MISO。这与模式 0 主机的采样、移位安排一致。",
    from: "// ④",
    to: "endmodule",
  },
];
export const fifoSteps: CodeStep[] = [
  {
    title: "请求不等于成功：先看空满标志",
    explanation:
      "do_write 与 do_read 才代表真正接受的操作。满时拒绝写，空时拒绝读；计数器也只统计被接受的操作。",
    from: "// ①",
    to: "// ②",
  },
  {
    title: "写入当前位置，然后挪动写指针",
    explanation:
      "到 DEPTH−1 时显式回到 0，因此深度不必是 2 的幂。其他位置就正常加一。",
    from: "// ②",
    to: "// ③",
  },
  {
    title: "读取当前位置，数据随后才有效",
    explanation:
      "这是寄存读输出。接收模块要在读请求被接受、rd_data 更新之后再使用它，不能当成首字直通 FIFO。",
    from: "// ③",
    to: "// ④",
  },
  {
    title: "用成功的读写组合更新数量",
    explanation:
      "只写入就加一，只读出就减一，同时成功则不变。满且同时请求读写时，本例只接受读；空时则只接受写。",
    from: "// ④",
    to: "endmodule",
  },
];
export const i2cSteps: CodeStep[] = [
  {
    title: "输出只有“拉低”和“释放”",
    explanation:
      "scl_oe/sda_oe 为 1 时拉低，为 0 时输出高阻。实际的高电平来自外部上拉电阻。读回线路电平后要同步。",
    from: "// ①",
    to: "// ②",
  },
  {
    title: "把延时改成真正的时序状态",
    explanation:
      "每次 tick 是一个节拍，状态机在节拍到来时推进。tick 需要由系统时钟计数器产生，间隔满足器件时序；它不是一个新的时钟。",
    from: "// ②",
    to: "// ③",
  },
  {
    title: "先确认高电平，再制造 START",
    explanation:
      "等待 SCL/SDA 实际为高后，先拉低 SDA。再经过一个节拍拉低 SCL，为后续数据位做准备。",
    from: "// ③",
    to: "// ④",
  },
  {
    title: "STOP 的两个动作不能颠倒",
    explanation:
      "SDA 先保持低，释放 SCL并等它实际升高；再等一个节拍，最后释放 SDA。这里只演示起止条件，还没实现地址、数据与 ACK。",
    from: "// ④",
    to: "default:",
  },
];
