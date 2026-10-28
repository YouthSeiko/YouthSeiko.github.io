(function () {
  "use strict";

  var catalogue = window.YOUTHSEIKO_I18N;
  var switcher = document.getElementById("language-switcher");
  if (!catalogue || !switcher) return; // A failed catalogue cannot break the French site.
  var allowed = ["fr", "en", "ja"];
  var language = "fr";
  var storageKey = "youthseiko.language";
  var textSources = new WeakMap();
  var attributeSources = new WeakMap();
  var attributes = ["aria-label", "title", "alt", "data-alt", "content"];
  var normalise = function (text) { return text.replace(/\s+/g, " ").trim(); };
  var sourceSchema = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(function (node) {
    try { return { node: node, data: JSON.parse(node.textContent) }; } catch (error) { return null; }
  }).filter(Boolean);

  // Runtime messages have numbers and fragment IDs; keep their state in the game modules.
  var patterns = [
    [/^(\d+) \/ (\d+) fragments retrouvés$/, function (m) { return [m[1] + " / " + m[2] + " fragments found", m[1] + " / " + m[2] + " 個のかけらを発見"]; }],
    [/^Fragment (HEART|MIRAI|BABYLONE|CENTURY) retrouvé ✓$/, function (m) { return [m[1] + " fragment found ✓", m[1] + "のかけらを発見 ✓"]; }],
    [/^Fragment (HEART|MIRAI|BABYLONE|CENTURY) retrouvé\. (.+)$/, function (m) { return [m[1] + " fragment found. " + translate(m[2], "en"), m[1] + "のかけらを発見。" + translate(m[2], "ja")]; }],
    [/^Archive (\d+) · (ouvrir ↗|verrouillée)$/, function (m) { return ["Archive " + m[1] + (m[2] === "ouvrir ↗" ? " · open ↗" : " · locked"), "アーカイブ " + m[1] + (m[2] === "ouvrir ↗" ? " · 開く ↗" : " · ロック中")]; }],
    [/^Page (\d+) \/ (\d+)$/, function (m) { return ["Page " + m[1] + " / " + m[2], m[1] + " / " + m[2] + " ページ"]; }],
    [/^Pièce blanche, (vue de l’autre côté|vue de face)$/, function (m) { return ["White room, " + (m[1] === "vue de face" ? "front view" : "view from the other side"), "白い部屋、" + (m[1] === "vue de face" ? "正面からの眺め" : "反対側からの眺め")]; }]
  ];

  function hasTranslation(source) {
    return Object.prototype.hasOwnProperty.call(catalogue, source) || patterns.some(function (rule) { return rule[0].test(source); });
  }
  function translate(source, target) {
    target = target || language;
    if (target === "fr") return source;
    var index = target === "ja" ? 1 : 0;
    if (Object.prototype.hasOwnProperty.call(catalogue, source)) return catalogue[source][index];
    for (var i = 0; i < patterns.length; i += 1) {
      var match = source.match(patterns[i][0]);
      if (match) return patterns[i][1](match)[index];
    }
    return source;
  }
  function excluded(node) {
    var element = node.nodeType === 1 ? node : node.parentElement;
    return !element || !!element.closest("script, style, noscript, [data-no-i18n]");
  }
  function localiseValue(source) {
    var key = normalise(source);
    if (!key || language === "fr") return source;
    return source.slice(0, source.indexOf(source.trimStart())) + translate(key) + (source.match(/\s*$/) || [""])[0];
  }
  function localiseText(node) {
    if (excluded(node)) return;
    var state = textSources.get(node);
    if (!state || node.data !== state.rendered) state = { source: node.data, rendered: node.data };
    var next = localiseValue(state.source);
    state.rendered = next;
    textSources.set(node, state);
    if (node.data !== next) node.data = next;
  }
  function localiseAttributes(element) {
    if (excluded(element)) return;
    var states = attributeSources.get(element) || {};
    attributes.forEach(function (attribute) {
      if (!element.hasAttribute(attribute)) return;
      if (attribute === "content" && !element.matches('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[property="og:image:alt"], meta[name="twitter:title"], meta[name="twitter:description"]')) return;
      var current = element.getAttribute(attribute);
      var state = states[attribute];
      if (!state || current !== state.rendered) state = { source: current, rendered: current };
      var next = localiseValue(state.source);
      state.rendered = next;
      states[attribute] = state;
      if (next !== current) element.setAttribute(attribute, next);
    });
    attributeSources.set(element, states);
  }
  function localiseTree(root) {
    if (root.nodeType === 3) { localiseText(root); return; }
    if (root.nodeType !== 1 || excluded(root)) return;
    localiseAttributes(root);
    root.querySelectorAll("*").forEach(localiseAttributes);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var text;
    while ((text = walker.nextNode())) localiseText(text);
  }
  function updateSchema(value, key) {
    if (key === "inLanguage") return { fr: "fr-FR", en: "en-GB", ja: "ja-JP" }[language];
    if (Array.isArray(value)) return value.map(function (item) { return updateSchema(item, key); });
    if (value && typeof value === "object") {
      var result = {};
      Object.keys(value).forEach(function (field) { result[field] = updateSchema(value[field], field); });
      return result;
    }
    return typeof value === "string" && ["description", "slogan", "knowsAbout"].indexOf(key) !== -1 ? translate(value) : value;
  }
  function selectLanguage(next, userChoice) {
    if (allowed.indexOf(next) === -1) return;
    language = next;
    document.documentElement.lang = next;
    localiseTree(document.documentElement);
    var locale = document.querySelector('meta[property="og:locale"]');
    if (locale) locale.content = { fr: "fr_FR", en: "en_GB", ja: "ja_JP" }[next];
    sourceSchema.forEach(function (schema) { schema.node.textContent = JSON.stringify(updateSchema(schema.data), null, 2); });
    document.documentElement.style.setProperty("--glitch-caption", JSON.stringify(translate("SIGNAL 000 / LA VITRINE A CHANGÉ DE FRÉQUENCE")));
    switcher.querySelectorAll("[data-language]").forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.language === next)); });
    if (userChoice) {
      try { localStorage.setItem(storageKey, next); } catch (error) { /* The selected language still works for this visit. */ }
      try {
        var url = new URL(window.location.href);
        url.searchParams.set("lang", next);
        history.replaceState(null, "", url);
      } catch (error) { /* File previews and restricted history still work. */ }
      document.getElementById("language-status").textContent = translate("Langue : français.");
    }
    document.dispatchEvent(new CustomEvent("youthseiko:language-change", { detail: { language: next } }));
  }

  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === "characterData") localiseText(record.target);
      else if (record.type === "attributes") localiseAttributes(record.target);
      else record.addedNodes.forEach(localiseTree);
    });
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  var initial = "fr";
  try { var saved = localStorage.getItem(storageKey); if (allowed.indexOf(saved) !== -1) initial = saved; } catch (error) { /* Optional preference. */ }
  try { var requested = new URL(window.location.href).searchParams.get("lang"); if (allowed.indexOf(requested) !== -1) initial = requested; } catch (error) { /* Use the default. */ }
  switcher.querySelectorAll("[data-language]").forEach(function (button) {
    button.addEventListener("click", function () { selectLanguage(button.dataset.language, true); });
  });
  selectLanguage(initial, false);
  switcher.hidden = false;

  // Coverage helper for maintenance; no telemetry, requests or remote translation.
  window.YouthseikoI18n = {
    get language() { return language; },
    translate: translate,
    missing: function () {
      var missing = new Set();
      var walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) {
        if (excluded(node)) continue;
        var state = textSources.get(node);
        var source = normalise(state ? state.source : node.data);
        if (/[A-Za-zÀ-ÿ]/.test(source) && !hasTranslation(source) && !/^[\d\s/.:—–·%✧]+$/.test(source)) missing.add(source);
      }
      document.querySelectorAll("*").forEach(function (element) {
        if (excluded(element)) return;
        var states = attributeSources.get(element) || {};
        Object.keys(states).forEach(function (attribute) {
          var source = normalise(states[attribute].source);
          if (/[A-Za-zÀ-ÿ]/.test(source) && !hasTranslation(source) && !/^(https?:|#)/.test(source)) missing.add(source);
        });
      });
      return Array.from(missing);
    }
  };
})();
