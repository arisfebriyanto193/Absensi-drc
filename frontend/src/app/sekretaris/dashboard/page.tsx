"use client";

import { useEffect, useState } from "react";
import { FileText, Clock, Settings } from "lucide-react";
import Link from "next/link";

export default function SekretarisDashboard() {
  const [riwayat, setRiwayat] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/surat`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRiwayat(data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ width: "100%", animation: "fadeIn 0.5s" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
          Dashboard Sekretaris
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Pantau dan kelola pembuatan surat-menyurat DRC.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        <div 
          className="surface-card" 
          style={{ 
            display: "flex", alignItems: "center", gap: "20px", padding: "28px", 
            borderLeft: "5px solid var(--primary)",
            background: "linear-gradient(135deg, var(--surface) 0%, rgba(79, 172, 254, 0.05) 100%)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            cursor: "pointer"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.boxShadow = "0 15px 30px -5px rgba(79, 172, 254, 0.15)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
        >
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "rgba(79, 172, 254, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
            <FileText size={32} />
          </div>
          <div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Surat Dibuat</p>
            <p style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1.2" }}>{riwayat.length}</p>
          </div>
        </div>
      </div>

      <div className="surface-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
          <h2 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} color="var(--primary)" /> Riwayat Pembuatan Surat Terbaru
          </h2>
          <Link href="/sekretaris/surat/buat" className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem", textDecoration: "none" }}>
            + Buat Surat Baru
          </Link>
        </div>

        {riwayat.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <FileText size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p>Belum ada riwayat pembuatan surat.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "0 16px 12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>No. Surat</th>
                  <th style={{ padding: "0 16px 12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Jenis Template</th>
                  <th style={{ padding: "0 16px 12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tujuan</th>
                  <th style={{ padding: "0 16px 12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.slice(0, 5).map((item) => (
                  <tr key={item.id} style={{ backgroundColor: "var(--surface)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", borderRadius: "12px", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)"; }} onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)"; }}>
                    <td style={{ padding: "16px", fontWeight: "600", color: "var(--primary)", borderTopLeftRadius: "12px", borderBottomLeftRadius: "12px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)" }}>{item.no_surat}</td>
                    <td style={{ padding: "16px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ padding: "6px 12px", backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>
                        {item.nama_template}
                      </span>
                    </td>
                    <td style={{ padding: "16px", color: "var(--text-main)", fontWeight: "500", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>{item.tujuan_surat || "-"}</td>
                    <td style={{ padding: "16px", color: "var(--text-muted)", borderTopRightRadius: "12px", borderBottomRightRadius: "12px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>{new Date(item.tanggal_surat).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
