`timescale 1ns/1ps
module tb;
    reg clk=0,rst_n=1,rx=1;
    wire [7:0] data;wire done;
    integer count=0,i;
    reg [7:0] value;
    always #5 clk=~clk;
    uart_rx #(.BAUD_DIV(17)) dut(.clk(clk),.rst_n(rst_n),.rx(rx),.data(data),.rx_done(done));
    always @(posedge clk) if(rst_n&&done) count=count+1;
    task sendbit(input b);begin rx=b;repeat(17) @(negedge clk);end endtask
    task frame(input [7:0] v,input stopbit);begin sendbit(0);for(i=0;i<8;i=i+1)sendbit(v[i]);sendbit(stopbit);rx=1;repeat(20) @(negedge clk);end endtask
    initial begin
        #1 rst_n=0;repeat(3) @(negedge clk);rst_n=1;
        rx=0;repeat(2) @(negedge clk);rx=1;repeat(200) @(negedge clk);
        if(count!=0) $fatal(1,"False start was accepted");
        frame(8'h96,1);
        if(count!=1||data!==8'h96||done!==0) $fatal(1,"Odd divisor valid frame failed");
        frame(8'h5a,0);
        if(count!=1||data!==8'h96) $fatal(1,"Invalid stop frame was accepted");
        $display("PASS UART RX: odd divisor, false start rejected, invalid stop discarded");$finish;
    end
    initial begin #100000;$fatal(1,"RX timeout");end
endmodule
