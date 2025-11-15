import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ value, defaultValue, onValueChange, className = '', children }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList: React.FC<TabsListProps> = ({ className = '', children }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
    {children}
  </div>
);

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className = '', children }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const { value: selectedValue, onValueChange } = context;
  const isSelected = selectedValue === value;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected 
          ? 'bg-background text-foreground shadow-sm' 
          : 'hover:bg-background/50'
      } ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<TabsContentProps> = ({ value, className = '', children }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  const { value: selectedValue } = context;
  
  if (selectedValue !== value) return null;
  
  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };