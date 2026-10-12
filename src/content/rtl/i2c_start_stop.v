// 只演示 START/STOP，不是完整 I2C 主机。tick 是单周期节拍脉冲。
// 顶层 scl/sda 引脚需要外部上拉。START 完成后保持 SCL/SDA 为低。
module i2c_start_stop (
    input wire clk, rst_n, tick,
    input wire start, stop,
    inout wire scl, sda,
    output reg busy, done
);
    localparam IDLE=0, START_WAIT=1, START_HOLD=2,
               STOP_LOW=3, STOP_WAIT=4, STOP_HOLD=5;
    reg [2:0] state;
    reg scl_oe, sda_oe;
    reg scl_d1, scl_d2, sda_d1, sda_d2;
    // ① 开漏：1 表示拉低，0 表示释放
    assign scl = scl_oe ? 1'b0 : 1'bz;
    assign sda = sda_oe ? 1'b0 : 1'bz;
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin scl_d1<=1; scl_d2<=1; sda_d1<=1; sda_d2<=1; end
        else begin scl_d1<=scl; scl_d2<=scl_d1; sda_d1<=sda; sda_d2<=sda_d1; end
    end
    // ② 用节拍与状态等待，替代仿真中的 # 延时
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state<=IDLE; scl_oe<=0; sda_oe<=0; busy<=0; done<=0;
        end else begin
            done <= 0;
            case (state)
                IDLE: begin
                    if (start) begin
                        scl_oe<=0; sda_oe<=0; busy<=1; state<=START_WAIT;
                    end else if (stop) begin
                        scl_oe<=1; sda_oe<=1; busy<=1; state<=STOP_LOW;
                    end
                end
                // ③ 总线确实为高后，拉低 SDA 产生 START
                START_WAIT: if (tick && scl_d2 && sda_d2) begin
                    sda_oe<=1; state<=START_HOLD;
                end
                START_HOLD: if (tick) begin
                    scl_oe<=1; busy<=0; done<=1; state<=IDLE;
                end
                // ④ SDA 保持低，先释放 SCL，再等它实际升高
                STOP_LOW: if (tick) begin scl_oe<=0; state<=STOP_WAIT; end
                STOP_WAIT: if (tick && scl_d2) state<=STOP_HOLD;
                STOP_HOLD: if (tick) begin
                    sda_oe<=0; busy<=0; done<=1; state<=IDLE;
                end
                default: begin state<=IDLE; busy<=0; scl_oe<=0; sda_oe<=0; end
            endcase
        end
    end
endmodule
