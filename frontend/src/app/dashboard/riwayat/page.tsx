"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { History, ClipboardList, CheckCircle, XCircle, Clock, Filter, Camera, Shield, Calendar as CalendarIcon } from "lucide-react";

export default function UserRiwayat() {
  const [absensi, setAbsensi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterStatus, setFilterStatus] = useState("all");

  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/dashboard', '')}/api/user/riwayat`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setAbsensi(data.absensi || []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredAbsensi = useMemo(() => {
    return absensi.filter(a => {
      const isBulanMatch = new Date(a.tanggal).toISOString().slice(0, 7) === filterBulan;
      const isStatusMatch = filterStatus === "all" || a.status_konfirmasi === filterStatus;
      return isBulanMatch && isStatusMatch;
    });
  }, [absensi, filterBulan, filterStatus]);

  const stats = useMemo(() => {
    const currentMonthAbsen = absensi.filter(a => new Date(a.tanggal).toISOString().slice(0, 7) === filterBulan);
    return {
      total: currentMonthAbsen.length,
      approved: currentMonthAbsen.filter(a => a.status_konfirmasi === 'approved').length,
      rejected: currentMonthAbsen.filter(a => a.status_konfirmasi === 'rejected').length,
      pending: currentMonthAbsen.filter(a => a.status_konfirmasi === 'pending').length,
    };
  }, [absensi, filterBulan]);

  const imageBaseUrl = "http://localhost:5000/uploads"; // Fallback if API URL parsing is needed, assuming static folder is configured on port 5000 in backend
  // Actually, the PHP version uploaded to `absen.dinusrobotic.org/uploads`. Since we are using Next.js/Express, we need to know the static file route.
  // We'll use NEXT_PUBLIC_API_URL and strip /api. 
  // e.g. http://localhost:5000/api -> http://localhost:5000/uploads
  const staticUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') + '/uploads';

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat riwayat...</div>;

  return (
    <div className="fade-in max-w-6xl mx-auto pb-10">
      <div className="surface-card mb-6 p-6" style={{ background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "white" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
          <History size={28} />
          Riwayat Absensi
        </h1>
        <p style={{ opacity: 0.9 }}>Semua riwayat absensi piket Anda</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="surface-card p-5" style={{ borderLeft: "4px solid #3b82f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "4px" }}>Total Absensi</p>
            <p style={{ fontSize: "1.8rem", fontWeight: "700", color: "#3b82f6" }}>{stats.total}</p>
          </div>
          <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
            <ClipboardList size={28} />
          </div>
        </div>

        <div className="surface-card p-5" style={{ borderLeft: "4px solid #10b981", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "4px" }}>Disetujui</p>
            <p style={{ fontSize: "1.8rem", fontWeight: "700", color: "#10b981" }}>{stats.approved}</p>
          </div>
          <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <CheckCircle size={28} />
          </div>
        </div>

        <div className="surface-card p-5" style={{ borderLeft: "4px solid #ef4444", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "4px" }}>Ditolak</p>
            <p style={{ fontSize: "1.8rem", fontWeight: "700", color: "#ef4444" }}>{stats.rejected}</p>
          </div>
          <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
            <XCircle size={28} />
          </div>
        </div>

        <div className="surface-card p-5" style={{ borderLeft: "4px solid #f59e0b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "4px" }}>Pending</p>
            <p style={{ fontSize: "1.8rem", fontWeight: "700", color: "#f59e0b" }}>{stats.pending}</p>
          </div>
          <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
            <Clock size={28} />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="surface-card mb-6">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
          <Filter size={20} color="var(--primary)" />
          <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Filter Riwayat</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)", fontSize: "0.9rem" }}>Bulan</label>
            <input 
              type="month" 
              value={filterBulan} 
              onChange={(e) => setFilterBulan(e.target.value)} 
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)", fontSize: "0.9rem" }}>Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="surface-card">
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
          Daftar Riwayat ({filteredAbsensi.length})
        </h2>

        {filteredAbsensi.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <History size={48} style={{ margin: "0 auto 16px", color: "var(--text-muted)", opacity: 0.5 }} />
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: "500" }}>Tidak ada riwayat absensi pada periode ini.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredAbsensi.map((absen: any) => (
              <div key={absen.id} style={{ border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", backgroundColor: "var(--bg-color)", transition: "box-shadow 0.2s" }} className="hover-lift">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CalendarIcon size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>
                        {new Date(absen.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{absen.lokasi}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={14} /> Jadwal: {absen.jam_mulai} - {absen.jam_selesai}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--primary)" }}>
                          <CheckCircle size={14} /> Absen: {new Date(absen.jam_absen).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <span style={{ 
                    padding: "6px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px",
                    backgroundColor: absen.status_konfirmasi === 'approved' ? "#d1fae5" : absen.status_konfirmasi === 'rejected' ? "#fee2e2" : "#fef3c7",
                    color: absen.status_konfirmasi === 'approved' ? "#065f46" : absen.status_konfirmasi === 'rejected' ? "#991b1b" : "#92400e"
                  }}>
                    {absen.status_konfirmasi === 'approved' && <CheckCircle size={14} />}
                    {absen.status_konfirmasi === 'rejected' && <XCircle size={14} />}
                    {absen.status_konfirmasi === 'pending' && <Clock size={14} />}
                    {absen.status_konfirmasi.toUpperCase()}
                  </span>
                </div>

                {/* Photos */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Camera size={14} /> Foto Before
                    </p>
                    <img 
                      src={`${staticUrl}/${absen.foto_before}`} 
                      alt="Before" 
                      style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px", border: "1px solid var(--border)", cursor: "pointer" }}
                      onClick={() => setModalImage(`${staticUrl}/${absen.foto_before}`)}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Camera size={14} /> Foto After
                    </p>
                    <img 
                      src={`${staticUrl}/${absen.foto_after}`} 
                      alt="After" 
                      style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px", border: "1px solid var(--border)", cursor: "pointer" }}
                      onClick={() => setModalImage(`${staticUrl}/${absen.foto_after}`)}
                    />
                  </div>
                </div>

                {/* Notes */}
                {absen.catatan && (
                  <div style={{ backgroundColor: "rgba(0,0,0,0.03)", padding: "12px 16px", borderRadius: "12px", marginBottom: "12px" }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" }}>Catatan:</p>
                    <p style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>{absen.catatan}</p>
                  </div>
                )}

                {/* Admin Note */}
                {absen.keterangan_admin && (
                  <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", borderLeft: "4px solid #3b82f6", padding: "12px 16px", borderRadius: "4px 12px 12px 4px" }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1d4ed8", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Shield size={14} /> Keterangan Admin:
                    </p>
                    <p style={{ fontSize: "0.95rem", color: "#1e3a8a" }}>{absen.keterangan_admin}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {modalImage && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setModalImage(null)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <img src={modalImage} alt="Fullscreen" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: "8px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} />
        </div>, document.body
      )}
    </div>
  );
}


