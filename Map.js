function initMap() {
  const container = d3.select("#map");
  if (container.empty()) return;

  const width = 760;
  const height = 420;

  container.selectAll("*").remove();
  container.style("position", "relative");

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  const mapLayer = svg.append("g").attr("class", "map-layer");

  const projection = d3.geoNaturalEarth1();
  const path = d3.geoPath(projection);
  const mapPalette = ["#efbec0", "#e59aa5", "#d4748f", "#ab4f82", "#903568", "#6f1f51"];
  const globeBackgroundColor = "#ffffff";
  const noDataCountryColor = "#e6e6e6";

  const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => {
    mapLayer.attr("transform", event.transform);
  });
  svg.call(zoom);

  container.selectAll("button.map-reset-btn").remove();
  const resetButton = container
    .append("button")
    .attr("type", "button")
    .attr("class", "map-reset-btn")
    .text("Reset View")
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "10px")
    .style("z-index", "10")
    .style("padding", "4px 10px")
    .style("border", "1px solid #cdbec4")
    .style("border-radius", "12px")
    .style("background", "#fff")
    .style("font-size", "12px")
    .style("cursor", "pointer");
  const resetButtonWidth = resetButton.node()?.getBoundingClientRect().width || 82;

  container.selectAll("div.map-legend-overlay").remove();
  const legendOverlay = container
    .append("div")
    .attr("class", "map-legend-overlay")
    .style("position", "absolute")
    .style("top", "13px")
    .style("right", `${resetButtonWidth + 30}px`)
    .style("z-index", "10")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "stretch")
    .style("gap", "3px")
    .style("pointer-events", "none");

  resetButton.on("click", () => {
    svg.transition().duration(250).call(zoom.transform, d3.zoomIdentity);
  });

  wireRegionButtons();

  function matchFeatureToRow(feature, state) {
    if (!state || !state.rows) return null;
    const props = feature?.properties || {};

    // 1. Try matching by ISO code
    const isoCandidates = [
      feature?.id,
      props.iso3, props.ISO3, props.iso_a3, props.ISO_A3,
      props.adm0_a3, props.ADM0_A3
    ];

    for (const val of isoCandidates) {
      if (!val) continue;
      const code = String(val).trim().toUpperCase();
      if (code.length === 3) {
        // Direct match against state.rows
        const matched = state.rows.find(r => r.iso3 && String(r.iso3).trim().toUpperCase() === code);
        if (matched) return matched;
      }
    }

    // 2. Fallback to matching by country name
    const nameCandidates = [
      props.name, props.NAME, props.admin, props.ADMIN, props.brk_name
    ];

    for (const val of nameCandidates) {
      if (!val) continue;
      const normFeatName = String(val).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!normFeatName) continue;

      const matched = state.rows.find(r => {
        const normRowName = String(r.country || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return normRowName === normFeatName;
      });
      if (matched) return matched;
    }

    return null;
  }

  function drawLegend(breaks) {
    legendOverlay.selectAll("*").remove();

    const bar = legendOverlay
      .append("div")
      .style("display", "grid")
      .style("grid-template-columns", `repeat(${mapPalette.length}, 1fr)`)
      .style("width", "200px")
      .style("height", "10px");

    bar
      .selectAll("div.legend-segment")
      .data(mapPalette)
      .join("div")
      .attr("class", "legend-segment")
      .style("background", (d) => d)
      .style("border-top", "1px solid rgba(90, 50, 90, 0.25)")
      .style("border-bottom", "1px solid rgba(90, 50, 90, 0.25)")
      .style("border-left", (_, i) => (i === 0 ? "1px solid rgba(90, 50, 90, 0.25)" : "none"))
      .style("border-right", (_, i) => (i === mapPalette.length - 1 ? "1px solid rgba(90, 50, 90, 0.25)" : "none"));

    const labels = legendOverlay
      .append("div")
      .style("display", "grid")
      .style("grid-template-columns", `repeat(${breaks.length}, 1fr)`)
      .style("width", "200px");

    labels
      .selectAll("div.legend-label")
      .data(breaks)
      .join("div")
      .attr("class", "legend-label")
      .style("text-align", "center")
      .style("font-size", "11px")
      .style("line-height", "1")
      .style("color", "#47384c")
      .text((d) => `${d}`);
  }

  function getLegendBreaks(metric, maxValue) {
    if (metric === "mh_crisis_index") return [0, 16, 32, 48, 64, 80];
    const safeMax = Math.max(1, maxValue);
    const step = safeMax / (mapPalette.length - 1);
    return Array.from({ length: mapPalette.length }, (_, i) => Math.round(i * step));
  }

  function render() {
    const state = getState();
    if (!state.geo || !state.rows?.length) return;
    updateRegionButtonStyles(state.focusedRegion);

    const features = (state.geo.features || []).filter((feature) => {
      const name = feature?.properties?.name || "";
      return name !== "Antarctica";
    });
    if (!features.length) return;

    projection.fitSize([width, height], { type: "FeatureCollection", features });
    const [tx, ty] = projection.translate();
    projection.translate([tx - 20, ty - 10]);

    const metric = state.mapMetric || "mh_crisis_index";

    // Single source of truth for feature -> row
    function getRowForFeature(feature) {
      return matchFeatureToRow(feature, state);
    }

    // Feature key is now strictly the canonical iso3 from the matched row.
    // This guarantees it matches rowById in State.js perfectly.
    function getFeatureKey(feature) {
      const row = matchFeatureToRow(feature, state);
      return row ? row.iso3 : null;
    }

    const values = state.rows
      .map((row) => row[metric])
      .filter((value) => Number.isFinite(value));

    const maxValue = d3.max(values) || 1;
    const domainMax = metric === "mh_crisis_index" ? 80 : maxValue;
    const colorScale = d3
      .scaleQuantize()
      .domain([0, domainMax])
      .range(mapPalette);

    mapLayer
      .selectAll("path.globe-bg")
      .data([null])
      .join("path")
      .attr("class", "globe-bg")
      .attr("d", path({ type: "Sphere" }))
      .attr("fill", globeBackgroundColor)
      .attr("stroke", "none")
      .attr("pointer-events", "none");

    const countryPaths = mapLayer
      .selectAll("path.country-path")
      .data(features, (d, i) => getFeatureKey(d) || d.properties?.name || `feature-${i}`);

    countryPaths
      .join("path")
      .attr("class", "country-path")
      .attr("d", path)
      .attr("fill", (feature) => {
        const row = getRowForFeature(feature);
        const value = row?.[metric];
        if (!row) return noDataCountryColor;
        return Number.isFinite(value) ? colorScale(value) : noDataCountryColor;
      })
      .style("stroke", (feature) => {
        const id = getFeatureKey(feature);
        if (id && id === state.selectedId) return "#6ECA97";
        if (id && id === state.hoveredId) return "#6ECA97";
        return "#9f9f9f";
      })
      .style("stroke-width", (feature) => {
        const id = getFeatureKey(feature);
        if (id && id === state.selectedId) return 1.8;
        if (id && id === state.hoveredId) return 1.3;
        return 0.45;
      })
      .attr("opacity", (feature) => {
        if (!state.focusedRegion) return 1;
        const row = getRowForFeature(feature);
        if (!row) return 0.2;
        return row.region === state.focusedRegion ? 1 : 0.2;
      })
      .on("mouseenter", function (_, feature) {
        const id = getFeatureKey(feature);
        if (id) setState({ hoveredId: id });
      })
      .on("mouseleave", function () {
        setState({ hoveredId: null });
      })
      .on("click", function (_, feature) {
        const id = getFeatureKey(feature);
        if (!id) return;
        const nextSelected = getState().selectedId === id ? null : id;
        setState({ selectedId: nextSelected });
      });

    drawLegend(getLegendBreaks(metric, maxValue));
  }

  subscribe(render);
  render();
}

function wireRegionButtons() {
  const buttons = document.querySelectorAll(".region-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const clickedRegion = button.dataset.region;
      const currentRegion = getState().focusedRegion;
      const nextRegion = currentRegion === clickedRegion ? null : clickedRegion;
      setState({ focusedRegion: nextRegion });
      updateRegionButtonStyles(nextRegion);
    });
  });
}

function updateRegionButtonStyles(activeRegion) {
  const buttons = document.querySelectorAll(".region-btn");
  buttons.forEach((button) => {
    const isActive = button.dataset.region === activeRegion;
    button.classList.toggle("active", isActive);
  });
}

window.initMap = initMap;
