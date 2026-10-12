`timescale 1ns/1ps
module tb;
    reg clk=0,rst_n=1,start=0,manual=0,manual_sck=0;
    reg [7:0] payload=0,reply=0,saved;
    wire sck,mosi,miso,cs_n;wire [7:0] master_rx,slave_rx;
    wire slave_sck=manual?manual_sck:sck;
    wire slave_cs=manual?1'b1:cs_n;
    integer i,j;
    always #5 clk=~clk;
    spi_master #(.CLK_DIV(4)) master(.clk(clk),.rst_n(rst_n),.data(payload),.start(start),.sck(sck),.mosi(mosi),.miso(miso),.cs_n(cs_n),.rx_data(master_rx));
    spi_slave slave(.clk(clk),.rst_n(rst_n),.sck(slave_sck),.mosi(mosi),.miso(miso),.cs_n(slave_cs),.tx_data(reply),.rx_data(slave_rx));
    initial begin
        #1 rst_n=0;repeat(4) @(negedge clk);rst_n=1;
        for(i=0;i<256;i=i+1) begin
            @(negedge clk);payload=i;reply=i^8'ha5;start=1;
            @(negedge clk);start=0;
            wait(cs_n==1);repeat(6) @(negedge clk);
            if(master_rx!==(i^8'ha5)||slave_rx!==i[7:0]) $fatal(1,"SPI full duplex mismatch at %d: %h %h",i,master_rx,slave_rx);
            if(miso!==1'bz) $fatal(1,"MISO not released");
        end
        saved=slave.rx_shift;manual=1;
        for(j=0;j<8;j=j+1)begin manual_sck=1;repeat(5) @(negedge clk);manual_sck=0;repeat(5) @(negedge clk);end
        if(slave.rx_shift!==saved||miso!==1'bz) $fatal(1,"Unselected SPI slave responded");
        $display("PASS SPI: 256 full-duplex transfers, inactive CS gating, MISO tri-state");$finish;
    end
    initial begin #500000;$fatal(1,"SPI timeout");end
endmodule
