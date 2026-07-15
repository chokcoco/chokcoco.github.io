document.addEventListener("DOMContentLoaded", () => {
  const escapeHtml = (value) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const token = (type, value) => `<span class="code-token ${type}">${escapeHtml(value)}</span>`;
  const highlight = (source) => {
    const pattern = /(\/\/.*$|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|export|from|async|await|function|return|const|let|if|else|for|while|class|interface|type|new|null|undefined|true|false)\b|\b\d+(?:\.\d+)?\b)/gm;
    let output = "";
    let cursor = 0;
    for (const match of source.matchAll(pattern)) {
      output += escapeHtml(source.slice(cursor, match.index));
      const value = match[0];
      const kind = value.startsWith("//") || value.startsWith("#") ? "comment" : /^['"`]/.test(value) ? "string" : /^\d/.test(value) ? "number" : "keyword";
      output += token(kind, value);
      cursor = match.index + value.length;
    }
    return output + escapeHtml(source.slice(cursor));
  };

  document.querySelectorAll("pre code[data-language]").forEach((node) => {
    node.innerHTML = highlight(node.textContent);
  });

  document.querySelectorAll(".copy-code").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.closest(".code-card")?.querySelector("code")?.textContent || "";
      await navigator.clipboard.writeText(code);
      const original = button.textContent;
      button.textContent = "已复制";
      setTimeout(() => { button.textContent = original; }, 1200);
    });
  });

  if (window.mermaid) {
    var _ts = window.__themeSwitcher;
    var _theme = _ts ? _ts.getActiveTheme() : "guardnet";
    var _cfg = _ts ? _ts.mermaidConfig(_theme) : {
      startOnLoad: true,
      theme: "dark",
      securityLevel: "strict",
      themeVariables: {
        background: "#0d0d11",
        primaryColor: "#151a29",
        primaryTextColor: "#f7f7f8",
        primaryBorderColor: "#4966a8",
        lineColor: "#8495bd",
        secondaryColor: "#111827",
        tertiaryColor: "#17171d",
        fontFamily: "Futura, Avenir Next, PingFang SC, sans-serif",
      },
    };
    _cfg.startOnLoad = true;
    _cfg.securityLevel = "strict";
    window.mermaid.initialize(_cfg);
  }
});
