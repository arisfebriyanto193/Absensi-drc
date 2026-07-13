"use client";

import { useEffect, useState, useRef } from "react";
import { Package, Plus, Edit2, Trash2, X, Image as ImageIcon } from "lucide-react";
import Swal from "sweetalert2";

export default function KelolaBarang() {
  const [barang, setBarang] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  
  // Form state
  const [namaBarang, setNamaBarang] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [tanggalPengecekan, setTanggalPengecekan] = useState("");
  const [kondisi, setKondisi] = useState("Baik");
  const [jumlah, setJumlah] = useState(1);
  const [foto, setFoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBarang = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventaris/barang`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBarang(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchBarang();
  }, []);

  const resetForm = () => {
    setNamaBarang("");
    setLokasi("");
    setTanggalPengecekan("");
    setKondisi("Baik");
    setJumlah(1);
    setFoto(null);
    setEditItem(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenModal = (item?: any) => {
    resetForm();
    if (item) {
      setEditItem(item);
      setNamaBarang(item.nama_barang);
      setLokasi(item.lokasi || "");
      if (item.tanggal_pengecekan) {
        setTanggalPengecekan(new Date(item.tanggal_pengecekan).toISOString().split('T')[0]);
      }
      setKondisi(item.kondisi);
      setJumlah(item.jumlah);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    const formData = new FormData();
    formData.append("nama_barang", namaBarang);
    formData.append("lokasi", lokasi);
    formData.append("tanggal_pengecekan", tanggalPengecekan);
    formData.append("kondisi", kondisi);
    formData.append("jumlah", jumlah.toString());
    if (foto) {
      formData.append("foto", foto);
    }

    const url = editItem 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/inventaris/barang/${editItem.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/inventaris/barang`;
      
    const method = editItem ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
          // Don't set Content-Type for FormData
        },
        body: formData
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchBarang();
        Swal.fire({
          title: "Sukses!",
          text: "Data barang berhasil disimpan",
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
      } else {
        const data = await res.json();
        Swal.fire("Error!", data.error || "Terjadi kesalahan", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error!", "Gagal menyimpan data", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Barang ini akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventaris/barang/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchBarang();
        Swal.fire({
          title: 'Terhapus!',
          text: 'Data barang telah dihapus.',
          icon: 'success',
          confirmButtonColor: '#3b82f6'
        });
      } else {
        Swal.fire("Error!", "Gagal menghapus data", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error!", "Gagal menghubungi server", "error");
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
            Kelola Barang
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Daftar inventaris barang milik DRC.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(79, 172, 254, 0.3)" }}>
          <Plus size={20} /> Tambah Barang
        </button>
      </div>

      <div className="surface-card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Foto</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Nama Barang</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Lokasi</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Kondisi</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Jumlah</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Tgl Cek</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {barang.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.01)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "16px" }}>
                    {item.foto ? (
                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f3f4f6" }}>
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}${item.foto}`} alt={item.nama_barang} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px", fontWeight: "500", color: "var(--text-main)" }}>{item.nama_barang}</td>
                  <td style={{ padding: "16px", color: "var(--text-muted)" }}>{item.lokasi || "-"}</td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600",
                      backgroundColor: item.kondisi === 'Baik' ? 'rgba(16,185,129,0.1)' : item.kondisi === 'Rusak Ringan' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: item.kondisi === 'Baik' ? '#10b981' : item.kondisi === 'Rusak Ringan' ? '#f59e0b' : '#ef4444'
                    }}>
                      {item.kondisi}
                    </span>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center", fontWeight: "600" }}>{item.jumlah}</td>
                  <td style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>{item.tanggal_pengecekan ? new Date(item.tanggal_pengecekan).toLocaleDateString("id-ID") : "-"}</td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                      <button onClick={() => handleOpenModal(item)} style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {barang.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    <Package size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
                    <p>Belum ada data barang.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="surface-card" style={{ width: "100%", maxWidth: "500px", padding: "0", animation: "slideIn 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>{editItem ? 'Edit Barang' : 'Tambah Barang'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Nama Barang <span style={{ color: "red" }}>*</span></label>
                <input 
                  type="text" 
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                  placeholder="Contoh: Kamera DSLR, Obeng, dll"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Jumlah <span style={{ color: "red" }}>*</span></label>
                  <input 
                    type="number" 
                    value={jumlah}
                    onChange={(e) => setJumlah(Number(e.target.value))}
                    required
                    min="1"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Kondisi</label>
                  <select 
                    value={kondisi}
                    onChange={(e) => setKondisi(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Lokasi Penyimpanan</label>
                <input 
                  type="text" 
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                  placeholder="Contoh: Lemari A, Ruang DRC"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Tanggal Pengecekan Terakhir</label>
                <input 
                  type="date" 
                  value={tanggalPengecekan}
                  onChange={(e) => setTanggalPengecekan(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", colorScheme: "var(--color-scheme)" }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Foto Barang {editItem && '(Opsional)'}</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFoto(e.target.files[0]);
                    }
                  }}
                  ref={fileInputRef}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px dashed var(--border)" }}
                />
                {editItem && editItem.foto && !foto && (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Biarkan kosong jika tidak ingin mengubah foto saat ini.</p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-main)", fontWeight: "600", cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
