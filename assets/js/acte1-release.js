(function () {
  "use strict";
  var button = document.querySelector("[data-acte1-trailer]");
  if (!button) return;
  button.addEventListener("click", function () {
    var frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/mtY2pzi8atQ";
    frame.title = "▶ Voir le trailer officiel"; // French source translated by the site observer.
    frame.allow = "encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    button.replaceWith(frame);
    frame.focus();
  });
})();
