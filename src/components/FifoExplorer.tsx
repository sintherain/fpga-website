import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { fifoOperation } from "../lib/fifo-model";

const format = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");
const DURATION = 1000;
interface Transfer {
  id: number;
  incoming: number | null;
  outgoing: number | null;
  rejectedWrite: boolean;
  rejectedRead: boolean;
}

export default function FifoExplorer() {
  const [queue, setQueue] = useState<number[]>([]);
  const [next, setNext] = useState(0x10);
  const [lastRead, setLastRead] = useState<number | null>(null);
  const [message, setMessage] = useState(
    "队列现在是空的。先从右侧写入几个字节。",
  );
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [width, setWidth] = useState(640);
  const stage = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  const arrow = useId();

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(260, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function operate(write: boolean, read: boolean) {
    if (transfer) return;
    const result = fifoOperation(queue, next, write, read, 8);
    setQueue(result.queue);
    if (result.wrote) setNext((next + 1) & 255);
    setMessage(
      (result.wrote
        ? `写入 0x${format(next)}。`
        : write
          ? "队列已满，写入未被接受。"
          : "") +
        (result.read !== null
          ? `读出 0x${format(result.read)}。`
          : read
            ? "队列为空，读取未被接受。"
            : ""),
    );
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (result.read !== null) setLastRead(result.read);
      return;
    }
    setTransfer({
      id: ++sequence.current,
      incoming: result.wrote ? next : null,
      outgoing: result.read,
      rejectedWrite: write && !result.wrote,
      rejectedRead: read && result.read === null,
    });
    timer.current = setTimeout(() => {
      if (result.read !== null) setLastRead(result.read);
      setTransfer(null);
      timer.current = null;
    }, DURATION);
  }
  function reset() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setTransfer(null);
    setQueue([]);
    setNext(0x10);
    setLastRead(null);
    setMessage("队列已清空。可以重新开始。");
  }

  // 保持八个位置和左右端口在同一行；小屏幕只缩小间距，不缩小整张图。
  const portWidth = width < 480 ? 36 : 60;
  const gap = width < 480 ? 14 : 24;
  const start = portWidth + gap;
  const end = width - start;
  const pitch = (end - start) / 8;
  const cellWidth = pitch - (width < 480 ? 3 : 6);
  const motionStyle = (from: number, to: number) =>
    ({
      "--fifo-from": `${from}px`,
      "--fifo-to": `${to}px`,
    }) as CSSProperties;

  return (
    <div className="experiment">
      <div className="experiment-label">
        队列实验 · 看一个字节进来，再看它出去
      </div>
      <div className="fifo-flow-heading">
        <span>← 数据从右向左流动</span>
        <span>
          {queue.length} / 8 个位置 ·{" "}
          {queue.length === 0 ? "空" : queue.length === 8 ? "满" : "可以读写"}
        </span>
      </div>
      <div className="fifo-motion-stage" ref={stage}>
        <svg
          viewBox={`0 0 ${width} 196`}
          width={width}
          height={196}
          role="img"
          aria-label={`右侧写入，左侧读出。FIFO 从最早到最新：${queue.map(format).join("、") || "空"}。上次读出：${lastRead === null ? "暂无" : format(lastRead)}`}
        >
          <defs>
            <marker
              id={arrow}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M1 1 L8 5 L1 9"
                fill="none"
                stroke="#96a882"
                strokeWidth="1.7"
              />
            </marker>
          </defs>
          <text
            x={width / 2}
            y={29}
            textAnchor="middle"
            className="fifo-diagram-heading"
          >
            FIFO · 按到达顺序排队
          </text>
          <text
            x={portWidth / 2}
            y={61}
            textAnchor="middle"
            className="fifo-port-label"
          >
            读出端
          </text>
          <text
            x={width - portWidth / 2}
            y={61}
            textAnchor="middle"
            className="fifo-port-label"
          >
            写入端
          </text>
          <rect
            x={0.5}
            y={80}
            width={portWidth - 1}
            height={40}
            rx={6}
            className={`fifo-output-port ${transfer?.rejectedRead ? "fifo-rejected" : ""}`}
          />
          <text
            x={portWidth / 2}
            y={105}
            textAnchor="middle"
            className="fifo-port-value"
          >
            {lastRead === null ? "—" : format(lastRead)}
          </text>
          <rect
            x={width - portWidth + 0.5}
            y={80}
            width={portWidth - 1}
            height={40}
            rx={6}
            className={`fifo-input-port ${transfer?.rejectedWrite ? "fifo-rejected" : ""}`}
          />
          <text
            x={width - portWidth / 2}
            y={105}
            textAnchor="middle"
            className="fifo-port-value"
          >
            {format(next)}
          </text>
          <path
            d={`M${start - 3} 100 H${portWidth + 3}`}
            fill="none"
            stroke="#aaba94"
            markerEnd={`url(#${arrow})`}
          />
          <path
            d={`M${width - portWidth - 3} 100 H${end + 1}`}
            fill="none"
            stroke="#aaba94"
            markerEnd={`url(#${arrow})`}
          />
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x={start + i * pitch}
              y={80}
              width={cellWidth}
              height={40}
              rx={4}
              className="fifo-empty-cell"
            />
          ))}
          {queue.map((value, i) => (
            <g
              key={value}
              className="fifo-queued-byte"
              style={{
                transform: `translateX(${start + i * pitch}px)`,
                opacity: transfer?.incoming === value ? 0 : 1,
              }}
            >
              <rect x={0} y={80} width={cellWidth} height={40} rx={4} />
              <text x={cellWidth / 2} y={105} textAnchor="middle">
                {format(value)}
              </text>
            </g>
          ))}
          {transfer?.outgoing !== null && transfer?.outgoing !== undefined && (
            <g
              key={`out-${transfer.id}`}
              className="fifo-moving-byte fifo-moving-out"
              style={motionStyle(start, (portWidth - cellWidth) / 2)}
            >
              <rect x={0} y={80} width={cellWidth} height={40} rx={4} />
              <text x={cellWidth / 2} y={105} textAnchor="middle">
                {format(transfer.outgoing)}
              </text>
            </g>
          )}
          {transfer?.incoming !== null && transfer?.incoming !== undefined && (
            <g
              key={`in-${transfer.id}`}
              className="fifo-moving-byte fifo-moving-in"
              style={motionStyle(
                width - portWidth + (portWidth - cellWidth) / 2,
                start + (queue.length - 1) * pitch,
              )}
            >
              <rect x={0} y={80} width={cellWidth} height={40} rx={4} />
              <text x={cellWidth / 2} y={105} textAnchor="middle">
                {format(transfer.incoming)}
              </text>
            </g>
          )}
          <text
            x={portWidth / 2}
            y={144}
            textAnchor="middle"
            className={
              transfer?.rejectedRead ? "fifo-refusal-label" : "fifo-end-note"
            }
          >
            {transfer?.rejectedRead ? "空 · 拒绝" : "上次读出"}
          </text>
          <text
            x={width - portWidth / 2}
            y={144}
            textAnchor="middle"
            className={
              transfer?.rejectedWrite ? "fifo-refusal-label" : "fifo-end-note"
            }
          >
            {transfer?.rejectedWrite ? "满 · 拒绝" : "下一字节"}
          </text>
          <text x={start} y={166} className="fifo-end-note">
            最早到达
          </text>
          <text x={end - 3} y={166} textAnchor="end" className="fifo-end-note">
            最近到达
          </text>
        </svg>
      </div>
      <div className="experiment-controls">
        <button
          className="experiment-button primary"
          disabled={!!transfer}
          onClick={() => operate(true, false)}
        >
          写入 0x{format(next)}
        </button>
        <button
          className="experiment-button"
          disabled={!!transfer}
          onClick={() => operate(false, true)}
        >
          读出一个字节
        </button>
        <button
          className="experiment-button"
          disabled={!!transfer}
          onClick={() => operate(true, true)}
        >
          同时请求读写
        </button>
        <button className="experiment-button" onClick={reset}>
          清空
        </button>
      </div>
      <div className="experiment-status mt-5" aria-live="polite">
        {message}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        绿色字节从右侧进入队尾，棕色字节从左侧离开队头；同时成功读写时，两边一起移动。位置移动只表示排队顺序，真实
        FIFO 的存储器通过读写指针访问。
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        先看操作前的空满标志：空时同时读写只接受写；满时只接受读。被拒绝的操作不会让字节移动。
      </p>
    </div>
  );
}
