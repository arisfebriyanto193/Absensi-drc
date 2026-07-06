"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Eye, X, Image as ImageIcon } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminAbsensi() {
  const [absensi, setAbsensi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAbsen, setSelectedAbsen] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAbsensi = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/absensi`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) setAbsensi(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAbsensi();
  }, []);

  const handleKonfirmasi = async (id: number, status: string) => {
    const { value: keterangan } = await Swal.fire({
      title: 'Keterangan Admin',
      input: 'text',
      inputLabel: 'Opsional',
      inputPlaceholder: 'Masukkan catatan tambahan...',
      showCancelButton: true,
      confirmButtonText: 'Kirim Konfirmasi',
      cancelButtonText: 'Batal',
      confirmButtonColor: 'var(--primary)'
    });
    
    if (keterangan === undefined) return;

    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/absensi/konfirmasi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id, status, keterangan_admin: keterangan || "" })
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: `Absensi berhasil di-${status}`, confirmButtonColor: 'var(--primary)' });
        setIsModalOpen(false);
        fetchAbsensi();
      } else {
        const err = await res.json();
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || "Gagal konfirmasi", confirmButtonColor: 'var(--primary)' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan', confirmButtonColor: 'var(--primary)' });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="fade-in">
      <div className="surface-card">
        <h2 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "var(--text-main)", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
          Konfirmasi Absensi
        </h2>

        {absensi.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.02)", textAlign: "left" }}>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Nama</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Waktu Absen</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Lokasi</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Catatan</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {absensi.map((absen: any) => (
                  <tr key={absen.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontWeight: "500" }}>{absen.nama_lengkap}</td>
                    <td style={{ padding: "12px" }}>{new Date(absen.jam_absen).toLocaleString("id-ID")}</td>
                    <td style={{ padding: "12px" }}>{absen.lokasi}</td>
                    <td style={{ padding: "12px" }}>{absen.catatan || "-"}</td>
                    <td style={{ padding: "12px", display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button 
                        onClick={() => { setSelectedAbsen(absen); setIsModalOpen(true); }}
                        style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--primary)", backgroundColor: "rgba(79, 172, 254, 0.1)", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: "500" }}>
                        <Eye size={16} /> Detail
                      </button>
                      <button 
                        onClick={() => handleKonfirmasi(absen.id, "approved")}
                        style={{ padding: "6px 12px", borderRadius: "8px", border: "none", backgroundColor: "#10b981", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle size={16} /> Setujui
                      </button>
                      <button 
                        onClick={() => handleKonfirmasi(absen.id, "rejected")}
                        style={{ padding: "6px 12px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <XCircle size={16} /> Tolak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            Tidak ada absensi yang menunggu konfirmasi.
          </div>
        )}
      </div>
      </div>

      {isModalOpen && selectedAbsen && typeof document !== 'undefined' && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="fade-in" style={{ background: "white", width: "100%", maxWidth: "700px", borderRadius: "20px", padding: "32px", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", zIndex: 10 }} onMouseOver={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }} onMouseOut={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", marginBottom: "24px", paddingRight: "40px" }}>
              Detail Absensi
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>Nama Lengkap</p>
                <p style={{ fontWeight: "600", color: "#0f172a" }}>{selectedAbsen.nama_lengkap}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>Waktu Absen</p>
                <p style={{ fontWeight: "600", color: "#0f172a" }}>{new Date(selectedAbsen.jam_absen).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>Lokasi</p>
                <p style={{ fontWeight: "600", color: "#0f172a" }}>{selectedAbsen.lokasi}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>Catatan</p>
                <p style={{ fontWeight: "600", color: "#0f172a" }}>{selectedAbsen.catatan || "-"}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
              <div>
                <p style={{ fontWeight: "600", marginBottom: "12px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ImageIcon size={18} color="var(--primary)" /> Foto Sebelum
                </p>
                {selectedAbsen.foto_before ? (
                  <a href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${selectedAbsen.foto_before}`} target="_blank" rel="noopener noreferrer">
                    <img src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${selectedAbsen.foto_before}`} alt="Before" style={{ width: "100%", height: "250px", objectFit: "cover", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                  </a>
                ) : (
                  <div style={{ width: "100%", height: "250px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Tidak ada foto</div>
                )}
              </div>
              <div>
                <p style={{ fontWeight: "600", marginBottom: "12px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ImageIcon size={18} color="#10b981" /> Foto Sesudah
                </p>
                {selectedAbsen.foto_after ? (
                  <a href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${selectedAbsen.foto_after}`} target="_blank" rel="noopener noreferrer">
                    <img src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${selectedAbsen.foto_after}`} alt="After" style={{ width: "100%", height: "250px", objectFit: "cover", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                  </a>
                ) : (
                  <div style={{ width: "100%", height: "250px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Tidak ada foto</div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => handleKonfirmasi(selectedAbsen.id, "approved")} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#10b981", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "600", fontSize: "1rem" }}>
                <CheckCircle size={20} /> Setujui Absensi
              </button>
              <button onClick={() => handleKonfirmasi(selectedAbsen.id, "rejected")} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "600", fontSize: "1rem" }}>
                <XCircle size={20} /> Tolak Absensi
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}
