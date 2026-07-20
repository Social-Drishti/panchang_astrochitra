'use client';

import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface AppState {
  selectedDate: Date;
  locationId: string;
  navigateDate: (delta: number) => void;
  goToToday: () => void;
  setDate: (d: Date) => void;
  setLocationId: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [locationId, setLocationIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('panchang-location') || 'delhi';
    }
    return 'delhi';
  });

  const navigateDate = useCallback((delta: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const setDate = useCallback((d: Date) => {
    setSelectedDate(d);
  }, []);

  const setLocationId = useCallback((id: string) => {
    setLocationIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panchang-location', id);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      selectedDate, locationId,
      navigateDate, goToToday, setDate, setLocationId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
