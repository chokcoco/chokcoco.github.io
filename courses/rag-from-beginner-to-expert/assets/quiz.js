document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-answer]");
  if (!button) return;
  const row = button.closest(".quiz-question");
  const result = row.querySelector(".quiz-result");
  const correct = row.dataset.correct;
  if (button.dataset.answer === correct) {
    result.textContent = "答对了。";
    result.style.color = "#0f766e";
  } else {
    result.textContent = "再想想，正确答案是：" + correct;
    result.style.color = "#b45309";
  }
});
