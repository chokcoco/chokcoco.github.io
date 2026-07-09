(function () {
  function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function fallbackHighlight(code, language) {
    let html = escapeHtml(code);
    html = html.replace(/(\/\/.*)$/gm, '<span class="hljs-comment">$1</span>');
    html = html.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, '<span class="hljs-string">$1</span>');
    html = html.replace(/\b(async|await|function|const|let|return|class|new|record|String|List|Map|of|public|private|void|int|boolean|if|else|for|while|extends|implements|builder)\b/g, '<span class="hljs-keyword">$1</span>');
    html = html.replace(/\b(\d+)\b/g, '<span class="hljs-number">$1</span>');
    return html;
  }

  document.querySelectorAll("pre code").forEach((block) => {
    if (window.hljs) {
      window.hljs.highlightElement(block);
      return;
    }
    const language = [...block.classList].find((name) => name.startsWith("language-"))?.replace("language-", "") || "";
    block.innerHTML = fallbackHighlight(block.textContent, language);
    block.classList.add("hljs");
  });
})();
