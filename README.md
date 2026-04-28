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
The transition from the VA3 proposal to the final VA4 implementation introduced several major structural and interactive enhancements to improve data exploration:

*   **Addition of Interactive Scatterplot**: The most significant change from the VA3 design is the inclusion of a dynamic scatterplot. This view allows users to correlate any two metrics (e.g., GDP vs. Suicide Rate) while using circle size to represent a third variable, providing a depth of analysis not present in the original proposal.
*   **Draggable Detail Panel**: To improve usability, the country detail panel was transformed into a draggable floating component. This allows users to reposition the detailed data metrics anywhere on the screen to avoid obstructing the underlying map or charts.
*   **Global Peer-Mode Toggle**: We added a centralized toggle that allows users to switch between **Regional** and **Income-Group** peer highlighting. This interaction instantly synchronizes highlights across the map, scatterplot, and bar charts.
*   **Dynamic Variable Selection**: Every chart now features integrated dropdown menus, enabling users to switch the primary metrics for the map, both ranking bars, and all three scatterplot axes in real-time.
*   **Horizontal Region Carousel**: To manage the full scope of the WHO geographic regions without cluttering the UI, we implemented a horizontal "slider" filter that ensures easy navigation on all screen sizes.

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
