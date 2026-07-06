"use client";

import { useEffect, useState } from "react";
import { Calendar, Info } from "lucide-react";

export default function UserDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/dashboard`, {
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
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "24px", 
        marginBottom: "32px" 
      }}>
        <div className="surface-card" style={{ borderTop: "4px solid var(--primary)" }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Status Jadwal Hari Ini
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "16px", background: "rgba(79, 172, 254, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
              <Calendar size={32} />
            </div>
            <div>
              {data?.jadwal_hari_ini ? (
                <>
                  <p style={{ fontSize: "1.2rem", fontWeight: "700" }}>{data.jadwal_hari_ini.lokasi}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "12px" }}>
                    {data.jadwal_hari_ini.jam_mulai} - {data.jadwal_hari_ini.jam_selesai}
                  </p>
                  <a href={`/dashboard/absen?jadwal_id=${data.jadwal_hari_ini.id}`} style={{ 
                    display: "inline-block", padding: "8px 16px", backgroundColor: "var(--primary)", 
                    color: "white", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600", textDecoration: "none" 
                  }}>
                    Absen Sekarang
                  </a>
                </>
              ) : (
                <p style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--text-muted)" }}>Tidak ada jadwal</p>
              )}
            </div>
          </div>
        </div>

        <div className="surface-card" style={{ borderTop: "4px solid var(--accent)" }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Informasi
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "16px", background: "rgba(118, 75, 162, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
              <Info size={32} />
            </div>
            <p style={{ fontSize: "1rem", color: "var(--text-main)", fontWeight: "500" }}>
              Pastikan absen tepat waktu sesuai jadwal piket yang telah ditentukan.
            </p>
          </div>
        </div>
      </div>

      <div className="surface-card">
        <h2 style={{ fontSize: "1.2rem", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
          Riwayat Absensi Terbaru
        </h2>
        
        {data?.riwayat_terbaru && data.riwayat_terbaru.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-color)", textAlign: "left" }}>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Waktu</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Status</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {data.riwayat_terbaru.map((row: any) => (
                  <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px" }}>{new Date(row.jam_absen).toLocaleString("id-ID")}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ 
                        padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600",
                        backgroundColor: row.status_konfirmasi === 'approved' ? "#d1fae5" : row.status_konfirmasi === 'rejected' ? "#fee2e2" : "#fef3c7",
                        color: row.status_konfirmasi === 'approved' ? "#065f46" : row.status_konfirmasi === 'rejected' ? "#991b1b" : "#92400e"
                      }}>
                        {row.status_konfirmasi}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>{row.catatan || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>Belum ada riwayat absensi</p>
        )}
      </div>
    </div>
  );
}
