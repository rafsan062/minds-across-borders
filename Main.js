/**
 * main.js — Minds Across Borders
 * Entry point. Loads static assets once, seeds state, then calls each
 * module's init in order.
 *
 * Ownership:
 *   Sasi   → this skeleton + boot() shape + init call order
 *   Rizvan → fills in real CSV/GeoJSON paths, adds initMap / initScatter wiring
 *   Andrew → adds initBar / initUI wiring if early DOM hooks are needed
 *
 * IMPORTANT: Do not add top-level state fields here without telling Sasi.
 * Use setState({ key: value }) to put data into state — never write to _state.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

// ─── Constants ───────────────────────────────────────────────────────────────

const CSV_PATH     = "data/Global_Mental_Health_Crisis_Index_2026.csv";
const GEOJSON_PATH = "geo/world-110m.json";   // ← Rizvan: confirm GeoJSON source

// "iso3" is confirmed in the dataset (MWI, MOZ, ETH…) and is the standard
// join key for most world GeoJSON files (Natural Earth, topojson/world-atlas).
// Rizvan: verify the GeoJSON feature property name matches — commonly "iso_a3".
const COUNTRY_KEY  = "iso3";

// ─── Boot ────────────────────────────────────────────────────────────────────

async function boot() {
  // 1. Load CSV + GeoJSON in parallel.
  //    d3.autoType converts numeric strings to numbers automatically.
  //    Rizvan: replace paths above; add any custom type coercion if needed.
  const [rows, geo] = await Promise.all([
    d3.csv(CSV_PATH, d3.autoType),
    d3.json(GEOJSON_PATH),
  ]);

  // 2. Build O(1) lookup map: countryKey → row object.
  //    Used by tooltip (ui.js) and detail panel for fast access.
  const rowById = new Map(rows.map((r) => [r[COUNTRY_KEY], r]));

  // 3. Seed state. All modules read from here via getState() / subscribe().
  setState({
    countryKey: COUNTRY_KEY,
    rows,
    rowById,
    geo,
  });

  // 4. Init each module in order.
  //    Each init() must:
  //      a) attach its D3 view to the DOM node Sasi's HTML exposes (#map, #scatter, etc.)
  //      b) subscribe to state for re-renders
  //    Script load order in index.html guarantees these functions exist.
  //    Order: map → scatter → bar → ui
  //    (ui attaches to controls that exist after layout, so it runs last)
  initMap();       // js/map.js     — Rizvan
  initScatter();   // js/scatter.js — Rizvan
  initBar();       // js/bar.js     — Andrew
  initUI();        // js/ui.js      — Andrew
}

// ─── Run ─────────────────────────────────────────────────────────────────────

boot().catch((err) => {
  console.error("[main] boot() failed:", err);
  // Surface the error visibly during development.
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div style="background:#b00;color:#fff;padding:1rem;font-family:monospace">
      <strong>Boot error:</strong> ${err.message}<br>
      <small>Check the console and verify CSV/GeoJSON paths in main.js.</small>
    </div>`
  );
});