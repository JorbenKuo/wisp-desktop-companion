# V2 design and interaction verification

Date: 2026-10-17 (Asia/Shanghai)

final result: passed

## Source visual truth

- Existing V1 project and browser capture: `qa/v1-reference.jpg` (1064 × 956 px). Used for pixel character, asset treatment, light work surface and violet UI continuity. V2 intentionally adds document and table scenes, rather than cloning V1's entire whiteboard layout.
- New book asset: `assets/grimoire-spread.png` (1586 × 992 px with alpha). Used directly as the terminal's background, with live HTML controls on its pages.

## Rendered evidence and normalization

- `qa/workspace.jpg`: 1064 × 956 px; document editor, 43px companion and persistent familiar marks.
- `qa/grimoire.jpg`: 1064 × 956 px; expanded guide chapter. Book layout box x=52, y=153, width=960, height=650 CSS px.
- `qa/skill-menu.jpg`: 985 × 956 px; compact skill menu over the table scene. This image is supplementary and is not used for a 1:1 comparison to V1.
- `qa/narrow-settings.jpg`: 760 × 820 px; settings chapter at a narrow desktop breakpoint. Long settings content has its own scroll area. Page scroll width measured 760px, with no horizontal page overflow.
- Browser screenshots are at 1 pixel per CSS px for the comparison captures. V1 and V2 workspace dimensions both 1064 × 956. No density scaling needed.
- `qa/style-comparison.jpg`: V1 and V2 shown together, full views, 1064px panels; scene change is intentional. Used to assess asset scale, text hierarchy, overall palette and obstruction.
- `qa/book-comparison.jpg`: source PNG scaled to the exact 960 × 650 book box, beside the matching rendered book crop. Used to check cover, spine, page margins and text placement. Source blank pages are intentionally filled with functional UI in the implementation.
- Both comparison composites were opened and visually reviewed. The focused book comparison supplements the full-view comparison because small text and page margins need a closer check.

## Required visual surfaces

- Typography: system Chinese UI type retained for readable editable content; serif book headings and compact monospace labels. Card copy increased to 12px and book copy to 11px in the readability pass; functional text darkened. Small secondary labels remain deliberately subdued.
- Spacing/layout: companion ~43px, skill panel 254px, familiar rail 42px. Book content moved into actual parchment area; controls do not overlap the spine or cover. Narrow desktop settings scroll without hiding the close control.
- Color: existing violet, warm paper and quiet neutral surfaces retained. Book uses warm brown on parchment. Gold marks indicate unread results; read results use a calmer green status mark.
- Assets: original PNG character and familiars reused; new alpha PNG book is rendered directly. Raster artwork uses pixelated scaling. No emoji or approximate CSS illustrations replace the assets.
- Copy: default work example is general creative work, with worldbuilding retained as a separate scene. Labels clearly identify local simulation; no claims of real AI training or system-level software integration.

## Findings and fixes

1. [Resolved P2] Initial book running labels sat too close to the cover. Increased top/bottom page insets and rechecked in `grimoire.jpg` and `book-comparison.jpg`.
2. [Resolved P2] Secondary explanatory text was too light at compact sizes. Darkened body copy and increased key text sizes; reviewed final book and narrow settings captures.
3. [Resolved P2] Continuous tasks could only be paused while actively processing. Added pause/resume to ready continuous tasks and preserved the prior state. UI verified after completion and refresh.
4. [Resolved P2] One-shot tasks incorrectly described a read result as continuing to watch. Corrected read labels to distinguish continuous and one-shot work. Reloaded final build and verified one-shot label, archive removal and continuous recall.
5. [Resolved P2] Book movement could allow an early click to hit a moving chapter. Disabled book controls during the 520ms opening animation; reduced-motion setting skips the waiting interval.

## Primary browser interactions verified

- First-time guide, sample delegation and explicit confirmation before any task mark appears.
- Context menu event (the browser equivalent of macOS two-finger secondary click) opens the four-skill menu.
- Text editing in document and table scenes; local changes survive scene switches.
- Two familiar types active together; switch document/table/whiteboard without losing their marks.
- Running task pause, persisted paused progress after reload, resume and completion.
- Completed continuous task pause/resume.
- Scoped continuous document check restarts after an edit; no action, task or book panel opens automatically.
- Completed result changes after its source material changes; source remains user-edited, with no automatic write-back.
- One-shot result archival removes its mark; recall removes a continuous task's mark.
- Shift-select two whiteboard blocks, propose relation and require user confirmation to keep it.
- Option+M opens book even from document editing; Escape closes it.
- Four book chapters, task list opens the relevant task, user confirmation writes an observed habit.
- Reduced-motion checkbox and pace selector change visibly; settings persist after reload.
- Explicit reset confirmation restores original example content. Preview returned to a clean document and onboarding state.
- Console warnings/errors: none observed in the final browser log check. Runtime error banner remained hidden.
- JavaScript syntax checked with bundled Node; all three generated HTML entrypoints identical; no unresolved template tokens.

