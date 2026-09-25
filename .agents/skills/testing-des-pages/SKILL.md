---
name: testing-des-pages
description: How to boot and end-to-end test the static Arabic study pages (miqraa, wahy, etc.) in the medmrf-10/des repo locally — data dependencies, local server, and driving Chrome via CDP for mobile-width verification.
---

# Testing des static pages locally

The site is plain static HTML/JS (no build, no framework). Pages fetch JSON data and load sibling scripts with relative paths like `../wahy/data/...` and `../shared/...`.

## Data dependencies

- Pages may 404/fail on audit/feature branches that lack data dirs. Pull them into the working tree (do NOT commit) with: `git checkout origin/main -- wahy shared` (adjust paths per page).
- `wahy/data/index.json` entries use `{n, ar, en, ayahs, place, bismillah}` — there is **no** `v` field; code doing `s.v` throws TypeError and pages render "تعذّر تحميل البيانات — افتح عبر الموقع المنشور".
- `wahy/data/surah/<n>.json` uses `verses[{k, a, t}]`.

## Serving

- Serve the **repo root**, not a subdir: `python3 -m http.server 8099` then open `http://localhost:8099/<page>/`.
- A `favicon.ico` 404 in console is expected locally — ignore it.

## Driving Chrome via CDP

- `google-chrome` is at `~/.local/bin/google-chrome`. Remote debugging REQUIRES a non-default profile: `--remote-debugging-port=9222 --user-data-dir=/tmp/<name> --no-first-run --no-default-browser-check`.
- Python websockets lib (`websockets` 16.x) is installed under `~/.local/lib/python3.10/site-packages` for `/usr/bin/python3` only — interactive/tty shells resolve `python3` to pyenv 3.12 which does NOT have it. Run scripts with `/usr/bin/python3` or `PYTHONPATH=$HOME/.local/lib/python3.10/site-packages`.
- Chrome's normal window has a ~500px min-width — `--window-size=360` will not shrink it. For mobile-width tests use CDP `Emulation.setDeviceMetricsOverride` (e.g. 360x700, deviceScaleFactor 1, mobile true) — applied on a persistent session it sticks for the whole run; `Page.captureScreenshot` then yields exact-width evidence PNGs.
- `write_to_process` sends literal bytes — always terminate commands with `<CR>` or the tty buffer never delivers the line.
- `pkill`/`pgrep -f <pattern>` matches the executing shell's own cmdline — self-kills. Use bracket tricks (`miq_pr[o]f`, `809[9]`) or explicit PIDs.

## What good verification looks like

- Fetch assertions via `Runtime.evaluate` with `returnByValue` (DOM counts, option text, `typeof MUTA`/`FSRS`, localStorage). Keep one persistent WS session so `Runtime.exceptionThrown`, `Network.responseReceived>=400`, and `console.error` are captured across the whole flow.
- For bug fixes, first reproduce the bug on a temp copy of the page (e.g. sed the old expression back in) to prove the test can detect failure, then test the fixed page.
- Clicks via `Input.dispatchMouseEvent` at `getBoundingClientRect().center` are trusted and reliable under emulation.
