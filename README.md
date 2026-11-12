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

## Controls

- Select a building, then click an empty map tile to build.
- Drag to move the map; scroll or use the + and - buttons to zoom.
- Keys 1-8 select construction tools. B selects the bulldozer. Escape deselects.
- Focus the map, then use arrow keys and Enter to build with the keyboard. Space pauses or resumes.
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
- `dist/engine.mjs`: city simulation and building rules.
- `tests/engine.test.mjs`: simulation tests.

The game uses HTML, CSS, and JavaScript with Canvas 2D. Fonts load from Google Fonts; the game also works with system font fallbacks.
