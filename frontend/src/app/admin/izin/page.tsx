"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Eye, X, Image as ImageIcon } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminIzin() {
  const [izinList, setIzinList] = useState<any[]>([]);
  const [riwayatList, setRiwayatList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIzin, setSelectedIzin] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchIzin = () => {
    const token = localStorage.getItem("token");
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/izin`, { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/izin/riwayat`, { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json())
    ])
    .then(([pendingData, riwayatData]) => { 
      if (Array.isArray(pendingData)) setIzinList(pendingData);
      if (Array.isArray(riwayatData)) setRiwayatList(riwayatData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchIzin();
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/izin/konfirmasi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id, status, keterangan_admin: keterangan || "" })
      });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'Berhasil', text: `Izin berhasil di-${status}`, confirmButtonColor: 'var(--primary)' });
          setIsModalOpen(false);
          fetchIzin();
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
          Konfirmasi Izin
        </h2>

        {izinList.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.02)", textAlign: "left" }}>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Nama</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Waktu Pengajuan</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Jadwal</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Alasan</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {izinList.map((izin: any) => (
                  <tr key={izin.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontWeight: "500" }}>{izin.nama_lengkap}</td>
                    <td style={{ padding: "12px" }}>{new Date(izin.created_at).toLocaleString("id-ID")}</td>
                    <td style={{ padding: "12px" }}>{new Date(izin.tanggal).toLocaleDateString("id-ID")} - {izin.lokasi}</td>
                    <td style={{ padding: "12px" }}>{izin.alasan || "-"}</td>
                    <td style={{ padding: "12px", display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button 
                        onClick={() => { setSelectedIzin(izin); setIsModalOpen(true); }}
                        style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--primary)", backgroundColor: "rgba(79, 172, 254, 0.1)", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: "500" }}>
                        <Eye size={16} /> Detail
                      </button>
                      <button 
                        onClick={() => handleKonfirmasi(izin.id, "approved")}
                        style={{ padding: "6px 12px", borderRadius: "8px", border: "none", backgroundColor: "#10b981", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle size={16} /> Setujui
                      </button>
                      <button 
                        onClick={() => handleKonfirmasi(izin.id, "rejected")}
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
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #e2e8f0" }}>
            Tidak ada permohonan izin yang menunggu konfirmasi.
          </div>
        )}
      </div>

      <div className="surface-card" style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "var(--text-main)", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
          Riwayat Izin
        </h2>

        {riwayatList.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.02)", textAlign: "left" }}>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Nama</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Waktu Pengajuan</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Jadwal</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Status</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {riwayatList.map((izin: any) => {
                  let statusText = "Menunggu";
                  let statusColor = "#64748b";
                  let bgStatus = "#f1f5f9";
                  let Icon = CheckCircle;

                  if (izin.status === "approved") {
                    statusText = "Disetujui";
                    statusColor = "#10b981";
                    bgStatus = "#ecfdf5";
                  } else if (izin.status === "rejected") {
                    statusText = "Ditolak";
                    statusColor = "#ef4444";
                    bgStatus = "#fef2f2";
                    Icon = XCircle;
                  }

                  return (
                    <tr key={izin.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{izin.nama_lengkap}</td>
                      <td style={{ padding: "12px" }}>{new Date(izin.created_at).toLocaleString("id-ID")}</td>
                      <td style={{ padding: "12px" }}>{new Date(izin.tanggal).toLocaleDateString("id-ID")}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ 
                          display: "inline-flex", alignItems: "center", gap: "6px", 
                          padding: "6px 12px", borderRadius: "20px", 
                          background: bgStatus, color: statusColor, fontSize: "0.85rem", fontWeight: "600"
                        }}>
                          <Icon size={14} /> {statusText}
                        </span>
                      </td>
                      <td style={{ padding: "12px", display: "flex", justifyContent: "center" }}>
                        <button 
                          onClick={() => { setSelectedIzin(izin); setIsModalOpen(true); }}
                          style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--primary)", backgroundColor: "rgba(79, 172, 254, 0.1)", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: "500" }}>
                          <Eye size={16} /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #e2e8f0" }}>
            Belum ada riwayat permohonan izin.
          </div>
        )}
      </div>
    </div>

      {isModalOpen && selectedIzin && typeof document !== 'undefined' && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="fade-in" style={{ background: "white", width: "100%", maxWidth: "600px", borderRadius: "20px", padding: "32px", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", zIndex: 10 }} onMouseOver={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }} onMouseOut={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", marginBottom: "24px", paddingRight: "40px" }}>
              Detail Pengajuan Izin
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>Nama Lengkap</p>
                <p style={{ fontWeight: "600", color: "#0f172a" }}>{selectedIzin.nama_lengkap}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>Waktu Pengajuan</p>
                <p style={{ fontWeight: "600", color: "#0f172a" }}>{new Date(selectedIzin.created_at).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>Jadwal Piket</p>
                <p style={{ fontWeight: "600", color: "#0f172a" }}>{new Date(selectedIzin.tanggal).toLocaleDateString("id-ID")} - {selectedIzin.lokasi}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>Alasan</p>
                <p style={{ fontWeight: "600", color: "#0f172a" }}>{selectedIzin.alasan || "-"}</p>
              </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
              <p style={{ fontWeight: "600", marginBottom: "12px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                <ImageIcon size={18} color="var(--primary)" /> File Bukti
              </p>
              {selectedIzin.file_bukti ? (
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${selectedIzin.file_bukti}`} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${selectedIzin.file_bukti}`} 
                    alt="Bukti Izin" 
                    style={{ width: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", padding: "10px" }} 
                    onError={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        const span = document.createElement('div');
                        span.innerHTML = '📝 Lihat File Dokumen (Klik di sini)';
                        span.style.padding = '40px';
                        span.style.textAlign = 'center';
                        span.style.background = '#f1f5f9';
                        span.style.borderRadius = '12px';
                        span.style.color = 'var(--primary)';
                        span.style.fontWeight = '600';
                        target.parentElement.appendChild(span);
                      }
                    }}
                  />
                </a>
              ) : (
                <div style={{ width: "100%", padding: "40px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Tidak ada file bukti</div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              {selectedIzin.status === "pending" ? (
                <>
                  <button onClick={() => handleKonfirmasi(selectedIzin.id, "approved")} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#10b981", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "600", fontSize: "1rem" }}>
                    <CheckCircle size={20} /> Setujui Izin
                  </button>
                  <button onClick={() => handleKonfirmasi(selectedIzin.id, "rejected")} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "600", fontSize: "1rem" }}>
                    <XCircle size={20} /> Tolak Izin
                  </button>
                </>
              ) : (
                <div style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "#f1f5f9", textAlign: "center", fontWeight: "600", color: "#64748b" }}>
                  Izin ini telah {selectedIzin.status === 'approved' ? 'disetujui' : 'ditolak'}
                </div>
              )}
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}
