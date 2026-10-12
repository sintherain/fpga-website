import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { chapters } from "../content/chapters";
import { NotebookArt } from "../components/LearningDiagram";
export default function Home() {
  return (
    <div className="home-page">
      <section className="home-intro">
        <div className="home-intro-copy">
          <div className="eyebrow">一本可以动手的接口笔记</div>
          <h1 className="editorial-title">
            从一根线，
            <br />
            读懂<em>一场通信。</em>
          </h1>
          <p>
            FPGA
            不必从复杂的工程开始。先看懂信号怎样流动，再把每一拍写成电路。这里有连接图、可以动手的波形，还有一段一段讲清楚的
            Verilog。
          </p>
          <Link className="start-link" to="/fpga">
            翻开第一章 <ArrowRight size={17} />
          </Link>
          <span className="start-note">
            也可以从下面的目录，选一个感兴趣的章节。
          </span>
        </div>
        <div>
          <div className="notebook-art">
            <NotebookArt />
          </div>
          <p className="notebook-caption">把信号画出来，电路就近了一点。</p>
        </div>
      </section>
      <div className="home-divider" />
      <section aria-labelledby="course-index">
        <div className="home-section-heading">
          <h2 id="course-index" className="home-section-title">
            从这里开始
          </h2>
          <p>7 个章节 · 按自己的节奏学习</p>
        </div>
        <div className="course-list">
          {chapters.map((c) => (
            <Link className="course-entry" to={`/${c.id}`} key={c.id}>
              <span className="entry-number">{c.num}</span>
              <div className="entry-copy">
                <h3>{c.title}</h3>
                <p>{c.description}</p>
              </div>
              <ArrowRight className="entry-arrow" size={16} />
            </Link>
          ))}
        </div>
      </section>
      <section className="home-bottom">
        <div>
          <h3>怎么读这本笔记？</h3>
          <p>
            先看连接关系，接着动手调整波形，最后读代码。长模块会拆成几步讲解，完整源码可以展开、复制或下载。
          </p>
        </div>
        <div>
          <h3>给刚入门的你</h3>
          <p>
            如果已经了解计数器与状态机，可以从 UART 开始。第一次接触
            FPGA，就先认识芯片里的几个基本构件，再做一个最小的实验。
          </p>
        </div>
      </section>
    </div>
  );
}
