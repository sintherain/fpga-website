import type { ReactNode } from "react";
import { headingId } from "../lib/headings";
export function SectionHeader({
  title,
  lead,
}: {
  index: string;
  en: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="chapter-heading">
      <h1>{title}</h1>
      {lead && <p>{lead}</p>}
    </header>
  );
}
export function H3({ children }: { children: ReactNode }) {
  return (
    <h2
      id={headingId(typeof children === "string" ? children : "")}
      className="section-heading"
    >
      {children}
    </h2>
  );
}
export function H4({ children }: { children: ReactNode }) {
  return (
    <h3
      id={headingId(typeof children === "string" ? children : "")}
      className="subsection-heading"
    >
      {children}
    </h3>
  );
}
export const Lead = ({ children }: { children: ReactNode }) => (
  <p className="lesson-note">{children}</p>
);
export const LD = ({ children }: { children: ReactNode }) => (
  <strong className="phrase-lead">{children}</strong>
);
export const P = ({ children }: { children: ReactNode }) => (
  <p className="lesson-paragraph">{children}</p>
);
export const IC = ({ children }: { children: ReactNode }) => (
  <code className="inline-code">{children}</code>
);
