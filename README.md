# DWI website

Open `index.html` in your browser. `software.html` presents all apps in a responsive product grid with search, category, collection, and operating-system filters, plus featured or alphabetical sorting. All 13 apps have a standalone product page in `Products/` with an overview, features, and downloads. Shared styles, scripts, assets, and installers stay in their existing locations. Freo, SolidWork, and Cloudy also have screenshots from their project documentation.

The directory labels Freo, SolidWork, and Melora under DWI; Quill, Times, LBrowser, Keepy, Cloudy, Ghosty, and Calcium under Replace Big Tech Apps; and Wired Paper, Wired Grid, and Wired Slides under Wired Office. The sub-brand labels follow repository owners. The homepage shows four featured apps and links to the full directory.

Every card in the directory includes a Downloads menu with direct links to installer files.

## Nutzungsbedingungen

`nutzungsbedingungen.html` displays the supplied terms and links to the downloadable source file, `nutzungsbedingungen.md`. Every page links to the terms in its footer. Before publishing, replace the legal name, postal address, and contact email placeholders in both files, and review the text against the actual services and licenses.

## Official app logos

App icons in `assets/` were exported from the installed app bundles. The product pages and directory use those icons with letter fallbacks.

## Downloads on GitHub Pages

The directory and product pages list available installers for all 13 apps. The menus and links work without JavaScript, including in a GitHub Pages project subdirectory.

| Software | Repository | Downloads |
| --- | --- | --- |
| Freo | [999david7/freo](https://github.com/999david7/freo) | macOS DMGs; Windows x64/ARM64/32-bit setup; Linux DEB, RPM, and AppImage (x64 and ARM64) |
| SolidWork | [DWI-INC/SolidWork](https://github.com/DWI-INC/SolidWork) | macOS DMGs; Windows x64/ARM64/32-bit setup; Linux DEB, RPM, and AppImage (x64 and ARM64) |
| Melora | [999david7/Melora](https://github.com/999david7/Melora) | macOS DMGs; Windows ZIP and Linux TAR.GZ archives |
| Quill | [Replace-Big-Tech-Apps/Quill](https://github.com/Replace-Big-Tech-Apps/Quill) | macOS universal DMG |
| Times | [Replace-Big-Tech-Apps/Times](https://github.com/Replace-Big-Tech-Apps/Times) | macOS DMG |
| LBrowser | [Replace-Big-Tech-Apps/LBrowser](https://github.com/Replace-Big-Tech-Apps/LBrowser) | macOS DMG |
| Calcium | [Replace-Big-Tech-Apps/Calcium](https://github.com/Replace-Big-Tech-Apps/Calcium) | macOS DMG |
| Wired Paper, Wired Grid, Wired Slides | [Wired Office](https://github.com/Wired-Office) | macOS DMG, Windows x64 installer, Linux x64 DEB and AppImage |
| Keepy | [Replace-Big-Tech-Apps/Keepy](https://github.com/Replace-Big-Tech-Apps/Keepy) | Local macOS 15+ DMG for Apple silicon and Intel |
| Cloudy | [Replace-Big-Tech-Apps/Cloudy](https://github.com/Replace-Big-Tech-Apps/Cloudy) | Local macOS 14+ DMG for Apple silicon |
| Ghosty | [Replace-Big-Tech-Apps/Ghosty](https://github.com/Replace-Big-Tech-Apps/Ghosty) | Local macOS 13+ DMG for Apple silicon and Intel |

Melora's Windows and Linux downloads are labeled as archives because those releases do not include setup installers. Each product page also links to its release notes and full asset list.

After publishing a new app release, refresh the static links, versions, and file sizes with Python 3 (no dependencies):

```sh
python3 scripts/update-downloads.py
```

The updater reads public GitHub release metadata and requires internet access. It uses the installers in `downloads/` for Keepy, Cloudy, and Ghosty until their repositories publish installable releases.

For GitHub Pages, publish this directory's static files, including `downloads/`. The other apps' installers are served by GitHub Releases. This local directory does not currently have a Git remote or deployment configuration.

## Notes

- Contact address `hello@dwi-inc.net` is a placeholder. Verify or change it before publishing.
- Product descriptions are example marketing copy and should be reviewed before launch.
- Static HTML, CSS, and JS; no dependencies or build system required.

## Software catalog

`software.css` and `software.js` contain the catalog-specific design and interactions. The homepage and product pages use the existing shared styles. The catalog includes a three-column desktop grid, a tablet grid, and single-column phone cards. Search, category, collection, and operating-system filters combine; Reset restores all products. Collection cards at the bottom filter and return to the product grid.

Product pages and download disclosures remain available without JavaScript. Installer links retain the `downloads:<product>` markers used by `scripts/update-downloads.py`. With JavaScript enabled, operating-system labels and filtering are derived from the current download links.

## Freo and SolidWork releases

Freo's source and releases are at https://github.com/999david7/freo; SolidWork's are at https://github.com/DWI-INC/SolidWork. `releases.js` checks the public latest-release API when the catalog or a Freo/SolidWork product page loads and displays available DMG, Windows setup/MSI, and Linux DEB/RPM/AppImage assets. The catalog updates its platform labels and filters after releases load. Drafts, prereleases, source archives, and empty files are excluded. No GitHub credentials are needed in the browser.

The static download updater uses the same repositories. When no release is published, the pages link to the repository/releases instead of offering old installers. Rate limits, timeouts, or offline use preserve the static content; run `python3 scripts/update-downloads.py` to refresh that fallback after a release.

## Hardware

`hardware.html` presents DWI hardware projects, starting with [The Bond Case](https://github.com/DWI-INC/The-Bond-Case). The shared header and footer link to Hardware from every page. `hardware.css` styles the responsive project listing. The repository was empty when added, so the page links to GitHub and marks project details as coming soon.
