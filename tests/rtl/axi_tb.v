`timescale 1ns/1ps
module tb;
    reg clk=0, rst_n=1;
    always #5 clk=~clk;
    reg [3:0] awid=0, arid=0;
    reg [15:0] awaddr=0, araddr=0;
    reg [7:0] awlen=0, arlen=0;
    reg [2:0] awsize=2, arsize=2;
    reg [1:0] awburst=1, arburst=1;
    reg awvalid=0, wvalid=0, arvalid=0, bready=0, rready=0;
    reg [31:0] wdata=0;
    reg [3:0] wstrb=15;
    reg wlast=0;
    wire awready,wready,arready,bvalid,rvalid,rlast;
    wire [3:0] bid,rid;
    wire [1:0] bresp,rresp;
    wire [31:0] rdata;
    axi4_burst_ram dut(
        .clk(clk),.rst_n(rst_n),.awid(awid),.awaddr(awaddr),.awlen(awlen),
        .awsize(awsize),.awburst(awburst),.awvalid(awvalid),.awready(awready),
        .wdata(wdata),.wstrb(wstrb),.wlast(wlast),.wvalid(wvalid),.wready(wready),
        .bid(bid),.bresp(bresp),.bvalid(bvalid),.bready(bready),
        .arid(arid),.araddr(araddr),.arlen(arlen),.arsize(arsize),.arburst(arburst),
        .arvalid(arvalid),.arready(arready),.rid(rid),.rdata(rdata),.rresp(rresp),
        .rlast(rlast),.rvalid(rvalid),.rready(rready)
    );
    reg [31:0] expected [0:1023];
    reg r_stalled=0,b_stalled=0;
    reg [39:0] held_r;
    reg [6:0] held_b;
    integer writes=0,reads=0,wn=0,rn=0,wseen=0,rseen=0;
    reg last_write_seen=0;
    // 检查整个 payload：背压时不仅 DATA，ID/RESP/LAST/VALID 也必须保持。
    always @(posedge clk) begin
        if (!rst_n) begin
            r_stalled=0;b_stalled=0;wseen=0;rseen=0;
        end else begin
            if(r_stalled && {rvalid,rid,rdata,rresp,rlast} !== held_r)
                $fatal(1,"R payload changed under backpressure");
            if(b_stalled && {bvalid,bid,bresp} !== held_b)
                $fatal(1,"B payload changed under backpressure");
            r_stalled=rvalid&&!rready;held_r={rvalid,rid,rdata,rresp,rlast};
            b_stalled=bvalid&&!bready;held_b={bvalid,bid,bresp};
            if(awvalid&&awready)begin
                wn={1'b0,awlen}+1;wseen=0;last_write_seen=0;
            end
            if(wvalid&&wready)begin
                wseen=wseen+1;
                if(wlast !== (wseen==wn))$fatal(1,"wrong WLAST in test");
                if(wlast)last_write_seen=1;
                writes=writes+1;
            end
            if(bvalid && (wseen!=wn || !last_write_seen))
                $fatal(1,"write response before complete AW/W transaction");
            if(arvalid&&arready)begin rn={1'b0,arlen}+1;rseen=0;end
            if(rvalid&&rready)begin
                rseen=rseen+1;reads=reads+1;
                if(rlast !== (rseen==rn))$fatal(1,"wrong RLAST");
            end
        end
    end

    task automatic address_write(input [15:0] addr,input [7:0] len,
        input [2:0] size,input [1:0] burst,input [3:0] id);
        begin
            @(negedge clk);
            awaddr=addr;awlen=len;awsize=size;awburst=burst;awid=id;awvalid=1;
            @(posedge clk);while(!awready)@(posedge clk);
            @(negedge clk);awvalid=0;
        end
    endtask
    task automatic write_burst(input [15:0] addr,input [7:0] len,
        input [2:0] size,input [1:0] burst,input [3:0] id,
        input [3:0] mask,input [31:0] value,input [1:0] response);
        integer beat,lane,index;
        begin
            address_write(addr,len,size,burst,id);
            // AW 输入在握手后改变，验证模块使用的是锁存地址/长度/ID。
            awaddr=16'hffff;awlen=0;awid=0;
            for(beat=0;beat<=len;beat=beat+1)begin
                repeat(beat%3)@(negedge clk);
                @(negedge clk);wdata=value+beat;wstrb=mask;
                wlast=(beat==len);wvalid=1;
                @(posedge clk);while(!wready)@(posedge clk);
                if(response==0)begin
                    index=(addr>>2)+beat;
                    for(lane=0;lane<4;lane=lane+1)
                        if(mask[lane])expected[index][lane*8+:8]=wdata[lane*8+:8];
                end
                @(negedge clk);wvalid=0;wlast=0;
            end
            repeat(4)@(negedge clk);
            while(!bvalid)@(negedge clk);
            if(bresp!==response||bid!==id)$fatal(1,"B response or ID");
            if(awready||wready)$fatal(1,"new write accepted before B completion");
            bready=1;@(posedge clk);@(negedge clk);bready=0;
        end
    endtask
    task automatic read_burst(input [15:0] addr,input [7:0] len,
        input [2:0] size,input [1:0] burst,input [3:0] id,input [1:0] response);
        integer beat;
        reg [31:0] value;
        begin
            @(negedge clk);
            araddr=addr;arlen=len;arsize=size;arburst=burst;arid=id;arvalid=1;
            @(posedge clk);while(!arready)@(posedge clk);
            @(negedge clk);arvalid=0;araddr=16'hffff;arid=0;
            for(beat=0;beat<=len;beat=beat+1)begin
                while(!rvalid)@(negedge clk);
                repeat(1+beat%3)@(negedge clk);
                value=response==0?expected[(addr>>2)+beat]:0;
                if(rdata!==value||rid!==id||rresp!==response||rlast!==(beat==len))
                    $fatal(1,"R data/ID/response/LAST beat %0d at %h",beat,addr);
                if(arready)$fatal(1,"new read accepted before RLAST completion");
                rready=1;@(posedge clk);@(negedge clk);rready=0;
            end
            if(rvalid)$fatal(1,"extra read beat");
        end
    endtask
    task reset;
        begin
            @(negedge clk);rst_n=0;awvalid=0;wvalid=0;arvalid=0;bready=0;rready=0;
            repeat(2)@(negedge clk);rst_n=1;
        end
    endtask

    integer i;
    initial begin
        $dumpfile("axi_tb.vcd");
        $dumpvars(1,tb);
        // 仿真超时单独处理，避免错误 READY 导致无限等待。
        reset();
        for(i=0;i<1024;i=i+1)expected[i]=0;
        // W 先于 AW 到达：主机保持 WVALID，不等 AWREADY 才发 W。
        @(negedge clk);wvalid=1;wdata=32'h11223344;wlast=1;
        repeat(4)begin @(posedge clk);if(wready)$fatal(1,"W accepted without AW");end
        address_write(0,0,2,1,7);
        @(posedge clk);while(!wready)@(posedge clk);
        expected[0]=32'h11223344;
        @(negedge clk);wvalid=0;wlast=0;
        while(!bvalid)@(negedge clk);
        if(bresp!==0||bid!==7)$fatal(1,"W-before-AW response");
        bready=1;@(posedge clk);@(negedge clk);bready=0;
        read_burst(0,0,2,1,9,0);

        write_burst(16'h100,3,2,1,3,15,32'ha0000000,0);
        read_burst(16'h100,3,2,1,6,0);
        // 字节使能，包括全部关闭，不能破坏未选中的字节。
        for(i=0;i<16;i=i+1)
            write_burst(16'h100,0,2,1,i,i,32'hdeadbeef,0);
        read_burst(16'h100,3,2,1,4,0);
        write_burst(16'h400,255,2,1,15,15,32'h12340000,0);
        read_burst(16'h400,255,2,1,14,0);
        // 正好结束于 4 KiB 边界应合法，跨越则报错且不改已有数据。
        write_burst(16'hffc,0,2,1,1,15,32'h56789abc,0);
        write_burst(16'hffc,1,2,1,2,15,0,2);
        read_burst(16'hffc,0,2,1,3,0);
        read_burst(16'hffc,1,2,1,3,2);
        // 不支持的请求必须按声明长度完成响应，而不是挂死/静默绕回。
        write_burst(16'h101,3,2,1,4,15,0,2);
        write_burst(16'h100,3,1,1,5,15,0,2);
        write_burst(16'h100,3,2,0,6,15,0,2);
        write_burst(16'h100,3,2,2,7,15,0,2);
        write_burst(16'h1000,3,2,1,8,15,0,2);
        read_burst(16'h101,3,2,1,4,2);
        read_burst(16'h100,3,1,1,5,2);
        read_burst(16'h100,3,2,0,6,2);
        read_burst(16'h100,3,2,2,7,2);
        read_burst(16'h1000,3,2,1,8,2);
        read_burst(16'h100,3,2,1,9,0);
        // 读写真正并行，但避开同地址碰撞。
        fork
            write_burst(16'h800,15,2,1,11,15,32'habcd0000,0);
            read_burst(16'h400,15,2,1,12,0);
        join
        read_burst(16'h800,15,2,1,13,0);
        // 复位中断未完成事务；RAM 已写内容仍可读。
        address_write(16'h200,3,2,1,0);
        reset();read_burst(16'h100,3,2,1,1,0);
        @(negedge clk);araddr=16'h100;arlen=3;arsize=2;arburst=1;arvalid=1;
        @(posedge clk);@(negedge clk);arvalid=0;
        reset();
        if(bvalid||rvalid)$fatal(1,"reset did not cancel response");
        read_burst(16'h100,0,2,1,2,0);
        $display("PASS AXI4 RAM: 1/4/16/256 beats, W-before-AW, R/B backpressure, IDs, all WSTRB masks, boundary/error responses, concurrent read/write, reset");
        $finish;
    end
    initial begin #200000;$fatal(1,"AXI test timeout");end
endmodule
