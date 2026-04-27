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
        setState({ selectedId: currentSelection === d.iso3 ? null : d.iso3 });
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
        // If something is selected, dim others
        if (state.selectedId && d.iso3 !== state.selectedId) return 0.2;
        // If hovering, slightly dim others
        if (state.hoveredId && d.iso3 !== state.hoveredId) return 0.4;
        return 0.85;
      });
  }

  // Subscribe and initial render
  subscribe(render);
  render();

  // Add responsive listener
  window.addEventListener("resize", render);
}

window.initScatter = initScatter;
