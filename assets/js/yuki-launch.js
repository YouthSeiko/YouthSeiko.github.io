(function () {
  "use strict";
  var header = document.getElementById("header");
  var install = document.getElementById("yuki-desktop-install");
  var badge = install && install.querySelector("ms-store-badge");
  if (!header || !badge) return;

  function measureHeader() {
    document.documentElement.style.setProperty("--site-header-height", Math.ceil(header.getBoundingClientRect().height) + "px");
  }
  if ("ResizeObserver" in window) new ResizeObserver(measureHeader).observe(header);
  window.addEventListener("resize", measureHeader);
  measureHeader();

  function updateBadge(language) {
    var locales = { fr: "fr-fr", en: "en-gb", ja: "ja-jp" };
    language = locales[language] ? language : "fr";
    badge.setAttribute("language", language);
    badge.setAttribute("theme", document.body.classList.contains("is-glitched") ? "light" : "dark");
    badge.setAttribute("aria-label", { fr: "Installer Yuki Desktop 2D avec Microsoft", en: "Install Yuki Desktop 2D with Microsoft", ja: "Microsoft経由でYuki Desktop 2Dをインストール" }[language]);
    document.querySelectorAll("[data-yuki-store-link]").forEach(function (link) {
      link.href = "https://apps.microsoft.com/detail/9NXR6J4HHC0K?hl=" + locales[language];
    });
  }
  document.addEventListener("youthseiko:language-change", function (event) { updateBadge(event.detail.language); });
  new MutationObserver(function () { updateBadge(document.documentElement.lang); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  updateBadge(document.documentElement.lang);

  // Load the official component once its install area is approached, not on arrival.
  var loading = false;
  function loadBadge() {
    if (loading) return;
    loading = true;
    var script = document.createElement("script");
    script.type = "module";
    script.src = "https://get.microsoft.com/badge/ms-store-badge.bundled.js";
    document.head.appendChild(script);
  }
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      loadBadge();
      observer.disconnect();
    }, { rootMargin: "300px" });
    observer.observe(install);
  } else loadBadge();
})();
