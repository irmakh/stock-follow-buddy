# Stock Follow Buddy

## Project Overview

Stock Follow Buddy is a comprehensive, client-side web application designed to help users track their stock portfolio with a primary focus on investments in Turkish Lira (TRY). It is built as a Single Page Application (SPA) using React and TypeScript.

The application is architected to be completely private and offline-first. All user data, including transactions and price history, is stored exclusively in the browser's `localStorage`, meaning no data is ever sent to a server. A service worker provides robust offline functionality, caching the application shell and assets for instant loading and network independence.

## Key Features

-   **Portfolio Management**: Users can add, view, and manage `BUY` and `SELL` transactions for various stock tickers.
-   **Dashboard Analytics**: An interactive dashboard visualizes the portfolio's health through several charts:
    -   **Portfolio Allocation**: A pie chart showing the weight of each stock by market value.
    -   **Cost vs. Market Value**: A bar chart comparing the cost basis and current market value for each holding.
    -   **Price History**: A line chart to track the historical price of any stock.
-   **Multi-Currency Support**: The entire portfolio, including gains and losses, can be viewed in either **TRY** or **USD**. The app can fetch the latest USD/TRY exchange rate automatically or allow manual entry.
-   **Detailed Views**:
    -   **Portfolio View**: A detailed breakdown of each current holding, showing quantity, average cost, market value, and unrealized gains/losses.
    -   **Accounting View**: A history of all realized gains and losses, calculated using the **First-In, First-Out (FIFO)** method.
-   **Data Management**:
    -   Import and export transactions and price data in both **JSON** and **CSV** formats.
    -   Create and restore a full backup of all application data (transactions and prices).
    -   Reset all application data to its initial state.
-   **Offline-First & Privacy**: All data is stored in `localStorage`, and the application is fully functional offline after the first visit via a service worker.
-   **Modern UI/UX**: A responsive design that works on desktop and mobile, with support for both light and dark themes.

## Core Concepts

-   **Portfolio Calculation (`hooks/usePortfolio.ts`)**: This is the core logic hub. The `usePortfolio` custom hook processes all transactions chronologically. It calculates current holdings (quantity, total cost, average cost) and determines realized gains/losses for `SELL` transactions using the FIFO accounting method. It then combines this with the latest price data to compute market values and unrealized P/L.
-   **Data Persistence (`App.tsx`)**: The main `App` component manages the application's state (`transactions`, `stockPrices`). It uses `useEffect` hooks to persist this state to `localStorage` whenever it changes, ensuring data is saved across sessions.
-   **Offline Capability (`service-worker.js`)**: The service worker employs a "stale-while-revalidate" caching strategy. It serves the app shell and assets from the cache for instant loads and offline access, while simultaneously fetching fresh versions in the background to keep the app updated.

## Technology Stack

-   **Framework**: React 19
-   **Language**: TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **Charting**: Recharts
-   **State Management**: React Hooks (`useState`, `useEffect`, `useContext`)
-   **Routing**: View switching is handled by internal state management in `App.tsx` (not a formal router library).
-   **Testing**: Vitest, React Testing Library, jsdom
-   **Offline Support**: Service Worker API

## Project Structure

The codebase is organized to separate concerns, making it easier to navigate and maintain.

```
/
├── src/
│   ├── components/       # Reusable React components (UI elements, views, charts)
│   |   ├── ui/           # Generic, reusable UI components (Button, Card, Modal etc.)
│   |   ├── charts/       # All Recharts components
│   |   └── ...           # View-specific components (Dashboard, PortfolioView etc.)
│   ├── contexts/         # React Context providers (Theme, Modal, Notification)
│   ├── hooks/            # Custom React hooks (e.g., usePortfolio for business logic)
│   ├── services/         # Logic decoupled from UI (e.g., fileService for import/export)
│   ├── types.ts          # Core TypeScript type definitions for the entire application
│   ├── App.tsx           # Main application component, state management, and view routing
│   ├── index.tsx         # Application entry point - renders the App component
│   └── service-worker.js # Offline functionality and caching logic
├── tests/                # All test files for Vitest
├── index.html            # Main HTML file with importmap
├── package.json          # Project dependencies and scripts
└── vite.config.ts        # Vite and Vitest configuration
```
