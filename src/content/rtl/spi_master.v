// SPI 模式 0 主机，MSB 先发，每次片选传输一个字节。
// CLK_DIV >= 2；本书过采样从机配套仿真使用 CLK_DIV >= 4。
module spi_master #(
    parameter CLK_DIV = 4
)(
    input wire clk, rst_n,
    input wire [7:0] data,
    input wire start,
    output reg sck, mosi,
    input wire miso,
    output reg cs_n,
    output reg [7:0] rx_data
);
    localparam CNT_W = (CLK_DIV > 1) ? $clog2(CLK_DIV) : 1;
    reg [CNT_W-1:0] div_cnt;
    reg [2:0] bit_cnt;
    reg [7:0] tx_shift, rx_shift;
    reg active;
    // —— 1. 每 CLK_DIV 拍产生一次半周期节拍 ——
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) div_cnt <= 0;
        else if (!active || div_cnt == CLK_DIV-1) div_cnt <= 0;
        else div_cnt <= div_cnt + 1'b1;
    end
    wire sck_tick = active && (div_cnt == CLK_DIV-1);
    // —— 2. 一个完整 SCK 周期需要翻转两次 ——
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) sck <= 0;
        else if (!active) sck <= 0;
        else if (sck_tick) sck <= ~sck;
    end
    // —— 3. 片选、收发移位与数据交付 ——
    always @(posedge clk or negedge rst_n) begin
        // 复位与启动：首个采样沿之前就放好 D7
        if (!rst_n) begin
            cs_n <= 1; mosi <= 0; active <= 0;
            bit_cnt <= 0; tx_shift <= 0; rx_shift <= 0; rx_data <= 0;
        end else if (start && !active) begin
            active <= 1;
            cs_n <= 0;
            tx_shift <= data;
            rx_shift <= 0;
            mosi <= data[7];
            bit_cnt <= 0;
        end else if (sck_tick) begin
            // 边沿驱动收发：判断的是本拍翻转之前的 SCK
            if (sck == 0) begin
                rx_shift <= {rx_shift[6:0], miso};
            end else if (bit_cnt == 7) begin
                cs_n <= 1;
                rx_data <= rx_shift;
                active <= 0;
            end else begin
                bit_cnt <= bit_cnt + 1'b1;
                mosi <= tx_shift[6];
                tx_shift <= {tx_shift[6:0], 1'b0};
            end
            // 结束主控：最后一次下降沿后回到模式 0 空闲电平
        end
    end
endmodule
