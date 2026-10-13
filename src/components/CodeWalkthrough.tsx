import { Download } from "lucide-react";
import CodeBlock from "./CodeBlock";
import type { CodeStep } from "../content/walkthroughs";
import { downloadCode } from "../lib/download-code";

function excerpt(code: string, step: CodeStep) {
  const lines = code.trimEnd().split("\n");
  const start = lines.findIndex((line) => line.includes(step.from));
  const end = step.to
    ? lines.findIndex((line, i) => i > start && line.includes(step.to!))
    : lines.length;
  if (start < 0 || end < 0) throw new Error("代码讲解定位失败：" + step.title);
  const selected = lines.slice(start, end);
  while (selected.length && !selected[selected.length - 1].trim())
    selected.pop();
  const indent = Math.min(
    ...selected
      .filter((x) => x.trim())
      .map((x) => x.match(/^\s*/)?.[0].length ?? 0),
  );
  return {
    code: selected.map((x) => x.slice(indent)).join("\n"),
    line: start + 1,
  };
}
export default function CodeWalkthrough({
  title,
  code,
  steps,
}: {
  title: string;
  code: string;
  steps: CodeStep[];
}) {
  return (
    <div className="code-walkthrough">
      <p className="walkthrough-intro">
        把 {title} 拆成 {steps.length}{" "}
        步来读。下面是原模块的摘录，行号与完整源码对应。
      </p>
      {steps.map((step, i) => {
        const part = excerpt(code, step);
        return (
          <section key={step.title} className="walkthrough-step">
            <span className="walkthrough-index">{i + 1}</span>
            <div>
              <h4>{step.title}</h4>
              <p>{step.explanation}</p>
              <CodeBlock
                title={`${title} · ${step.title}`}
                code={part.code}
                startLine={part.line}
              />
              {step.tip && <p className="walkthrough-tip">{step.tip}</p>}
            </div>
          </section>
        );
      })}
      <details className="full-code">
        <summary>
          展开完整源码 · {title}（{code.trimEnd().split("\n").length} 行）
        </summary>
        <CodeBlock title={title} code={code} />
        <button
          className="download-code"
          onClick={() => downloadCode(code, title)}
        >
          <Download size={14} />
          下载 {title}
        </button>
      </details>
    </div>
  );
}
