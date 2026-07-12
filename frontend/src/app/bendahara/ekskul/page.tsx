"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { PlusCircle, Wallet, School, Trash2 } from "lucide-react";

export default function DaftarSekolahEkskul() {
  const [sekolah, setSekolah] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_sekolah: "",
    deskripsi: ""
  });

  const fetchSekolah = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/ekskul`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setSekolah(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchSekolah();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/ekskul`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        Swal.fire('Berhasil', data.message, 'success');
        setIsModalOpen(false);
        setFormData({ nama_sekolah: "", deskripsi: "" });
        fetchSekolah();
      } else {
        Swal.fire('Error', data.message || 'Gagal menambahkan sekolah', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    Swal.fire({
      title: 'Hapus Sekolah?',
      text: "Seluruh riwayat mengajar dan honor di sekolah ini akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, hapus!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/ekskul/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            Swal.fire('Terhapus!', 'Sekolah berhasil dihapus.', 'success');
            fetchSekolah();
          }
        } catch (error) {
          Swal.fire('Error', 'Gagal menghapus', 'error');
        }
      }
    });
  };

  return (
    <>
      <div className="fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.2rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
            <School size={24} color="var(--primary)" /> Ekstrakurikuler Robotic
          </h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ padding: "8px 16px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <PlusCircle size={18} /> Tambah Sekolah
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {sekolah.map(s => (
              <Link 
                key={s.id} 
                href={`/bendahara/ekskul/${s.id}`} 
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <div className="surface-card hover-lift" style={{ cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "var(--primary)", margin: 0 }}>{s.nama_sekolah}</h3>
                    <button 
                      onClick={(e) => handleDelete(e, s.id)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                      title="Hapus Sekolah"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px", flex: 1 }}>
                    {s.deskripsi || "Tidak ada deskripsi"}
                  </p>
                  
                  <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                    <div style={{ flex: 1, backgroundColor: "var(--bg-color)", padding: "10px", borderRadius: "8px" }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Total Pendapatan</p>
                      <p style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-main)" }}>Rp {Number(s.total_pendapatan).toLocaleString("id-ID")}</p>
                    </div>
                    <div style={{ flex: 1, backgroundColor: "rgba(16, 185, 129, 0.05)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
                      <p style={{ fontSize: "0.75rem", color: "#10b981", marginBottom: "4px" }}>Masuk Kas DRC</p>
                      <p style={{ fontSize: "0.95rem", fontWeight: "600", color: "#10b981" }}>Rp {Number(s.total_kas).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", textAlign: "right" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", backgroundColor: "var(--border)", padding: "4px 8px", borderRadius: "12px" }}>
                      {s.total_pertemuan} Kali Pertemuan
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {sekolah.length === 0 && (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Belum ada sekolah terdaftar. Silakan tambah sekolah baru.
              </p>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "20px", fontSize: "1.2rem", color: "var(--text-main)" }}>Tambah Sekolah Mitra</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Nama Sekolah</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: SD Semesta"
                  value={formData.nama_sekolah}
                  onChange={(e) => setFormData({...formData, nama_sekolah: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="form-label">Deskripsi / Alamat</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: "80px", resize: "vertical" }}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                ></textarea>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: "var(--primary)", color: "white" }}>Simpan</button>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: "#94a3b8", color: "white" }} onClick={() => setIsModalOpen(false)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
