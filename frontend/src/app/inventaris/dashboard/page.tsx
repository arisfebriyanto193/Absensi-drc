"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle, Clock, CheckCircle, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

export default function InventarisDashboard() {
  const [stats, setStats] = useState({
    totalBarang: 0,
    rusak: 0,
    pendingRequest: 0,
    dipinjam: 0
  });
  const [peminjaman, setPeminjaman] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // Fetch stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventaris/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data);
      })
      .catch(err => console.error(err));

    // Fetch recent requests
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventaris/peminjaman`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPeminjaman(data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s", display: "flex", flexDirection: "column", gap: "32px" }}>
      
      {/* Hero Banner */}
      <div style={{ 
        width: "100%", 
        padding: "40px", 
        borderRadius: "24px", 
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
        color: "white",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.3)"
      }}>
        {/* Abstract Background Shapes */}
        <div style={{ position: "absolute", top: "-20%", right: "-5%", width: "300px", height: "300px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(40px)" }}></div>
        <div style={{ position: "absolute", bottom: "-20%", left: "10%", width: "200px", height: "200px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(30px)" }}></div>
        
        <div style={{ position: "relative", zIndex: 10 }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "8px", letterSpacing: "-0.02em" }}>
            Dashboard Inventaris
          </h1>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, maxWidth: "600px" }}>
            Pantau ketersediaan stok barang secara real-time dan kelola permintaan peminjaman alat dari anggota DRC dengan mudah.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
        {/* Card 1 */}
        <div className="surface-card" style={{ padding: "24px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "default" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "linear-gradient(135deg, #eff6ff, #dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", boxShadow: "0 4px 6px rgba(59,130,246,0.1)" }}>
              <Package size={26} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", backgroundColor: "#eff6ff", color: "#3b82f6" }}>Total</span>
          </div>
          <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1" }}>{stats.totalBarang}</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "8px", fontWeight: "500" }}>Semua Barang</p>
        </div>
        
        {/* Card 2 */}
        <div className="surface-card" style={{ padding: "24px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "linear-gradient(135deg, #fef2f2, #fee2e2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", boxShadow: "0 4px 6px rgba(239,68,68,0.1)" }}>
              <AlertTriangle size={26} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", backgroundColor: "#fef2f2", color: "#ef4444" }}>Perhatian</span>
          </div>
          <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1" }}>{stats.rusak}</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "8px", fontWeight: "500" }}>Barang Rusak</p>
        </div>

        {/* Card 3 */}
        <div className="surface-card" style={{ padding: "24px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "linear-gradient(135deg, #fffbeb, #fef3c7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", boxShadow: "0 4px 6px rgba(245,158,11,0.1)" }}>
              <Clock size={26} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", backgroundColor: "#fffbeb", color: "#f59e0b" }}>Pending</span>
          </div>
          <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1" }}>{stats.pendingRequest}</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "8px", fontWeight: "500" }}>Request Menunggu</p>
        </div>

        {/* Card 4 */}
        <div className="surface-card" style={{ padding: "24px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", boxShadow: "0 4px 6px rgba(16,185,129,0.1)" }}>
              <CheckCircle size={26} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", backgroundColor: "#ecfdf5", color: "#10b981" }}>Aktif</span>
          </div>
          <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1" }}>{stats.dipinjam}</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "8px", fontWeight: "500" }}>Barang Sedang Dipinjam</p>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="surface-card" style={{ padding: "0", overflow: "hidden", borderRadius: "24px" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(79, 172, 254, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
              <Activity size={20} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)" }}>
              Aktivitas Peminjaman Terbaru
            </h2>
          </div>
          <Link href="/inventaris/peminjaman" style={{ 
            display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", fontWeight: "600", 
            color: "var(--primary)", backgroundColor: "rgba(79, 172, 254, 0.1)", padding: "8px 16px", borderRadius: "20px",
            transition: "all 0.2s"
          }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(79, 172, 254, 0.2)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "rgba(79, 172, 254, 0.1)"}>
            Kelola Semua <ArrowRight size={16} />
          </Link>
        </div>

        {peminjaman.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <Package size={56} style={{ opacity: 0.15, margin: "0 auto 20px", color: "var(--text-main)" }} />
            <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>Belum ada request peminjaman saat ini.</p>
            <p style={{ fontSize: "0.9rem", marginTop: "8px" }}>Request dari anggota akan muncul di sini.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.01)" }}>
                  <th style={{ padding: "16px 32px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>Peminjam</th>
                  <th style={{ padding: "16px 32px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>Barang</th>
                  <th style={{ padding: "16px 32px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>Jumlah</th>
                  <th style={{ padding: "16px 32px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>Tgl Pinjam</th>
                  <th style={{ padding: "16px 32px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {peminjaman.slice(0, 5).map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "20px 32px", fontWeight: "600", color: "var(--text-main)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold" }}>
                          {item.nama_peminjam.charAt(0).toUpperCase()}
                        </div>
                        {item.nama_peminjam}
                      </div>
                    </td>
                    <td style={{ padding: "20px 32px", fontWeight: "500", color: "var(--text-main)" }}>{item.nama_barang}</td>
                    <td style={{ padding: "20px 32px", textAlign: "center", fontWeight: "600" }}>{item.jumlah_pinjam}</td>
                    <td style={{ padding: "20px 32px", textAlign: "center", color: "var(--text-muted)" }}>{new Date(item.tanggal_pinjam).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: "20px 32px", textAlign: "center" }}>
                      <span style={{
                        padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600",
                        backgroundColor: item.status === 'Pending' ? 'rgba(245,158,11,0.1)' : item.status === 'Disetujui' ? 'rgba(16,185,129,0.1)' : item.status === 'Ditolak' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                        color: item.status === 'Pending' ? '#f59e0b' : item.status === 'Disetujui' ? '#10b981' : item.status === 'Ditolak' ? '#ef4444' : '#3b82f6',
                        display: "inline-block"
                      }}>
                        {item.status}
                      </span>
                    </td>
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
