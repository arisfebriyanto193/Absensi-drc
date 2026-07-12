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
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
          Dashboard Sekretaris
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Pantau dan kelola pembuatan surat-menyurat DRC.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        <div className="surface-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "24px", borderLeft: "4px solid var(--primary)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(79, 172, 254, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
            <FileText size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Total Surat Dibuat</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-main)" }}>{riwayat.length}</p>
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
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>No. Surat</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Jenis Template</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Tujuan</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.slice(0, 5).map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.01)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "12px", fontWeight: "500", color: "var(--primary)" }}>{item.no_surat}</td>
                    <td style={{ padding: "12px" }}>{item.nama_template}</td>
                    <td style={{ padding: "12px", color: "var(--text-muted)" }}>{item.tujuan_surat || "-"}</td>
                    <td style={{ padding: "12px" }}>{new Date(item.tanggal_surat).toLocaleDateString("id-ID")}</td>
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
