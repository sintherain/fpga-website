// UART 8N1 发送器，LSB 先发。BAUD_DIV >= 2。
module uart_tx #(
    parameter CLK_FREQ = 50_000_000,
    parameter BAUD_RATE = 115200,
    parameter BAUD_DIV = CLK_FREQ / BAUD_RATE
)(
    input wire clk, rst_n,
    input wire [7:0] data,
    input wire start,
    output reg tx,
    output reg busy
);
    localparam IDLE=2'd0, START=2'd1, DATA=2'd2, STOP=2'd3;
    localparam CNT_W = (BAUD_DIV > 1) ? $clog2(BAUD_DIV) : 1;
    reg [1:0] state;
    reg [CNT_W-1:0] baud_cnt;
    reg [2:0] bit_cnt;
    reg [7:0] shift;

    always @(posedge clk or negedge rst_n) begin
        // ① 每个寄存器都有确定的初值
        if (!rst_n) begin
            state <= IDLE;
            baud_cnt <= 0;
            bit_cnt <= 0;
            shift <= 0;
            tx <= 1'b1;
            busy <= 1'b0;
        end else begin
            case (state)
                // ② 接受 start，锁存数据，并立刻送出起始位
                IDLE: begin
                    tx <= 1'b1;
                    busy <= 1'b0;
                    baud_cnt <= 0;
                    bit_cnt <= 0;
                    if (start) begin
                        shift <= data;
                        tx <= 1'b0;
                        busy <= 1'b1;
                        state <= START;
                    end
                end
                // ③ 一个完整的起始位结束，开始输出 D0
                START: begin
                    if (baud_cnt == BAUD_DIV-1) begin
                        baud_cnt <= 0;
                        tx <= shift[0];
                        state <= DATA;
                    end else baud_cnt <= baud_cnt + 1'b1;
                end
                // ④ 每过一个位周期，右移并送出下一位
                DATA: begin
                    if (baud_cnt == BAUD_DIV-1) begin
                        baud_cnt <= 0;
                        if (bit_cnt == 7) begin
                            tx <= 1'b1;
                            state <= STOP;
                        end else begin
                            bit_cnt <= bit_cnt + 1'b1;
                            shift <= {1'b0, shift[7:1]};
                            tx <= shift[1];
                        end
                    end else baud_cnt <= baud_cnt + 1'b1;
                end
                // ⑤ 停止位也必须持续一个完整位周期
                STOP: begin
                    if (baud_cnt == BAUD_DIV-1) begin
                        baud_cnt <= 0;
                        busy <= 1'b0;
                        state <= IDLE;
                    end else baud_cnt <= baud_cnt + 1'b1;
                end
                default: begin state <= IDLE; tx <= 1'b1; busy <= 0; end
            endcase
        end
    end
endmodule
