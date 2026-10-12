import { useState } from "react";
interface Beat {
  cycle: number;
  valid: boolean;
  ready: boolean;
  data: string;
  accepted: boolean;
}
const values = ["0xA0", "0xB1", "0xC2"];
export default function AxiHandshake() {
  const [ready, setReady] = useState(false),
    [index, setIndex] = useState(0),
    [history, setHistory] = useState<Beat[]>([]);
  const valid = index < values.length;
  function step() {
    const accepted = valid && ready;
    setHistory((h) => [
      ...h,
      {
        cycle: h.length + 1,
        valid,
        ready,
        data: values[index] ?? "—",
        accepted,
      },
    ]);
    if (accepted) setIndex(index + 1);
  }
  return (
    <div className="experiment">
      <div className="experiment-label">
        握手实验 · 你来决定接收方什么时候准备好
      </div>
      <div className="handshake-cells">
        <span className={valid ? "on" : ""}>VALID = {valid ? "1" : "0"}</span>
        <span className={ready ? "on" : ""}>READY = {ready ? "1" : "0"}</span>
        <span>DATA = {values[index] ?? "—"}</span>
      </div>
      <div className="experiment-controls">
        <button
          className="experiment-button"
          aria-pressed={ready}
          onClick={() => setReady(!ready)}
        >
          {ready ? "让接收方等待" : "让接收方就绪"}
        </button>
        <button
          className="experiment-button primary"
          disabled={history.length >= 12}
          onClick={step}
        >
          时钟前进一步
        </button>
        <button
          className="experiment-button"
          onClick={() => {
            setIndex(0);
            setHistory([]);
            setReady(false);
          }}
        >
          重新开始
        </button>
      </div>
      {history.length > 0 && (
        <div className="overflow-x-auto mt-5">
          <table className="w-full min-w-[380px] text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th>上升沿</th>
                <th>VALID</th>
                <th>READY</th>
                <th>DATA</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              {history.map((beat) => (
                <tr key={beat.cycle} className="border-t border-border">
                  <td>{beat.cycle}</td>
                  <td>{Number(beat.valid)}</td>
                  <td>{Number(beat.ready)}</td>
                  <td>{beat.data}</td>
                  <td
                    className={
                      beat.accepted ? "text-[#567c43]" : "text-muted-foreground"
                    }
                  >
                    {beat.accepted
                      ? "完成传输"
                      : beat.valid
                        ? "保持，等待"
                        : "没有数据"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="experiment-status mt-5" aria-live="polite">
        已传输 {index} / 3 个字节。
        {valid && !ready
          ? "接收方尚未就绪，发送方保持当前数据。"
          : valid
            ? "下一个上升沿可以接受当前数据。"
            : "所有字节已经传完。"}
      </div>
    </div>
  );
}
