`timescale 1ns/1ps
module tb;
    reg clk=0,rst_n=1,wr=0,rd=0;
    reg [7:0] value=0;
    wire [7:0] out3,out1;wire full3,empty3,full1,empty1;
    reg [7:0] model[0:1][0:2],expected_read[0:1];
    integer count[0:1],capacity[0:1];
    integer i,j,k;reg do_write,do_read,accepted_read[0:1];
    always #5 clk=~clk;
    sync_fifo #(.DEPTH(3)) d3(.clk(clk),.rst_n(rst_n),.wr_en(wr),.wr_data(value),.rd_en(rd),.rd_data(out3),.full(full3),.empty(empty3));
    sync_fifo #(.DEPTH(1)) d1(.clk(clk),.rst_n(rst_n),.wr_en(wr),.wr_data(value),.rd_en(rd),.rd_data(out1),.full(full1),.empty(empty1));
    task step(input w,input r,input [7:0] v);begin
        @(negedge clk);wr=w;rd=r;value=v;
        for(j=0;j<2;j=j+1)begin
            do_write=w&&(count[j]<capacity[j]);do_read=r&&(count[j]>0);accepted_read[j]=do_read;
            if(do_read)begin expected_read[j]=model[j][0];for(k=0;k<2;k=k+1)model[j][k]=model[j][k+1];count[j]=count[j]-1;end
            if(do_write)begin model[j][count[j]]=v;count[j]=count[j]+1;end
        end
        @(posedge clk);#1;
        if(accepted_read[0]&&out3!==expected_read[0])$fatal(1,"DEPTH3 data order");
        if(accepted_read[1]&&out1!==expected_read[1])$fatal(1,"DEPTH1 data order");
        if(full3!==(count[0]==3)||empty3!==(count[0]==0)||full1!==(count[1]==1)||empty1!==(count[1]==0))$fatal(1,"FIFO flags");
    end endtask
    initial begin
        count[0]=0;count[1]=0;capacity[0]=3;capacity[1]=1;
        #1 rst_n=0;repeat(3) @(negedge clk);rst_n=1;
        step(0,1,0);step(1,1,8'h11);step(1,0,8'h22);step(1,0,8'h33);step(1,1,8'h44);
        for(i=0;i<400;i=i+1)step(i%3!=0,i%4!=0,i);
        repeat(5)step(0,1,0);
        $display("PASS FIFO: DEPTH 1/3, pointer wrap, order, empty/full, simultaneous requests");$finish;
    end
endmodule
