(() => {
  const CLASS_BASE = "hide-until-marker";
  const CLASS_ONLY_VIZ = "only-viz";

  // Marker (ohne Leerzeichen)
  const BLOCK_MARK = "//---"; // eigene Zeile empfohlen
  const HIDE_MARK  = "//-!-"; // am Ende einer Zeile empfohlen

  // --- Marker-Erkennung (robust gegen Tokenisierung/Whitespace) ---
  function hasCommentMarker(lineEl, marker) {
    const t = (lineEl.textContent || "");
    const idx = t.indexOf("//");
    if (idx === -1) return false;
    const comment = t.slice(idx);
    return comment.includes(marker);
  }

  function isBlockMarker(lineEl) {
    return hasCommentMarker(lineEl, BLOCK_MARK);
  }

  function isHideLine(lineEl) {
    return hasCommentMarker(lineEl, HIDE_MARK);
  }

  // --- Render-Root finden (bei dir hängt Strudel den CM-Block als Geschwister an) ---
  function findRenderedCmRoot(customEl) {
    let n = customEl.nextElementSibling;
    for (let i = 0; i < 12 && n; i++) {
      const cm = n.querySelector?.(".cm-editor");
      if (cm) return cm;
      n = n.nextElementSibling;
    }
    return null;
  }

  // --- Zeilen wirklich ausblenden (nicht per nth-of-type) ---
  function applyOne(customEl) {
    const cmRoot = findRenderedCmRoot(customEl);
    if (!cmRoot) return false;

    const lines = cmRoot.querySelectorAll(".cm-line");
    if (!lines.length) return false;

    // Index der Block-Markerzeile (letztes Vorkommen gewinnt)
    let blockMarkerIndex0 = -1;
    lines.forEach((line, i) => {
      if (isBlockMarker(line)) blockMarkerIndex0 = i;
    });

    // Wir zählen, ob überhaupt etwas verborgen wird (für gutters)
    let hidesSomething = false;

    // Zeilen dynamisch ausblenden
    lines.forEach((line, i) => {
      const hide =
        (blockMarkerIndex0 >= 0 && i <= blockMarkerIndex0) || // alles bis //---
        isHideLine(line) ||                                   // //-!-
        isBlockMarker(line);                                  // Markerzeile selbst nie zeigen

      if (hide) {
        hidesSomething = true;
        line.style.setProperty("display", "none", "important");
      } else {
        // falls zuvor versteckt und jetzt nicht mehr: zurücksetzen
        line.style.removeProperty("display");
      }
    });

    // Zeilennummern optional verstecken, wenn wir Zeilen ausblenden
    const gutters = cmRoot.querySelector(".cm-gutters");
    if (gutters) {
      if (hidesSomething) gutters.style.setProperty("display", "none", "important");
      else gutters.style.removeProperty("display");
    }

    // only-viz => CodeMirror komplett ausblenden (Visual bleibt)
    if (customEl.classList.contains(CLASS_ONLY_VIZ)) {
      cmRoot.style.setProperty("display", "none", "important");
    } else {
      cmRoot.style.removeProperty("display");
    }

    return true;
  }

  function process() {
    document.querySelectorAll(`strudel-editor.${CLASS_BASE}`).forEach(applyOne);
  }

  // --- Performance: kurzes Initial-Polling, danach nur ereignisbasiert ---
  function start() {
    process();

    // Web Components / CM sind asynchron: kurzes Polling-Fenster
    let tries = 0;
    const maxTries = 18;      // 18 * 200ms = 3.6s
    const intervalMs = 200;

    const timer = setInterval(() => {
      process();
      if (++tries >= maxTries) clearInterval(timer);
    }, intervalMs);

    // Nach Laden nochmal
    window.addEventListener("load", () => {
      process();
      setTimeout(process, 250);
      setTimeout(process, 1000);
    });

    // Nach Klick auf "Update" nochmal (Strudel rendert neu)
    document.addEventListener("click", (e) => {
      if ((e.target?.textContent || "").trim() === "Update") {
        setTimeout(process, 50);
        setTimeout(process, 250);
      }
    });
  }

  start();
})();
