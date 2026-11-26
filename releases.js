"use strict";

// Public release metadata only. No credentials are shipped to the browser.
// Refreshes the static download lists for products that publish GitHub releases.
(() => {
  const PRODUCTS = [
    {id: "freo", name: "Freo", repo: "999david7/freo"},
    {id: "solidwork", name: "SolidWork", repo: "DWI-INC/SolidWork"}
  ];
  const PLATFORMS = ["macOS", "Windows", "Linux"];

  const escape = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  function describe(asset, repository) {
    if (!asset || typeof asset.name !== "string" || !Number.isFinite(asset.size) || asset.size <= 0) return null;
    const name = asset.name.toLowerCase();
    const url = asset.browser_download_url;
    if (typeof url !== "string" || !url.startsWith(`${repository}/releases/download/`) || name.includes("widget")) return null;
    let platform, packageName, kind;
    if (name.endsWith(".dmg")) [platform, packageName, kind] = ["macOS", ".dmg — macOS installer", "DMG installer"];
    else if (name.endsWith("-setup.exe")) [platform, packageName, kind] = ["Windows", ".exe — Windows setup", "Installer"];
    else if (name.endsWith(".msi")) [platform, packageName, kind] = ["Windows", ".msi — Windows setup", "Installer"];
    else if (name.endsWith(".appimage")) [platform, packageName, kind] = ["Linux", ".AppImage — portable app", "AppImage"];
    else if (name.endsWith(".deb")) [platform, packageName, kind] = ["Linux", ".deb — Debian / Ubuntu", "DEB package"];
    else if (name.endsWith(".rpm")) [platform, packageName, kind] = ["Linux", ".rpm — Fedora / Red Hat", "RPM package"];
    else return null;
    let architecture = "";
    if (/arm64|aarch64/.test(name)) architecture = platform === "macOS" ? "Apple silicon (ARM64)" : "ARM64";
    else if (/x86_64|x64|amd64/.test(name)) architecture = platform === "macOS" ? "Intel (x86_64)" : "x64 (x86_64)";
    else if (name.includes("x86")) architecture = "x86 (32-bit)";
    return {platform, architecture, packageName, kind, url, size: `${(asset.size / 1_000_000).toFixed(1)} MB`};
  }

  async function refresh({id, name, repo}) {
    const repository = `https://github.com/${repo}`;
    const directory = document.querySelector(`[data-name="${name}"] .directory-downloads`);
    const product = document.querySelector(`[data-product="${id}"] #download`);
    if (!directory && !product) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: {Accept: "application/vnd.github+json"}, signal: controller.signal
      });
      // Keep the static downloads for missing releases, rate limits, or outages.
      if (!response.ok) return;
      const release = await response.json();
      if (release.draft || release.prerelease || !Array.isArray(release.assets)) return;
      const assets = release.assets.map(asset => describe(asset, repository)).filter(Boolean);
      if (!assets.length) return;
      assets.sort((a, b) => PLATFORMS.indexOf(a.platform) - PLATFORMS.indexOf(b.platform)
        || a.architecture.localeCompare(b.architecture) || a.packageName.localeCompare(b.packageName));
      const version = escape(String(release.tag_name || "").replace(/^v/, ""));
      if (directory) {
        directory.querySelector("ul").innerHTML = assets.map(asset => {
          const short = {"Apple silicon (ARM64)": "Apple silicon", "Intel (x86_64)": "Intel", "x64 (x86_64)": "x64", "x86 (32-bit)": "32-bit"};
          const label = [asset.platform, short[asset.architecture] || asset.architecture, asset.kind].filter(Boolean).join(" · ");
          return `<li><a class="text-link" href="${escape(asset.url)}">${escape(label)} ↓</a> <small>${escape(asset.size)}</small></li>`;
        }).join("");
        document.dispatchEvent(new CustomEvent("dwi:releases-updated", {detail: {name}}));
      }
      if (product) {
        product.querySelector(".release-list").innerHTML = PLATFORMS.map(platform => {
          const matches = assets.filter(asset => asset.platform === platform);
          if (!matches.length) return `<div class="download-platform unavailable"><span>${platform}</span><small>No release available</small></div>`;
          const architectures = [...new Set(matches.map(asset => asset.architecture))];
          const groups = architectures.map(architecture => {
            const rows = matches.filter(asset => asset.architecture === architecture).map(asset =>
              `<div class="release-item"><div><strong>${escape(asset.packageName)}</strong><small>Version ${version} · ${escape(asset.size)}</small></div><a class="button button-primary" href="${escape(asset.url)}" aria-label="Download ${escape(name)} for ${escape(platform)} · ${escape(architecture)} (${escape(asset.kind)})">Download ↓</a></div>`
            ).join("");
            return `<details class="download-architecture" name="${id}-${platform}-architecture"><summary><span>${escape(architecture || `${platform} build`)}</span><span class="disclosure-arrow" aria-hidden="true"></span></summary><div class="download-packages">${rows}</div></details>`;
          }).join("");
          return `<details class="download-platform" name="${id}-platform"><summary><span>${platform}</span><span class="disclosure-arrow" aria-hidden="true"></span></summary><div class="download-architectures"><p class="download-prompt">Choose your processor</p>${groups}</div></details>`;
        }).join("");
        product.querySelector(".download-note").innerHTML = `Choose the package that matches your operating system and processor. <a href="${repository}/releases/latest">Release notes and all downloads ↗</a>`;
      }
    } catch {
      // Network failures leave the static downloads usable.
    } finally {
      clearTimeout(timeout);
    }
  }
  PRODUCTS.forEach(refresh);
})();
