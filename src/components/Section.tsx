import React from "react";

interface SectionHeaderProps {
  index: string;
  en: string;
  title: string;
  lead?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  index,
  en,
  title,
  lead,
}) => (
  <header className="mb-10">
    <div className="readout mb-3 flex items-center gap-3">
      <span className="text-[#22d3ee]">{index}</span>
      <span className="h-px w-10 bg-border" />
      <span>{en}</span>
    </div>
    <h2 className="text-3xl font-semibold tracking-tight text-[#e6eaef] md:text-4xl">
      {title}
    </h2>
    {lead && (
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
        {lead}
      </p>
    )}
  </header>
);

export const H3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-3 mt-10 border-l-[3px] border-[#22d3ee] pl-3 text-lg font-semibold tracking-tight text-[#e6eaef]">
    {children}
  </h3>
);

export const H4: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="mb-3 mt-8 border-l-[3px] border-border pl-3 text-base font-semibold text-[#e6eaef]">
    {children}
  </h4>
);

export const Lead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="my-4 rounded-md border border-border bg-[#0a0d12] px-4 py-3 text-[15px] leading-7 text-[#c6cdd6]">
    {children}
  </p>
);

/** 段首总起短语（琥珀色强调） */
export const LD: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[#fcd34d]">{children}</span>
);

export const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="my-4 text-[15px] leading-7 text-[#a8b0ba]">{children}</p>
);

/** 行内代码 */
export const IC: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="rounded bg-[#1a2230] px-1.5 py-0.5 font-mono text-[13px] text-[#7dd3fc]">
    {children}
  </code>
);
