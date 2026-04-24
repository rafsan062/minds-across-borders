# VA4 implementation plan — Minds Across Borders

**Purpose:** working plan for a three-person team: who owns what, how the repo is split, what we build first, and which decisions are still open. Deeper checklists, optional ideas, and the decision log live in `VA4-implementation-notes.md`.

---

## 1) Team and ownership

| Teammate | Primary scope | Notes |
|----------|----------------|--------|
| **Sasi** | `index.html`, `css/`, `js/state.js` | **Starts first** — page shell, styles, the **`state.js` contract** (fields + `get` / `set` / `subscribe`), and a short JSDoc so map/bar/scatter/ui stay aligned. **First `main.js` skeleton** (`async` load + one `boot()` that calls each `init*`). |
| **Rizvan** | `js/map.js`, `js/scatter.js` | Implements `initMap`, `initScatter` using **only** the public state API. Fills in **data loading in `main.js`** and passes GeoJSON/rows into map/scatter as agreed with Sasi. |
| **Andrew** | `js/ui.js`, `js/bar.js` | Implements `initBar`, `initUI` using **only** the public state API. Wires tooltips and controls to `setState` (no new top-level state fields without Sasi). |

**Shared coordination**

- **One** `index.html` — Sasi sets **script order** (state → feature modules → `main`). If you use `type="module"`, Sasi sets import graph so `state.js` loads first.
- **Only Sasi** renames or adds **top-level** state fields. Everyone else uses **`getState()`**, **`setState(partial)`** (or the documented setter helpers), and **`subscribe(listener)`** to react to changes. No `import { state }` and `state.foo =` from feature files unless Sasi documents that as API.
- **`main.js` — Sasi (skeleton) + Rizvan (load/geo) + Andrew (as needed for early DOM hooks)** — one entry that loads assets once, seeds state, and calls the four inits in order. Details in §2 below.

**Git**

- One repo, **`main`**, small frequent commits, **`git pull` before you edit** someone else’s file areas.

---

## 2) `state.js` (Sasi) — single source of app state

Sasi’s job is to define a **small, explicit contract** the whole app uses. Feature modules (map, scatter, bar, ui) must **not** each keep a parallel copy of “current country” without syncing through here.

**Public API (pattern)**

Export three functions (names can be exactly this for clarity):

- **`getState()`** — return a read-only *view* of state (e.g. shallow copy or frozen object) or the same object if the team accepts careful mutation only via `setState`.
- **`setState(partial)`** — shallow-merge updates into the internal state object, then call all **subscribers** so every view re-renders or patches what changed.
- **`subscribe(fn)`** — `fn` runs after every `setState`; return an **`unsubscribe`** function. Each module: subscribe once in its `init`, update D3 on notification.

(Alternate: a tiny `createStore` pattern — same three behaviors.)

**V1 state fields (initial spec — Sasi can add fields, but not silently)**

| Field | Type / example | Set by / meaning |
|--------|-----------------|------------------|
| `countryKey` | string, e.g. `"country"` or `"iso3"` | **Sasi** at init — one canonical column (or feature id) that joins **CSV row ↔ GeoJSON feature**. Everyone compares this string. |
| `rows` | `Array<object>` | **`main.js`** after `d3.csv` (one object per country row). |
| `rowById` | `Map` or `Record<string, object>` | **Optional, `main.js`** after load — `countryKey` → row for O(1) lookup (tooltip, detail). If missing, build from `rows` in ui. |
| `geo` | GeoJSON `FeatureCollection` or similar | **`main.js` after** `d3.json` on the world file. |
| `hoveredId` | `string \| null` | **Rizvan/Andrew** — country id for **transient** hover (tooltip + highlight). |
| `selectedId` | `string \| null` | **Rizvan/Andrew** — **clicked** country; drives detail panel and persistent outline. |
| `focusedRegion` | `string \| null` | Region from CSV, or `null` = world / no filter — **Rizvan** (region buttons) and/or **Andrew** (if UI owns region). |
| `mapMetric` | string | Default **`mh_crisis_index`**; choropleth column name. |
| `barLeftMetric` | string | Default **`treatment_gap_pct`**. |
| `barRightMetric` | string | Default **`psychiatrists_per100k`**. |
| `scatterX` / `scatterY` / `scatterSize` | strings | **Open until locked** — which CSV columns; defaults chosen as a team. |

**Rules**

- **Hover** updates only `hoveredId`; **click** updates `selectedId` (and may clear or keep hover policy — **document** in `state.js` comment).
- **Variable controls** in UI: `setState({ mapMetric: "…" })` (and bar/scatter fields) so map and charts stay in one place.
- **Benchmarks** (global/region/income): either derived in **ui** from `rows` on demand, or later add `state.benchmarks` if Sasi wants them cached — decide once and note in JSDoc.

---

## 3) `main.js` — one entry, load once, init order

**Responsibility:** load static assets **once**, build any simple lookups, put **`rows` + `geo` (+ `rowById` if used)** into state via `setState`, then call each module’s `init` so they register **subscriptions** and draw.

**Suggested shape**

```text
async function boot() {
  const [rows, geo] = await Promise.all([
    d3.csv("data/....csv", d3.autoType),   // or manual typing
    d3.json("geo/....json"),
  ]);
  // optional: const rowById = new Map(rows.map((r) => [r[countryKey], r]));
  setState({ rows, geo, /* rowById if used */, countryKey: "…" });
  initMap();
  initScatter();
  initBar();
  initUI();
}
boot();
```

- **`initMap` / `initScatter`** — from **Rizvan** (`map.js` / `scatter.js`), attach to the DOM nodes Sasi’s HTML exposes (e.g. `#map`, `#scatter`).
- **`initBar` / `initUI`** — from **Andrew** (`bar.js` / `ui.js`).
- **Order:** map → scatter → bar → ui is a reasonable default (ui may attach to controls that exist after layout). If something must run last, document it in a one-line comment in `main.js`.

