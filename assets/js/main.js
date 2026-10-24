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

  // Text only: no microphone, audio autoplay or account needed.
  var mascot = document.getElementById("studioMascot");
  var bubble = document.getElementById("mascotBubble");
  var mascotLine = document.getElementById("mascotLine");
  var talk = document.getElementById("mascotTalk");
  var dismiss = document.getElementById("mascotDismiss");
  if (mascot && bubble && mascotLine && talk && dismiss) {
    var lines = [
      "Bienvenue ! J’ai rangé les bugs sous le tapis. Ne soulève pas le tapis.",
      "Tu viens pour les jeux ou pour mon incroyable sens de l’accueil ?",
      "Akari sauve la partie. Moi, je sauve les biscuits.",
      "MIRAI a un Neuro Burst. Moi, j’ai un café et beaucoup d’espoir.",
      "Ce studio fonctionne au talent, à la curiosité et aux nouilles instantanées.",
      "Je ne boude pas. Je compile mes émotions.",
      "Quatre projets, un studio, et toujours pas de bouton pour faire la vaisselle.",
      "Tu peux explorer. J’ai désactivé les rencontres aléatoires dans le menu.",
      "Si tu entends de la phonk dans le couloir, c’est probablement Akari.",
      "Le boss de fin du site ? Trouver où j’ai posé mon goûter.",
      "Bienvenue dans notre univers. Les chaussures sont facultatives, la curiosité recommandée.",
      "Je surveille le studio. Enfin… surtout le stock de chocolat.",
      "Attention : regarder nos projets peut provoquer des idées de jeu à 3 heures du matin.",
      "Mon pouvoir spécial ? Transformer cinq minutes de pause en quête secondaire.",
      "Non, je ne suis pas un bouton de sauvegarde. Mais tu peux quand même cliquer.",
      "Un jour, je serai le personnage principal. Aujourd’hui, je garde le coin de l’écran.",
      "Les explosions de MIRAI sont prévues. Les miennes arrivent quand il n’y a plus de thé.",
      "Je voulais dire un truc profond… mais j’ai pensé aux raviolis.",
      "Chaque visite nous donne un point de motivation. Merci pour le combo !",
      "Tu as trouvé le studio secret. Récompense : mon regard très impressionnant."
    ];
    var previous = -1;
    var hideTimer;
    try { previous = Number(sessionStorage.getItem("youthseiko.mascot.last") || -1); } catch (e) { /* Storage is optional. */ }

    function hideBubble() {
      clearTimeout(hideTimer);
      bubble.hidden = true;
      talk.setAttribute("aria-expanded", "false");
    }
    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        if (bubble.contains(document.activeElement) || bubble.matches(":hover")) {
          scheduleHide();
        } else {
          hideBubble();
        }
      }, 14000);
    }
    function sayHello() {
      // Select from all the other lines: no immediate repeat, even on reload.
      var hasPrevious = previous >= 0 && previous < lines.length;
      var index = Math.floor(Math.random() * (lines.length - (hasPrevious ? 1 : 0)));
      if (hasPrevious && index >= previous) index += 1;
      previous = index;
      try { sessionStorage.setItem("youthseiko.mascot.last", String(index)); } catch (e) { /* No cookies required. */ }
      bubble.hidden = false;
      mascotLine.textContent = lines[index];
      talk.setAttribute("aria-expanded", "true");
      scheduleHide();
    }
    mascot.hidden = false;
    talk.addEventListener("click", sayHello);
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
      if (event.persisted) sayHello();
    });
    sayHello();
  }
})();
