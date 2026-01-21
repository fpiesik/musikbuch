# Rhythmus – Puls und Wiederholung

## Der musikalische Puls

In der Musik ist der **Puls** das regelmäßige Zeitraster, auf dem Klänge erscheinen.
Im folgenden Beispiel hören wir einen gleichmäßigen Puls mit zwei verschiedenen
Schlägen.

👉 Achte nur auf **Reihenfolge** und **Wiederholung**, nicht auf Technik.

---
<div style="display:flex; gap:.5rem; align-items:center; margin:.5rem 0;">
  <button type="button" onclick="window.__strudelToggle?.()">▶/■</button>
  <button type="button" onclick="window.__strudelEval?.()">Update</button>
</div>

<strudel-editor class="strudel" id="ex1">
  <!--
sound("bd sd").fast(2)
  -->
</strudel-editor>

<script>
(function () {
  const el = document.getElementById("ex1");
  const wait = setInterval(() => {
    const ed = el?.editor;
    if (!ed) return;

    clearInterval(wait);

    // Wenn dein Editor-Objekt Zugriff auf den Code bietet:
    const code = ed.getCode?.() || el.textContent || "";
    const lines = code.split("\n").filter(l => l.trim().length).length;

    if (lines > 8) {
      // hier müsstest du je nach API "scroll to bottom" aufrufen
      ed.scrollToBottom?.();
    }
  }, 100);
})();
</script>



---

## Was hörst du?

- Welche Klänge wiederholen sich?
- Entsteht ein Gefühl von „vorwärts gehen“?
- Kannst du mitzählen?

---

## Aufgabe

Verändere **nur** die Zeichenfolge im Klammerausdruck:

```text
bd sd
