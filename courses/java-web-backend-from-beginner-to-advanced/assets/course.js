document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".copy-code").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.closest(".code-card")?.querySelector("code")?.textContent || "";
      await navigator.clipboard.writeText(code);
      const previous = button.textContent;
      button.textContent = "已复制";
      window.setTimeout(() => { button.textContent = previous; }, 1200);
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

  if (window.hljs) {
    document.querySelectorAll("pre code[class^='language-']").forEach((block) => {
      window.hljs.highlightElement(block);
    });
  }
});
