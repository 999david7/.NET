"use strict";

(() => {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  const cards = [...grid.querySelectorAll(".catalog-card")];
  const categories = [...document.querySelectorAll('input[name="category"]')];
  const search = document.getElementById("product-search");
  const brand = document.getElementById("brand-filter");
  const platform = document.getElementById("platform-filter");
  const sort = document.getElementById("product-sort");
  const count = document.getElementById("directory-count");
  const empty = document.getElementById("directory-empty");
  const normalize = text => text.toLocaleLowerCase().trim();

  // Read platform availability from the actual download links so release updates
  // remain the source of truth, rather than maintaining a second platform list.
  const products = cards.map(card => {
    const downloads = [...card.querySelectorAll(".directory-downloads li a")];
    const platforms = [
      ["macos", "macOS"], ["windows", "Windows"], ["linux", "Linux"]
    ].filter(([, label]) => downloads.some(link => link.textContent.includes(label)));
    const platformLabel = card.querySelector(".catalog-platforms");
    platformLabel.replaceChildren();
    if (!platforms.length) platformLabel.textContent = "Release pending";
    platforms.forEach(([, label], index) => {
      if (index) {
        const separator = document.createElement("span");
        separator.setAttribute("aria-hidden", "true");
        separator.textContent = "·";
        platformLabel.append(separator);
      }
      platformLabel.append(document.createTextNode(label));
    });
    return {
      card,
      name: card.dataset.name,
      order: Number(card.dataset.order),
      platforms: platforms.map(([value]) => value),
      searchText: normalize([
        card.dataset.name,
        card.querySelector(".catalog-description").textContent,
        card.querySelector(".catalog-brand").textContent,
        card.querySelector(".catalog-category").textContent
      ].join(" "))
    };
  });

  document.addEventListener("dwi:releases-updated", event => {
    const updated = products.find(product => product.name === event.detail?.name);
    if (!updated) return;
    const links = [...updated.card.querySelectorAll(".directory-downloads li a")];
    const available = [["macos", "macOS"], ["windows", "Windows"], ["linux", "Linux"]]
      .filter(([, label]) => links.some(link => link.textContent.includes(label)));
    updated.platforms = available.map(([value]) => value);
    const label = updated.card.querySelector(".catalog-platforms");
    label.textContent = available.map(([, name]) => name).join(" · ") || "Release pending";
    updateProducts();
  });

  function updateProducts() {
    const category = categories.find(input => input.checked)?.value || "all";
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    const ordered = [...products].sort((a, b) => {
      if (sort.value === "az") return a.name.localeCompare(b.name);
      if (sort.value === "za") return b.name.localeCompare(a.name);
      return a.order - b.order;
    });
    ordered.forEach(product => {
      const show = (category === "all" || product.card.dataset.category === category)
        && (brand.value === "all" || product.card.dataset.brand === brand.value)
        && (platform.value === "all" || product.platforms.includes(platform.value))
        && terms.every(term => product.searchText.includes(term));
      product.card.hidden = !show;
      if (show) visible++;
      else product.card.querySelector("details").open = false;
      grid.append(product.card);
    });
    count.textContent = visible === products.length
      ? `${visible} products`
      : `${visible} of ${products.length} products`;
    empty.hidden = visible !== 0;
  }

  function resetFilters() {
    search.value = "";
    categories.find(input => input.value === "all").checked = true;
    brand.value = "all";
    platform.value = "all";
    sort.value = "featured";
    updateProducts();
  }

  search.addEventListener("input", updateProducts);
  [...categories, brand, platform, sort].forEach(control => control.addEventListener("change", updateProducts));
  document.getElementById("reset-filters").addEventListener("click", resetFilters);
  document.getElementById("empty-reset").addEventListener("click", () => {
    resetFilters();
    search.focus();
  });
  document.querySelectorAll("[data-collection]").forEach(button => {
    button.addEventListener("click", () => {
      resetFilters();
      brand.value = button.dataset.collection;
      updateProducts();
      document.getElementById("catalog-heading").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      brand.focus({ preventScroll: true });
    });
  });
  updateProducts();
})();
