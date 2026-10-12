`timescale 1ns/1ps
module tb;
    reg clk=0, rst_n=1, start=0;
    reg [7:0] payload=0, expected=0;
    wire tx_a,tx_b,busy_a,busy_b,done_a,done_b;
    wire [7:0] rx_a,rx_b;
    integer count_a=0,count_b=0,i;
    reg previous_a=0,previous_b=0;
    always #5 clk=~clk;
    uart_tx #(.BAUD_DIV(16)) a(.clk(clk),.rst_n(rst_n),.data(payload),.start(start),.tx(tx_a),.busy(busy_a));
    uart_tx_cnt #(.BAUD_DIV(16)) b(.clk(clk),.rst_n(rst_n),.data(payload),.start(start),.tx(tx_b),.busy(busy_b));
    uart_rx #(.BAUD_DIV(16)) ra(.clk(clk),.rst_n(rst_n),.rx(tx_a),.data(rx_a),.rx_done(done_a));
    uart_rx #(.BAUD_DIV(16)) rb(.clk(clk),.rst_n(rst_n),.rx(tx_b),.data(rx_b),.rx_done(done_b));
    always @(posedge clk) if(rst_n) begin
        if(done_a) begin
            if(previous_a || rx_a !== expected) $fatal(1,"FSM loopback / rx_done failure");
            count_a=count_a+1;
        end
        if(done_b) begin
            if(previous_b || rx_b !== expected) $fatal(1,"Counter loopback / rx_done failure");
            count_b=count_b+1;
        end
        previous_a=done_a;previous_b=done_b;
    end else begin previous_a=0;previous_b=0;end
    initial begin
        #1 rst_n=0;repeat(3) @(negedge clk);rst_n=1;
        for(i=0;i<256;i=i+1) begin
            @(negedge clk);payload=i;expected=i;start=1;
            @(negedge clk);start=0;payload=~i; // 锁存后的输入变化不能污染发送
            repeat(20) @(negedge clk);start=1; // 忙时的请求必须忽略
            @(negedge clk);start=0;
            wait(!busy_a&&!busy_b);repeat(3) @(negedge clk);
            if(count_a!=i+1||count_b!=i+1) $fatal(1,"Missing or repeated UART frame");
        end
        if(done_a!==0||done_b!==0) $fatal(1,"rx_done must return low");
        start=1;@(negedge clk);start=0;repeat(20) @(negedge clk);
        rst_n=0;repeat(3) @(negedge clk);rst_n=1;repeat(3) @(negedge clk);
        if(tx_a!==1||tx_b!==1||busy_a!==0||busy_b!==0) $fatal(1,"Reset during frame failed");
        $display("PASS UART: 256 bytes on both transmitters, busy requests ignored, one-cycle done, reset mid-frame");$finish;
    end
    initial begin #1000000;$fatal(1,"UART timeout");end
endmodule
