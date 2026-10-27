(function () {
  "use strict";

  // Registries are deliberately small: add fragments/archives here, scenes in HTML.
  // These experiments are not canonical game documents. No network calls or telemetry.
  var FRAGMENTS = [
    { id: "HEART", mark: "♡", hint: "Yuki protège quelque chose. Elle n’aime pas qu’on insiste." },
    { id: "MIRAI", mark: "💉", hint: "Une seringue près du nom de MIRAI cache un signal persistant." },
    { id: "BABYLONE", mark: "□", hint: "La curiosité du studio a laissé traîner un cube blanc." },
    { id: "CENTURY", mark: "✉", hint: "Quelqu’un attend près de CENTURY. Vérifie ses messages." }
  ];
  var ARCHIVES = [{ id: "000", requires: ["HEART", "MIRAI", "BABYLONE", "CENTURY"], button: "archive-unlock", document: "archive-000" }];
  var STORAGE_KEY = "youthseiko.fragments.v1";
  var fragments = new Set();
  var storageAvailable = true;
  var storageDamaged = false;
  var validIds = FRAGMENTS.map(function (item) { return item.id; });
  var byId = function (id) { return document.getElementById(id); };

  function readFragments(raw) {
    if (!raw) return [];
    var saved = JSON.parse(raw);
    if (!saved || saved.version !== 1 || !Array.isArray(saved.fragments)) throw new Error("Unsupported save");
    return saved.fragments.filter(function (id) { return validIds.indexOf(id) !== -1; });
  }
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    try { fragments = new Set(readFragments(raw)); } catch (error) { storageDamaged = true; }
  } catch (error) { storageAvailable = false; }

  function persist() {
    try {
      // Merge another tab's discoveries before writing; unknown IDs are ignored.
      var raw = localStorage.getItem(STORAGE_KEY);
      try { readFragments(raw).forEach(function (id) { fragments.add(id); }); } catch (error) { /* Replace only our malformed save. */ }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, fragments: Array.from(fragments) }));
      storageAvailable = true;
      storageDamaged = false;
    } catch (error) { storageAvailable = false; }
  }

  function archiveReady(archive) {
    return archive.requires.every(function (id) { return fragments.has(id); });
  }

  FRAGMENTS.forEach(function (item) {
    var slot = document.createElement("li");
    slot.dataset.fragment = item.id;
    var mark = document.createElement("span");
    mark.className = "fragment-mark";
    mark.textContent = item.mark;
    mark.setAttribute("aria-hidden", "true");
    var title = document.createElement("strong");
    title.textContent = item.id;
    var status = document.createElement("span");
    status.className = "fragment-state";
    var hint = document.createElement("details");
    var summary = document.createElement("summary");
    summary.textContent = "Un indice ?";
    var text = document.createElement("p");
    text.textContent = item.hint;
    hint.append(summary, text);
    slot.append(mark, title, status, hint);
    byId("fragment-slots").appendChild(slot);
  });

  function render() {
    byId("glitch-enter").disabled = !archiveReady(ARCHIVES[0]);
    document.querySelectorAll("[data-fragment-count]").forEach(function (node) { node.textContent = fragments.size + " / " + FRAGMENTS.length; });
    byId("archive-progress").textContent = fragments.size + " / " + FRAGMENTS.length + " fragments retrouvés";
    document.querySelectorAll("[data-fragment]").forEach(function (slot) {
      var found = fragments.has(slot.dataset.fragment);
      slot.classList.toggle("is-found", found);
      slot.querySelector(".fragment-state").textContent = found ? "Retrouvé ✓" : "À retrouver";
    });
    document.querySelectorAll("[data-claim]").forEach(function (button) {
      if (!fragments.has(button.dataset.claim)) return;
      button.disabled = true;
      button.textContent = "Fragment " + button.dataset.claim + " retrouvé ✓";
    });
    if (fragments.has("HEART")) byId("notebook-entry").hidden = false;
    byId("storage-note").textContent = !storageAvailable
      ? "Le stockage est indisponible. Tes fragments restent acquis pendant cette visite, mais leur conservation après rechargement n’est pas garantie."
      : storageDamaged
        ? "La sauvegarde locale est illisible. Tu peux retrouver les fragments ; la prochaine découverte créera une nouvelle sauvegarde."
        : "Les fragments sont conservés dans ce navigateur. Aucun compte nécessaire.";
    ARCHIVES.forEach(function (archive) {
      var ready = archiveReady(archive);
      byId(archive.button).disabled = !ready;
      byId(archive.button).textContent = "Archive " + archive.id + (ready ? " · ouvrir ↗" : " · verrouillée");
    });
  }

  var yukiClicks = 0;
  var notebookPage = 0;
  var terminalInspected = false;
  var terminalCompared = false;
  var inscriptionRead = false;
  var roomTurned = false;
  var objectFound = false;
  var chatIndex = 0;
  var dateInspected = false;
  var chatLines = ["Je pensais que tu reviendrais.", "Tu as vu mon dernier message ?", "Pourquoi tu ne réponds pas ?", "…"];
  // Eligibility is checked at claim time, not on dialog open or page load.
  var canClaim = {
    HEART: function () { return yukiClicks >= 7 && notebookPage === 2; },
    MIRAI: function () { return terminalInspected && terminalCompared; },
    BABYLONE: function () { return inscriptionRead && roomTurned && objectFound; },
    CENTURY: function () { return chatIndex === chatLines.length && dateInspected; }
  };

  document.querySelectorAll("[data-claim]").forEach(function (button) {
    button.addEventListener("click", function () {
      var id = button.dataset.claim;
      if (!canClaim[id] || !canClaim[id]() || fragments.has(id)) return;
      fragments.add(id);
      persist();
      render();
      var feedback = document.querySelector('[data-feedback="' + id + '"]');
      feedback.textContent = "Fragment " + id + " retrouvé. " + (storageAvailable ? "Il est conservé dans ce navigateur." : "Stockage indisponible : conservé pour cette visite seulement.");
      // Keep keyboard focus in the scene after disabling the claim button.
      button.closest(".secret-body").querySelector('[data-modal="secret-archives"]').focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent("youthseiko:fragment-found", { detail: { id: id, count: fragments.size } }));
    });
  });

  document.addEventListener("youthseiko:yuki-interaction", function (event) {
    yukiClicks += 1;
    var reactions = {
      1: "Quoi ? Tu veux quelque chose ?",
      3: "Tu comptes continuer longtemps ?!",
      5: "Hé ! Ne touche pas à ça !",
      7: "… Tu n’as rien vu, compris ?! Le carnet est là. Ne plie pas les pages."
    };
    if (yukiClicks >= 7) byId("notebook-entry").hidden = false;
    if (reactions[yukiClicks]) {
      event.preventDefault();
      event.detail.say(reactions[yukiClicks]);
    }
  });

  function showNotebookPage() {
    document.querySelectorAll("[data-notebook-page]").forEach(function (page) { page.hidden = Number(page.dataset.notebookPage) !== notebookPage; });
    byId("notebook-position").textContent = "Page " + (notebookPage + 1) + " / 3";
    byId("notebook-prev").disabled = notebookPage === 0;
    byId("notebook-next").disabled = notebookPage === 2;
    if (document.activeElement.disabled) {
      (notebookPage === 2 ? document.querySelector('[data-claim="HEART"]:not(:disabled)') || byId("notebook-prev") : byId("notebook-next")).focus({ preventScroll: true });
    }
  }
  byId("notebook-next").addEventListener("click", function () { notebookPage = Math.min(2, notebookPage + 1); showNotebookPage(); });
  byId("notebook-prev").addEventListener("click", function () { notebookPage = Math.max(0, notebookPage - 1); showNotebookPage(); });
  byId("terminal-inspect").addEventListener("click", function () {
    terminalInspected = true;
    byId("terminal-report").hidden = false;
    byId("terminal-compare").focus({ preventScroll: true });
  });
  byId("terminal-compare").addEventListener("click", function () {
    if (!terminalInspected) return;
    terminalCompared = true;
    byId("terminal-result").hidden = false;
    var claim = document.querySelector('[data-claim="MIRAI"]');
    if (!claim.disabled) claim.focus({ preventScroll: true });
  });
  byId("room-inscription").addEventListener("click", function () {
    inscriptionRead = true;
    byId("room-description").textContent = "« Ce qui manque se trouve de l’autre côté. » Le cube porte le même signe.";
  });
  byId("room-turn").addEventListener("click", function () {
    roomTurned = !roomTurned;
    byId("room-scene").classList.toggle("is-turned", roomTurned);
    byId("room-scene").setAttribute("aria-label", "Pièce blanche, " + (roomTurned ? "vue de l’autre côté" : "vue de face"));
    byId("room-turn").textContent = roomTurned ? "Revenir face au mur ↶" : "Voir l’autre côté ↻";
    byId("room-description").textContent = roomTurned ? "Le cube a changé de place. Une fente apparaît sur sa face arrière." : "Le mur est revenu. Ou bien est-ce toi ?";
    // Do not leave a collectible exposed after returning to the wrong side.
    document.querySelector('[data-claim="BABYLONE"]').hidden = !(objectFound && roomTurned);
  });
  byId("room-object").addEventListener("click", function () {
    if (inscriptionRead && roomTurned) {
      objectFound = true;
      byId("room-description").textContent = "Le signe s’aligne avec la fente. Un fragment blanc s’en détache.";
      document.querySelector('[data-claim="BABYLONE"]').hidden = false;
    } else {
      byId("room-description").textContent = inscriptionRead ? "Cette face est lisse. L’inscription parlait d’un autre côté." : "Un signe gravé. Il ressemble à celui du mur.";
    }
  });
  byId("chat-next").addEventListener("click", function () {
    if (chatIndex >= chatLines.length) return;
    var line = document.createElement("li");
    line.textContent = chatLines[chatIndex];
    byId("chat-messages").appendChild(line);
    chatIndex += 1;
    byId("chat-status").textContent = chatLines[chatIndex - 1];
    if (chatIndex === chatLines.length) {
      byId("chat-next").hidden = true;
      byId("chat-date").hidden = false;
      byId("chat-inspect-date").focus({ preventScroll: true });
    }
  });
  byId("chat-inspect-date").addEventListener("click", function () {
    if (chatIndex !== chatLines.length) return;
    dateInspected = true;
    byId("chat-result").hidden = false;
    var claim = document.querySelector('[data-claim="CENTURY"]');
    if (!claim.disabled) claim.focus({ preventScroll: true });
  });

  // A single in-flow notice on exploration; no popup, sound, timer or stolen focus.
  var noticeDismissed = false;
  byId("century-dismiss").addEventListener("click", function () {
    noticeDismissed = true;
    byId("century-notice").hidden = true;
    document.querySelector('#project-century .secret-trigger').focus({ preventScroll: true });
  });
  if ("IntersectionObserver" in window) {
    var noticeObserver = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      if (!noticeDismissed && !fragments.has("CENTURY")) byId("century-notice").hidden = false;
      noticeObserver.disconnect();
    }, { threshold: 0.25 });
    noticeObserver.observe(byId("project-century"));
  } // The envelope remains available if observation is unsupported.

  ARCHIVES.forEach(function (archive) {
    byId(archive.button).addEventListener("click", function () {
      if (!archiveReady(archive)) return;
      byId(archive.document).hidden = false;
      byId(archive.document).querySelector("h3").focus({ preventScroll: false });
    });
  });
  // A voluntary visual reward. Never restored automatically on a later visit.
  byId("glitch-enter").addEventListener("click", function () {
    if (!archiveReady(ARCHIVES[0]) || byId("archive-000").hidden) return;
    document.body.classList.add("is-glitched");
    byId("glitch-controls").hidden = false;
    Array.from(document.querySelectorAll("dialog[open]")).reverse().forEach(function (dialog) { dialog.close(); });
    byId("glitch-status").textContent = "Version glitch activée. Le bouton Revenir au site normal reste disponible en bas de l’écran.";
    window.scrollTo({ top: 0, behavior: "instant" });
    byId("glitch-exit").focus({ preventScroll: true });
  });
  byId("glitch-exit").addEventListener("click", function () {
    document.body.classList.remove("is-glitched");
    byId("glitch-controls").hidden = true;
    byId("glitch-status").textContent = "Version normale rétablie. Tes fragments sont conservés.";
    document.querySelector(".site-header .brand").focus({ preventScroll: true });
  });
  window.addEventListener("storage", function (event) {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      readFragments(event.newValue).forEach(function (id) { fragments.add(id); });
      render();
    } catch (error) { /* An invalid external value cannot break the active visit. */ }
  });

  render();
  document.querySelectorAll("[data-secret-control]").forEach(function (control) { control.hidden = false; });
})();
