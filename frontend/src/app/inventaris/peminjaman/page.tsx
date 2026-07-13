"use client";

import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

export default function KelolaPeminjaman() {
  const [peminjaman, setPeminjaman] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const fetchPeminjaman = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventaris/peminjaman`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPeminjaman(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchPeminjaman();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi',
      text: `Apakah Anda yakin ingin mengubah status menjadi ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: status === 'Ditolak' ? '#ef4444' : '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, ubah!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventaris/peminjaman/${id}/status`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      if (res.ok) {
        fetchPeminjaman();
        Swal.fire({
          title: 'Sukses!',
          text: `Status berhasil diubah menjadi ${status}`,
          icon: 'success',
          confirmButtonColor: '#3b82f6'
        });
      } else {
        Swal.fire("Akses Ditolak", data.error || "Gagal mengupdate status. Pastikan Anda memiliki akses (Ketua Inventaris).", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error!", "Gagal menghubungi server", "error");
    }
  };

  // Check if current user is Ketua Inventaris or Admin
  const isKetua = user && (user.role === 'admin' || (user.jabatan && user.jabatan.includes('Ketua Inventaris')) || (user.jabatan && user.jabatan.includes('Ketua Umum')));

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
          Kelola Peminjaman
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Daftar pengajuan peminjaman barang oleh anggota.
          {!isKetua && " (Aksi persetujuan hanya dapat dilakukan oleh Ketua Inventaris)"}
        </p>
      </div>

      <div className="surface-card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Peminjam</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Barang</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Jumlah</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Alasan</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Tgl Pinjam</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Tgl Kembali</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Status</th>
                {isKetua && (
                  <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {peminjaman.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.01)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "16px", fontWeight: "500", color: "var(--text-main)" }}>{item.nama_peminjam}</td>
                  <td style={{ padding: "16px", color: "var(--primary)" }}>{item.nama_barang}</td>
                  <td style={{ padding: "16px", textAlign: "center", fontWeight: "600" }}>{item.jumlah_pinjam}</td>
                  <td style={{ padding: "16px", color: "var(--text-muted)", maxWidth: "200px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.alasan}>
                      {item.alasan || "-"}
                    </div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>{new Date(item.tanggal_pinjam).toLocaleDateString("id-ID")}</td>
                  <td style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>{new Date(item.tanggal_kembali).toLocaleDateString("id-ID")}</td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600",
                      backgroundColor: item.status === 'Pending' ? 'rgba(245,158,11,0.1)' : item.status === 'Disetujui' ? 'rgba(16,185,129,0.1)' : item.status === 'Ditolak' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                      color: item.status === 'Pending' ? '#f59e0b' : item.status === 'Disetujui' ? '#10b981' : item.status === 'Ditolak' ? '#ef4444' : '#3b82f6'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  {isKetua && (
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                        {item.status === 'Pending' && (
                          <>
                            <button onClick={() => handleUpdateStatus(item.id, 'Disetujui')} title="Setujui" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => handleUpdateStatus(item.id, 'Ditolak')} title="Tolak" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {item.status === 'Disetujui' && (
                          <button onClick={() => handleUpdateStatus(item.id, 'Dikembalikan')} title="Tandai Dikembalikan" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <RefreshCw size={16} />
                          </button>
                        )}
                        {(item.status === 'Ditolak' || item.status === 'Dikembalikan') && (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Selesai</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {peminjaman.length === 0 && (
                <tr>
                  <td colSpan={isKetua ? 8 : 7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    <ClipboardList size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
                    <p>Belum ada data peminjaman.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
