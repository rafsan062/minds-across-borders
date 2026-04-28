// Bar.js
// Two horizontal scrollable ranking bar charts

window.initBar = function () {
    const margin = { top: 20, right: 20, bottom: 30, left: 135 }; // Fine-tuned for perfect alignment
    const containerWidth = d3.select("#bar-left").node().clientWidth;
    const width = containerWidth * .9 - margin.left - margin.right;

    const rowHeight = 24; // Increased for much wider spacing

    // SVG containers

    const svgAxisLeft = d3.select("#bar-left .bar-axis")
        .append("svg")
        .attr("height", 40)
        .attr("width", width + margin.left + margin.right)
        .append("g")
        .attr("transform", `translate(${margin.left},20)`);

    const svgLeft = d3.select("#bar-left .bar-scroll")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const svgAxisRight = d3.select("#bar-right .bar-axis")
        .append("svg")
        .attr("height", 40)
        .attr("width", width + margin.left + margin.right)
        .append("g")
        .attr("transform", `translate(${margin.left},20)`);

    const svgRight = d3.select("#bar-right .bar-scroll")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // const svgLeft = d3.select("#bar-left")
    //     .append("svg")
    //     .attr("width", width + margin.left + margin.right)
    //     .append("g")
    //     .attr("transform", `translate(${margin.left},${margin.top})`);
    //
    // const svgRight = d3.select("#bar-right")
    //     .append("svg")
    //     .attr("width", width + margin.left + margin.right)
    //     .append("g")
    //     .attr("transform", `translate(${margin.left},${margin.top})`);

    // Dropdowns
    const selectLeft = d3.select("#select-bar-left");
    const selectRight = d3.select("#select-bar-right");

    // Color scale
    const color = window.regionColors || d3.scaleOrdinal(d3.schemeTableau10);

    // Track previous state to skip re-render on hover-only changes
    let prevBarLeftMetric = null;
    let prevBarRightMetric = null;
    let prevSelectedId = undefined;
    let prevFocusedRegion = undefined;
    let prevDataLength = 0;

    // Safety net: clear hover when mouse leaves the container divs
    // These divs are persistent (never destroyed), unlike SVG children
    d3.select("#bar-left").on("mouseleave", () => {
        if (getState().hoveredId) setState({ hoveredId: null });
    });
    d3.select("#bar-right").on("mouseleave", () => {
        if (getState().hoveredId) setState({ hoveredId: null });
    });

    // ─────────────────────────────────────────────
    // Update (runs on state changes)
    // ─────────────────────────────────────────────
    function update(state) {
        const data = state.rows || [];
        const key = state.countryKey;

        if (!data.length || !key) return;

        // Skip full re-render if only hoveredId changed
        // (re-rendering destroys bars under the cursor, breaking mouseleave)
        const needsRender =
            prevBarLeftMetric !== state.barLeftMetric ||
            prevBarRightMetric !== state.barRightMetric ||
            prevSelectedId !== state.selectedId ||
            prevFocusedRegion !== state.focusedRegion ||
            prevDataLength !== data.length;

        if (!needsRender) return;

        prevBarLeftMetric = state.barLeftMetric;
        prevBarRightMetric = state.barRightMetric;
        prevSelectedId = state.selectedId;
        prevFocusedRegion = state.focusedRegion;
        prevDataLength = data.length;

        renderChart(
            svgLeft,
            svgAxisLeft,
            data,
            state.barLeftMetric,
            key,
            state,
            "bar-left-title",
            "#bar-left"
        );

        renderChart(
            svgRight,
            svgAxisRight,
            data,
            state.barRightMetric,
            key,
            state,
            "bar-right-title",
            "#bar-right"
        );
    }

    // ─────────────────────────────────────────────
    // Render chart
    // ─────────────────────────────────────────────
    function renderChart(svg, axis, data, metric, key, state, titleId, containerSelector) {
        const nameField = "country"; // change if needed

        // Filter + sort ALL countries
        const filtered = data
            .filter(d => {
                // metric must exist
                const validMetric = d[metric] != null && !isNaN(d[metric]);

                // region filter (if one is selected)
                const regionMatch = !state.focusedRegion || d.region === state.focusedRegion;

                return validMetric && regionMatch;
            })
            .sort((a, b) => d3.descending(+a[metric], +b[metric]));

        const chartHeight = filtered.length * rowHeight;

        // Resize SVG dynamically
        const svgRoot = d3.select(containerSelector)
            .select(".bar-scroll svg");

        svgRoot.attr("height", chartHeight + margin.top + margin.bottom);

        // Scales
        const x = d3.scaleLinear()
            .domain([0, d3.max(filtered, d => +d[metric]) || 0])
            .range([0, width]); // Reverted to start at 0

        const y = d3.scaleBand()
            .domain(filtered.map(d => d[nameField]))
            .range([0, chartHeight])
            .padding(0.5); // Wide spacing between bars

        // Clear previous render
        svg.selectAll("*").remove();

        // Y axis (country names)
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .selectAll("text")
            .style("font-size", `${Math.min(14, rowHeight * 0.7)}px`);

        // X axis
        // svg.append("g")
        //     .attr("transform", `translate(0,${chartHeight})`)
        //     .call(d3.axisBottom(x).ticks(5));

        axis.selectAll("*").remove();

        axis.append("g")
            .attr("transform", "translate(0,0)")
            .call(d3.axisBottom(x).ticks(5))
            .selectAll("text")
            .style("font-size", "14px"); // 2px larger numbers

        // Bars
        svg.selectAll(".bar")
            .data(filtered, d => d[key])
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d[nameField]))
            .attr("height", y.bandwidth())
            .attr("x", 0)
            .attr("width", d => x(+d[metric]))
            .attr("rx", 3) // Small rounded corner
            .attr("ry", 3)
            .attr("fill", d => window.regionColors?.[d.region] || "#ccc")
            .attr("stroke", d =>
                state.selectedId === d[key] ? "black" : "none"
            )
            .attr("stroke-width", d =>
                state.selectedId === d[key] ? 2 : 0
            )
            .on("mouseenter", (event, d) => {
                setState({ hoveredId: d[key] });
            })
            .on("mouseleave", () => {
                setState({ hoveredId: null });
            })
            .on("click", (event, d) => {
                const id = d[key];
                setState({
                    selectedId: state.selectedId === id ? null : id
                });
            });



        // ─────────────────────────────────────────────
        // Optional: auto-scroll to selected country
        // ─────────────────────────────────────────────
        if (state.selectedId) {
            const selected = filtered.find(d => d[key] === state.selectedId);
            if (selected) {
                const yPos = y(selected[nameField]);
                const container = d3.select(containerSelector)
                    .select(".bar-scroll")
                    .node();

                if (yPos != null) {
                    container.scrollTop = yPos;
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // Dropdown → state
    // ─────────────────────────────────────────────
    selectLeft.on("change", function () {
        setState({ barLeftMetric: this.value });
    });

    selectRight.on("change", function () {
        setState({ barRightMetric: this.value });
    });

    // ─────────────────────────────────────────────
    // Subscribe to state
    // ─────────────────────────────────────────────
    subscribe(update);

    // Initial render
    update(getState());
};