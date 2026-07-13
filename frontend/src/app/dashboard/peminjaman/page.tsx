"use client";

import { useEffect, useState } from "react";
import { Package, Plus, ClipboardList, X } from "lucide-react";
import Swal from "sweetalert2";

export default function PeminjamanUser() {
  const [barang, setBarang] = useState<any[]>([]);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<any>(null);
  
  // Form State
  const [jumlahPinjam, setJumlahPinjam] = useState(1);
  const [alasan, setAlasan] = useState("");
  const [tanggalPinjam, setTanggalPinjam] = useState("");
  const [tanggalKembali, setTanggalKembali] = useState("");

  const fetchData = () => {
    const token = localStorage.getItem("token");
    
    // Fetch katalog barang
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/barang`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBarang(data);
      })
      .catch(err => console.error(err));

    // Fetch riwayat
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/riwayat`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRiwayat(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item: any) => {
    setSelectedBarang(item);
    setJumlahPinjam(1);
    setAlasan("");
    setTanggalPinjam(new Date().toISOString().split('T')[0]);
    // Default kembalikan besok
    const besok = new Date();
    besok.setDate(besok.getDate() + 1);
    setTanggalKembali(besok.toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarang) return;

    if (jumlahPinjam > selectedBarang.jumlah) {
      return Swal.fire("Perhatian!", "Jumlah pinjam melebihi stok yang tersedia", "warning");
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/request`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          barang_id: selectedBarang.id,
          jumlah_pinjam: jumlahPinjam,
          alasan,
          tanggal_pinjam: tanggalPinjam,
          tanggal_kembali: tanggalKembali
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        Swal.fire({
          title: "Berhasil!",
          text: "Pengajuan peminjaman berhasil dibuat, menunggu persetujuan.",
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
      } else {
        Swal.fire("Gagal!", data.error || "Gagal mengajukan peminjaman", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error!", "Gagal menghubungi server", "error");
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
          Peminjaman Barang
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Ajukan peminjaman inventaris DRC dan lihat riwayat peminjaman Anda.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Katalog Barang */}
        <div className="surface-card">
          <div style={{ marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
            <h2 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Package size={20} color="var(--primary)" /> Katalog Inventaris
            </h2>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
            {barang.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Tidak ada barang tersedia.</p>
            ) : (
              barang.map(item => (
                <div key={item.id} style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-color)" }}>
                  <div style={{ height: "120px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "8px", marginBottom: "12px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.foto ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL}${item.foto}`} alt={item.nama_barang} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Package size={40} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                    )}
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "4px" }}>{item.nama_barang}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span>Tersedia: {item.jumlah}</span>
                    <span>{item.kondisi}</span>
                  </p>
                  <button 
                    onClick={() => handleOpenModal(item)}
                    disabled={item.jumlah < 1 || item.kondisi === 'Rusak Berat'}
                    style={{ 
                      marginTop: "auto", width: "100%", padding: "8px", borderRadius: "8px", 
                      backgroundColor: (item.jumlah < 1 || item.kondisi === 'Rusak Berat') ? "var(--border)" : "var(--primary)", 
                      color: (item.jumlah < 1 || item.kondisi === 'Rusak Berat') ? "var(--text-muted)" : "white",
                      border: "none", fontWeight: "600", cursor: (item.jumlah < 1 || item.kondisi === 'Rusak Berat') ? "not-allowed" : "pointer",
                      transition: "opacity 0.2s"
                    }}
                  >
                    Pinjam
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Riwayat Peminjaman */}
        <div className="surface-card">
          <div style={{ marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
            <h2 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <ClipboardList size={20} color="var(--primary)" /> Riwayat Peminjaman Anda
            </h2>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Barang</th>
                  <th style={{ padding: "12px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Jumlah</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Tgl Pinjam - Kembali</th>
                  <th style={{ padding: "12px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontWeight: "500", color: "var(--text-main)" }}>{item.nama_barang}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{item.jumlah_pinjam}</td>
                    <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                      {new Date(item.tanggal_pinjam).toLocaleDateString("id-ID")} - {new Date(item.tanggal_kembali).toLocaleDateString("id-ID")}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600",
                        backgroundColor: item.status === 'Pending' ? 'rgba(245,158,11,0.1)' : item.status === 'Disetujui' ? 'rgba(16,185,129,0.1)' : item.status === 'Ditolak' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                        color: item.status === 'Pending' ? '#f59e0b' : item.status === 'Disetujui' ? '#10b981' : item.status === 'Ditolak' ? '#ef4444' : '#3b82f6'
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {riwayat.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                      <p>Belum ada riwayat peminjaman.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Pengajuan Peminjaman */}
      {isModalOpen && selectedBarang && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="surface-card" style={{ width: "100%", maxWidth: "450px", padding: "0", animation: "slideIn 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Pengajuan Peminjaman</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "rgba(79, 172, 254, 0.05)", borderRadius: "8px", border: "1px solid rgba(79, 172, 254, 0.2)" }}>
                <p style={{ fontWeight: "600", color: "var(--primary)" }}>{selectedBarang.nama_barang}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Sisa stok: {selectedBarang.jumlah}</p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Jumlah Pinjam <span style={{ color: "red" }}>*</span></label>
                <input 
                  type="number" 
                  value={jumlahPinjam}
                  onChange={(e) => setJumlahPinjam(Number(e.target.value))}
                  required
                  min="1"
                  max={selectedBarang.jumlah}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Tgl Pinjam <span style={{ color: "red" }}>*</span></label>
                  <input 
                    type="date" 
                    value={tanggalPinjam}
                    onChange={(e) => setTanggalPinjam(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", colorScheme: "var(--color-scheme)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Tgl Kembali <span style={{ color: "red" }}>*</span></label>
                  <input 
                    type="date" 
                    value={tanggalKembali}
                    onChange={(e) => setTanggalKembali(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", colorScheme: "var(--color-scheme)" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Alasan/Keperluan <span style={{ color: "red" }}>*</span></label>
                <textarea 
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  required
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", resize: "vertical" }}
                  placeholder="Jelaskan untuk kegiatan apa..."
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-main)", fontWeight: "600", cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                  Ajukan Pinjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
