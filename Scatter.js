function initScatter() {
  const container = d3.select("#scatter");
  if (container.empty()) return;

  const margin = { top: 20, right: 20, bottom: 40, left: 70 };
  
  const fullHeight = 350; 
  const height = fullHeight - margin.top - margin.bottom;

  // Initialize SVG without hardcoded width
  const svg = container
    .append("svg")
    .attr("height", fullHeight)
    .style("overflow", "visible");

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xAxisG = chart.append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0,${height})`);

  const yAxisG = chart.append("g")
    .attr("class", "axis y-axis");

  const benchmarkG = chart.append("g").attr("class", "benchmark-layer");
  const dotsG = chart.append("g").attr("class", "dots-layer");

  // Region Colors
  const regionColors = {
    "Africa": "var(--color-africa)",
    "Americas": "var(--color-americas)",
    "Europe": "var(--color-europe)",
    "S-E Asia": "var(--color-se-asia)",
    "E. Med": "var(--color-e-med)",
    "W. Pacific": "var(--color-w-pacific)"
  };

  window.regionColors = regionColors;

  const metricLabels = {
    mh_crisis_index: "Crisis Index",
    treatment_gap_pct: "Treatment Gap (%)",
    psychiatrists_per100k: "Psychiatrists/100k",
    depression_pct: "Depression (%)",
    anxiety_pct: "Anxiety (%)",
    suicide_rate_per100k: "Suicide Rate",
    mh_budget_pct_health: "MH Budget (%)",
    youth_mh_crisis_score: "Youth Crisis Score",
    mh_system_score: "MH System Score",
    mh_spend_usd_per_capita: "Spend (USD/capita)",
    mh_investment_gap: "Investment Gap",
    gdp_per_capita_usd: "GDP/Capita (USD)",
    internet_penetration_pct: "Internet Penetration (%)",
    social_media_hours_daily: "Social Media (Hours)",
    total_affected_millions: "Affected (Millions)",
    population_millions: "Population (Millions)",
    none: "Fixed Size"
  };

  function render() {
    const state = getState();
    const rows = state.rows || [];
    if (!rows.length) return;

    // Dynamically get current container width for responsiveness
    const containerRect = container.node().getBoundingClientRect();
    const fullWidth = containerRect.width || 600;
    const width = fullWidth - margin.left - margin.right;

    // Update SVG dimensions
    svg.attr("width", fullWidth)
       .attr("viewBox", `0 0 ${fullWidth} ${fullHeight}`);

    const xMetric = state.scatterX || "gdp_per_capita_usd";
    const yMetric = state.scatterY || "mh_crisis_index";
    const sizeMetric = state.scatterSize || "total_affected_millions";

    // Filter valid data
    const validData = rows.filter(d => 
      Number.isFinite(Number(d[xMetric])) && 
      Number.isFinite(Number(d[yMetric]))
    );

    // Scales (using dynamic width)
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(validData, d => Number(d[xMetric])) * 1.05])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(validData, d => Number(d[yMetric])) * 1.05])
      .range([height, 0]);

    let sizeScale;
    if (sizeMetric !== "none") {
      sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(validData, d => Number(d[sizeMetric]))])
        .range([4, 25]);
    } else {
      sizeScale = () => 6;
    }

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
    const yAxis = d3.axisLeft(yScale).ticks(6);

    xAxisG.transition().duration(500).call(xAxis);
    yAxisG.transition().duration(500).call(yAxis);

    // ── Benchmark reference lines ─────────────────────────────────
    benchmarkG.selectAll("*").remove();

    // Use region-filtered data if a region is focused, else global
    const benchData = state.focusedRegion
      ? validData.filter(d => d.region === state.focusedRegion)
      : validData;
    const benchLabel = state.focusedRegion ? "Region Avg" : "Global Avg";

    if (benchData.length > 0) {
      const xValues = benchData.map(d => Number(d[xMetric])).filter(Number.isFinite);
      const yValues = benchData.map(d => Number(d[yMetric])).filter(Number.isFinite);
      const xAvg = xValues.reduce((a, b) => a + b, 0) / xValues.length;
      const yAvg = yValues.reduce((a, b) => a + b, 0) / yValues.length;

      // Vertical line for X average
      benchmarkG.append("line")
        .attr("x1", xScale(xAvg)).attr("x2", xScale(xAvg))
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", "#ab4f82")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.45);
      benchmarkG.append("text")
        .attr("x", xScale(xAvg) + 4).attr("y", 12)
        .attr("fill", "#ab4f82").attr("font-size", "9px").attr("font-weight", "600")
        .text(`${benchLabel}: ${xAvg.toFixed(1)}`);

      // Horizontal line for Y average
      benchmarkG.append("line")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", yScale(yAvg)).attr("y2", yScale(yAvg))
        .attr("stroke", "#ab4f82")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.45);
      benchmarkG.append("text")
        .attr("x", width - 4).attr("y", yScale(yAvg) - 4)
        .attr("fill", "#ab4f82").attr("font-size", "9px").attr("font-weight", "600")
        .attr("text-anchor", "end")
        .text(`${benchLabel}: ${yAvg.toFixed(1)}`);
    }

    // Join
    const dots = dotsG.selectAll(".scatter-dot")
      .data(validData, d => d.iso3);

    // Enter
    const dotsEnter = dots.enter()
      .append("circle")
      .attr("class", "scatter-dot")
      .attr("cx", d => xScale(Number(d[xMetric])))
      .attr("cy", d => yScale(Number(d[yMetric])))
      .attr("r", 0)
      .attr("fill", d => regionColors[d.region] || "#999")
      .style("stroke", "white")
      .style("stroke-width", "0.5px")
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        setState({ hoveredId: d.iso3 });
      })
      .on("mouseleave", () => {
        setState({ hoveredId: null });
      })
      .on("click", (event, d) => {
        const currentSelection = getState().selectedId;
        const nextSelected = currentSelection === d.iso3 ? null : d.iso3;
        setState({ selectedId: nextSelected, hoveredId: null });
      });

    // Update + Enter
    dots.merge(dotsEnter)
      .transition().duration(500)
      .attr("cx", d => xScale(Number(d[xMetric])))
      .attr("cy", d => yScale(Number(d[yMetric])))
      .attr("r", d => sizeScale(Number(d[sizeMetric])));

    // Remove
    dots.exit().transition().duration(300).attr("r", 0).remove();

    // Highlights and Opacity
    dotsG.selectAll(".scatter-dot")
      .style("stroke", d => {
        if (state.selectedId === d.iso3) return "var(--highlight-selected)";
        if (state.hoveredId === d.iso3) return "#000";
        return "white";
      })
      .style("stroke-width", d => {
        if (state.selectedId === d.iso3) return "2px";
        if (state.hoveredId === d.iso3) return "1.5px";
        return "0.5px";
      })
      .attr("opacity", d => {
        // If a region is focused, dim others
        if (state.focusedRegion && d.region !== state.focusedRegion) return 0.1;
        // If something is selected, highlight peers
        if (state.selectedId) {
          if (d.iso3 === state.selectedId) return 1;
          const selectedRow = state.rowById?.get(state.selectedId);
          if (selectedRow && d.region === selectedRow.region) return 0.55;
          return 0.12;
        }
        // If hovering, slightly dim others
        if (state.hoveredId && d.iso3 !== state.hoveredId) return 0.4;
        return 0.85;
      });

    // ── Crosshair tooltip ────────────────────────────────────────
    // Remove old overlay if it exists, then create a fresh one
    chart.selectAll(".crosshair-overlay").remove();
    chart.selectAll(".crosshair-group").remove();

    const crossG = chart.append("g")
      .attr("class", "crosshair-group")
      .style("pointer-events", "none")
      .style("display", "none");

    const crossLineX = crossG.append("line")
      .attr("y1", 0).attr("y2", height)
      .attr("stroke", "#7D6983").attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,2").attr("opacity", 0.6);

    const crossLineY = crossG.append("line")
      .attr("x1", 0).attr("x2", width)
      .attr("stroke", "#7D6983").attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,2").attr("opacity", 0.6);

    const crossLabel = crossG.append("g");
    const crossBg = crossLabel.append("rect")
      .attr("rx", 4).attr("ry", 4)
      .attr("fill", "rgba(255,255,255,0.92)")
      .attr("stroke", "#cdbec4").attr("stroke-width", 0.5);
    const crossText = crossLabel.append("text")
      .attr("font-size", "10px").attr("fill", "#47384c").attr("font-weight", "600");

    const SNAP_DISTANCE = 30;

    chart.append("rect")
      .attr("class", "crosshair-overlay")
      .attr("width", width).attr("height", height)
      .attr("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", function (event) {
        const [mx, my] = d3.pointer(event);

        // Find nearest dot
        let nearest = null;
        let minDist = Infinity;
        validData.forEach(d => {
          const dx = xScale(Number(d[xMetric])) - mx;
          const dy = yScale(Number(d[yMetric])) - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) { minDist = dist; nearest = d; }
        });

        let cx, cy, labelText;

        if (nearest && minDist < SNAP_DISTANCE) {
          // Snap to the dot
          cx = xScale(Number(nearest[xMetric]));
          cy = yScale(Number(nearest[yMetric]));
          labelText = `${nearest.country}: ${Number(nearest[xMetric]).toFixed(1)}, ${Number(nearest[yMetric]).toFixed(1)}`;
          setState({ hoveredId: nearest.iso3 });
        } else {
          // Free crosshair — clear any hover
          cx = mx;
          cy = my;
          const xVal = xScale.invert(mx);
          const yVal = yScale.invert(my);
          labelText = `${xVal.toFixed(1)}, ${yVal.toFixed(1)}`;
          if (getState().hoveredId) setState({ hoveredId: null });
        }

        crossG.style("display", null);
        crossLineX.attr("x1", cx).attr("x2", cx);
        crossLineY.attr("y1", cy).attr("y2", cy);

        // Position label
        const pad = 5;
        crossText.text(labelText);
        const bbox = crossText.node().getBBox();
        const lx = Math.min(cx + 8, width - bbox.width - pad * 2);
        const ly = Math.max(cy - 10, bbox.height + pad);
        crossBg.attr("x", lx - pad).attr("y", ly - bbox.height - pad + 2)
          .attr("width", bbox.width + pad * 2).attr("height", bbox.height + pad);
        crossText.attr("x", lx).attr("y", ly);
      })
      .on("mouseleave", function () {
        crossG.style("display", "none");
        setState({ hoveredId: null });
      });
  }

  // Subscribe and initial render
  subscribe(render);
  render();

  // Add responsive listener
  window.addEventListener("resize", render);
}

window.initScatter = initScatter;
