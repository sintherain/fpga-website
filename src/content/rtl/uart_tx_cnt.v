// 8N1 计数器译码版。仅在 !busy 时接受 start，BAUD_DIV >= 2。
module uart_tx_cnt #(
    parameter CLK_FREQ = 50_000_000,
    parameter BAUD_RATE = 115200,
    parameter BAUD_DIV = CLK_FREQ / BAUD_RATE
)(
    input wire clk, rst_n,
    input wire [7:0] data,
    input wire start,
    output reg tx,
    output wire busy
);
    localparam CNT_W = (BAUD_DIV > 1) ? $clog2(BAUD_DIV) : 1;
    reg [CNT_W-1:0] counter0;
    reg [3:0] counter2;
    reg [7:0] register;
    reg en;
    assign busy = en;

    // ① 使能与数据锁存：发送过程中忽略新的 start
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin en <= 0; register <= 0; end
        else if (start && !en) begin en <= 1; register <= data; end
        else if (en && counter2 == 9 && counter0 == BAUD_DIV-1) en <= 0;
    end
    // ② 位内计数与位序号：只有真正发送时才前进
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin counter0 <= 0; counter2 <= 0; end
        else if (!en) begin counter0 <= 0; counter2 <= 0; end
        else if (counter0 == BAUD_DIV-1) begin
            counter0 <= 0;
            counter2 <= (counter2 == 9) ? 0 : counter2 + 1'b1;
        end else counter0 <= counter0 + 1'b1;
    end
    // ③ 当前位序号决定线路输出。寄存输出比计数器晚一个 clk。
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) tx <= 1;
        else if (en) begin
            case (counter2)
                0: tx <= 0;
                1: tx <= register[0];
                2: tx <= register[1];
                3: tx <= register[2];
                4: tx <= register[3];
                5: tx <= register[4];
                6: tx <= register[5];
                7: tx <= register[6];
                8: tx <= register[7];
                9: tx <= 1;
                default: tx <= 1;
            endcase
        end else tx <= 1;
    end
endmodule
