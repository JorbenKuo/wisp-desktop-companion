# Wisp · English Desktop Demo

[中文开发指南](docs/DEVELOPMENT.zh-CN.md) · [中文版产品说明 PDF](docs/Wisp-Product-Guide.zh-CN.pdf)

Current version: **v0.3.2**. Private team prototype; no backend or live AI service is connected.

An offline interactive concept of a little pixel witch who lives beside your cursor. The familiar desktop makes her role easy to explain: work stays in ordinary apps; Wisp brings a separate pixel interface into the moment you need help.

## Open

Double-click `index.html` or `source/shell.html`. Fonts, icons, artwork and document readers are embedded. No installation, CDN or network connection is needed.

The local preview is http://127.0.0.1:4188/ . To serve it again:

```sh
python3 -m http.server 4188 --bind 127.0.0.1
```

## A 90-second demonstration

1. Move the cursor, then pause. Wisp follows you and starts her little idle routine after about 1.2 seconds.
2. Drag an app by its title bar. Switch between Pages, Mail and Sheets using the Dock. Standard window buttons close, minimize and zoom. The File menu opens demo files; View can arrange windows or show the desktop.
3. Secondary-click the proposal heading. Choose **Check**. The sample catches a poster due on November 10 for an event opening on November 8.
4. Choose **Summon**, inspect the exact scope and confirm **Summon familiar**. Watch the summoning and flight. Continue in another app while its small side mark remains. Completion lights the mark without opening a panel.
5. Open **Idea Cauldron**. Add the current document, paste text, select files, or drag a desktop file into it. Choose Understand, Check or Create for the collected materials. A familiar can continue with the extracted copies.
6. Press **Option + M** to open the waist grimoire. Show the familiar register, confirmed preferences and settings. Press **Esc** to close it.

Optional worldbuilding example: open Canvas, Shift-click two notes and pause for Wisp to propose a connection. Accept the proposal to explore it; keep the relationship only after reviewing it.

A short English pitch:

> Wisp is a personal cursor companion for the tools you already use. You choose what to entrust to her. She reads, connects ideas and calls familiars for longer tasks, while a quiet mark keeps you informed. Her grimoire holds the preferences you confirm. The vision is an OS-level companion that learns your working rhythm through feedback, without asking you to abandon your workspace.

## Four basics, plus proposals

| Always available | Purpose |
| --- | --- |
| Understand | Explain and summarize the selected material |
| Check | Find gaps, conflicts and questions, with source evidence |
| Create | Produce a new draft or possible direction |
| Summon | Call a familiar directly and assign a scoped task |

The four buttons keep fixed positions. Secondary-click opens the circle; no earlier action or proposal is needed to use Summon. Direct summons are one-time tasks by default.

Specific extra help is proposed by Wisp: Shift-click two Canvas notes and pause for a connection proposal; moving between Pages and Sheets can prompt a joint summary; a Check result can offer continued watching; repeated Understand use can offer to remember a preference. Accept or decline each proposal. A proposal does not start a task or change a preference before acceptance. Watching additionally shows its scope before the familiar is sent. Helpful proposals can be disabled in grimoire settings.

The cauldron remains available as a desktop object for document input, using Understand, Check and Create recipes plus Summon. It is not a fifth basic ability. Original files and documents stay unchanged.

## Visual language

- The simulated OS and editable documents use familiar system typography, a menu bar, standard window controls and a Dock.
- Every Wisp-owned surface uses **Pixelify Sans**, embedded as `Wisp Pixel`: spell menu, prompts, task cards, familiar marks, cauldron, grimoire, walkthrough, notices and drop feedback.
- Square borders, offset pixel shadows, square checkboxes, a square range handle and stepped opening states distinguish the magic layer.
- The quiet lavender ring has no continuous rotation or dense rune decoration. Star Thread uses two paper notes joined by a glowing thread.
- Original pixel witch and familiar PNGs remain in use.

## What is real in this build

Window movement, resizing, focus, closing, minimizing, restoring, document editing, local persistence, consent, task controls, file reading and the English interface are interactive. Idle timing, summoning, flights and persistent side marks are implemented.

TXT, DOCX, PPTX, XLSX and text-layer PDF extraction were verified in the preceding reader build. Basic HTML, RTF, OpenDocument and EPUB extraction are also implemented but were not individually verified. Each file shows its reading scope. Unsupported or unreadable files are excluded from generated results.

Limits: up to 12 materials, 20 MB each, 60,000 characters per material; PDF up to 50 pages, presentations up to 100 slides, spreadsheets up to 25 sheets and 1,000 rows per sheet. Scanned documents and images need OCR, which is outside this demo.

## Prototype boundary

This is a browser simulation of an OS-level companion, not a native operating-system overlay. It does not access other apps or monitor a real system cursor. Insights, drafting, familiar progress and learning suggestions use transparent local demo rules, not live AI. Behaviour counts do not imply learned understanding.

Content stays in browser localStorage. Closing the page pauses simulated work. The English demo uses `pixel-witch-companion-en-v3`, separate from the previous Chinese session. Previous Chinese builds are not included in this development repository. User documents and confirmed preferences are never silently translated or migrated.

## Source

- `source/shell.template`: English structure and OS chrome.
- `source/desktop.js`: simulated app windows and editable content.
- `source/os.js`: menu actions, toolbars, desktop-file gestures.
- `source/app.js`: companion, consent, familiars, memory and grimoire.
- `source/abilities.js`: Understand, Check, Create and the contextual proposal logic.
- `source/documents.js`: offline document readers.
- `source/style.css`: ordinary OS layer and scoped pixel magic theme.
- `assets/`: character sprites, ring and thread artwork, local fonts and standard icons.
- `build.py`: embeds everything into identical standalone HTML entrypoints.
- `design-qa.md`, `verification.json`, `qa/v3-en/`: verification and rendered evidence.

Run `python3 build.py` after editing source; do not edit generated HTML directly. The default build writes only inside this repository. Use `python3 build.py --legacy-exports` only if you need the two compatibility HTML exports in the parent folder.

Run `python3 scripts/check.py` for build consistency and embedded JavaScript syntax checks (requires Python 3 and Node.js). CI runs this on pushes and pull requests.

Standard OS icons: [Phosphor Icons](https://github.com/phosphor-icons/core), MIT license in `assets/os-icons/LICENSE.txt`. Pixelify Sans: [Google Fonts source](https://github.com/google/fonts/tree/main/ofl/pixelifysans), SIL Open Font License in `assets/fonts/OFL.txt`. Reader licenses are in `vendor/`. Generated ring and thread prompts are stored beside their PNGs.
