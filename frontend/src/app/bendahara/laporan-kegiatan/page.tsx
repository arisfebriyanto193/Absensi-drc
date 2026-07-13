"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Activity, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function BendaharaLaporanKegiatan() {
  const [laporan, setLaporan] = useState<any[]>([]);

  const fetchLaporan = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/laporan-kegiatan`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLaporan(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
          Laporan Keuangan Kegiatan
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Ringkasan arus kas (pemasukan & pengeluaran) dari setiap kegiatan DRC.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
        {laporan.map(item => (
          <div key={item.id} className="surface-card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--primary)" }}>{item.nama_kegiatan}</h3>
                <span style={{
                  padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600",
                  backgroundColor: item.status === 'Selesai' ? 'rgba(16,185,129,0.1)' : item.status === 'Sedang Berlangsung' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                  color: item.status === 'Selesai' ? '#10b981' : item.status === 'Sedang Berlangsung' ? '#3b82f6' : '#f59e0b'
                }}>
                  {item.status}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {item.tanggal_mulai ? new Date(item.tanggal_mulai).toLocaleDateString('id-ID') : '-'} s.d. {item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID') : '-'}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  <TrendingUp size={16} color="#10b981" /> Total Pemasukan
                </div>
                <span style={{ fontWeight: "600", color: "#10b981" }}>{formatRupiah(item.pemasukan)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  <TrendingDown size={16} color="#ef4444" /> Total Pengeluaran
                </div>
                <span style={{ fontWeight: "600", color: "#ef4444" }}>{formatRupiah(item.pengeluaran)}</span>
              </div>
            </div>

            <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px dashed var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-main)" }}>Saldo Akhir</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "700", color: item.saldo < 0 ? '#ef4444' : 'var(--text-main)' }}>
                {formatRupiah(item.saldo)}
              </span>
            </div>
            
            <Link 
              href={`/bendahara/laporan-kegiatan/${item.id}`}
              style={{ display: "block", marginTop: "4px", textAlign: "center", padding: "10px", backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6", borderRadius: "8px", fontWeight: "600", textDecoration: "none", transition: "all 0.2s" }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#3b82f6"; e.currentTarget.style.color = "white"; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.1)"; e.currentTarget.style.color = "#3b82f6"; }}
            >
              Kelola Keuangan Kegiatan
            </Link>
          </div>
        ))}
        {laporan.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)", backgroundColor: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <Activity size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p>Belum ada data kegiatan untuk dilaporkan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
