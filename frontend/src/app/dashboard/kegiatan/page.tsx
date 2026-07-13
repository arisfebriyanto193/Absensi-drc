"use client";

import { useEffect, useState } from "react";
import { Layers, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function UserKegiatan() {
  const [kegiatan, setKegiatan] = useState<any[]>([]);

  const fetchKegiatan = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setKegiatan(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchKegiatan();
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
          Kegiatan Saya
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Daftar kegiatan di mana Anda tergabung sebagai panitia.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
        {kegiatan.map(item => (
          <Link href={`/dashboard/kegiatan/${item.id}`} key={item.id} style={{ textDecoration: "none" }}>
            <div className="surface-card hover-lift" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px", cursor: "pointer", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>{item.nama_kegiatan}</h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: "600" }}>Peran: {item.peran || 'Admin'}</span>
                </div>
                <span style={{
                  padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600",
                  backgroundColor: item.status === 'Selesai' ? 'rgba(16,185,129,0.1)' : item.status === 'Sedang Berlangsung' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                  color: item.status === 'Selesai' ? '#10b981' : item.status === 'Sedang Berlangsung' ? '#3b82f6' : '#f59e0b',
                  whiteSpace: "nowrap"
                }}>
                  {item.status}
                </span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <Calendar size={14} /> 
                {item.tanggal_mulai ? new Date(item.tanggal_mulai).toLocaleDateString('id-ID') : '-'} 
                {item.tanggal_selesai ? ` s.d. ${new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}` : ''}
              </div>

              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", flex: 1 }}>
                {item.deskripsi ? (item.deskripsi.length > 100 ? item.deskripsi.substring(0, 100) + '...' : item.deskripsi) : 'Tidak ada deskripsi.'}
              </p>

              <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--primary)", fontSize: "0.9rem", fontWeight: "600" }}>
                <span>Kelola & Lihat Detail</span>
                <ChevronRight size={18} />
              </div>
            </div>
          </Link>
        ))}
        
        {kegiatan.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px", color: "var(--text-muted)", backgroundColor: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <Layers size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p style={{ fontSize: "1.1rem", fontWeight: "500", marginBottom: "8px" }}>Belum Ada Kegiatan</p>
            <p style={{ fontSize: "0.9rem" }}>Anda belum terdaftar sebagai panitia di kegiatan apa pun.</p>
          </div>
        )}
      </div>
    </div>
  );
}
