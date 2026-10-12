`timescale 1ns/1ps
module tb;
    reg clk=0,rst_n=1,start=0,stop=0,hold_scl=1;
    reg [3:0] divider=0;
    wire busy,done;
    wire tick=(divider==7);
    tri1 scl,sda;
    integer starts=0,stops=0;
    always #5 clk=~clk;
    always @(posedge clk)divider<=(divider==7)?0:divider+1;
    assign scl=hold_scl?1'b0:1'bz;
    i2c_start_stop dut(.clk(clk),.rst_n(rst_n),.tick(tick),.start(start),.stop(stop),.scl(scl),.sda(sda),.busy(busy),.done(done));
    always @(negedge sda)if(rst_n&&scl===1'b1)starts=starts+1;
    always @(posedge sda)if(rst_n&&scl===1'b1)stops=stops+1;
    initial begin
        #1 rst_n=0;repeat(3) @(negedge clk);rst_n=1;
        repeat(15) @(negedge clk);start=1;@(negedge clk);start=0;
        repeat(24) @(negedge clk);
        if(starts!=0||!busy)$fatal(1,"START ignored held SCL");
        hold_scl=0;wait(done);@(negedge clk);repeat(4) @(negedge clk);
        if(starts!=1||scl!==0||sda!==0||done!==0)$fatal(1,"START sequencing");
        stop=1;@(negedge clk);stop=0;hold_scl=1;
        repeat(24) @(negedge clk);
        if(stops!=0||!busy)$fatal(1,"STOP ignored held SCL");
        hold_scl=0;wait(done);repeat(3) @(negedge clk);
        if(stops!=1||scl!==1||sda!==1||done!==0)$fatal(1,"STOP sequencing");
        $display("PASS I2C START/STOP: held-clock wait, correct bus edges, one-cycle completion");$finish;
    end
    initial begin #100000;$fatal(1,"I2C timeout");end
endmodule
