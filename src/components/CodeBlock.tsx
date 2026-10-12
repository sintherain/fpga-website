import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
const keywords = new Set([
  "module",
  "endmodule",
  "input",
  "output",
  "inout",
  "wire",
  "reg",
  "logic",
  "always",
  "always_ff",
  "always_comb",
  "assign",
  "if",
  "else",
  "case",
  "endcase",
  "begin",
  "end",
  "parameter",
  "localparam",
  "initial",
  "posedge",
  "negedge",
  "or",
  "genvar",
  "generate",
  "endgenerate",
  "function",
  "endfunction",
  "task",
  "endtask",
  "default",
]);
function renderLine(line: string) {
  const comment = line.indexOf("//");
  const part = comment >= 0 ? line.slice(0, comment) : line;
  const tokens = part.split(
    /(\d[\d_]*'[sS]?[bBdDhHoO][\da-fA-F_xXzZ]+|\d[\d_]*|\$?[A-Za-z_][A-Za-z0-9_$]*)/g,
  );
  return (
    <>
      {tokens.map((token, i) => (
        <span
          key={i}
          className={
            keywords.has(token)
              ? "code-keyword"
              : /^\d/.test(token)
                ? "code-number"
                : undefined
          }
        >
          {token}
        </span>
      ))}
      {comment >= 0 && (
        <span className="code-comment">{line.slice(comment)}</span>
      )}
    </>
  );
}
export default function CodeBlock({
  title = "Verilog 片段",
  code,
  startLine = 1,
}: {
  title?: string;
  code: string;
  startLine?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{title}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`复制 ${title}`}
          aria-live="polite"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}{" "}
          {copied ? "已复制" : error ? "请手动选择代码" : "复制"}
        </button>
      </div>
      <div
        className="code-scroll"
        tabIndex={0}
        aria-label={`${title}，可横向滚动`}
      >
        <pre>
          <code>
            {code
              .replace(/\n$/, "")
              .split("\n")
              .map((line, i) => (
                <span key={i} className="code-line">
                  <span className="line-number" aria-hidden="true">
                    {startLine + i}
                  </span>
                  <span>
                    {renderLine(line)}
                    {"\n"}
                  </span>
                </span>
              ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
