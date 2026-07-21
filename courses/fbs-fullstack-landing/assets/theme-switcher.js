/**
 * Theme switcher — provides runtime style switching between guardnet (dark)
 * and evergreen (light) themes.
 *
 * Load this script WITHOUT defer in <head> so data-theme is set before paint.
 * It reads localStorage on load, sets the html attribute, then waits for
 * DOMContentLoaded to inject the toggle button into every .topbar.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "course-theme";
  var THEMES = ["guardnet", "evergreen"];
  var LABELS = { guardnet: "Guardnet", evergreen: "Evergreen" };

  function getSavedTheme() {
    try {
      var t = localStorage.getItem(STORAGE_KEY);
      if (t && THEMES.indexOf(t) !== -1) return t;
    } catch (e) {}
    return "guardnet";
  }

  function applyTheme(theme) {
    if (theme === "guardnet") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }

  function getActiveTheme() {
    return document.documentElement.getAttribute("data-theme") || "guardnet";
  }

  // Set theme immediately (before CSS paints) to avoid flash.
  applyTheme(getSavedTheme());

  // ---- Mermaid re-init ----
  function mermaidConfig(theme) {
    if (theme === "evergreen") {
      return {
        startOnLoad: false,
        theme: "base",
        securityLevel: "strict",
        themeVariables: {
          background: "#FDF5EB",
          primaryColor: "#EBE4DC",
          primaryTextColor: "#08150C",
          primaryBorderColor: "#056949",
          lineColor: "#6b6258",
          secondaryColor: "#F4F1EC",
          tertiaryColor: "#EBE4DC",
          fontFamily: "Georgia, serif",
        },
      };
    }
    return {
      startOnLoad: false,
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
  }

  function reinitMermaid(theme) {
    if (!window.mermaid) return;
    try {
      window.mermaid.initialize(mermaidConfig(theme));
      // Re-render existing diagrams
      var diagrams = document.querySelectorAll(".mermaid");
      if (diagrams.length > 0) {
        window.mermaid.run({ nodes: diagrams });
      }
    } catch (e) {
      // If re-init fails, diagrams keep their previous render
    }
  }

  // ---- Toggle button ----
  function createToggleButton() {
    var btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Switch theme");
    btn.title = "Switch theme";

    function updateLabel() {
      var current = getActiveTheme();
      var next = current === "guardnet" ? "evergreen" : "guardnet";
      btn.textContent = LABELS[next];
    }

    updateLabel();

    btn.addEventListener("click", function () {
      var current = getActiveTheme();
      var next = current === "guardnet" ? "evergreen" : "guardnet";
      applyTheme(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      updateLabel();
      reinitMermaid(next);

      // Notify any listeners (e.g. course.js that might want to react)
      window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
    });

    return btn;
  }

  function injectButtons() {
    // Inject into every topbar (platform + course pages)
    var topbars = document.querySelectorAll(".topbar");
    topbars.forEach(function (tb) {
      if (tb.querySelector(".theme-toggle")) return; // already injected
      tb.appendChild(createToggleButton());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectButtons);
  } else {
    injectButtons();
  }

  // Expose for course.js to call when it initializes Mermaid
  window.__themeSwitcher = {
    getActiveTheme: getActiveTheme,
    mermaidConfig: mermaidConfig,
    reinitMermaid: reinitMermaid,
  };
})();
