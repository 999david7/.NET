#!/usr/bin/env python3
"""Refresh installer links on the software directory and product pages."""
import html
import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPOSITORIES = {
    "freo": "999david7/freo",
    "solidwork": "DWI-INC/SolidWork",
    "melora": "999david7/Melora",
    "quill": "Replace-Big-Tech-Apps/Quill",
    "times": "Replace-Big-Tech-Apps/Times",
    "lbrowser": "Replace-Big-Tech-Apps/LBrowser",
    "keepy": "Replace-Big-Tech-Apps/Keepy",
    "cloudy": "Replace-Big-Tech-Apps/Cloudy",
    "ghosty": "Replace-Big-Tech-Apps/Ghosty",
    "calcium": "Replace-Big-Tech-Apps/Calcium",
    "wired-paper": "Wired-Office/Wired-Paper",
    "wired-grid": "Wired-Office/Wired-Grid",
    "wired-slides": "Wired-Office/Wired-Slides",
}
LOCAL_INSTALLERS = {
    "keepy": ("Keepy-1.0.dmg", "macOS 15+ · Apple silicon and Intel"),
    "cloudy": ("Cloudy-1.0.dmg", "macOS 14+ · Apple silicon"),
    "ghosty": ("Ghosty-1.0.dmg", "macOS 13+ · Apple silicon and Intel"),
}
PLATFORMS = ("macOS", "Windows", "Linux")
# Products that keep a GitHub link instead of failing when no release is published.
RELEASE_PENDING_OK = {"freo": "Freo", "solidwork": "SolidWork"}


def describe(product, filename):
    name = filename.lower()
    if "widget" in name:
        return None
    if name.endswith(".dmg"):
        platform, kind = "macOS", "DMG installer"
    elif name.endswith("-setup.exe") or name.endswith(".msi"):
        platform, kind = "Windows", "Installer"
    elif name.endswith(".deb"):
        platform, kind = "Linux", "DEB package"
    elif name.endswith(".rpm"):
        platform, kind = "Linux", "RPM package"
    elif name.endswith(".appimage"):
        platform, kind = "Linux", "AppImage"
    elif product == "melora" and name.endswith(".zip") and "windows" in name:
        platform, kind = "Windows", "ZIP archive · extract to install"
    elif product == "melora" and name.endswith(".tar.gz") and "linux" in name:
        platform, kind = "Linux", "TAR.GZ archive · extract to install"
    else:
        return None
    if any(arch in name for arch in ("arm64", "aarch64")):
        architecture = "Apple silicon" if platform == "macOS" else "ARM64"
    elif any(arch in name for arch in ("x86_64", "x64", "amd64")):
        architecture = "Intel" if platform == "macOS" else "x64"
    elif "x86" in name:
        architecture = "32-bit"
    elif product in ("quill", "lbrowser"):
        architecture = "Apple silicon + Intel"
    elif product == "calcium":
        architecture = "Apple silicon"
    else:
        architecture = ""
    return platform, architecture, kind


def installer_assets(product, repo, release):
    if release is None:
        return
    for asset in release["assets"]:
        description = describe(product, asset["name"])
        if description is None or asset["size"] <= 0:
            continue
        url = asset["browser_download_url"]
        if not url.startswith(f"https://github.com/{repo}/releases/download/"):
            raise ValueError(f"Unexpected download URL: {url}")
        size = f'{asset["size"] / 1_000_000:.1f} MB'
        yield (*description, url, size)


def local_installer(product):
    filename, label = LOCAL_INSTALLERS[product]
    path = ROOT / "downloads" / filename
    size = path.stat().st_size
    if size <= 0:
        raise ValueError(f"Installer is empty: {path}")
    return f"downloads/{filename}", label, f"{size / 1_000_000:.1f} MB"


def product_name(repo):
    name = repo.rsplit("/", 1)[-1].replace("-", " ")
    return html.escape(name[:1].upper() + name[1:])


