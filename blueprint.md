# **Project Blueprint: Jeju Weather Guard MVP**

## **1. Overview**

"Jeju Weather Guard" is a smart travel assistant that provides real-time, weather-adaptive itinerary recommendations for travelers in Jeju Island. If inclement weather (rain or extreme heat) is detected, the application will automatically suggest alternative indoor activities, ensuring a seamless and enjoyable travel experience.

## **2. Core Features**

*   **Real-time Weather Monitoring:** Integrates with the Cloudflare API (leveraging the KMA Open API) to fetch live weather data for Jeju.
*   **Dynamic Itinerary Adjustments:** Automatically swaps planned outdoor activities with nearby indoor alternatives from a curated list of locations when the weather is unfavorable.
*   **Personalized "Plan B" Suggestions:** Uses Gemini to generate creative and appealing alternative plans.
*   **Simple, Clean User Interface:** Displays the current travel plan and allows users to simulate a rainy day for testing purposes.

## **3. Project Structure & Files**

*   `index.html`: Main application interface.
*   `main.js`: Core application logic, API interactions, and DOM manipulation.
*   `style.css`: Styling for the user interface.
*   `places.json`: A static database of 15 curated tourist spots in Jeju.
*   `.env.example`: An example file for managing the Cloudflare API key.
*   `blueprint.md`: This file, documenting the project plan and design.

## **4. Implementation Steps**

1.  **Create `places.json`:** Define a list of 15 diverse locations in Jeju, each with an `id`, `name`, `type` (indoor/outdoor), `region` (Jeju/Seogwipo), and `category`.
2.  **Create `.env.example`:** Set up the structure for environment variables to securely handle the API key.
3.  **Develop `index.html`:** Structure the main page with a clear area for the itinerary and a "Simulate Rain" button for testing.
4.  **Implement `main.js`:**
    *   Load the `places.json` data.
    *   Fetch weather data from the specified Cloudflare worker.
    *   Implement the primary logic: on "rainy" or "hot" weather, replace "outdoor" locations with suitable "indoor" alternatives.
    *   (Simulated) Call the Gemini API to generate a friendly "Plan B" message.
    *   Add an event listener to the "Simulate Rain" button to test the functionality.
5.  **Design `style.css`:** Apply a clean, modern design to the UI for a good user experience.
6.  **Update `blueprint.md`:** Keep this document updated as development progresses.

## **5. Current Change Plan (Cloudflare Pages Deployment)**

**Overview:** Add Cloudflare Pages deployment automation via `wrangler`, ensure a build output in `dist`, and configure the project for Pages.

**Plan Steps:**
1. Add a minimal `package.json` with `build` and `deploy` scripts.
2. Create `wrangler.toml` with `compatibility_date` and `pages_build_output_dir`.
3. Install `wrangler` as a dev dependency.
4. Run `npm run deploy` to publish to Cloudflare Pages.

## **6. Current Change Plan (Local .env Support)**

**Overview:** Enable local development to read `OPENAI_API_KEY` from a `.env` file when using a local dev server.

**Plan Steps:**
1. Add a lightweight local dev server that serves static files and proxies `/api/openai`.
2. Load `.env` via `dotenv` so local requests use `OPENAI_API_KEY`.
3. Add a `dev` script and dependency updates.
