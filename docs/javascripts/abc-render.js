(() => {
  // Wichtig für MkDocs Material (Instant Navigation): wiederholt rendern, aber nur einmal pro Block.
  const RENDERED_ATTR = "data-abc-rendered";

  function getContentRoot() {
    // MkDocs Material: Inhalt steckt meist hier drin
    return (
      document.querySelector("main") ||
      document.querySelector(".md-content") ||
      document.body
    );
  }

  function extractFromPreCode(node) {
    // Klassischer Fall: <pre><code class="language-abc">...</code></pre>
    const code = node.querySelector("code");
    if (!code) return null;
    return (code.textContent || "").trim();
  }

  function extractFromPygmentsTable(node) {
    // Pygments kann Tabellen ausgeben: <div class="highlight"><table>...<pre>...</pre>
    const pre = node.querySelector("pre");
    if (!pre) return null;
    return (pre.textContent || "").trim();
  }

  function findAbcSources(root) {
    // Wir suchen verschiedene mögliche Strukturen:
    // 1) normale fenced code: pre > code.language-abc (wenn vorhanden)
    // 2) mkdocs-material/pymdownx: div.highlight (mit oder ohne language marker)
    // 3) generell: irgendwas, das "```abc" nicht mehr enthält, aber irgendwo "K:" / "X:" etc.
    const sources = [];

    // A) Standard-Fenced
    root.querySelectorAll('pre > code[class*="language-abc"]').forEach(code => {
      const pre = code.closest("pre");
      if (!pre || pre.hasAttribute(RENDERED_ATTR)) return;
      sources.push({ host: pre, abc: (code.textContent || "").trim() });
    });

    // B) Pygments/Highlight-Wrapper: versucht über Klassen einen ABC-Block zu erkennen
    root.querySelectorAll(".highlight, .codehilite").forEach(box => {
      if (box.hasAttribute(RENDERED_ATTR)) return;

      // Heuristik: Viele Setups setzen language-abc nicht durch → wir erkennen anhand der ersten Zeilen
      const abc = extractFromPygmentsTable(box);
      if (!abc) return;

      // Minimal-Heuristik: enthält Key (K:) oder Meter (M:) oder X: oder L:
      // und keine typischen Programmiersprachen-Keywords
      const head = abc.split("\n").slice(0, 10).join("\n");
      const looksLikeAbc =
        /\bK:\s*\S+/.test(head) || /\bM:\s*\S+/.test(head) || /\bX:\s*\d+/.test(head) || /\bL:\s*\S+/.test(head);

      if (looksLikeAbc) sources.push({ host: box, abc: abc.trim() });
    });

    return sources;
  }

  function renderOne(host, abcText) {
    if (!abcText) return;
    host.setAttribute(RENDERED_ATTR, "1");

    const out = document.createElement("div");
    out.className = "abc-notation";

    // host ersetzen
    host.replaceWith(out);

    try {
      ABCJS.renderAbc(out, abcText, { responsive: "resize" });
    } catch (e) {
      console.error("ABC render error:", e);
      out.textContent = "ABC Render Fehler (siehe Console).";
    }
  }

  function renderAll() {
    if (!window.ABCJS || typeof window.ABCJS.renderAbc !== "function") {
      console.error("ABCJS nicht verfügbar");
      return;
    }

    const root = getContentRoot();
    const items = findAbcSources(root);

    // Debug
    // console.log("ABC items:", items.length);

    items.forEach(({ host, abc }) => renderOne(host, abc));
  }

  // Initial
  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
  });

  // MkDocs Material Instant Navigation: nach Seitenwechsel neu rendern
  // Material feuert häufig "DOMContentLoaded" nicht erneut, daher diese Hooks:
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") renderAll();
  });

  // Zusätzlich: beobachte main content (wenn sich Inhalt ersetzt)
  const mo = new MutationObserver(() => {
    // kleines Debounce per microtask
    Promise.resolve().then(renderAll);
  });
  window.addEventListener("load", () => {
    const root = getContentRoot();
    if (root) mo.observe(root, { childList: true, subtree: true });
    renderAll();
  });
})();
