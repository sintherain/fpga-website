// AXI4 教学从机：32 位数据、16 位字节地址、4 位 ID、4 KiB 存储空间。
// 支持对齐的全宽 INCR 突发（1..256 拍），每方向最多一笔在途事务。
// AW/W 可以先后到达：W 先到时本例以 WREADY=0 等待 AW，不要求主机等 AWREADY。
// 不支持 FIXED/WRAP、窄传输、非对齐访问、独占及额外 sideband 功能。
// 不支持的地址请求返回 SLVERR：写仍接收规定拍数；读仍返回规定拍数。
// 主机必须正确给出 WLAST；错误 WLAST 不提供恢复保证，应复位并修正主机。
// RAM 不复位：先写再读。同地址读写冲突应避免，硬件行为需按器件确认。
// 此数组用于解释控制逻辑，不承诺推断成某种 FPGA 块 RAM。
module axi4_burst_ram (
    input wire clk, input wire rst_n,
    input wire [3:0] awid, input wire [15:0] awaddr,
    input wire [7:0] awlen, input wire [2:0] awsize,
    input wire [1:0] awburst, input wire awvalid, output wire awready,
    input wire [31:0] wdata, input wire [3:0] wstrb,
    input wire wlast, input wire wvalid, output wire wready,
    output reg [3:0] bid, output reg [1:0] bresp,
    output reg bvalid, input wire bready,
    input wire [3:0] arid, input wire [15:0] araddr,
    input wire [7:0] arlen, input wire [2:0] arsize,
    input wire [1:0] arburst, input wire arvalid, output wire arready,
    output reg [3:0] rid, output reg [31:0] rdata,
    output reg [1:0] rresp, output reg rlast,
    output reg rvalid, input wire rready
);
    reg [31:0] mem [0:1023];
    reg wr_active, wr_error, rd_error;
    reg [15:0] wr_addr, rd_addr;
    reg [8:0] wr_left, rd_left;
    reg [3:0] wr_id;
    integer lane;

    // ① 先确认请求落在本模块的能力与地址范围内
    function request_ok;
        input [15:0] addr;
        input [7:0] len;
        input [2:0] size;
        input [1:0] burst;
        reg [18:0] end_addr;
        begin
            // 末端使用不包含的地址；加一前扩展位宽，避免 LEN=255 溢出
            end_addr = {3'b0, addr} + (({11'b0, len} + 19'd1) << 2);
            request_ok = (size == 3'd2) && (burst == 2'b01)
                && (addr[1:0] == 0) && (addr < 16'd4096)
                && (end_addr <= 19'd4096);
        end
    endfunction

    // ② READY 由保存下来的状态决定；fire 只在时钟沿生效
    assign awready = rst_n && !wr_active && !bvalid;
    assign wready  = rst_n && wr_active;
    assign arready = rst_n && !rvalid;
    wire aw_fire = awvalid && awready;
    wire w_fire  = wvalid && wready;
    wire b_fire  = bvalid && bready;
    wire ar_fire = arvalid && arready;
    wire r_fire  = rvalid && rready;

    always @(posedge clk or negedge rst_n) begin
        // ③ 只复位控制与输出，不逐字清空 RAM
        if (!rst_n) begin
            wr_active <= 0; wr_error <= 0;
            wr_addr <= 0; wr_left <= 0; wr_id <= 0;
            bid <= 0; bresp <= 0; bvalid <= 0;
        end else begin
            if (b_fire) bvalid <= 0;

            // ④ AW 握手：保存整笔写事务的描述
            if (aw_fire) begin
                wr_active <= 1;
                wr_addr <= awaddr;
                wr_left <= {1'b0, awlen} + 9'd1;
                wr_id <= awid;
                wr_error <= !request_ok(awaddr, awlen, awsize, awburst);
            end

            // ⑤ W 握手：按字节使能写入，成功一拍才推进地址
            if (w_fire) begin
                if (!wr_error) begin
                    for (lane = 0; lane < 4; lane = lane + 1)
                        if (wstrb[lane])
                            mem[wr_addr[11:2]][lane*8 +: 8]
                                <= wdata[lane*8 +: 8];
                end

                // ⑥ 最后一拍必须同时满足长度计数与 WLAST
                if (wr_left == 1 && wlast) begin
                    wr_active <= 0;
                    bid <= wr_id;
                    bresp <= wr_error ? 2'b10 : 2'b00;
                    bvalid <= 1;
                end else if (wr_left > 1) begin
                    wr_addr <= wr_addr + 16'd4;
                    wr_left <= wr_left - 9'd1;
                    if (wlast) wr_error <= 1;
                end else begin
                    wr_error <= 1; // 主机漏给 WLAST，须修正主机/复位
                end
            end
        end
    end

    always @(posedge clk or negedge rst_n) begin
        // ⑦ AR 握手：锁存地址，准备第一拍读输出
        if (!rst_n) begin
            rd_addr <= 0; rd_left <= 0; rd_error <= 0;
            rid <= 0; rdata <= 0; rresp <= 0; rlast <= 0; rvalid <= 0;
        end else if (ar_fire) begin
            rd_addr <= araddr;
            rd_left <= {1'b0, arlen} + 9'd1;
            rd_error <= !request_ok(araddr, arlen, arsize, arburst);
            rid <= arid;
            rdata <= request_ok(araddr, arlen, arsize, arburst)
                ? mem[araddr[11:2]] : 32'd0;
            rresp <= request_ok(araddr, arlen, arsize, arburst)
                ? 2'b00 : 2'b10;
            rlast <= (arlen == 0);
            rvalid <= 1;

        // ⑧ R 握手：前一拍被接收后，才能准备下一拍
        end else if (r_fire) begin
            if (rd_left == 1) begin
                rvalid <= 0;
                rlast <= 0;
            end else begin
                rd_addr <= rd_addr + 16'd4;
                rd_left <= rd_left - 9'd1;
                rdata <= rd_error ? 32'd0 : mem[(rd_addr + 16'd4) >> 2];
                rlast <= (rd_left == 2);
            end
        end
        // 没有握手时不赋新值：RVALID/RDATA/RRESP/RID/RLAST 全部保持
    end
endmodule
