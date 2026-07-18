"use client";

import React from 'react';
import { usePeriode } from '@/context/PeriodeContext';

export default function PeriodeSelector() {
  const { periodes, selectedPeriodeId, setSelectedPeriodeId } = usePeriode();

  if (periodes.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Periode:</span>
      <select
        value={selectedPeriodeId}
        onChange={(e) => {
          const val = e.target.value;
          setSelectedPeriodeId(val);
          localStorage.setItem('selectedPeriodeId', val);
          window.location.reload();
        }}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="all">Semua Periode</option>
        {periodes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nama_periode} {p.is_active ? '(Aktif)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
