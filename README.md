# Minds Across Borders
**Visual Analytics Project (VA4)**

## Project Overview
**Minds Across Borders** is an interactive visual analytics dashboard designed to explore the global landscape of mental health crises and the corresponding preparedness of healthcare systems. By connecting socioeconomic indicators like GDP per capita with metrics such as the mental health treatment gap and the density of psychiatric professionals, this tool enables users to identify disparities, benchmark regional performance, and uncover the complex drivers of mental health outcomes worldwide.

The dashboard integrates multiple linked views—including a world choropleth map, a dynamic scatter plot, and dual-ranking bar charts—to provide a holistic perspective on the "Paradox of Progress," where economic growth does not always correlate with improved mental health infrastructure or outcomes.

## Live URL
[http://css1.seattleu.edu/~rrafsan/minds-across-borders/Index.html](http://css1.seattleu.edu/~rrafsan/minds-across-borders/Index.html)

## Prepared by:
*   **Andrew Levner**
*   **Rizvan Ahmed Rafsan**
*   **Sasivadhan Kandregula**

## Changes from VA3 Design Proposal
The final VA4 implementation introduces several high-impact structural and interactive enhancements that were not present in the initial VA3 design proposal:

*   **Addition of the Interactive Scatterplot**: The most significant structural addition is the interactive scatterplot. This view allows for multi-dimensional analysis (X-axis, Y-axis, and Circle Size), enabling users to uncover correlations between socioeconomic factors and mental health outcomes that were not accessible in the original proposal.
*   **Draggable Detail Panel**: To improve dashboard usability, the detail panel was transformed from a static overlay into a floating, draggable component. This allows users to move the panel anywhere on the screen, ensuring that key data metrics never obstruct the underlying map or charts.
*   **Enhanced UI Interactions & Linking**: We implemented a robust system of linked interactions across all views. This includes synchronized hovering, persistent selection across the map and charts, and a centralized "Peer Mode" toggle that allows for instant comparative analysis across regional and income-group cohorts.
*   **Full Real-Time Metric Control**: Unlike the static metrics envisioned in VA3, the final dashboard provides users with real-time control over every visualization's metrics through integrated dropdown menus for the map, bar charts, and all scatterplot axes.

## AI Usage Note
This project was developed in partnership with AI tools as a coding and design partner:
*   **Claude (Sonnet 4.6)**: Used for brainstorming the project narrative, audience framing, and refining the written design rationale.
*   **Cursor IDE & Antigravity (Google DeepMind)**: Used for iterative D3.js development, debugging complex state interactions, and performing high-fidelity UI refinements. All AI-suggested code was reviewed, tested, and integrated by the team.
*   **Google Gemini**: Used for generating aesthetic slide assets and supporting image generation for documentation.

## How to Run Locally
Because this project loads local data files (CSV/JSON) using D3.js, you must use a local web server to bypass CORS restrictions:
1.  Navigate to the project root directory.
2.  Start a local server:
    *   **VS Code**: Use the "Live Server" extension.
    *   **Python**: Run `python -m http.server 8000`.
    *   **Node**: Use `npx serve .`.
3.  Open `http://localhost:[port]` in your browser.
