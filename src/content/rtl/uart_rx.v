// 8N1 接收器：系统时钟计数定位位中点，非独立 16x 多数表决采样器。
// BAUD_DIV >= 8；整数分频会带来微小波特率误差。
module uart_rx #(
    parameter CLK_FREQ = 50_000_000,
    parameter BAUD_RATE = 115200,
    parameter BAUD_DIV = CLK_FREQ / BAUD_RATE
)(
    input wire clk, rst_n, rx,
    output reg [7:0] data,
    output reg rx_done
);
    localparam CNT_W = (BAUD_DIV > 1) ? $clog2(BAUD_DIV) : 1;
    reg rx_d1, rx_d2, rx_d3;
    reg [CNT_W-1:0] baud_cnt;
    reg [3:0] bit_cnt;
    reg [7:0] rx_shift;
    reg rx_busy;
    // ① 两级同步，然后用历史值检测第二级输出的下降沿
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin rx_d1 <= 1; rx_d2 <= 1; rx_d3 <= 1; end
        else begin rx_d1 <= rx; rx_d2 <= rx_d1; rx_d3 <= rx_d2; end
    end
    wire rx_fall = rx_d3 && !rx_d2;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            data <= 0; rx_done <= 0; baud_cnt <= 0;
            bit_cnt <= 0; rx_shift <= 0; rx_busy <= 0;
        end else begin
            // ② 默认清零，只在成功收帧的那一拍置高
            rx_done <= 1'b0;
            if (!rx_busy) begin
                baud_cnt <= 0;
                bit_cnt <= 0;
                if (rx_fall) begin rx_busy <= 1; rx_shift <= 0; end
            end else begin
                // ③ 每一位独立计时：数满后进入下一位
                if (baud_cnt == BAUD_DIV-1) begin
                    baud_cnt <= 0;
                    bit_cnt <= bit_cnt + 1'b1;
                end else baud_cnt <= baud_cnt + 1'b1;
                // ④ 只在中点确认起始位、收数据、检查停止位
                if (baud_cnt == BAUD_DIV/2-1) begin
                    if (bit_cnt == 0) begin
                        if (rx_d2) rx_busy <= 0;  // 起始毛刺，放弃
                    end else if (bit_cnt <= 8) begin
                        rx_shift <= {rx_d2, rx_shift[7:1]};
                    end else begin
                        rx_busy <= 0;
                        if (rx_d2) begin
                            data <= rx_shift;
                            rx_done <= 1'b1;
                        end  // 停止位为低，丢弃本帧，保留上次 data
                    end
                end
            end
        end
    end
endmodule