## Limits / follow-up polish

- This is a browser prototype. Native overlay, actual cross-app access, true background execution and AI inference are outside this build.
- Export button is implemented but download contents were not separately inspected in this QA pass.
- A phone-sized window was not separately tested; verified desktop widths are 1064 and 760 CSS px.
- Pixel character motion reuses poses with transform animation; bespoke idle sprite sequences can be a later art pass.

## Implementation checklist

- [x] Three requested capabilities present.
- [x] Explicit consent and scope for background delegation.
- [x] Persistent marks, pause/resume, ready, archive and recall.
- [x] Book hidden by default and opened through dedicated shortcut.
- [x] Offline self-contained HTML output, source files and local preview.
- [x] No remaining actionable P0/P1/P2 findings in verified desktop scope.

## V2.1 revision — four user requests (2026-10-17)

final result: passed

Source: existing `assets/arcane-ring.png`, familiar PNGs and V2 working UI. The user explicitly requested a circular menu, earlier idle, a material furnace and a fuller summoning sequence. Other workspace layout and original user task were preserved.

Evidence:
- `qa/before-v2-1.jpg` and `qa/v2-1/spell-circle.jpg`: both 1205 × 956 pixels, 1px per CSS px, same document state. `qa/v2-1/comparison.jpg` puts them together and was visually reviewed.
- `qa/v2-1/menu-preview.jpg`: focused capture of the actual restored ring menu. Uses the existing raster spell-circle asset, five live buttons and the small central witch; no substitute illustration.
- `qa/v2-1/furnace-result.jpg` and `furnace-draft.jpg`: actual imported text, source names, stated read scope and local example output.
- `qa/v2-1/summon-start.jpg`: invocation stage of the new circle/materialization animation; followed in-browser by the familiar mark and completed result.
- `qa/v2-1/narrow-furnace.jpg`: 760 × 820 viewport; panel measured x=20, y=90, width=410, height=583.8, bottom=673.8. No horizontal overflow; close, materials controls and actions reachable.

Checks:
- Idle threshold is 1200ms for gentle mode, 650ms for lively mode; minor pointer jitter does not continuously reset the idle timer. Browser showed idle/hat after stopping. Settings/character size retained.
- Context menu opens a centered ring, existing selection scope preserved, five skills functional. Furnace opens from its ring button and remains as a small independent object when collapsed.
- Native file chooser tested with real TXT, DOCX, PPTX, XLSX and text-layer PDF fixtures. All five produced non-empty extracted text; unsupported binary fixture was separately marked as excluded. PDF.js ran locally with an embedded worker, without console errors or CDN fetches.
- Actual extracted content checked against sample values (dates, 3000/1500 amounts and personnel names). Both check and draft recipes produced output grounded in these extracted materials and showed local-demo status. Unknown binary was excluded from result sources.
- Current-workspace copy and pasted-text ingestion tested. File/text material removal works; test-only material copies were removed before handoff.
- Furnace-to-familiar flow asks for consent and clearly limits file work to copied content. Summoning task materializes in the circle for 1.7 seconds then flies to its mark (~1.15 seconds); analysis starts after materialization. Completed background result used the copied document content and was archived through the UI.
- Added explicit XLSX relationship mapping so workbook tab ordering does not relabel sheet data. Long task/action panels constrained to viewport budget; old furnace output clears when a new brew starts.
- Original user document and original unread familiar task remained intact. Browser preview returned to the restored circle menu with an empty, ready-to-use furnace.
- Final browser warning/error logs empty. App and document-reader JavaScript syntax checks passed. All generated HTML entrypoints match and contain no unresolved template tokens.

Scope limits: extraction is real, analysis/generation remains local example logic. No OCR, old binary Office/iWork conversion, native OS integration or real model inference. Drag/drop handlers implemented; the automated file test used the file chooser, not an OS drag gesture. TXT/DOCX/PPTX/XLSX/PDF tested; ancillary HTML/RTF/ODF/EPUB branches and encrypted/scanned PDF feedback were not separately exercised in this revision.

Fidelity: character and spell artwork unchanged, restrained violet/warm-paper tokens retained, compact text hierarchy consistent. Full-view comparison plus focused ring and narrow furnace review found no remaining actionable P0/P1/P2 issue in verified desktop scope. Bespoke character idle frames remain future P3 artwork polish.

## V3.1 — English desktop and scoped pixel magic (2026-10-17)

final result: passed

The existing working prototype is the source target. The user requested familiar OS conventions, English competition content, more understandable magical skill names, a calmer ring, and pixel styling for every Wisp-owned surface. The OS and document typography intentionally remain conventional.

### Visual evidence

