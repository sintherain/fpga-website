// 同步 FIFO，DEPTH >= 1，WIDTH >= 1。支持非 2 的幂深度。
// 普通同步读：读请求在 clk 上升沿被接受，rd_data 随后更新。
module sync_fifo #(
    parameter DEPTH = 16,
    parameter WIDTH = 8
)(
    input wire clk, rst_n,
    input wire wr_en,
    input wire [WIDTH-1:0] wr_data,
    input wire rd_en,
    output reg [WIDTH-1:0] rd_data,
    output wire full, empty
);
    localparam PTR_W = (DEPTH > 1) ? $clog2(DEPTH) : 1;
    localparam COUNT_W = $clog2(DEPTH+1);
    reg [WIDTH-1:0] mem [0:DEPTH-1];
    reg [PTR_W-1:0] wr_ptr, rd_ptr;
    reg [COUNT_W-1:0] count;
    // ① 只统计真正被接受的操作
    assign full = (count == DEPTH);
    assign empty = (count == 0);
    wire do_write = wr_en && !full;
    wire do_read = rd_en && !empty;
    // ② 写入与指针回绕：到最后一个合法地址就回到 0
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) wr_ptr <= 0;
        else if (do_write) begin
            mem[wr_ptr] <= wr_data;
            wr_ptr <= (wr_ptr == DEPTH-1) ? 0 : wr_ptr + 1'b1;
        end
    end
    // ③ 读出是寄存输出，不能在拉高 rd_en 的同一拍提前用新数据
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin rd_ptr <= 0; rd_data <= 0; end
        else if (do_read) begin
            rd_data <= mem[rd_ptr];
            rd_ptr <= (rd_ptr == DEPTH-1) ? 0 : rd_ptr + 1'b1;
        end
    end
    // ④ 同时接受读写则数量不变；空满边界看接受条件
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) count <= 0;
        else case ({do_write, do_read})
            2'b10: count <= count + 1'b1;
            2'b01: count <= count - 1'b1;
            default: count <= count;
        endcase
    end
endmodule
