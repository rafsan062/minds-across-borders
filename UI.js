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

  // Chart title span to update dynamically
  const mapTitleSpan = document.querySelector("#map-title-metric");

  let mouseX = 0;
  let mouseY = 0;

  // Detail Panel setup
  const detailPanel = document.getElementById("detail-panel");
  const detailClose = document.getElementById("btn-close-detail");
  const btnShowMore = document.getElementById("btn-show-more");
  
  const dCountry = detailPanel?.querySelector(".detail-country");
  const dRegion = detailPanel?.querySelector(".detail-region");
  const dPop = detailPanel?.querySelector(".detail-pop");
  
  const dCrisis = detailPanel?.querySelector(".detail-crisis-val");
  const dGap = detailPanel?.querySelector(".di-gap");
  const dPsych = detailPanel?.querySelector(".di-psych");
  const dBudget = detailPanel?.querySelector(".di-budget");
  const dMhsys = detailPanel?.querySelector(".di-mhsys");
  const dGdp = detailPanel?.querySelector(".di-gdp");
  
  const dSuicide = detailPanel?.querySelector(".di-suicide");
  const dDepression = detailPanel?.querySelector(".di-depression");
  const dAnxiety = detailPanel?.querySelector(".di-anxiety");
  const dYouth = detailPanel?.querySelector(".di-youth");
  const dInvestment = detailPanel?.querySelector(".di-investment");
  
  const dIncome = detailPanel?.querySelector(".detail-income");
  const dGlobalAvg = detailPanel?.querySelector(".dc-global");
  const dRegionAvg = detailPanel?.querySelector(".dc-region");
  const dIncomeAvg = detailPanel?.querySelector(".dc-income");

  if (detailClose) {
    detailClose.addEventListener("click", () => {
      const currentState = getState();
      setState({
        selectedId: null,
        focusedRegion: currentState.previousFocusedRegion || null,
        previousFocusedRegion: null,
      });
    });
  }

  if (btnShowMore) {
    btnShowMore.addEventListener("click", () => {
      detailPanel.classList.toggle("expanded");
      if (detailPanel.classList.contains("expanded")) {
        btnShowMore.textContent = "Show Less";
      } else {
        btnShowMore.textContent = "Show More";
      }
    });
  }

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

    if (hoveredId && !state.selectedId && state.rowById && state.rowById.has(hoveredId)) {
      const row = state.rowById.get(hoveredId);
      
      const mapMetric = state.mapMetric || "mh_crisis_index";
      const rank1Metric = state.barLeftMetric || "treatment_gap_pct";
      const rank2Metric = state.barRightMetric || "psychiatrists_per100k";

      // Populate data
      if (ttCountry) ttCountry.textContent = row.country || "Unknown";
      if (ttRegion) {
        ttRegion.textContent = row.region || "Unknown";
        const regionColors = {
          "Africa": "var(--color-africa)",
          "Americas": "var(--color-americas)",
          "Europe": "var(--color-europe)",
          "S-E Asia": "var(--color-se-asia)",
          "E. Med": "var(--color-e-med)",
          "W. Pacific": "var(--color-w-pacific)"
        };
        ttRegion.style.color = regionColors[row.region] || "var(--text-secondary)";
      }
      
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

    // Update map title span
    const mapMetric = state.mapMetric || "mh_crisis_index";
    if (mapTitleSpan) mapTitleSpan.textContent = metricLabels[mapMetric] || mapMetric;

    // --- Detail Panel Logic ---
    const selectedId = state.selectedId;
    if (selectedId && state.rowById && state.rowById.has(selectedId) && detailPanel) {
      const row = state.rowById.get(selectedId);
      
      if (dCountry) dCountry.textContent = row.country || "Unknown";
      if (dRegion) {
        dRegion.textContent = row.region || "Unknown";
        const regionColors = {
          "Africa": "var(--color-africa)",
          "Americas": "var(--color-americas)",
          "Europe": "var(--color-europe)",
          "S-E Asia": "var(--color-se-asia)",
          "E. Med": "var(--color-e-med)",
          "W. Pacific": "var(--color-w-pacific)"
        };
        dRegion.style.color = regionColors[row.region] || "var(--text-secondary)";
      }
      if (dIncome) {
        dIncome.textContent = row.income_group || "Unknown";
        const incomeColors = {
          "High": "#6ECA97",
          "Upper-Middle": "#ab4f82",
          "Lower-Middle": "#e59aa5",
          "Low": "#efbec0"
        };
        dIncome.style.color = incomeColors[row.income_group] || "var(--text-secondary)";
      }
      if (dPop) dPop.textContent = row.population_millions !== null ? row.population_millions : "N/A";
      
      if (dCrisis) dCrisis.textContent = row.mh_crisis_index !== null ? row.mh_crisis_index : "N/A";

      // Calculate averages for Crisis Index
      if (state.rows && row.mh_crisis_index !== null) {
        const crisisMetric = "mh_crisis_index";
        
        // Global
        const globalRows = state.rows.filter(r => r[crisisMetric] !== null);
        const globalAvg = globalRows.reduce((sum, r) => sum + r[crisisMetric], 0) / globalRows.length;
        
        // Region
        const regionRows = globalRows.filter(r => r.region === row.region);
        const regionAvg = regionRows.reduce((sum, r) => sum + r[crisisMetric], 0) / regionRows.length;
        
        // Income Group
        const incomeRows = globalRows.filter(r => r.income_group === row.income_group);
        const incomeAvg = incomeRows.reduce((sum, r) => sum + r[crisisMetric], 0) / incomeRows.length;

        const formatDiff = (val, avg) => {
          const diff = val - avg;
          const sign = diff >= 0 ? "+" : "";
          return `${avg.toFixed(1)} (${sign}${diff.toFixed(1)})`;
        };

        if (dGlobalAvg) dGlobalAvg.textContent = formatDiff(row[crisisMetric], globalAvg);
        if (dRegionAvg) dRegionAvg.textContent = formatDiff(row[crisisMetric], regionAvg);
        if (dIncomeAvg) dIncomeAvg.textContent = formatDiff(row[crisisMetric], incomeAvg);
      }
      if (dGap) dGap.textContent = row.treatment_gap_pct !== null ? `${row.treatment_gap_pct}%` : "N/A";
      if (dPsych) dPsych.textContent = row.psychiatrists_per100k !== null ? row.psychiatrists_per100k : "N/A";
      if (dBudget) dBudget.textContent = row.mh_budget_pct_health !== null ? `${row.mh_budget_pct_health}%` : "N/A";
      if (dMhsys) dMhsys.textContent = row.mh_system_score !== null ? row.mh_system_score : "N/A";
      if (dGdp) dGdp.textContent = row.gdp_per_capita_usd !== null ? `$${row.gdp_per_capita_usd.toLocaleString()}` : "N/A";
      
      if (dSuicide) dSuicide.textContent = row.suicide_rate_per100k !== null ? row.suicide_rate_per100k : "N/A";
      if (dDepression) dDepression.textContent = row.depression_pct !== null ? `${row.depression_pct}%` : "N/A";
      if (dAnxiety) dAnxiety.textContent = row.anxiety_pct !== null ? `${row.anxiety_pct}%` : "N/A";
      if (dYouth) dYouth.textContent = row.youth_mh_crisis_score !== null ? row.youth_mh_crisis_score : "N/A";
      if (dInvestment) dInvestment.textContent = row.mh_investment_gap !== null ? row.mh_investment_gap : "N/A";

      // Reset expansion state for new country
      detailPanel.classList.remove("expanded");
      if (btnShowMore) btnShowMore.textContent = "Show More";

      detailPanel.classList.add("visible");
      detailPanel.setAttribute("aria-hidden", "false");
    } else if (detailPanel) {
      detailPanel.classList.remove("visible");
      detailPanel.setAttribute("aria-hidden", "true");
    }
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

  // Wire peer-mode toggle buttons
  const peerToggle = document.getElementById("peer-mode-toggle");
  if (peerToggle) {
    const peerBtns = peerToggle.querySelectorAll(".peer-btn");
    peerBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.peer;
        setState({ peerMode: mode });
        // Update active class
        peerBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Keep toggle in sync with state on every render
    subscribe((state) => {
      const mode = state.peerMode || "region";
      peerBtns.forEach(b => {
        b.classList.toggle("active", b.dataset.peer === mode);
      });
    });
  }

  subscribe(renderUI);
  renderUI();

  // ─── Modal open / close ────────────────────────────────────
  function setupModal(btnId, modalId) {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    if (!btn || !modal) return;

    btn.addEventListener("click", () => {
      modal.classList.add("visible");
      modal.setAttribute("aria-hidden", "false");
    });

    // Close on × button
    const closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("visible");
        modal.setAttribute("aria-hidden", "true");
      });
    }

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("visible");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  setupModal("btn-source", "modal-source");
  setupModal("btn-about", "modal-about");

  // Close any open modal on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.visible").forEach((m) => {
        m.classList.remove("visible");
        m.setAttribute("aria-hidden", "true");
      });
    }
  });
}

window.initUI = initUI;
