import React, { createContext, useState, useContext } from 'react';

const MonthContext = createContext<any>(null);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonthId, setSelectedMonthId] = useState(new Date().toISOString().slice(0, 7));

  return (
    <MonthContext.Provider value={{ selectedMonthId, setSelectedMonthId }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  return useContext(MonthContext);
}