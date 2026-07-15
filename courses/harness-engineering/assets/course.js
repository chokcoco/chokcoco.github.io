document.addEventListener("DOMContentLoaded", () => {
  const escapeHtml = (value) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const token = (type, value) => `<span class="code-token ${type}">${escapeHtml(value)}</span>`;

  const highlightWithPattern = (source, pattern, classify) => {
    let output = "";
    let cursor = 0;
    for (const match of source.matchAll(pattern)) {
      output += escapeHtml(source.slice(cursor, match.index));
      output += token(classify(match[0]), match[0]);
      cursor = match.index + match[0].length;
    }
    return output + escapeHtml(source.slice(cursor));
  };

  function highlightJavaScript(source) {
    const pattern = /(\/\/.*$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|export|from|async|await|function|return|const|let|var|if|else|for|of|while|try|catch|throw|new|class|extends|null|undefined)\b|\b(?:true|false)\b|\b\d+(?:\.\d+)?\b|[{}[\]();,.])/gm;
    return highlightWithPattern(source, pattern, (value) => {
      if (value.startsWith("//") || value.startsWith("/*")) return "comment";
      if (/^["'`]/.test(value)) return "string";
      if (/^(true|false)$/.test(value)) return "boolean";
      if (/^\d/.test(value)) return "number";
      if (/^[{}[\]();,.]$/.test(value)) return "punctuation";
      return "keyword";
    });
  }

  function highlightJava(source) {
    const pattern = /(\/\/.*$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[A-Za-z][A-Za-z0-9_]*|\b(?:package|import|public|private|protected|class|interface|record|extends|implements|static|final|void|return|new|if|else|for|while|try|catch|throw|throws|var|this|null)\b|\b(?:true|false)\b|\b\d+(?:\.\d+)?[LlFfDd]?\b|[{}[\]();,.])/gm;
    return highlightWithPattern(source, pattern, (value) => {
      if (value.startsWith("//") || value.startsWith("/*")) return "comment";
      if (value.startsWith("@")) return "annotation";
      if (/^["']/.test(value)) return "string";
      if (/^(true|false)$/.test(value)) return "boolean";
      if (/^\d/.test(value)) return "number";
      if (/^[{}[\]();,.]$/.test(value)) return "punctuation";
      return "keyword";
    });
  }

  function highlightJson(source) {
    const pattern = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g;
    return highlightWithPattern(source, pattern, (value) => {
      if (value.trim().endsWith(":")) return "property";
      if (value.startsWith('"')) return "string";
      if (/^(true|false|null)$/.test(value)) return "boolean";
      return "number";
    });
  }

  function highlightShell(source) {
    return escapeHtml(source)
      .replace(/(#.*)$/gm, '<span class="code-token comment">$1</span>')
      .replace(/\b(npm|pnpm|node|java|mvn|gradle|git|curl|mkdir|cd)\b/g, '<span class="code-token keyword">$1</span>');
  }

  function highlightMarkdown(source) {
    return escapeHtml(source)
      .replace(/^(#{1,6} .*)$/gm, '<span class="code-token property">$1</span>')
      .replace(/^(\s*[-*] .*)$/gm, '<span class="code-token string">$1</span>');
  }

  document.querySelectorAll("pre code[data-language]").forEach((node) => {
    const language = node.dataset.language.toLowerCase();
    const source = node.textContent;
    if (["js", "javascript", "typescript", "ts"].includes(language)) node.innerHTML = highlightJavaScript(source);
    else if (language === "java") node.innerHTML = highlightJava(source);
    else if (language === "json") node.innerHTML = highlightJson(source);
    else if (["bash", "shell", "sh", "zsh"].includes(language)) node.innerHTML = highlightShell(source);
    else if (["markdown", "md"].includes(language)) node.innerHTML = highlightMarkdown(source);
    else node.innerHTML = escapeHtml(source);
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
      },
    };
    _cfg.startOnLoad = true;
    _cfg.securityLevel = "strict";
    window.mermaid.initialize(_cfg);
  }
});
