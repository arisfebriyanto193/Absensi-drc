"use client";

import { useEffect, useState } from "react";
import { Wallet, Activity, TrendingUp, TrendingDown, Info } from "lucide-react";

export default function BendaharaDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "var(--text-main)" }}>Overview Keuangan</h1>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "24px", 
        marginBottom: "32px" 
      }}>
        {/* Card Saldo Akhir (Seluruh Kegiatan) */}
        <div className="surface-card" style={{ borderTop: "4px solid var(--primary)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "12px", background: "rgba(79, 172, 254, 0.1)", borderRadius: "12px", color: "var(--primary)" }}>
              <Wallet size={24} />
            </div>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
              Saldo Total Kegiatan
            </h3>
          </div>
          <p style={{ fontSize: "1.8rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
            Rp {Number(data?.saldoAkhir || 0).toLocaleString("id-ID")}
          </p>
        </div>

        {/* Card Total Pemasukan Kegiatan */}
        <div className="surface-card" style={{ borderTop: "4px solid #10b981", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "12px", color: "#10b981" }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
              Pemasukan (Kegiatan)
            </h3>
          </div>
          <p style={{ fontSize: "1.8rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
            Rp {Number(data?.totalPemasukan || 0).toLocaleString("id-ID")}
          </p>
        </div>

        {/* Card Total Pengeluaran Kegiatan */}
        <div className="surface-card" style={{ borderTop: "4px solid #ef4444", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", color: "#ef4444" }}>
              <TrendingDown size={24} />
            </div>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
              Pengeluaran (Kegiatan)
            </h3>
          </div>
          <p style={{ fontSize: "1.8rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
            Rp {Number(data?.totalPengeluaran || 0).toLocaleString("id-ID")}
          </p>
        </div>
        
        {/* Card Uang Kas Anggota Terkumpul */}
        <div className="surface-card" style={{ borderTop: "4px solid var(--accent)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "12px", background: "rgba(118, 75, 162, 0.1)", borderRadius: "12px", color: "var(--accent)" }}>
              <Activity size={24} />
            </div>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
              Kas Anggota Terkumpul
            </h3>
          </div>
          <p style={{ fontSize: "1.8rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
            Rp {Number(data?.totalKasAnggota || 0).toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="surface-card" style={{ display: "flex", alignItems: "flex-start", gap: "16px", backgroundColor: "rgba(79, 172, 254, 0.05)" }}>
        <Info color="var(--primary)" size={24} style={{ marginTop: "4px" }} />
        <div>
          <h4 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "var(--primary)" }}>Informasi Sistem Keuangan</h4>
          <p style={{ color: "var(--text-muted)", lineHeight: "1.6", fontSize: "0.95rem" }}>
            Sistem keuangan ini terbagi menjadi dua bagian: <strong>Kas Anggota</strong> (Iuran rutin dari anggota organisasi) dan <strong>Kegiatan & Transaksi</strong> (Pembukuan uang masuk dan keluar pada suatu kegiatan/proyek spesifik). Total Saldo di atas adalah gabungan dari Saldo Awal semua kegiatan beserta arus kas transaksinya.
          </p>
        </div>
      </div>
    </div>
  );
}