- `qa/v3-en/spell-menu.jpg` is the English desktop before the pixel-theme pass; `qa/v3-en/final-desktop.jpg` is the final pixel interface. Both are 1064 × 956 CSS pixels, with the same arranged window layout and spell-menu state, without density scaling. Familiar completion adds a side mark in the final view as expected.
- `qa/v3-en/pixel-comparison.jpg` puts these views together. Opened and visually reviewed: system text, window proportions and document content remain steady; the magic layer changes to Pixelify Sans, square outlines and offset shadows. The sparse ring and two-note thread icon are retained.
- `qa/v3-en/pixel-delegation.jpg` shows the actual English pixel prompt, three familiar choices, readable scope, input, checkbox and consent actions.
- `qa/v3-en/pixel-grimoire.jpg` shows the actual pixel-type book layout. Book artwork is the existing PNG. The final small follow-up makes the close button and slider square and removes background blur, as shown in the narrow settings capture.
- `qa/v3-en/pixel-settings-narrow.jpg` is 760 × 820. Square checkbox and range handle, clear English labels, chapter navigation, close control and the independently scrolling settings page remain accessible. No horizontal page overflow observed. Temporary viewport override was reset.

### Interaction and implementation checks

- File, View and Window menus open and execute actions. Native-style minimize/restore, maximize/restore, closing/reopening, Dock focus and desktop reveal work.
- Native pointer drag moves windows; resize gesture changed the document from 496 × 710 to 520 × 686 during testing. Layout arrangement restores presentation positions while preserving content and tasks.
- Initially the right rail covered the edge of a reference window. Reserved a 72px rail area so resize and window controls remain separate from familiar marks.
- Full English sample content, accessible names, status labels, preferences, guide, settings, task results and document-reader feedback were checked. Static scan found no CJK characters in the five UI/script sources.
- The English date checker detects the November 8 / November 10 example. Familiar consent, summoning, completed English report and persistence after reload were verified. Existing Chinese storage remains untouched under a separate key.
- Caught and removed an obsolete walkthrough-button listener after replacing the old header; this had stopped final initialization. Final reloads show the saved familiar, active cursor animation and no new console warnings/errors.
- Desktop file drag was changed to a pointer gesture after native HTML drag did not reach the cauldron. Verified a real drag of Venue notes into the cauldron: one material, 454 characters, labelled as a desktop-file copy. Brewed the English summary, opened the resulting report and removed that test material.
- Pixelify Sans is embedded in every HTML entrypoint. Browser font check passed; computed magic font is Wisp Pixel, while document heading remains Georgia. All Wisp controls inherit the pixel face. The native familiar tooltip was replaced by a pixel tooltip; OS tooltips retain system styling.
- Magic menu, action cards, tasks, cauldron, grimoire, walkthrough, toasts, file-drop feedback, captions and familiar marks use square controls and pixel type. The reduced-motion setting and keyboard access remain available.
- Combined JavaScript and reader JavaScript syntax checks passed. All four HTML entrypoints are identical and have no unresolved build tokens. Font and icon licenses are bundled, including in standalone HTML.
- Final browser console issues after the corrected final build: zero. Preview left open on the pixel spell menu with three sample apps and the original English test familiar.

No remaining actionable P0/P1/P2 finding in the verified desktop scope. This remains a local browser simulation; no native OS integration or live model inference was added. Phone layouts, every ancillary document format and native system-wide gestures were not tested in this revision.

## V3.2 Four basics and proposals 2026-10-17

final result: passed

The agreed product model is implemented as four fixed circle buttons: Understand, Check, Create, Summon. Additional help is offered as a proposal. Current English pixel styling and conventional OS typography remain.

Evidence: `qa/v3-2/before.jpg`, `final-basics.jpg` and the opened `comparison.jpg` show the before/after menu at 1064 by 956. Background window order differs because Canvas was opened during the proposal test; the focused menu and document geometry are unchanged. `check.jpg` shows a date conflict with original evidence; `proposal.jpg` shows an actual two-note connection proposal.

Verified in-browser: four button count; Understand gives source-based points, Check gives a distinct issue and evidence, Create gives a new event draft, Summon opens directly with one-time scope and no default watching. Shift-selecting two notes proposes a connection; acceptance gives a candidate while the board remains unchanged until Keep is chosen. Check on Sheets offers continued watching, and only accepting that proposal exposes watching in the consent form. Cross-document organization was proposed with two named sources; Not now left the cauldron empty. Repeated Understand use offered remembering short summaries; Not now dismissed it without writing a preference. No task was started by merely opening these proposals. Pixel styling and source scope remain visible. Menu arrival now fades without moving controls so rapid clicks work. Final console warnings/errors: zero.

Implemented but not separately exercised end to end in this revision: accepted cross-document summary, accepted memory persistence, Copy result, and the new proposal setting toggle. Existing familiar execution, book settings and file-reader QA remains in the preceding sections. No native OS access or live AI is claimed. No remaining actionable P0/P1/P2 issue was observed in the verified core flow.
