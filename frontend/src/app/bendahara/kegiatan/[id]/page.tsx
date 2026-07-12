"use client";

import { useEffect, useState, use } from "react";
import Swal from "sweetalert2";
import { ArrowLeft, PlusCircle, MinusCircle, FileText, Trash2, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DetailKegiatan({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: "pengeluaran",
    nominal: "",
    keterangan: ""
  });
  const [fileBukti, setFileBukti] = useState<File | null>(null);

  const fetchDetail = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/kegiatan/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
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
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    const submitData = new FormData();
    submitData.append("tanggal", formData.tanggal);
    submitData.append("jenis", formData.jenis);
    submitData.append("nominal", formData.nominal);
    submitData.append("keterangan", formData.keterangan);
    if (fileBukti) {
      submitData.append("bukti", fileBukti);
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/kegiatan/${id}/transaksi`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`
        },
        body: submitData
      });
      
      const result = await res.json();
      
      if (res.ok) {
        Swal.fire('Berhasil', result.message, 'success');
        setIsModalOpen(false);
        setFormData({ tanggal: new Date().toISOString().split('T')[0], jenis: "pengeluaran", nominal: "", keterangan: "" });
        setFileBukti(null);
        fetchDetail();
      } else {
        Swal.fire('Error', result.message || 'Gagal menambahkan transaksi', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
    }
  };

  const handleDelete = (trxId: number) => {
    Swal.fire({
      title: 'Hapus Transaksi?',
      text: "Data dan bukti transaksi akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, hapus!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/transaksi/${trxId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            Swal.fire('Terhapus!', 'Transaksi berhasil dihapus.', 'success');
            fetchDetail();
          }
        } catch (error) {
          Swal.fire('Error', 'Gagal menghapus', 'error');
        }
      }
    });
  };

  const handleDeleteKegiatan = () => {
    Swal.fire({
      title: 'Hapus Kegiatan ini?',
      text: "Seluruh data transaksi dan bukti di dalam kegiatan ini akan terhapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, hapus semua!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/kegiatan/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            Swal.fire('Terhapus!', 'Kegiatan berhasil dihapus.', 'success');
            router.push("/bendahara/kegiatan");
          } else {
            Swal.fire('Error', 'Gagal menghapus kegiatan', 'error');
          }
        } catch (error) {
          Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
        }
      }
    });
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
  if (!data) return <div style={{ padding: "20px" }}>Kegiatan tidak ditemukan</div>;

  return (
    <>
      <div className="fade-in">
        <Link href="/bendahara/kegiatan" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "20px", fontWeight: "500" }}>
        <ArrowLeft size={18} /> Kembali ke Daftar Kegiatan
      </Link>

      <div className="surface-card" style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "1.5rem", color: "var(--text-main)", margin: 0 }}>{data.nama_kegiatan}</h1>
            <button 
              onClick={handleDeleteKegiatan}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: "600" }}
              title="Hapus Kegiatan"
            >
              <Trash2 size={16} /> Hapus Kegiatan
            </button>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "600px" }}>{data.deskripsi || "Tidak ada deskripsi"}</p>
        </div>
        
        <div style={{ textAlign: "right", padding: "16px", background: "rgba(79, 172, 254, 0.05)", borderRadius: "12px", border: "1px solid rgba(79, 172, 254, 0.2)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Saldo Saat Ini</p>
          <h2 style={{ color: "var(--primary)", fontSize: "2rem", margin: 0 }}>Rp {Number(data.saldo_akhir).toLocaleString("id-ID")}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>
            Saldo Awal: Rp {Number(data.saldo_awal).toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="surface-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ fontSize: "1.2rem" }}>Riwayat Transaksi</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => { setFormData({...formData, jenis: "pemasukan"}); setIsModalOpen(true); }}
              style={{ padding: "8px 16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <PlusCircle size={18} /> Pemasukan
            </button>
            <button 
              onClick={() => { setFormData({...formData, jenis: "pengeluaran"}); setIsModalOpen(true); }}
              style={{ padding: "8px 16px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <MinusCircle size={18} /> Pengeluaran
            </button>
          </div>
        </div>

        {data.transaksi && data.transaksi.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-color)", textAlign: "left" }}>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Tanggal</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Keterangan</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>Nominal</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>Bukti</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.transaksi.map((trx: any) => (
                  <tr key={trx.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px" }}>{new Date(trx.tanggal).toLocaleDateString("id-ID")}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ 
                          width: "8px", height: "8px", borderRadius: "50%", 
                          backgroundColor: trx.jenis === "pemasukan" ? "#10b981" : "#ef4444" 
                        }}></span>
                        {trx.keterangan}
                      </div>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: trx.jenis === "pemasukan" ? "#10b981" : "#ef4444", fontWeight: "600" }}>
                      {trx.jenis === "pemasukan" ? "+" : "-"} Rp {Number(trx.nominal).toLocaleString("id-ID")}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      {trx.bukti_url ? (
                        <a href={`${process.env.NEXT_PUBLIC_API_URL}${trx.bukti_url}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <FileText size={16} /> Lihat
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button 
                        onClick={() => handleDelete(trx.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: "10px" }} />
            <p>Belum ada transaksi untuk kegiatan ini.</p>
          </div>
        )}
      </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "20px", fontSize: "1.2rem", color: "var(--text-main)" }}>
              Catat {formData.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Tanggal</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.tanggal}
                  onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="form-label">Nominal (Rp)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formData.nominal}
                  onChange={(e) => setFormData({...formData, nominal: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="form-label">Keterangan / Rincian</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: Beli snack rapat"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="form-label">Bukti (Opsional)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ 
                    padding: "10px 16px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border)", 
                    borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" 
                  }}>
                    <Download size={16} /> Pilih File
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={(e) => setFileBukti(e.target.files ? e.target.files[0] : null)}
                      style={{ display: "none" }}
                    />
                  </label>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {fileBukti ? fileBukti.name : "Tidak ada file"}
                  </span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: formData.jenis === 'pemasukan' ? "#10b981" : "#ef4444", color: "white" }}>
                  Simpan Transaksi
                </button>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: "#94a3b8", color: "white" }} onClick={() => setIsModalOpen(false)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
