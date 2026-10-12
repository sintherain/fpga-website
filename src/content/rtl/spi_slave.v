// SPI 模式 0，单字节教学从机。系统 clk 对外部 SCK 过采样。
// 本例需 clk 足够快（建议至少 SCK 的 8 倍，并满足实际时序）。
// CS 到首个 SCK 沿、最后一个采样沿到 CS 释放均留至少 4 个 clk。
// 更高速的从机应使用 SCK 时钟域与 CDC，不可直接套用此例。
module spi_slave (
    input wire clk, rst_n,
    input wire sck, mosi,
    output wire miso,
    input wire cs_n,
    input wire [7:0] tx_data,
    output reg [7:0] rx_data
);
    reg sck_d1, sck_d2, sck_d3;
    reg cs_d1, cs_d2, cs_d3;
    reg mosi_d1, mosi_d2;
    reg [7:0] tx_shift, rx_shift;
    reg miso_bit;
    // ① 未被选中时释放共享 MISO，三态放在顶层 I/O
    assign miso = cs_n ? 1'bz : miso_bit;
    // ② SCK、CS 与 MOSI 同步到本地 clk
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            sck_d1 <= 0; sck_d2 <= 0; sck_d3 <= 0;
            cs_d1 <= 1; cs_d2 <= 1; cs_d3 <= 1;
            mosi_d1 <= 0; mosi_d2 <= 0;
        end else begin
            sck_d1 <= sck; sck_d2 <= sck_d1; sck_d3 <= sck_d2;
            cs_d1 <= cs_n; cs_d2 <= cs_d1; cs_d3 <= cs_d2;
            mosi_d1 <= mosi; mosi_d2 <= mosi_d1;
        end
    end
    wire sck_rise = !sck_d3 && sck_d2;
    wire sck_fall = sck_d3 && !sck_d2;
    wire start = cs_d3 && !cs_d2;
    wire done = !cs_d3 && cs_d2;
    // ③ 片选确定帧边界；只有选中时才收发
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            tx_shift <= 0; rx_shift <= 0; rx_data <= 0; miso_bit <= 0;
        end else if (start) begin
            tx_shift <= tx_data;
            rx_shift <= 0;
            miso_bit <= tx_data[7];
        end else if (done) begin
            rx_data <= rx_shift;
        end else if (!cs_d2) begin
            // ④ 上升沿收，下降沿准备下一位
            if (sck_rise) rx_shift <= {rx_shift[6:0], mosi_d2};
            else if (sck_fall) begin
                miso_bit <= tx_shift[6];
                tx_shift <= {tx_shift[6:0], 1'b0};
            end
        end
    end
endmodule
