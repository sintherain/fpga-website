import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";

// 保留旧站 #uart 等章节书签，并使用适合 GitHub Pages 的哈希路由。
const legacy = window.location.hash.match(
  /^#(fpga|uart|spi|i2c|axi|fifo|roadmap|top)$/,
);
if (legacy)
  window.history.replaceState(
    null,
    "",
    legacy[1] === "top" ? "#/" : "#/" + legacy[1],
  );

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
