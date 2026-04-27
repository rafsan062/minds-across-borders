function initUI() {
  const tooltip = document.getElementById("tooltip");
  if (!tooltip) return;

  // Helper mapping for readable metric labels
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

  const ttCountry = tooltip.querySelector(".tooltip-country");
  const ttRegion = tooltip.querySelector(".tooltip-region");
  const ttPrimaryLabel = tooltip.querySelector(".tt-primary-label");
  const ttPrimaryValue = tooltip.querySelector(".tt-primary-value");
  const ttRank1Label = tooltip.querySelector(".tt-rank1-label");
  const ttRank1Value = tooltip.querySelector(".tt-rank1-value");
  const ttRank2Label = tooltip.querySelector(".tt-rank2-label");
  const ttRank2Value = tooltip.querySelector(".tt-rank2-value");
  const ttPop = tooltip.querySelector(".tt-pop");

  // Chart title spans to update dynamically
  const barLeftTitleSpan = document.querySelector("#bar-left-title .metric-name");
  const barRightTitleSpan = document.querySelector("#bar-right-title .metric-name");
  const mapTitleSpan = document.querySelector("#map-title-metric");

  let mouseX = 0;
  let mouseY = 0;

  // Track global mouse position for tooltip positioning
  document.addEventListener("mousemove", (e) => {
    mouseX = e.pageX;
    mouseY = e.pageY;
    
    // If tooltip is visible, update its position dynamically
    if (tooltip.classList.contains("visible")) {
      positionTooltip();
    }
  });

  function positionTooltip() {
    // Add small offset so cursor doesn't cover tooltip
    const offsetX = 15;
    const offsetY = 15;
    
    // Bounds checking
    const ttRect = tooltip.getBoundingClientRect();
    const ww = window.innerWidth;
    const wh = window.innerHeight;

    // Use page scrolling into account
    let left = mouseX + offsetX;
    let top = mouseY + offsetY;

    if (left + ttRect.width > ww + window.scrollX) {
      left = mouseX - ttRect.width - offsetX;
    }
    if (top + ttRect.height > wh + window.scrollY) {
      top = mouseY - ttRect.height - offsetY;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function renderUI() {
    const state = getState();
    const hoveredId = state.hoveredId;

    if (hoveredId && state.rowById && state.rowById.has(hoveredId)) {
      const row = state.rowById.get(hoveredId);
      
      const mapMetric = state.mapMetric || "mh_crisis_index";
      const rank1Metric = state.barLeftMetric || "treatment_gap_pct";
      const rank2Metric = state.barRightMetric || "psychiatrists_per100k";

      // Populate data
      if (ttCountry) ttCountry.textContent = row.country || "Unknown";
      if (ttRegion) ttRegion.textContent = row.region || "Unknown";
      
      if (ttPrimaryLabel) ttPrimaryLabel.textContent = metricLabels[mapMetric] || mapMetric;
      if (ttPrimaryValue) ttPrimaryValue.textContent = row[mapMetric] !== null ? row[mapMetric] : "N/A";

      if (ttRank1Label) ttRank1Label.textContent = metricLabels[rank1Metric] || rank1Metric;
      if (ttRank1Value) ttRank1Value.textContent = row[rank1Metric] !== null ? row[rank1Metric] : "N/A";

      if (ttRank2Label) ttRank2Label.textContent = metricLabels[rank2Metric] || rank2Metric;
      if (ttRank2Value) ttRank2Value.textContent = row[rank2Metric] !== null ? row[rank2Metric] : "N/A";

      if (ttPop) ttPop.textContent = row.population_millions !== null ? row.population_millions : "N/A";

      // Show tooltip
      tooltip.classList.add("visible");
      tooltip.setAttribute("aria-hidden", "false");
      
      // Initial position
      positionTooltip();
    } else {
      // Hide tooltip
      tooltip.classList.remove("visible");
      tooltip.setAttribute("aria-hidden", "true");
    }

    // Update the bar chart title spans to match the pretty labels
    const mapMetric = state.mapMetric || "mh_crisis_index";
    const rank1Metric = state.barLeftMetric || "treatment_gap_pct";
    const rank2Metric = state.barRightMetric || "psychiatrists_per100k";
    if (barLeftTitleSpan) barLeftTitleSpan.textContent = metricLabels[rank1Metric] || rank1Metric;
    if (barRightTitleSpan) barRightTitleSpan.textContent = metricLabels[rank2Metric] || rank2Metric;
    if (mapTitleSpan) mapTitleSpan.textContent = metricLabels[mapMetric] || mapMetric;
  }

  // Wire metric dropdowns to state
  const mapMetricSelect = document.getElementById("select-map-metric");
  const barLeftSelect = document.getElementById("select-bar-left");
  const barRightSelect = document.getElementById("select-bar-right");
  const scatterXSelect = document.getElementById("select-scatter-x");
  const scatterYSelect = document.getElementById("select-scatter-y");
  const scatterSizeSelect = document.getElementById("select-scatter-size");

  if (mapMetricSelect) {
    mapMetricSelect.value = getState().mapMetric || "mh_crisis_index";
    mapMetricSelect.addEventListener("change", (e) => {
      setState({ mapMetric: e.target.value });
    });
  }
  if (barLeftSelect) {
    barLeftSelect.addEventListener("change", (e) => {
      setState({ barLeftMetric: e.target.value });
    });
  }
  if (barRightSelect) {
    barRightSelect.addEventListener("change", (e) => {
      setState({ barRightMetric: e.target.value });
    });
  }
  if (scatterXSelect) {
    scatterXSelect.addEventListener("change", (e) => {
      setState({ scatterX: e.target.value });
    });
  }
  if (scatterYSelect) {
    scatterYSelect.addEventListener("change", (e) => {
      setState({ scatterY: e.target.value });
    });
  }
  if (scatterSizeSelect) {
    scatterSizeSelect.addEventListener("change", (e) => {
      setState({ scatterSize: e.target.value });
    });
  }

  subscribe(renderUI);
  renderUI();
}

window.initUI = initUI;
