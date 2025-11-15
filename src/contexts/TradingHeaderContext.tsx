import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TradingHeaderContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAccountManagerClick: () => void;
  setOnAccountManagerClick: (handler: () => void) => void;
  onNewTradeClick: () => void;
  setOnNewTradeClick: (handler: () => void) => void;
}

const TradingHeaderContext = createContext<TradingHeaderContextType | undefined>(undefined);

export const useTradingHeader = () => {
  const context = useContext(TradingHeaderContext);
  if (!context) {
    // Return safe defaults if context is not available
    return {
      searchQuery: '',
      setSearchQuery: () => {},
      onAccountManagerClick: () => {},
      setOnAccountManagerClick: () => {},
      onNewTradeClick: () => {},
      setOnNewTradeClick: () => {},
    };
  }
  return context;
};

interface TradingHeaderProviderProps {
  children: ReactNode;
}

export const TradingHeaderProvider: React.FC<TradingHeaderProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onAccountManagerClick, setOnAccountManagerClick] = useState<() => void>(() => {});
  const [onNewTradeClick, setOnNewTradeClick] = useState<() => void>(() => {});

  return (
    <TradingHeaderContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        onAccountManagerClick,
        setOnAccountManagerClick,
        onNewTradeClick,
        setOnNewTradeClick,
      }}
    >
      {children}
    </TradingHeaderContext.Provider>
  );
};

