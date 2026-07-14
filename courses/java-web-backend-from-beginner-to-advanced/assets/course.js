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
    window.mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "strict" });
  }

  if (window.hljs) {
    document.querySelectorAll("pre code[class^='language-']").forEach((block) => {
      window.hljs.highlightElement(block);
    });
  }
});
