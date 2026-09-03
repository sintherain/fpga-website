import React, { useMemo } from "react";

const KEYWORDS = new Set([
  "module", "endmodule", "input", "output", "inout", "wire", "reg", "logic",
  "always", "always_ff", "always_comb", "assign", "if", "else", "case",
  "casez", "endcase", "begin", "end", "parameter", "localparam", "initial",
  "posedge", "negedge", "or", "and", "not", "genvar", "generate",
  "endgenerate", "function", "endfunction", "typedef", "enum", "default",
]);

function highlightLine(line: string, key: number): React.ReactNode {
  // 注释
  const commentIdx = line.indexOf("//");
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : "";

  // 更简单稳妥：按单词边界切分
  const parts = codePart.split(/([A-Za-z_][A-Za-z0-9_$]*|\d+'[bdh][0-9a-fA-FxzXZ_]+|\d+)/g);

  return (
    <div key={key} className="table-row">
      <span className="table-cell select-none pr-4 text-right text-[#3f4a5a] w-8">
        {key + 1}
      </span>
      <span className="table-cell whitespace-pre">
        {parts.map((p, i) => {
          if (!p) return null;
          if (KEYWORDS.has(p)) {
            return (
              <span key={i} className="text-[#22d3ee]">
                {p}
              </span>
            );
          }
          if (/^\d+'[bdh]/.test(p) || /^\d+$/.test(p)) {
            return (
              <span key={i} className="text-[#fbbf24]">
                {p}
              </span>
            );
          }
          return <span key={i}>{p}</span>;
        })}
        {commentPart && <span className="text-[#4b6076]">{commentPart}</span>}
      </span>
    </div>
  );
}

interface CodeBlockProps {
  title?: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ title, code }) => {
  const lines = useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
  return (
    <div className="my-6 overflow-hidden rounded-md border border-border bg-[#0b0e13]">
      {title && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-[#fb7185]/70" />
          <span className="h-2 w-2 rounded-full bg-[#fbbf24]/70" />
          <span className="h-2 w-2 rounded-full bg-[#34d399]/70" />
          <span className="ml-2 font-mono text-[11px] tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
      )}
      <div className="overflow-x-auto p-4">
        <div className="table font-mono text-[12.5px] leading-6 text-[#b7c0cd]">
          {lines.map((l, i) => highlightLine(l, i))}
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;
