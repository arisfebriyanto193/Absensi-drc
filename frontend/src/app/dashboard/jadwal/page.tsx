"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";

export default function UserJadwal() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/dashboard', '')}/api/user/jadwal`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setJadwal(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat jadwal...</div>;

  return (
    <div className="fade-in max-w-5xl mx-auto pb-10">
      <div className="surface-card mb-6 p-6" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "white" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
          <CalendarIcon size={28} />
          Jadwal Piket Saya
        </h1>
        <p style={{ opacity: 0.9 }}>Daftar seluruh jadwal piket yang ditugaskan kepada Anda.</p>
      </div>

      <div className="surface-card">
        {jadwal.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <CalendarIcon size={48} style={{ margin: "0 auto 16px", color: "var(--text-muted)", opacity: 0.5 }} />
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: "500" }}>Anda belum memiliki jadwal piket.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {jadwal.map((j: any) => (
              <div key={j.id} style={{ 
                border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", 
                backgroundColor: "var(--bg-color)", position: "relative", overflow: "hidden",
                borderTop: "4px solid var(--primary)", transition: "transform 0.2s, box-shadow 0.2s"
              }} className="hover-lift">
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>
                    {new Date(j.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <span style={{ 
                    display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600",
                    backgroundColor: j.status === 'completed' ? "#d1fae5" : j.status === 'scheduled' ? "#dbeafe" : "#f3f4f6",
                    color: j.status === 'completed' ? "#065f46" : j.status === 'scheduled' ? "#1e40af" : "#374151"
                  }}>
                    {j.status === 'scheduled' ? 'TERJADWAL' : j.status === 'completed' ? 'SELESAI' : j.status.toUpperCase()}
                  </span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-muted)" }}>
                    <div style={{ padding: "8px", borderRadius: "50%", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Waktu</p>
                      <p style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.95rem" }}>{j.jam_mulai} - {j.jam_selesai}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-muted)" }}>
                    <div style={{ padding: "8px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lokasi</p>
                      <p style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.95rem" }}>{j.lokasi}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
