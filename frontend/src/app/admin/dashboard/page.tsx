"use client";

import { useEffect, useState } from "react";
import { Users, AlertCircle, Mail, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="fade-in">
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "24px", 
        marginBottom: "32px" 
      }}>
        
        <div className="surface-card" style={{ borderTop: "4px solid var(--primary)", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ padding: "16px", background: "rgba(79, 172, 254, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
            <Users size={32} />
          </div>
          <div>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase" }}>Total Users</h3>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-main)" }}>{data?.total_users || 0}</p>
          </div>
        </div>

        <div className="surface-card" style={{ borderTop: "4px solid #f59e0b", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ padding: "16px", background: "rgba(245, 158, 11, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase" }}>Pending Absen</h3>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-main)" }}>{data?.pending_absen || 0}</p>
          </div>
        </div>

        <div className="surface-card" style={{ borderTop: "4px solid #ef4444", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
            <Mail size={32} />
          </div>
          <div>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase" }}>Pending Izin</h3>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-main)" }}>{data?.pending_izin || 0}</p>
          </div>
        </div>

        <div className="surface-card" style={{ borderTop: "4px solid #10b981", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
            <Calendar size={32} />
          </div>
          <div>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase" }}>Jadwal Hari Ini</h3>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-main)" }}>{data?.jadwal_hari_ini || 0}</p>
          </div>
        </div>
      </div>

      {/* Detail Widgets */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        
        {/* Jadwal Hari Ini Widget */}
        <div className="surface-card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)" }}>
            <Calendar size={20} color="var(--primary)" /> Petugas Hari Ini
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data?.petugas_hari_ini && data.petugas_hari_ini.length > 0 ? (
              data.petugas_hari_ini.map((p: any, idx: number) => (
                <div key={idx} style={{ 
                  padding: "12px 16px", background: "rgba(79, 172, 254, 0.05)", 
                  borderLeft: "3px solid var(--primary)", borderRadius: "8px",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.95rem" }}>{p.nama_lengkap}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{p.lokasi}</div>
                  </div>
                  <div style={{ background: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600", color: "var(--primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    {p.jam_mulai.substring(0,5)} - {p.jam_selesai.substring(0,5)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "0.9rem", background: "#f8fafc", borderRadius: "8px" }}>
                Tidak ada jadwal piket hari ini.
              </div>
            )}
          </div>
        </div>

        {/* Pending Absensi Widget */}
        <div className="surface-card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)" }}>
            <AlertCircle size={20} color="#f59e0b" /> Absensi Menunggu Konfirmasi
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data?.recent_pending && data.recent_pending.length > 0 ? (
              data.recent_pending.map((a: any) => (
                <div key={a.id} style={{ 
                  padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "8px",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.95rem" }}>{a.nama_lengkap}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      {new Date(a.waktu_absen).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                  <div style={{ 
                    padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase",
                    background: a.jenis === "masuk" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    color: a.jenis === "masuk" ? "#10b981" : "#ef4444"
                  }}>
                    {a.jenis}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "0.9rem", background: "#f8fafc", borderRadius: "8px" }}>
                Semua absensi sudah dikonfirmasi!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
