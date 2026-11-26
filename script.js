"use strict";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#main-nav");

function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("open");
}

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    navigation.classList.toggle("open", !isOpen);
  });
  navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Use original product artwork when added to assets/<product>.png.
// Otherwise leave the existing illustrated icon or letter fallback visible.
document.querySelectorAll("img[data-logo]").forEach(img => {
  function loaded() { if (img.naturalWidth > 0) img.classList.add("is-loaded"); }
  if (img.complete) loaded();
  else img.addEventListener("load", loaded, { once: true });
});
