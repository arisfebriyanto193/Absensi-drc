"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function BendaharaKegiatan() {
  const [kegiatan, setKegiatan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_kegiatan: "",
    deskripsi: "",
    saldo_awal: 0
  });

  const fetchKegiatan = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/kegiatan`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setKegiatan(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/kegiatan`, {
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
        setFormData({ nama_kegiatan: "", deskripsi: "", saldo_awal: 0 });
        fetchKegiatan();
      } else {
        Swal.fire('Error', data.message || 'Gagal menambahkan kegiatan', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
    }
  };

  return (
    <>
      <div className="fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.2rem", color: "var(--text-main)" }}>Daftar Kegiatan</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: "8px 16px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
        >
          + Tambah Kegiatan
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {kegiatan.map(k => (
            <Link 
              key={k.id} 
              href={`/bendahara/kegiatan/${k.id}`} 
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div className="surface-card hover-lift" style={{ cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "var(--primary)" }}>{k.nama_kegiatan}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px", flex: 1 }}>
                  {k.deskripsi?.length > 100 ? k.deskripsi.substring(0, 100) + '...' : k.deskripsi}
                </p>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Saldo Awal:</span>
                  <strong style={{ color: "var(--text-main)" }}>Rp {Number(k.saldo_awal).toLocaleString("id-ID")}</strong>
                </div>
              </div>
            </Link>
          ))}
          {kegiatan.length === 0 && (
            <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              Belum ada kegiatan. Silakan tambah kegiatan baru.
            </p>
          )}
        </div>
      )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "20px", fontSize: "1.2rem", color: "var(--text-main)" }}>Tambah Kegiatan Baru</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Nama Kegiatan</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.nama_kegiatan}
                  onChange={(e) => setFormData({...formData, nama_kegiatan: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="form-label">Deskripsi</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: "80px", resize: "vertical" }}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="form-label">Saldo Awal (Rp)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formData.saldo_awal}
                  onChange={(e) => setFormData({...formData, saldo_awal: Number(e.target.value)})}
                />
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