**Who edits `main.js`:** Sasi creates the file and `boot` **stub**; **Rizvan** adds real paths and `initMap`/`initScatter` wiring; **Andrew** plugs `initBar`/`initUI`. Avoid long unrelated edits in the same commit without a heads-up.

---

## 4) File layout (no `data.js`)

We are **not** adding a separate `data.js` — **`main.js` loads** CSV + GeoJSON and places **`rows` / `geo`** (and optional **`rowById`**) into state (see §2–3).

```
index.html
css/styles.css
data/…csv
geo/…(GeoJSON)
js/state.js     — Sasi: getState / setState / subscribe + field table (§2)
js/main.js      — Sasi (skeleton) + Rizvan/Andrew: boot, load, init order (§3)
js/map.js       — Rizvan: initMap, choropleth, legend, zoom/pan, region controls
js/scatter.js   — Rizvan: initScatter, size encoding, linked highlight
js/bar.js       — Andrew: initBar, two bars, linked highlight
js/ui.js        — Andrew: initUI, tooltips, detail, controls
```

Each of `initMap` / `initScatter` / `initBar` / `initUI` is a **function** with no args (or receives `{ getState, setState, subscribe }` if you use modules) that reads `document` / `#` ids from Sasi’s HTML and **subscribes** to state updates.

---

## 5) What to build (core)

**First scope (product)**

- **Map:** world choropleth; default color metric **`mh_crisis_index`**, with a way to **switch** the map metric. **Zoom and pan**; **region** focus under the map (buttons and/or **left / right** through regions in the CSV).
- **Scatter:** under the map; **dot size** = user-selected variable.
- **Two bar charts** (illness- vs preparedness-style rankings): defaults **`treatment_gap_pct`** and **`psychiatrists_per100k`**, **linked** to the map.
- **Hover:** tooltip + same-country **highlight** on map, bars, and scatter.
- **Click:** selected country + **detail** with comparisons vs **global**, **region**, and **income** averages.

**Non-negotiables (clarity and consistency)**

- **Linked views:** same country in sync across map, scatter, and bars. One clear rule for **hover** vs **click** in `state.js`.
- **Encodings:** map = **sequential** magnitude; bars/scatter = **stable region colors** (not the same role as the choropleth). Legend and **units** obvious.
- **Narrative:** severity, drivers, peer comparison — if we pivot from the VA3 story, we say so in README/talk, not as a surprise.
- **No** default **country search bar** (audience is map-literate).

**Later / optional (see notes)**

- Bookmark/track, region→country→back navigation, bar reordering when region-focused, colorblind/curation for map ramp, peer highlights, benchmark lines/sliders, progressive labels, two-tier variable menu, and similar — **not** required to ship the first working version. Full list in `VA4-implementation-notes.md`.

**Risks / watchouts**

- **CSV country names vs GeoJSON** names. · Bar clutter if every country is shown at once. · Weak **legend** → misread map. · Competing **hover** vs **click** states if state isn’t explicit.

**Quick pre-submit checks**

- Join coverage and tooltip values match the CSV. · Selection and averages are correct. · Readable on a laptop. · (When course requires it) README, live URL, backup demo assets — tracked in the notes, not here.

---

## 6) Open decisions (abridged)

Pulled from `VA4-implementation-notes.md` — still to decide or lock in as we build:

- Benchmarks: static lines, movable threshold, or both; default global vs region vs income; user switching.
- Choropleth **range** interaction: emphasize band vs full recolor.
- Peer “connect” **highlight:** by region, income, or both (and how it looks in each view).
- Variable selector: layout (e.g. grouped / two-tier) and which metrics are “primary” vs secondary.
- Map/bars: label density and when country labels show (e.g. more when zoomed / region-focused).
- Palette: default ramp, colorblind-friendly options, map-only vs global UI.
- Region-focused **bars:** strict region block vs mixed ordering; **grouping** mode for bar/scatter.
- **Navigation** flow: after country detail, does “clear” return to the previous region view?
- Country “bookmark” behavior vs click-only. · Region control style; whether focus **filters** linked charts. · Arrows to cycle regions.
- Scatter: default x/y and default **size** variable. · Two fixed bar charts vs one switchable chart. · Detail panel: side panel vs card. · Sort defaults and optional top-N.

---

## 7) Suggested build order (with who starts when)

1. **Sasi:** `index.html` + `css` + **`state.js`** with the **§2 API** and **V1 field table** (can stub `rows`/`geo` empty first). **+ `main.js` shell:** `async boot` → empty `setState` → `initMap(); initScatter(); initBar(); initUI();` (no-ops in each file at first is OK). Script order in HTML per §2–3.
2. **Rizvan:** Real **`d3.csv` + `d3.json` in `boot`**, `setState({ rows, geo, countryKey, … })`, then **`initMap` / `initScatter`** (choropleth, legend, region shell, scatter container).
3. **Andrew:** **`initBar` / `initUI`** reading **`getState`/`subscribe`**, two bars + tooltip shell; no duplicate “selected country” variables outside `state.js`.
4. **Linking:** all modules only change selection/hover through **`setState`**; fix any double subscriptions.
5. **Andrew + Sasi:** detail panel + variable controls bound to `mapMetric` / bar / scatter fields.
6. **Rizvan:** scatter encodings; map polish (zoom/pan, focus).
7. **All:** benchmarks + region behavior + QA; deploy when host is ready.

For the long **decision log**, optional design adds, and fine-grained checklist, use **`VA4-implementation-notes.md`**.
