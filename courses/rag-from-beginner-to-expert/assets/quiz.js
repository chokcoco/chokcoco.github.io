
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-answer]");
  if (!button) return;
  const wrap = button.closest(".quiz-question");
  const result = wrap.querySelector(".quiz-result");
  const ok = button.dataset.answer === "true";
  result.textContent = ok ? "答对了。" : "再想一下。";
  result.style.color = ok ? "#0f766e" : "#b45309";
});
