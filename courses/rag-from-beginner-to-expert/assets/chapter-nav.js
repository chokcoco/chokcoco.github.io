document.addEventListener("DOMContentLoaded", () => {
  const navigation = document.querySelector(".chapter-nav");
  const toggle = navigation?.querySelector(".chapter-nav-toggle");
  const active = navigation?.querySelector("[aria-current='page']");
  if (!navigation || !toggle) return;

  const compact = () => window.matchMedia("(max-width: 1240px)").matches;
  const setExpanded = (expanded) => {
    navigation.classList.toggle("is-collapsed", !expanded && !compact());
    navigation.classList.toggle("is-expanded", expanded && compact());
    toggle.setAttribute("aria-expanded", String(expanded));
    const label = toggle.querySelector(".chapter-nav-toggle-label");
    if (label) label.textContent = expanded ? "收起" : "展开";
  };

  setExpanded(!compact());
  active?.scrollIntoView({ block: "center" });
  toggle.addEventListener("click", () => setExpanded(toggle.getAttribute("aria-expanded") !== "true"));
  window.addEventListener("resize", () => setExpanded(!compact()));
});
