document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("pre code.language-abc").forEach((block, i) => {
    const abc = block.textContent;
    const div = document.createElement("div");
    div.className = "abc-notation";
    block.parentNode.replaceWith(div);

    ABCJS.renderAbc(div, abc, {
      responsive: "resize",
      staffwidth: 600
    });
  });
});
