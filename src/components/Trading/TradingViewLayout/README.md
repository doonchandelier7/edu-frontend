# TradingViewLayout - Modular Structure

This folder contains the refactored TradingViewLayout component, broken down into smaller, manageable modules.

## Folder Structure

```
TradingViewLayout/
├── index.tsx              # Main component (combines all modules)
├── types.ts               # TypeScript interfaces and types
├── utils.ts               # Helper functions and utilities
├── components/            # UI components
│   ├── Header.tsx         # Trading dashboard header with search
│   ├── AccountInfo.tsx    # Alpaca account information display
│   ├── EmptyAccount.tsx   # Empty state when no account connected
│   ├── StockList.tsx      # Reusable stock list component
│   ├── WatchlistSection.tsx   # Watchlist section component
│   ├── IndianStocksSection.tsx # Indian stocks section component
│   ├── IndianIndices.tsx      # Indian indices component
│   ├── ChartModal.tsx     # Chart modal component
│   └── TradeModal.tsx     # Trade order modal component
└── hooks/                 # Custom React hooks
    ├── useMarketData.ts   # Hook for fetching market data
    ├── useChartData.ts    # Hook for fetching chart data
    └── useQuote.ts        # Hook for fetching quote data
```

## Benefits of This Structure

1. **Maintainability**: Each component is in its own file, making it easier to find and modify code
2. **Reusability**: Components like `StockList` can be reused across different sections
3. **Testability**: Smaller, focused components are easier to test
4. **Type Safety**: All types are centralized in `types.ts`
5. **Separation of Concerns**: Business logic (hooks) is separated from UI (components)

## Usage

The main component is exported from `index.tsx` and can be imported as before:

```typescript
import TradingViewLayout from './components/Trading/TradingViewLayout';
```

## Component Breakdown

- **Header**: Search bar, navigation, and New Trade button
- **AccountInfo**: Displays Alpaca account details with refresh functionality
- **WatchlistSection**: Manages and displays watchlist stocks
- **IndianStocksSection**: Displays Indian stock listings
- **IndianIndices**: Shows Indian market indices
- **ChartModal**: Full-screen chart view with controls
- **TradeModal**: Order placement interface

## Custom Hooks

- **useMarketData**: Manages market data fetching and auto-refresh
- **useChartData**: Handles chart data fetching and news
- **useQuote**: Manages real-time quote updates

