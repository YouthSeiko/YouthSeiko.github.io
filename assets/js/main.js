(function () {
  "use strict";

  var header = document.getElementById("header");
  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");

  // Header shadow on scroll
  function onScroll() {
    if (window.scrollY > 12) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile navigation
  function closeNav() {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Ouvrir le menu");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) closeNav();
    });
  }

  // Project modals
  var openButtons = document.querySelectorAll("[data-modal]");
  var closeButtons = document.querySelectorAll("[data-close]");

  openButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dialog = document.getElementById(btn.getAttribute("data-modal"));
      if (!dialog) return;
      closeNav();
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
        document.body.classList.add("modal-open");
      }
    });
  });

  closeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dialog = btn.closest("dialog");
      if (dialog) dialog.close();
    });
  });

  document.querySelectorAll("dialog.modal").forEach(function (dialog) {
    // Close when clicking outside the modal body
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    // Remove scroll lock when any modal closes
    dialog.addEventListener("close", function () {
      var anyOpen = document.querySelector("dialog.modal[open]");
      if (!anyOpen) document.body.classList.remove("modal-open");
    });
  });

  // Lightbox for gameplay gallery
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");

  document.querySelectorAll("[data-lightbox]").forEach(function (item) {
    item.addEventListener("click", function () {
      if (!lightbox || !lightboxImg) return;
      lightboxImg.src = item.getAttribute("data-lightbox");
      lightboxImg.alt = item.getAttribute("data-alt") || "";
      if (typeof lightbox.showModal === "function") lightbox.showModal();
    });
  });

  document.querySelectorAll("[data-lightbox-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (lightbox) lightbox.close();
    });
  });

  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.close();
    });
  }

  // Scroll reveal
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    document.documentElement.classList.add("has-reveal");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Keep the current section visible in the navigation without hiding content.
  if ("IntersectionObserver" in window && nav) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        nav.querySelectorAll("a").forEach(function (link) {
          if (link.getAttribute("href") === "#" + entry.target.id) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    document.querySelectorAll("main > section[id]").forEach(function (section) { sectionObserver.observe(section); });
  }

  // Yuki: pre-generated Japanese voice, French subtitles, explicit audio opt-in.
  var mascot = document.getElementById("studioMascot");
  var bubble = document.getElementById("mascotBubble");
  var mascotLine = document.getElementById("mascotLine");
  var talk = document.getElementById("mascotTalk");
  var dismiss = document.getElementById("mascotDismiss");
  var voiceToggle = document.getElementById("mascotVoice");
  var voiceStatus = document.getElementById("mascotVoiceStatus");
  if (mascot && bubble && mascotLine && talk && dismiss && voiceToggle && voiceStatus) {
    var lines = window.YUKI_LINES || [{ french: "Moi, c’est Yuki. Je ne t’attendais pas… Enfin, entre quand même !" }];
    var previous = -1;
    var hideTimer;
    var currentLine;
    var voiceEnabled = false;
    var needsGesture = true;
    var playToken = 0;
    var speech = document.getElementById("mascotAudio");
    speech.preload = "none";
    speech.volume = 0.8;
    try { previous = Number(sessionStorage.getItem("youthseiko.mascot.last") || -1); } catch (e) { /* Storage is optional. */ }
    try { voiceEnabled = localStorage.getItem("youthseiko.yuki.voice") === "on"; } catch (e) { /* Storage is optional. */ }

    function updateVoiceButton() {
      voiceToggle.textContent = voiceEnabled && needsGesture ? "Écouter" : voiceEnabled ? "Voix : ON" : "Voix : OFF";
      voiceToggle.setAttribute("aria-pressed", String(voiceEnabled));
      voiceToggle.setAttribute("aria-label", voiceEnabled && needsGesture ? "Écouter Yuki en japonais" : voiceEnabled ? "Couper la voix de Yuki" : "Activer la voix japonaise de Yuki");
    }
    function stopVoice() {
      playToken += 1;
      speech.pause();
      speech.currentTime = 0;
      mascot.classList.remove("is-speaking");
    }
    function playVoice() {
      stopVoice();
      if (!voiceEnabled) return;
      if (!currentLine.audio) {
        voiceStatus.textContent = "Voix indisponible ; le texte reste en français.";
        return;
      }
      var token = playToken;
      needsGesture = false;
      updateVoiceButton();
      speech.src = currentLine.audio;
      voiceStatus.textContent = "Voix japonaise · sous-titre français";
      var attempt = speech.play();
      if (attempt) attempt.catch(function (error) {
        if (token !== playToken) return;
        mascot.classList.remove("is-speaking");
        needsGesture = true;
        voiceStatus.textContent = error.name === "NotAllowedError" ? "Clique sur Écouter pour entendre Yuki." : "Voix indisponible. Tu peux réessayer ; le texte reste lisible.";
        updateVoiceButton();
      });
    }
    speech.addEventListener("playing", function () { mascot.classList.add("is-speaking"); });
    speech.addEventListener("pause", function () { mascot.classList.remove("is-speaking"); });
    speech.addEventListener("ended", function () { mascot.classList.remove("is-speaking"); });

    function hideBubble() {
      clearTimeout(hideTimer);
      stopVoice();
      bubble.hidden = true;
      talk.setAttribute("aria-expanded", "false");
    }
    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        if (bubble.contains(document.activeElement) || bubble.matches(":hover") || !speech.paused) {
          scheduleHide();
        } else {
          hideBubble();
        }
      }, 14000);
    }
    function sayHello(userGesture) {
      stopVoice();
      // Select from all the other lines: no immediate repeat, even on reload.
      var hasPrevious = lines.length > 1 && previous >= 0 && previous < lines.length;
      var index = Math.floor(Math.random() * (lines.length - (hasPrevious ? 1 : 0)));
      if (hasPrevious && index >= previous) index += 1;
      previous = index;
      try { sessionStorage.setItem("youthseiko.mascot.last", String(index)); } catch (e) { /* No cookies required. */ }
      bubble.hidden = false;
      currentLine = lines[index];
      mascotLine.textContent = currentLine.french;
      voiceStatus.textContent = voiceEnabled ? "Clique sur Yuki ou Écouter pour sa voix japonaise." : "Active la voix pour entendre Yuki en japonais.";
      talk.setAttribute("aria-expanded", "true");
      if (userGesture && voiceEnabled) playVoice();
      scheduleHide();
    }
    mascot.hidden = false;
    updateVoiceButton();
    var reduceYuki = document.getElementById("mascotReduce");
    var restoreYuki = document.getElementById("mascotRestore");
    if (reduceYuki && restoreYuki) {
      reduceYuki.addEventListener("click", function () {
        hideBubble();
        mascot.classList.add("is-compact");
        restoreYuki.focus({ preventScroll: true });
      });
      restoreYuki.addEventListener("click", function () {
        mascot.classList.remove("is-compact");
        sayHello(true);
        talk.focus({ preventScroll: true });
      });
    }
    talk.addEventListener("click", function () { sayHello(true); });
    voiceToggle.addEventListener("click", function () {
      if (voiceEnabled && !needsGesture) {
        voiceEnabled = false;
        stopVoice();
        voiceStatus.textContent = "Voix coupée · le texte reste en français";
      } else {
        voiceEnabled = true;
        bubble.hidden = false;
        talk.setAttribute("aria-expanded", "true");
        playVoice();
        scheduleHide();
      }
      try { localStorage.setItem("youthseiko.yuki.voice", voiceEnabled ? "on" : "off"); } catch (e) { /* Optional preference. */ }
      updateVoiceButton();
    });
    dismiss.addEventListener("click", function () {
      talk.focus({ preventScroll: true });
      hideBubble();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !bubble.hidden) {
        if (bubble.contains(document.activeElement)) talk.focus({ preventScroll: true });
        hideBubble();
      }
    });
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        needsGesture = true;
        updateVoiceButton();
        sayHello(false);
      }
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopVoice();
        needsGesture = true;
        updateVoiceButton();
      }
    });
    window.addEventListener("pagehide", stopVoice);
    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-modal]")) stopVoice();
    });
    sayHello(false);
  }
})();
