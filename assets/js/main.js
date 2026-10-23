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
})();
