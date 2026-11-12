# Little City

A cozy city-building game that runs in your browser. Start with a riverside village and build a city of your own.

## Play

Build roads, cottages, apartments, markets, workshops, parks, schools, and wind turbines. Connect buildings to City Hall, balance housing and jobs, and keep your residents happy. Population milestones earn grants and unlock new buildings.

Progress saves automatically in your browser. Saves are specific to that browser and device.

## Run locally

No build step or dependencies are needed. With Python 3 installed, run:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in your browser. Use an HTTP server; opening index.html directly from disk will not load the JavaScript modules correctly.

## Full-screen interface and four styles

The game map fills the browser window. Compact floating controls show your resources, time, and next milestone. Building tools open only when needed.

Use the full-screen button or F to hide browser chrome on supported browsers. The UI style button lets you preview four styles instantly:

1. **Modern** (recommended): compact glass panels and bright green accents.
2. **Cozy**: warm cream panels, rounded shapes, and soft countryside colors.
3. **Midnight**: navy controls, cyan accents, and illuminated city windows.
4. **Retro**: green and amber panels with arcade-inspired typography.

Style preferences save separately from your city. Existing city saves remain compatible.

## Controls

- Open Build or press K, select a building, then click an empty map tile. The tool panel closes so you can see the city. Use the selected tool repeatedly or open Build to change it.
- Drag to move the map; scroll or use the + and - buttons to zoom.
- Keys 1-8 select construction tools. B selects the bulldozer. Escape deselects.
- Focus the map, then use arrow keys and Enter to build with the keyboard. Space pauses or resumes.
- Press F or use the full-screen button to toggle full screen on supported browsers.
- Use the speed button to switch between 1x, 2x, and 3x simulation speeds.

At 1x speed, one month passes every ten seconds while the game is visible. Dialogs pause the simulation. There is no offline growth. Starting a new city asks before replacing your save.

## Tests

With Node.js 20 or later installed:

```sh
node --test tests/engine.test.mjs
```

The tests cover the starter city, construction rules, road connectivity, demolition refunds, population growth, power, milestone grants, and save restoration.

## Project files

- `dist/index.html`: game interface and icons.
- `dist/styles.css`: responsive styles.
- `dist/app.mjs`: isometric renderer, controls, and browser saves.
- `dist/themes.mjs`: four style palettes and night lighting.
- `dist/engine.mjs`: city simulation and building rules.
- `tests/engine.test.mjs`: simulation tests.

The game uses HTML, CSS, and JavaScript with Canvas 2D. Fonts load from Google Fonts; the game also works with system font fallbacks.