def download_section(product, repo, release):
    platforms = {platform: {} for platform in PLATFORMS}
    architecture_labels = {
        "Apple silicon": "Apple silicon (ARM64)",
        "Intel": "Intel (x86_64)",
        "x64": "x64 (x86_64)",
        "32-bit": "x86 (32-bit)",
        "": "macOS build",
    }
    package_labels = {
        "DMG installer": ".dmg — macOS installer",
        "Installer": ".exe — Windows setup",
        "DEB package": ".deb — Debian / Ubuntu",
        "RPM package": ".rpm — Fedora / Red Hat",
        "AppImage": ".AppImage — portable app",
        "ZIP archive · extract to install": ".zip — extract to install",
        "TAR.GZ archive · extract to install": ".tar.gz — extract to install",
    }
    escape = html.escape
    name = product_name(repo)
    for platform, architecture, kind, url, size in installer_assets(product, repo, release):
        architecture = architecture_labels.get(architecture, architecture)
        label = f"{platform} · {architecture}"
        meta = f'Version {release["tag_name"].removeprefix("v")} · {size}'
        package = package_labels.get(kind, kind)
        if url.lower().endswith(".msi"):
            package = ".msi — Windows setup"
        row = (f'<div class="release-item"><div><strong>{escape(package)}</strong><small>{escape(meta)}</small></div>'
               f'<a class="button button-primary" href="{escape(url, quote=True)}" '
               f'aria-label="Download {name} for {escape(label, quote=True)} ({escape(kind, quote=True)})">Download ↓</a></div>')
        platforms[platform].setdefault(architecture, []).append((package, row))
    if not any(platforms.values()):
        if product in LOCAL_INSTALLERS:
            url, label, size = local_installer(product)
            return (
                f'<div class="release-list" aria-label="{name} downloads">\n'
                f'<div class="release-item"><div><strong>{escape(label)}</strong><small>DMG installer · {size}</small></div>'
                f'<a class="button button-primary" href="../{escape(url)}" download>Download {name} ↓</a></div>\n</div>'
                '<p class="download-note">Open the DMG and drag the app into Applications. '
                'Apple has not notarized this build.</p>'
            )
        if product in RELEASE_PENDING_OK:
            return (f'<div class="release-list" aria-label="{name} downloads"><p class="release-empty">'
                    'No installer release is available yet.</p></div>'
                    f'<p class="download-note"><a href="https://github.com/{repo}">View {name} on GitHub ↗</a> · '
                    f'<a href="https://github.com/{repo}/releases">Releases and downloads ↗</a></p>')
        raise ValueError(f"No installable downloads found for {repo}")
    content = []
    for platform, architectures in platforms.items():
        if not architectures:
            content.append(f'<div class="download-platform unavailable"><span>{platform}</span><small>No release available</small></div>')
            continue
        groups = []
        for architecture, packages in sorted(architectures.items()):
            rows = "\n".join(row for _, row in sorted(packages))
            groups.append(
                f'<details class="download-architecture" name="{product}-{platform}-architecture">'
                f'<summary><span>{escape(architecture)}</span><span class="disclosure-arrow" aria-hidden="true"></span></summary>'
                f'<div class="download-packages">{rows}</div></details>')
        groups_html = "\n".join(groups)
        content.append(
            f'<details class="download-platform" name="{product}-platform">'
            f'<summary><span>{platform}</span><span class="disclosure-arrow" aria-hidden="true"></span></summary>'
            f'<div class="download-architectures"><p class="download-prompt">Choose your processor</p>{groups_html}</div></details>')
    content_html = "\n".join(content)
    notes = "Open the downloaded DMG and drag the app into Applications. Requires macOS 15 or later." if product in ("quill", "times") else "Choose the package that matches your operating system and processor."
    return (f'<div class="release-list" aria-label="{name} downloads">\n{content_html}\n</div>'
            f'<p class="download-note">{notes} <a href="https://github.com/{repo}/releases/latest">Release notes and all downloads ↗</a></p>')


def latest_release(product, repo, headers):
    request = urllib.request.Request(f"https://api.github.com/repos/{repo}/releases/latest", headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        if error.code != 404 or (product not in LOCAL_INSTALLERS and product not in RELEASE_PENDING_OK):
            raise
        return None


def directory_downloads(product, repo, release):
    escape = html.escape
    assets = list(installer_assets(product, repo, release))
    rows = []
    if assets:
        assets.sort(key=lambda asset: (PLATFORMS.index(asset[0]), asset[1], asset[2]))
        for platform, architecture, kind, url, size in assets:
            label = " · ".join(part for part in (platform, architecture, kind) if part)
            rows.append(f'<li><a class="text-link" href="{escape(url)}">{escape(label)} ↓</a> <small>{size}</small></li>')
    elif product in LOCAL_INSTALLERS:
        url, label, size = local_installer(product)
        rows.append(
            f'<li><a class="text-link" href="{escape(url)}" download>'
            f'{escape(label)} · DMG ↓</a> <small>{size}</small></li>'
        )
    elif product in RELEASE_PENDING_OK:
        rows.append(f'<li>No installer release is available yet. <a class="text-link" href="https://github.com/{repo}/releases">View releases ↗</a></li>')
    else:
        raise ValueError(f"No installable downloads found for {repo}")

    name = product_name(repo)
    downloads = "\n".join(rows)
    note = "" if assets or product not in LOCAL_INSTALLERS else '<small class="directory-download-note">Local build. Apple has not notarized this installer.</small>\n'
    if product in RELEASE_PENDING_OK:
        note += f'<small class="directory-download-note"><a class="text-link" href="https://github.com/{repo}">View {RELEASE_PENDING_OK[product]} on GitHub ↗</a></small>\n'
    return (
        f'<details class="directory-downloads" name="software-downloads">\n'
        f'<summary aria-label="Downloads for {name}">Downloads</summary>\n<ul>\n{downloads}\n</ul>\n'
        f'{note}</details>'
    )


def main():
    # Prepare every update before writing any pages.
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "DWI-download-updater"}
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    directory_path = ROOT / "software.html"
    directory = directory_path.read_text()
    updates = {}
    for product, repo in REPOSITORIES.items():
        release = latest_release(product, repo, headers)
        marker = rf'(<!-- downloads:{product} -->).*?(<!-- /downloads:{product} -->)'
        details = directory_downloads(product, repo, release)
        directory, count = re.subn(marker, lambda match: f"{match[1]}\n{details}\n{match[2]}", directory, flags=re.S)
        if count != 1:
            raise ValueError(f"Missing or duplicate download markers for {product}")
        content = download_section(product, repo, release)
        path = ROOT / "Products" / f"{product}.html"
        page = path.read_text()
        pattern = r'<div class="release-list"[^>]*>.*?<p class="download-note">.*?</p>'
        updated, count = re.subn(pattern, lambda match: content, page, count=1, flags=re.S)
        if count != 1:
            raise ValueError(f"Download section missing: {path}")
        updates[path] = updated
    updates[directory_path] = directory
    for path, content in updates.items():
        path.write_text(content)
        print(f"Updated {path.name}")


if __name__ == "__main__":
    main()
