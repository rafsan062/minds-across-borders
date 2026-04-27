/**
 * state.js — Minds Across Borders
 * Single source of app state. All feature modules (map, scatter, bar, ui)
 * must read/write ONLY through the three exported functions below.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PUBLIC API
 * ─────────────────────────────────────────────────────────────────────────────
 *   getState()          → shallow copy of current state (read-only view)
 *   setState(partial)   → shallow-merge partial into state, notify subscribers
 *   subscribe(fn)       → fn(state) called after every setState; returns unsubscribe()
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * V1 STATE FIELDS
 * ─────────────────────────────────────────────────────────────────────────────
 *  countryKey      string          "iso3" | "country" — canonical join key between
 *                                  CSV rows and GeoJSON features. Set once by main.js.
 *
 *  rows            Array<object>   One object per country row, loaded by main.js via d3.csv.
 *
 *  rowById         Map<string,obj> countryKey → row for O(1) lookups (tooltip, detail).
 *                                  Built in main.js after load; optional but recommended.
 *
 *  geo             FeatureCollection  World GeoJSON loaded by main.js via d3.json.
 *
 *  hoveredId       string|null     Transient — country id under the cursor.
 *                                  Sets tooltip + highlight ring. Cleared on mouseleave.
 *                                  Set by: map.js / bar.js / scatter.js.
 *
 *  selectedId      string|null     Persistent — country id from a click event.
 *                                  Drives the detail panel and bold outline on map/bars.
 *                                  Set by: map.js / bar.js / scatter.js.
 *                                  Policy: clicking the same country again clears it.
 *                                  hoveredId is independent of selectedId.
 *
 *  focusedRegion   string|null     Region string from CSV (e.g. "Africa") or null = world.
 *                                  Controls region-filter buttons under the map.
 *                                  Set by: map.js (region buttons) or ui.js if UI owns them.
 *
 *  peerMode        string          "region" | "income" — controls which peer group the
 *                                  scatter plot highlights when a country is selected.
 *                                  Default: "region". Toggled via a control near the scatter.
 *
 *  mapMetric       string          CSV column used for choropleth fill.
 *                                  Default: "mh_crisis_index".
 *
 *  barLeftMetric   string          CSV column for the left / Illness bar chart.
 *                                  Default: "treatment_gap_pct".
 *
 *  barRightMetric  string          CSV column for the right / Preparedness bar chart.
 *                                  Default: "psychiatrists_per100k".
 *
 *  scatterX        string          CSV column for scatter x-axis. TBD by team.
 *  scatterY        string          CSV column for scatter y-axis. TBD by team.
 *  scatterSize     string          CSV column for scatter dot size. TBD by team.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RULES (for all teammates)
 * ─────────────────────────────────────────────────────────────────────────────
 *  • Use getState() to read. NEVER import the internal `_state` object directly.
 *  • Use setState(partial) to write. NEVER do `getState().foo = value`.
 *  • Use subscribe(fn) in each module's init function; store the unsubscribe
 *    return value if cleanup is ever needed.
 *  • Benchmarks (global/region/income averages): compute from rows on demand in
 *    ui.js unless team decides to cache them — add a `benchmarks` field here if so.
 */

// ─── Internal state ──────────────────────────────────────────────────────────

const _state = {
    // Data (set by main.js after load)
    countryKey:      null,          // e.g. "iso3"
    rows:            [],
    rowById:         new Map(),
    geo:             null,
  
    // Interaction
    hoveredId:       null,
    selectedId:      null,
    focusedRegion:   null,
    hoveredLegendIndex: null,   // index of legend color segment being hovered
    previousFocusedRegion: null, // saved region when entering country detail
    peerMode:        "region",     // "region" | "income" — scatter peer highlight mode
  
    // Metric selections (matching dropdown defaults in mockup)
    mapMetric:       "mh_crisis_index",
    barLeftMetric:   "treatment_gap_pct",
    barRightMetric:  "psychiatrists_per100k",
  
    // Scatter — confirmed columns from dataset (lock defaults with Rizvan)
    // Good candidates: x=gdp_per_capita_usd, y=mh_crisis_index, size=total_affected_millions
    scatterX:        "gdp_per_capita_usd",
    scatterY:        "mh_crisis_index",
    scatterSize:     "total_affected_millions",

    // Map palette key
    mapPaletteKey:   "crisis",
  };
  
  // ─── Subscribers ─────────────────────────────────────────────────────────────
  
  const _subscribers = new Set();
  
  // ─── Public API ──────────────────────────────────────────────────────────────
  
  /**
   * getState() → shallow copy of current state.
   * Modules should treat the returned object as read-only.
   */
  function getState() {
    return { ..._state };
  }
  
  /**
   * setState(partial) → shallow-merge `partial` into internal state,
   * then synchronously notify all subscribers with the new state snapshot.
   *
   * @param {Partial<typeof _state>} partial
   */
  function setState(partial) {
    Object.assign(_state, partial);
    const snapshot = getState();
    _subscribers.forEach((fn) => fn(snapshot));
  }
  
  /**
   * subscribe(fn) → register a listener called after every setState.
   * Returns an unsubscribe() function.
   *
   * Usage in a feature module's init:
   *   subscribe((state) => { ... update D3 view ... });
   *
   * @param {(state: object) => void} fn
   * @returns {() => void} unsubscribe
   */
  function subscribe(fn) {
    _subscribers.add(fn);
    return () => _subscribers.delete(fn);
  }
  
  // Export as plain globals (no bundler needed).
  // If the team switches to ES modules, change to:  export { getState, setState, subscribe };
  window.getState   = getState;
  window.setState   = setState;
  window.subscribe  = subscribe;