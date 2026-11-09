# Thanasin — paper-cut portfolio

Static site, no build step. Open with any static server, e.g.

    python -m http.server 8765      # then http://localhost:8765/

## What is here
- `index.html`, `projects.html` — the two pages
- `css/site.css` — all styling (paper-cut look, chat, character, diorama)
- `js/site.js` — page logic (cards, interactions, project popups, chat panel)
- `js/paper-avatar.bundle.js` — the paper characters (generated, do not edit by hand)
- `js/diorama.js` — paper arch scenery behind the characters
- `data/content.js` — all the text / projects / links (edit this to change content)
- `data/chat.js` — answers of the "talk to my AI" tag (live answers come from the Vercel function)
- `assets/` — images used by the pages · `demo/` — Food Vote story demo and the robot demo

Developer material (Blender sources, chat backend, character source modules, notes) lives in `../portfolio-dev/`
and is not part of the site.

## Deploy (GitHub Pages)
The loading screen waits for both paper characters to decode and paint their first frame, as well as the page and fonts. It does not dismiss itself on a timer. If a character fails, its fallback image must decode before the page opens. Canvas resizes repaint one frame even below the viewport so section 2 cannot become blank after layout changes.

Publish the contents of this folder. Before publishing: set an absolute URL for `og:image` in both HTML files, and make sure
the BinBuddy demo (`demo:` in `data/content.js`) points at a folder that is published too.
