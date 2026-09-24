---
name: testing-arabic-input
description: How to type Arabic (and other non-Latin) text into browser fields during computer-use GUI testing when the type action produces nothing.
---

# Typing Arabic text into web pages during GUI testing

When testing Arabic/RTL sites with the `computer` tool, the `type` action may silently produce no text in fields (no keysym mapping for Arabic in the X11 layout). Symptoms: field stays empty/placeholder only.

## Workaround: xdotool Unicode key events

1. Click the target input field with the `computer` tool so it has keyboard focus.
2. From the shell, send each character as a Unicode key event:

```bash
DISPLAY=:0 xdotool key --delay 150 U0627 U0644 U0648 U0631 U0642 U0627 U062A   # الورقات
```

- Each `UXXXX` is the Unicode code point of one character (e.g. ا=U0627 ل=U0644 و=U0648 ر=U0631 ق=U0642 ت=U062A).
- Use `--delay 150` or more: shorter delays can drop keystrokes (a missing char yields a wrong search term and confusing results — verify the typed text with a `zoom` screenshot before asserting).
- This fires real `input` events, so live-search/`oninput` handlers trigger correctly.
- Works for any site; no clipboard tool needed (xclip/xsel are often not installed).

## Notes

- Get code points per string: `python3 -c "print(' '.join(f'U{ord(c):04X}'.upper() for c in 'الورقات'))"`
- `type` works fine for Latin text; only use this for non-Latin scripts.
- For number inputs / ASCII fields, plain `type` + `Tab` (to fire `change`) is enough.
