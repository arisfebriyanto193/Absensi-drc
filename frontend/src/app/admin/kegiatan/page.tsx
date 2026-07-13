"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, Edit2, Trash2, X, Users } from "lucide-react";
import Swal from "sweetalert2";
import SearchableSelect from "@/components/SearchableSelect";

export default function AdminKelolaKegiatan() {
  const [kegiatan, setKegiatan] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPanitiaModalOpen, setIsPanitiaModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [selectedKegiatan, setSelectedKegiatan] = useState<any>(null);
  const [panitia, setPanitia] = useState<any[]>([]);
  
  // Form Kegiatan
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [status, setStatus] = useState("Perancangan");

  // Form Panitia
  const [selectedUser, setSelectedUser] = useState("");
  const [peran, setPeran] = useState("Ketua Pelaksana");

  const fetchKegiatan = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kegiatan`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setKegiatan(data);
      })
      .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(err => console.error(err));
  };

  const fetchPanitia = (kegiatanId: number) => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kegiatan/${kegiatanId}/panitia`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPanitia(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchKegiatan();
    fetchUsers();
  }, []);

  const resetForm = () => {
    setNamaKegiatan("");
    setDeskripsi("");
    setTanggalMulai("");
    setTanggalSelesai("");
    setStatus("Perancangan");
    setEditItem(null);
  };

  const handleOpenModal = (item?: any) => {
    resetForm();
    if (item) {
      setEditItem(item);
      setNamaKegiatan(item.nama_kegiatan);
      setDeskripsi(item.deskripsi || "");
      if (item.tanggal_mulai) setTanggalMulai(new Date(item.tanggal_mulai).toISOString().split('T')[0]);
      if (item.tanggal_selesai) setTanggalSelesai(new Date(item.tanggal_selesai).toISOString().split('T')[0]);
      setStatus(item.status);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    const url = editItem 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/kegiatan/${editItem.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/kegiatan`;
      
    const method = editItem ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nama_kegiatan: namaKegiatan,
          deskripsi,
          tanggal_mulai: tanggalMulai || null,
          tanggal_selesai: tanggalSelesai || null,
          status
        })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchKegiatan();
        Swal.fire({
          title: "Sukses!",
          text: `Kegiatan berhasil ${editItem ? 'diupdate' : 'dibuat'}`,
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
      text: "Kegiatan ini beserta data kepanitiaan dan keuangannya akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, hapus!'
    });

    if (!result.isConfirmed) return;
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kegiatan/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchKegiatan();
        Swal.fire("Terhapus!", "Kegiatan telah dihapus.", "success");
      } else {
        Swal.fire("Error!", "Gagal menghapus kegiatan", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error!", "Gagal menghubungi server", "error");
    }
  };

  const handleOpenPanitia = (item: any) => {
    setSelectedKegiatan(item);
    fetchPanitia(item.id);
    setSelectedUser("");
    setPeran("Ketua Pelaksana");
    setIsPanitiaModalOpen(true);
  };

  const handleAddPanitia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return Swal.fire("Error!", "Pilih user terlebih dahulu", "warning");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kegiatan/${selectedKegiatan.id}/panitia`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: selectedUser,
          peran
        })
      });
      
      if (res.ok) {
        fetchPanitia(selectedKegiatan.id);
        setSelectedUser("");
        Swal.fire("Sukses!", "Panitia berhasil ditambahkan", "success");
      } else {
        const data = await res.json();
        Swal.fire("Gagal!", data.error || "Gagal menambahkan panitia", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error!", "Gagal menghubungi server", "error");
    }
  };

  const handleDeletePanitia = async (panitiaId: number) => {
    const result = await Swal.fire({
      title: 'Hapus Panitia?',
      text: "User ini akan dihapus dari kepanitiaan kegiatan ini.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, hapus!'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kegiatan/${selectedKegiatan.id}/panitia/${panitiaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchPanitia(selectedKegiatan.id);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error!", "Gagal menghapus panitia", "error");
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
            Kelola Kegiatan
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Buat kegiatan baru dan tentukan panitia yang bertugas.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(79, 172, 254, 0.3)" }}>
          <Plus size={20} /> Buat Kegiatan Baru
        </button>
      </div>

      <div className="surface-card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Nama Kegiatan</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Tgl Pelaksanaan</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Status</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "2px solid var(--border)" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kegiatan.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.01)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "16px", fontWeight: "600", color: "var(--text-main)" }}>
                    {item.nama_kegiatan}
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px", fontWeight: "normal" }}>
                      {item.deskripsi ? (item.deskripsi.length > 50 ? item.deskripsi.substring(0, 50) + '...' : item.deskripsi) : '-'}
                    </div>
                  </td>
                  <td style={{ padding: "16px", color: "var(--text-muted)" }}>
                    {item.tanggal_mulai ? new Date(item.tanggal_mulai).toLocaleDateString("id-ID") : "-"} 
                    {item.tanggal_selesai ? ` s.d. ${new Date(item.tanggal_selesai).toLocaleDateString("id-ID")}` : ""}
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <span style={{
                      padding: "6px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600",
                      backgroundColor: item.status === 'Selesai' ? 'rgba(16,185,129,0.1)' : item.status === 'Sedang Berlangsung' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                      color: item.status === 'Selesai' ? '#10b981' : item.status === 'Sedang Berlangsung' ? '#3b82f6' : '#f59e0b'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                      <button onClick={() => handleOpenPanitia(item)} title="Kelola Panitia" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "none", padding: "6px 12px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" }}>
                        <Users size={16} /> Panitia
                      </button>
                      <button onClick={() => handleOpenModal(item)} title="Edit" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} title="Hapus" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {kegiatan.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    <Layers size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
                    <p>Belum ada data kegiatan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Kegiatan */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="surface-card" style={{ width: "100%", maxWidth: "500px", padding: "0", animation: "slideIn 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>{editItem ? 'Edit Kegiatan' : 'Buat Kegiatan Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Nama Kegiatan <span style={{ color: "red" }}>*</span></label>
                <input 
                  type="text" 
                  value={namaKegiatan}
                  onChange={(e) => setNamaKegiatan(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                  placeholder="Contoh: Lomba Inovasi Teknologi 2026"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Tgl Mulai</label>
                  <input 
                    type="date" 
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", colorScheme: "var(--color-scheme)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Tgl Selesai</label>
                  <input 
                    type="date" 
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", colorScheme: "var(--color-scheme)" }}
                  />
                </div>
              </div>

              {editItem && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                  >
                    <option value="Perancangan">Perancangan</option>
                    <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Deskripsi / Keterangan Singkat</label>
                <textarea 
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", resize: "vertical" }}
                  placeholder="Opsional..."
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
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

      {/* Modal Panitia */}
      {isPanitiaModalOpen && selectedKegiatan && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="surface-card" style={{ width: "100%", maxWidth: "700px", padding: "0", animation: "slideIn 0.3s", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Kelola Panitia</h2>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{selectedKegiatan.nama_kegiatan}</p>
              </div>
              <button onClick={() => setIsPanitiaModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              
              <div style={{ marginBottom: "32px", padding: "16px", backgroundColor: "rgba(79, 172, 254, 0.05)", borderRadius: "12px", border: "1px solid rgba(79, 172, 254, 0.2)" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "16px" }}>Tambah Anggota Panitia</h3>
                <form onSubmit={handleAddPanitia} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "500" }}>Pilih User</label>
                    <SearchableSelect 
                      options={users.map(u => ({ value: u.id, label: `${u.nama_lengkap || u.nama || u.username} (${u.nim || '-'})` }))}
                      value={selectedUser}
                      onChange={(val) => setSelectedUser(val.toString())}
                      placeholder="-- Pilih Anggota --"
                      required={true}
                    />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "500" }}>Peran / Divisi</label>
                    <select 
                      value={peran}
                      onChange={(e) => setPeran(e.target.value)}
                      required
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                    >
                      <option value="Ketua Pelaksana">Ketua Pelaksana</option>
                      <option value="Bendahara Kegiatan">Bendahara Kegiatan</option>
                      <option value="Sekretaris Kegiatan">Sekretaris Kegiatan</option>
                      <option value="Divisi Acara">Divisi Acara</option>
                      <option value="Divisi Konsumsi">Divisi Konsumsi</option>
                      <option value="Divisi Perlengkapan">Divisi Perlengkapan</option>
                      <option value="Divisi Publikasi">Divisi Publikasi</option>
                      <option value="Anggota">Anggota Biasa</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: "10px 20px", height: "42px", flexShrink: 0 }}>
                    Tambahkan
                  </button>
                </form>
              </div>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "12px" }}>Daftar Panitia Terdaftar</h3>
              <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Nama / NIM</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Peran</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)", width: "60px" }}>Hapus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panitia.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{p.nama}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.nim}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ 
                            padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600",
                            backgroundColor: p.peran === 'Ketua Pelaksana' ? 'rgba(59,130,246,0.1)' : p.peran === 'Bendahara Kegiatan' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                            color: p.peran === 'Ketua Pelaksana' ? '#3b82f6' : p.peran === 'Bendahara Kegiatan' ? '#10b981' : 'var(--text-main)'
                          }}>
                            {p.peran}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <button onClick={() => handleDeletePanitia(p.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {panitia.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                          Belum ada panitia terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
