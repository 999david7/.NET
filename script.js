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

const categoryFilter = document.getElementById("category-filter");
const brandFilter = document.getElementById("brand-filter");
if (categoryFilter && brandFilter) {
  const groups = [...document.querySelectorAll(".directory-group")];
  const count = document.getElementById("directory-count");
  const empty = document.getElementById("directory-empty");
  function filterSoftware() {
    let visible = 0;
    groups.forEach(group => {
      const categoryMatches = categoryFilter.value === "all" || group.dataset.category === categoryFilter.value;
      let groupVisible = false;
      group.querySelectorAll(".directory-card").forEach(card => {
        const show = categoryMatches && (brandFilter.value === "all" || card.dataset.brand === brandFilter.value);
        card.hidden = !show;
        if (show) { groupVisible = true; visible++; }
      });
      group.hidden = !groupVisible;
    });
    count.textContent = `${visible} ${visible === 1 ? "app" : "apps"}`;
    empty.hidden = visible !== 0;
  }
  categoryFilter.addEventListener("change", filterSoftware);
  brandFilter.addEventListener("change", filterSoftware);
  filterSoftware();
}
