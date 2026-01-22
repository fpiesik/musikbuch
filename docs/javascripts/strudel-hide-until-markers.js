(() => {
  const CLASS_BASE = "hide-until-marker";

  const RE_BLOCK_MARKER = /\/\/---\s*$/;  // //--- am Zeilenende
  const RE_HIDE_LINE    = /\/\/-!-\s*$/;  // //-!- am Zeilenende

  function text(lineEl) {
    return (lineEl.textContent || "").trim();
  }
  function isBlockMarker(lineEl) { return RE_BLOCK_MARKER.test(text(lineEl)); }
  function isHideLine(lineEl)    { return RE_HIDE_LINE.test(text(lineEl)); }

  function findRenderedCmRoot(customEl) {
    let n = customEl.nextElementSibling;
    for (let i = 0; i < 12 && n; i++) {
      const cm = n.querySelector?.(".cm-editor");
      if (cm) return cm;
      n = n.nextElementSibling;
    }
    return null;
  }

  function ensureStyleTag() {
    let tag = document.getElementById("strudel-marker-hide-style");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "strudel-marker-hide-style";
      document.head.appendChild(tag);
    }
    return tag;
  }

  function buildNthList(indices1Based) {
    return indices1Based.map(n => `.cm-content .cm-line:nth-of-type(${n})`).join(", ");
  }

  function applyOne(customEl, idx) {
    const cmRoot = findRenderedCmRoot(customEl);
    if (!cmRoot) return false;

    const uniq = customEl.id ? `sm-${customEl.id}` : `sm-auto-${idx}`;
    cmRoot.classList.add("strudel-cm", uniq);

    const lines = cmRoot.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    let blockMarkerIndex0 = -1;
    const hideLineNums1 = [];
    const hideMarkerNums1 = [];

    lines.forEach((line, i) => {
      if (isBlockMarker(line)) {
        blockMarkerIndex0 = i;
        hideMarkerNums1.push(i + 1);
      }
      if (isHideLine(line)) hideLineNums1.push(i + 1);
    });

    const hideFirstCount = blockMarkerIndex0 >= 0 ? (blockMarkerIndex0 + 1) : 0;

    let css = "";

    if (hideFirstCount > 0) {
      css += `
/* ${uniq}: hide first ${hideFirstCount} lines (until //---) */
.cm-editor.${uniq} .cm-content .cm-line:nth-of-type(-n+${hideFirstCount}) { display:none !important; }
`;
    }

    if (hideLineNums1.length > 0) {
      css += `
/* ${uniq}: hide lines marked with //-!- */
.cm-editor.${uniq} ${buildNthList(hideLineNums1)} { display:none !important; }
`;
    }

    if (hideMarkerNums1.length > 0) {
      css += `
/* ${uniq}: always hide //--- marker line itself */
.cm-editor.${uniq} ${buildNthList(hideMarkerNums1)} { display:none !important; }
`;
    }

    if (hideFirstCount > 0 || hideLineNums1.length > 0 || hideMarkerNums1.length > 0) {
      css += `
.cm-editor.${uniq} .cm-gutters { display:none !important; }
`;
    }

    if (!css) return true; // nichts zu tun ist ok

    const tag = ensureStyleTag();
    const start = `/*BEGIN:${uniq}*/`;
    const end   = `/*END:${uniq}*/`;
    const block = `${start}\n${css}\n${end}\n`;

    const re = new RegExp(`/\\*BEGIN:${uniq}\\*/[\\s\\S]*?/\\*END:${uniq}\\*/\\n?`, "g");
    const current = tag.textContent || "";
    const next = current.match(re) ? current.replace(re, block) : (current + "\n" + block);

    if (next !== current) tag.textContent = next;

    return true;
  }

  // --- Debounce helper ---
  function debounce(fn, ms) {
    let t = null;
    return () => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  // --- Setup observers for each editor ---
  const observed = new WeakSet();

  function attachObserver(customEl, idx) {
    const cmRoot = findRenderedCmRoot(customEl);
    if (!cmRoot) return false;

    if (observed.has(cmRoot)) return true;
    observed.add(cmRoot);

    const reapply = debounce(() => applyOne(customEl, idx), 50);

    // Beobachte Änderungen im Editor (CodeMirror baut DOM gerne um)
    const obs = new MutationObserver(reapply);
    obs.observe(cmRoot, { childList: true, subtree: true, characterData: true });

    // Erstmalig anwenden
    applyOne(customEl, idx);

    return true;
  }

  function processAll() {
    document.querySelectorAll(`strudel-editor.${CLASS_BASE}`).forEach((el, i) => {
      // Versuch: Wenn cmRoot noch nicht da ist, später nochmal probieren
      attachObserver(el, i);
    });
  }

  function start() {
    processAll();

    // Kurzes Bootstrapping-Polling nur um den Moment zu erwischen, wenn cmRoot auftaucht
    let tries = 0;
    const maxTries = 30;    // 30 * 200ms = 6s (nur initial)
    const timer = setInterval(() => {
      processAll();
      if (++tries >= maxTries) clearInterval(timer);
    }, 200);

    window.addEventListener("load", () => {
      processAll();
      setTimeout(processAll, 250);
      setTimeout(processAll, 1000);
    });

    // Nach Klick auf "Update" nochmal (zur Sicherheit)
    document.addEventListener("click", (e) => {
      if ((e.target?.textContent || "").trim() === "Update") {
        setTimeout(processAll, 50);
        setTimeout(processAll, 250);
      }
    });
  }

  start();
})();
