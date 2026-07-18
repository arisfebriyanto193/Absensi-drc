"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Periode {
  id: number;
  nama_periode: string;
  is_active: boolean;
}

interface PeriodeContextType {
  periodes: Periode[];
  selectedPeriodeId: string;
  setSelectedPeriodeId: (id: string) => void;
  fetchPeriodes: () => Promise<void>;
  activePeriodeId: string;
}

const PeriodeContext = createContext<PeriodeContextType | undefined>(undefined);

export function PeriodeProvider({ children }: { children: ReactNode }) {
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>('');
  const [activePeriodeId, setActivePeriodeId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  const fetchPeriodes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/periodes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPeriodes(data);
        const active = data.find((p: Periode) => p.is_active);
        if (active) {
          setActivePeriodeId(active.id.toString());
        }
        
        const saved = localStorage.getItem('selectedPeriodeId');
        if (saved && data.some((p: Periode) => p.id.toString() === saved || saved === 'all')) {
          setSelectedPeriodeId(saved);
        } else if (active) {
          setSelectedPeriodeId(active.id.toString());
        }
      }
    } catch (err) {
      console.error('Failed to fetch periodes', err);
    }
  };

  useEffect(() => {
    fetchPeriodes();
  }, []);

  useEffect(() => {
    if (!selectedPeriodeId) return;
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      if (typeof resource === 'string' && process.env.NEXT_PUBLIC_API_URL && resource.includes(process.env.NEXT_PUBLIC_API_URL)) {
        config = config || {};
        const existingHeaders = config.headers || {};
        // Only inject if not explicitly set
        const hasHeader = Object.keys(existingHeaders).some(k => k.toLowerCase() === 'x-periode-id');
        
        if (!hasHeader) {
          config.headers = {
            ...existingHeaders,
            'x-periode-id': selectedPeriodeId
          };
        }
      }
      return originalFetch(resource, config);
    };
    
    setIsReady(true);

    return () => {
      window.fetch = originalFetch;
    };
  }, [selectedPeriodeId]);

  if (!isReady) {
    return <div style={{display: 'none'}}>Loading Context...</div>;
  }

  return (
    <PeriodeContext.Provider value={{ periodes, selectedPeriodeId, setSelectedPeriodeId, fetchPeriodes, activePeriodeId }}>
      {children}
    </PeriodeContext.Provider>
  );
}

export function usePeriode() {
  const context = useContext(PeriodeContext);
  if (!context) {
    throw new Error('usePeriode must be used within a PeriodeProvider');
  }
  return context;
}
