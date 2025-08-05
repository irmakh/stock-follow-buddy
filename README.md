# Warning: This application is a hobby project and is still under development. Please do not use it for real-life financial decisions.

# Stock Follow Buddy

Stock Follow Buddy is a client-side web application designed to help users track their stock portfolio with a focus on investments made in Turkish Lira (TRY). It offers a comprehensive dashboard with interactive charts, detailed portfolio and accounting views, and robust data management features, including import/export capabilities. All data is stored locally in your browser, ensuring complete privacy.

The application is built with modern web technologies, is fully responsive, and works offline thanks to a service worker.

## Features

-   **Portfolio Tracking**: Add BUY and SELL transactions to monitor your stock holdings.
-   **Dashboard Analytics**: Visualize your portfolio with interactive charts:
    -   **Portfolio Allocation**: A pie chart showing the weight of each stock.
    -   **Cost vs. Market Value**: A bar chart comparing the cost basis and current market value for each holding.
    -   **Price History**: A line chart to track the historical price of any stock.
-   **Multi-Currency Support**: View your entire portfolio in either TRY or USD. The app automatically fetches the latest USD/TRY exchange rate.
-   **Detailed Views**:
    -   **Portfolio View**: See a detailed breakdown of each holding, including quantity, average cost, market value, and unrealized gains/losses.
    -   **Accounting View**: Review realized gains and losses calculated using the First-In, First-Out (FIFO) method.
-   **Data Management**:
    -   Import and export transactions and price data in both **JSON** and **CSV** formats.
    -   Create and restore a full backup of all application data.
    -   Reset all application data to start fresh.
-   **Client-Side Storage**: All data is securely stored in your browser's `localStorage`. No data ever leaves your machine.
-   **Offline Functionality**: The app is fully functional offline after the first visit, thanks to a robust service worker implementation.
-   **Responsive Design**: A seamless experience on both desktop and mobile devices.
-   **Light & Dark Mode**: Switch between themes to suit your preference.

## Technology Stack

-   **Framework**: [React 19](https://react.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Charting Library**: [Recharts](https://recharts.org/)
-   **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [jsdom](https://github.com/jsdom/jsdom)
-   **Offline Support**: Service Worker API

## Project Structure

The project follows a standard React application structure:

```
/
├── public/               # Static assets (icons, manifest.json)
├── src/
│   ├── components/       # Reusable React components (UI, views, charts)
│   ├── contexts/         # React context providers (Theme, Modal, etc.)
│   ├── hooks/            # Custom React hooks (e.g., usePortfolio)
│   ├── services/         # Business logic decoupled from UI (e.g., fileService)
│   ├── types.ts          # Core TypeScript type definitions
│   ├── App.tsx           # Main application component and state management
│   ├── index.tsx         # Application entry point
│   └── service-worker.js # Offline functionality and caching logic
├── tests/                # All test files for Vitest
├── .gitignore
├── index.html            # Main HTML file
├── package.json
├── README.md
└── vite.config.ts        # Vite and Vitest configuration
```

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (version 18 or higher recommended)
-   [npm](https://www.npmjs.com/) (which comes with Node.js)

### Installation

1.  Clone the repository to your local machine:
    ```bash
    git clone https://github.com/your-username/stock-follow-buddy.git
    cd stock-follow-buddy
    ```

2.  Install the project dependencies using npm:
    ```bash
    npm install
    ```

### Running the Development Server

To start the Vite development server, run the following command. The application will be available at `http://localhost:5173`.

```bash
npm run dev
```

## Running Tests

This project uses [Vitest](https://vitest.dev/) for unit and component testing.

### Run tests in the terminal
This command will run all tests in watch mode, automatically re-running them when you save a file.

```bash
npm test
```

### Run tests with a graphical UI
For a more interactive experience, you can run the tests with the Vitest UI, which opens in your browser.

```bash
npm test:ui
```

## Key Concepts

### Portfolio Calculation (`usePortfolio.ts`)

The core portfolio logic resides in the `usePortfolio` custom hook. It takes all transactions and prices as input and calculates:
-   **Current Holdings**: It processes transactions chronologically to determine the current quantity, total cost, and average cost of each stock.
-   **Realized Gains (FIFO)**: When a `SELL` transaction occurs, the hook uses the First-In, First-Out method to determine the cost basis of the shares sold, calculating the realized gain or loss.
-   **Market Value & Unrealized Gains**: It uses the latest available price for each stock to calculate its current market value and the resulting unrealized P/L.

### Data Persistence & Privacy

This is a **client-side only** application. All data, including transactions and stock prices, is stored directly in your browser's `localStorage`. **No data is ever sent to an external server**, ensuring your financial information remains completely private to you.

### Offline Capability (`service-worker.js`)

The service worker uses a **stale-while-revalidate** caching strategy. This means:
1.  The application loads instantly from the cache, making it available even when offline.
2.  While you are using the cached version, the service worker fetches the latest updates in the background for your next visit.

This makes the app reliable and fast, regardless of network conditions.

### Module Graph
<img width="1261" height="956" alt="module_graph" src="https://github.com/user-attachments/assets/51a6b444-1a7d-414f-b065-ab495c9708fb" />

