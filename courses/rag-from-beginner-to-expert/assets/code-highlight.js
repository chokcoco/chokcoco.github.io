
document.addEventListener("DOMContentLoaded", () => {
  const escapeHtml = (value) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const span = (cls, value) => '<span class="code-token ' + cls + '">' + escapeHtml(value) + '</span>';

  const highlightJs = (source) => {
    const tokenPattern = /(\/\/.*$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|export|from|async|await|function|return|const|let|var|if|else|for|of|try|catch|throw|new|class|extends|null|undefined)\b|\b(?:true|false)\b|\b\d+(?:\.\d+)?\b|[{}[\]();,.])/gm;
    return source.replace(tokenPattern, (token) => {
      if (token.startsWith("//") || token.startsWith("/*")) return span("comment", token);
      if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) return span("string", token);
      if (/^(true|false)$/.test(token)) return span("boolean", token);
      if (/^\d/.test(token)) return span("number", token);
      if (/^[{}[\]();,.]$/.test(token)) return span("punctuation", token);
      return span("keyword", token);
    });
  };

  const highlightJson = (source) => source.replace(/("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g, (token) => {
    if (token.trim().endsWith(":")) return span("property", token);
    if (token.startsWith('"')) return span("string", token);
    if (/^(true|false|null)$/.test(token)) return span("boolean", token);
    return span("number", token);
  });

  const highlightMarkdown = (source) => escapeHtml(source)
    .replace(/^(#{1,6} .*)$/gm, '<span class="code-token heading">$1</span>')
    .replace(/^(- .*)$/gm, '<span class="code-token string">$1</span>')
    .replace(/^(\d+\. .*)$/gm, '<span class="code-token string">$1</span>');

  const highlightText = (source) => escapeHtml(source)
    .replace(/^([a-zA-Z0-9_.-]+\/.*)$/gm, '<span class="code-token property">$1</span>')
    .replace(/^(\s+[a-zA-Z0-9_.-]+\/?).*$/gm, (line) => {
      if (line.includes("#")) return line.replace(/(#.*)$/g, '<span class="code-token comment">$1</span>');
      return line;
    });

  const highlightBash = (source) => escapeHtml(source)
    .replace(/(#.*)$/gm, '<span class="code-token comment">$1</span>')
    .replace(/\b(npm|node|mkdir|cat|curl)\b/g, '<span class="code-token keyword">$1</span>');

  document.querySelectorAll("pre code").forEach((node) => {
    if (window.hljs) return;
    const language = (node.dataset.language || "").toLowerCase();
    const source = node.textContent;
    if (language.includes("javascript") || language === "js") node.innerHTML = highlightJs(source);
    else if (language.includes("json")) node.innerHTML = highlightJson(source);
    else if (language.includes("markdown") || language === "md") node.innerHTML = highlightMarkdown(source);
    else if (language.includes("bash") || language.includes("shell")) node.innerHTML = highlightBash(source);
    else node.innerHTML = highlightText(source);
  });

  if (window.hljs) window.hljs.highlightAll();
  if (window.mermaid) {
    var _ts = window.__themeSwitcher;
    var _theme = _ts ? _ts.getActiveTheme() : "guardnet";
    var _cfg = _ts ? _ts.mermaidConfig(_theme) : { startOnLoad: true, theme: "dark", securityLevel: "loose", themeVariables: {
      background: "#0d0d11",
      primaryColor: "#151a29",
      primaryTextColor: "#f7f7f8",
      primaryBorderColor: "#4966a8",
      lineColor: "#8495bd",
      secondaryColor: "#111827",
      tertiaryColor: "#17171d"
    }};
    _cfg.startOnLoad = true;
    _cfg.securityLevel = "loose";
    window.mermaid.initialize(_cfg);
  }
});
