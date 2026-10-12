import { lazy, Suspense, useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router";
import { ArrowLeft, ArrowRight, BookOpen, Menu, X } from "lucide-react";
import { chapters } from "./content/chapters";
import type { Chapter } from "./content/chapters";
import Home from "./pages/Home";
import { headingId, decodeHeadingHash } from "./lib/headings";

const pages = [
  lazy(() => import("./sections/FpgaBasics")),
  lazy(() => import("./sections/UartSection")),
  lazy(() => import("./sections/SpiSection")),
  lazy(() => import("./sections/I2cSection")),
  lazy(() => import("./sections/AxiSection")),
  lazy(() => import("./sections/FifoSection")),
  lazy(() => import("./sections/Roadmap")),
];
function ScrollAndTitle() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const chapter = chapters.find((c) => pathname === `/${c.id}`);
    document.title = chapter
      ? `${chapter.title} · FPGA 小课堂`
      : "FPGA 小课堂 · 接口与电路笔记";
    const frame = requestAnimationFrame(() => {
      if (hash) {
        const target = document.getElementById(decodeHeadingHash(hash));
        target?.scrollIntoView({ behavior: "instant" });
        if (target?.id === "main-content") target.focus({ preventScroll: true });
      } else window.scrollTo({ top: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}
function TocLinks({ chapter }: { chapter: Chapter }) {
  const { hash } = useLocation();
  const activeHeading = decodeHeadingHash(hash);
  return (
    <nav>
      {chapter.headings.map((text, i) => (
        <div className="toc-group" key={text}>
          <Link
            className={activeHeading === headingId(text) ? "selected" : ""}
            to={`/${chapter.id}#${headingId(text)}`}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {text}
          </Link>
          {chapter.subheadings?.[text]?.map((sub) => (
            <Link
              key={sub}
              className={`toc-child ${activeHeading === headingId(sub) ? "selected" : ""}`}
              to={`/${chapter.id}#${headingId(sub)}`}
            >
              {sub
                .replace(/^Verilog 实现（[12]\/2）：/, "")
                .replace(/^\d · /, "")}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
function ChapterLayout({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const chapter = chapters[index];
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  return (
    <div className="reader-grid">
      <article className="reader-article">
        <div className="chapter-meta">
          <span>第 {chapter.num} 章</span>
          <span>{chapter.tag}</span>
        </div>
        <Suspense
          fallback={
            <p className="loading-note" role="status">
              正在翻开这一章…
            </p>
          }
        >
          {children}
          <ChapterScroll />
        </Suspense>
        <aside className="chapter-recap">
          <BookOpen size={20} aria-hidden="true" />
          <div>
            <strong>读完这一章，可以试着回答</strong>
            <p>{chapter.question}</p>
          </div>
        </aside>
        <nav className="chapter-pagination" aria-label="章节翻页">
          {previous ? (
            <Link to={`/${previous.id}`}>
              <ArrowLeft size={18} />
              <span>
                <small>上一章</small>
                {previous.title}
              </span>
            </Link>
          ) : (
            <Link to="/">
              <ArrowLeft size={18} />
              <span>
                <small>回到</small>课程目录
              </span>
            </Link>
          )}
          {next ? (
            <Link to={`/${next.id}`}>
              <span>
                <small>下一章</small>
                {next.title}
              </span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/">
              <span>
                <small>重新浏览</small>课程目录
              </span>
              <ArrowRight size={18} />
            </Link>
          )}
        </nav>
      </article>
      <aside className="toc" aria-label="本章目录">
        <details className="toc-mobile">
          <summary>本章目录 · {chapter.headings.length} 个小节</summary>
          <TocLinks chapter={chapter} />
        </details>
        <div className="toc-inner">
          <p className="toc-label">这一章的内容</p>
          <TocLinks chapter={chapter} />
          <p className="toc-footnote">
            慢慢读，动手试。
            <br />
            把每一个时钟沿想清楚。
          </p>
        </div>
      </aside>
    </div>
  );
}
function ChapterScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(decodeHeadingHash(hash))?.scrollIntoView({ behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}
export default function App() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = chapters.find((c) => pathname === `/${c.id}`);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  return (
    <div className="site-shell">
      <ScrollAndTitle />
      <Link className="skip-link" to={pathname + "#main-content"}>
        跳到正文
      </Link>
      <header className="mobile-header">
        <Link to="/" className="wordmark" onClick={() => setMenuOpen(false)}>
          <BookOpen size={23} />
          <span>FPGA 小课堂</span>
        </Link>
        <button
          aria-label={menuOpen ? "关闭章节目录" : "打开章节目录"}
          aria-expanded={menuOpen}
          aria-controls="course-sidebar"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </header>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="关闭章节目录"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        id="course-sidebar"
        className={`course-sidebar ${menuOpen ? "is-open" : ""}`}
      >
        <Link
          to="/"
          className="wordmark desktop-wordmark"
          onClick={() => setMenuOpen(false)}
        >
          <BookOpen size={26} />
          <span>
            FPGA 小课堂<small>接口与电路笔记</small>
          </span>
        </Link>
        <NavLink
          to="/"
          end
          className="home-link"
          onClick={() => setMenuOpen(false)}
        >
          课程概览 <span>↗</span>
        </NavLink>
        <p className="sidebar-label">循序渐进，理解电路</p>
        <nav aria-label="课程章节">
          {chapters.map((c) => (
            <NavLink
              key={c.id}
              to={`/${c.id}`}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `chapter-link ${isActive ? "is-active" : ""}`
              }
            >
              <span className="chapter-number">{c.num}</span>
              <span>
                {c.title}
                <small>{c.subtitle}</small>
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-mark">✳</span>
          <p>
            先理解，再实现。
            <br />
            从一根信号线开始。
          </p>
        </div>
        <a
          className="source-link"
          href="https://github.com/sintherain/fpga-website"
          target="_blank"
          rel="noreferrer"
        >
          查看源码 <span>↗</span>
        </a>
      </aside>
      <div className="main-shell">
        <div className="page-topline">
          <Link to="/">接口与电路笔记</Link>
          <span>{current ? current.title : "从一根线，读懂一场通信"}</span>
        </div>
        <main id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            {chapters.map((c, i) => {
              const Page = pages[i];
              return (
                <Route
                  key={c.id}
                  path={`/${c.id}`}
                  element={
                    <ChapterLayout index={i}>
                      <Page />
                    </ChapterLayout>
                  }
                />
              );
            })}
            <Route
              path="*"
              element={
                <div className="not-found">
                  <h1>这一页还没写进笔记。</h1>
                  <p>从目录选择一个章节，继续学习吧。</p>
                  <Link to="/">回到课程目录 →</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <footer className="site-footer">
          <span>FPGA 小课堂</span>
          <span>用图理解 · 用代码验证</span>
        </footer>
      </div>
    </div>
  );
}
