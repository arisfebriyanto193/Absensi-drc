"use client";

import { useEffect, useState, use } from "react";
import Swal from "sweetalert2";
import { ArrowLeft, PlusCircle, Trash2, Calendar, Users, CheckCircle, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Komponen Searchable Select
const SearchableSelect = ({ value, onChange, options }: { value: any, onChange: (v: any) => void, options: {value: any, label: string}[] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find(o => o.value === value);
    if (selected) {
      setSearchTerm(selected.label);
    } else {
      setSearchTerm("");
    }
  }, [value, options]);

  const filtered = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input 
        type="text" 
        className="form-input"
        style={{ width: "100%", padding: "8px" }}
        value={searchTerm}
        onChange={e => { setSearchTerm(e.target.value); setIsOpen(true); }}
        onFocus={() => { setIsOpen(true); setSearchTerm(""); }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder="Ketik nama pengajar..."
      />
      {isOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--surface)", border: "1px solid var(--border)", maxHeight: "150px", overflowY: "auto", borderRadius: "8px", marginTop: "4px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          {filtered.length > 0 ? filtered.map(o => (
            <div 
              key={o.value} 
              style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: "0.9rem", color: "var(--text-main)" }}
              onClick={() => {
                onChange(o.value);
                setSearchTerm(o.label);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-color)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              {o.label}
            </div>
          )) : (
            <div style={{ padding: "8px 12px", fontSize: "0.9rem", color: "var(--text-muted)" }}>Tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DetailSekolah({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [anggota, setAnggota] = useState<any[]>([]); 
  
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    materi: "",
    total_pendapatan: 0,
    nominal_kas: 0,
    pengajar: [] as { user_id: number, honor: number, status_pembayaran?: string }[]
  });

  const fetchDetail = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/ekskul/${id}`, {
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

  const fetchAnggota = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/kas-anggota`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setAnggota(Array.isArray(data) ? data : []);
    })
    .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchDetail();
    fetchAnggota();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    const totalHonor = formData.pengajar.reduce((sum, p) => sum + p.honor, 0);
    if (totalHonor + formData.nominal_kas > formData.total_pendapatan) {
      return Swal.fire('Error', 'Total (Kas + Honor) melebihi Total Pendapatan!', 'error');
    }
    
    try {
      const url = editMode 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/ekskul/pembelajaran/${editId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/ekskul/${id}/pembelajaran`;
      
      const res = await fetch(url, {
        method: editMode ? "PUT" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        Swal.fire('Berhasil', result.message, 'success');
        setIsModalOpen(false);
        resetForm();
        fetchDetail();
      } else {
        Swal.fire('Error', result.message || 'Gagal menyimpan riwayat', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
    }
  };

  const handleEdit = (p: any) => {
    setFormData({
      tanggal: p.tanggal.split('T')[0],
      materi: p.materi,
      total_pendapatan: Number(p.total_pendapatan),
      nominal_kas: Number(p.nominal_kas),
      pengajar: p.pengajar ? p.pengajar.map((g: any) => ({ user_id: g.user_id, honor: Number(g.honor), status_pembayaran: g.status_pembayaran })) : []
    });
    setEditMode(true);
    setEditId(p.id);
    setIsModalOpen(true);
  };

  const handleDelete = (pembelajaranId: number) => {
    Swal.fire({
      title: 'Hapus Riwayat?',
      text: "Data pembelajaran ini akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, hapus!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/ekskul/pembelajaran/${pembelajaranId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            Swal.fire('Terhapus!', 'Riwayat berhasil dihapus.', 'success');
            fetchDetail();
          }
        } catch (error) {
          Swal.fire('Error', 'Gagal menghapus', 'error');
        }
      }
    });
  };

  const toggleStatus = async (pembelajaranId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'sudah' ? 'belum' : 'sudah';
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/ekskul/pembelajaran/${pembelajaranId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status_pembayaran: newStatus })
      });
      if (res.ok) fetchDetail();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleStatusPengajar = async (pengajarId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'sudah' ? 'belum' : 'sudah';
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/ekskul/pengajar/${pengajarId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status_pembayaran: newStatus })
      });
      if (res.ok) fetchDetail();
    } catch (error) {
      console.error(error);
    }
  };

  const addPengajar = () => {
    if (anggota.length > 0) {
      setFormData({
        ...formData,
        pengajar: [...formData.pengajar, { user_id: anggota[0].user_id, honor: 0, status_pembayaran: 'belum' }]
      });
    }
  };

  const removePengajar = (index: number) => {
    const updated = [...formData.pengajar];
    updated.splice(index, 1);
    setFormData({ ...formData, pengajar: updated });
  };

  const updatePengajar = (index: number, field: string, value: any) => {
    const updated = [...formData.pengajar];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, pengajar: updated });
  };

  const resetForm = () => {
    setFormData({ 
      tanggal: new Date().toISOString().split('T')[0], 
      materi: "", 
      total_pendapatan: 0, 
      nominal_kas: 0,
      pengajar: []
    });
    setEditMode(false);
    setEditId(null);
  };

  const anggotaOptions = anggota.map(a => ({ value: a.user_id, label: a.nama_lengkap }));

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
  if (!data) return <div style={{ padding: "20px" }}>Sekolah tidak ditemukan</div>;

  return (
    <>
      <div className="fade-in">
        <Link href="/bendahara/ekskul" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "20px", fontWeight: "500" }}>
          <ArrowLeft size={18} /> Kembali ke Daftar Sekolah
        </Link>

        <div className="surface-card" style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", color: "var(--text-main)", margin: 0, marginBottom: "8px" }}>{data.nama_sekolah}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "600px" }}>{data.deskripsi || "Tidak ada deskripsi"}</p>
          </div>
          
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ textAlign: "right", padding: "16px", background: "var(--bg-color)", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Total Pendapatan</p>
              <h2 style={{ color: "var(--text-main)", fontSize: "1.5rem", margin: 0 }}>Rp {data.pembelajaran?.reduce((sum: number, p: any) => sum + Number(p.total_pendapatan), 0).toLocaleString("id-ID") || 0}</h2>
            </div>
            <div style={{ textAlign: "right", padding: "16px", background: "rgba(16, 185, 129, 0.05)", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <p style={{ color: "#10b981", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Total Masuk Kas</p>
              <h2 style={{ color: "#10b981", fontSize: "1.5rem", margin: 0 }}>Rp {data.pembelajaran?.reduce((sum: number, p: any) => sum + Number(p.nominal_kas), 0).toLocaleString("id-ID") || 0}</h2>
            </div>
          </div>
        </div>

        <div className="surface-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontSize: "1.2rem" }}>Riwayat Pembelajaran</h2>
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              style={{ padding: "8px 16px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <PlusCircle size={18} /> Tambah Pembelajaran
            </button>
          </div>

          {data.pembelajaran && data.pembelajaran.length > 0 ? (
            <div style={{ display: "grid", gap: "16px" }}>
              {data.pembelajaran.map((p: any) => (
                <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "var(--surface)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <Calendar size={16} color="var(--primary)" />
                        <span style={{ fontWeight: "600", color: "var(--primary)" }}>{new Date(p.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <p style={{ color: "var(--text-main)", fontSize: "1rem" }}>{p.materi || "Tidak ada rincian materi"}</p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "2px" }}>Pendapatan</p>
                        <p style={{ fontWeight: "600" }}>Rp {Number(p.total_pendapatan).toLocaleString("id-ID")}</p>
                      </div>
                      <div style={{ textAlign: "right", color: "#10b981" }}>
                        <p style={{ fontSize: "0.8rem", marginBottom: "2px" }}>Masuk Kas</p>
                        <p style={{ fontWeight: "600" }}>Rp {Number(p.nominal_kas).toLocaleString("id-ID")}</p>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "10px" }}>
                        <button 
                          onClick={() => toggleStatus(p.id, p.status_pembayaran || 'belum')}
                          title="Klik untuk ubah status pembayaran"
                          style={{ 
                            padding: "6px 12px", 
                            borderRadius: "20px", 
                            fontSize: "0.8rem", 
                            fontWeight: "600",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: p.status_pembayaran === 'sudah' ? "#d1fae5" : "#fee2e2",
                            color: p.status_pembayaran === 'sudah' ? "#065f46" : "#991b1b"
                          }}
                        >
                          {p.status_pembayaran === 'sudah' ? 'Sudah Terbayar' : 'Belum Terbayar'}
                        </button>
                        
                        <button onClick={() => handleEdit(p)} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: "4px" }}>
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={16} /> Daftar Pengajar ({p.pengajar?.length || 0})
                    </h4>
                    {p.pengajar && p.pengajar.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                        {p.pengajar.map((g: any) => (
                          <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "var(--bg-color)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                            <span style={{ fontSize: "0.9rem", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.nama_lengkap}</span>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "0.9rem", color: "var(--primary)", fontWeight: "600" }}>Rp {Number(g.honor).toLocaleString("id-ID")}</span>
                              <button 
                                onClick={() => toggleStatusPengajar(g.id, g.status_pembayaran || 'belum')}
                                title="Klik untuk ubah status pembayaran"
                                style={{ 
                                  padding: "2px 8px", 
                                  borderRadius: "12px", 
                                  fontSize: "0.75rem", 
                                  fontWeight: "600",
                                  border: "none",
                                  cursor: "pointer",
                                  backgroundColor: g.status_pembayaran === 'sudah' ? "#d1fae5" : "#fee2e2",
                                  color: g.status_pembayaran === 'sudah' ? "#065f46" : "#991b1b"
                                }}
                              >
                                {g.status_pembayaran === 'sudah' ? 'Lunas' : 'Belum'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Tidak ada pengajar</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <Calendar size={48} style={{ opacity: 0.2, marginBottom: "10px" }} />
              <p>Belum ada riwayat pembelajaran di sekolah ini.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsModalOpen(false); resetForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "1.2rem", color: "var(--text-main)" }}>
              {editMode ? "Edit Pembelajaran" : "Catat Pembelajaran"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Tanggal Mengajar</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    required 
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label className="form-label">Materi / Keterangan</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Contoh: Pengenalan Robot Line Follower"
                    value={formData.materi}
                    onChange={(e) => setFormData({...formData, materi: e.target.value})}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ color: "var(--primary)" }}>Total Uang dari Sekolah</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: "600" }}>Rp</span>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ paddingLeft: "40px", borderColor: "var(--primary)" }}
                      value={formData.total_pendapatan || ""}
                      onChange={(e) => setFormData({...formData, total_pendapatan: Number(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ color: "#10b981" }}>Nominal Masuk Kas DRC</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: "600" }}>Rp</span>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ paddingLeft: "40px", borderColor: "#10b981" }}
                      value={formData.nominal_kas || ""}
                      onChange={(e) => setFormData({...formData, nominal_kas: Number(e.target.value)})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <label className="form-label" style={{ margin: 0 }}>Daftar Pengajar & Honor</label>
                  <button type="button" onClick={addPengajar} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", background: "rgba(79, 172, 254, 0.1)", color: "var(--primary)", border: "none", padding: "6px 12px", borderRadius: "16px", cursor: "pointer", fontWeight: "600" }}>
                    <PlusCircle size={14} /> Tambah Pengajar
                  </button>
                </div>
                
                {formData.pengajar.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", backgroundColor: "var(--bg-color)", borderRadius: "8px", border: "1px dashed var(--border)", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    Belum ada pengajar ditambahkan.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {formData.pengajar.map((p, index) => (
                      <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center", backgroundColor: "var(--bg-color)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        
                        <SearchableSelect 
                          value={p.user_id} 
                          options={anggotaOptions} 
                          onChange={(val) => updatePengajar(index, 'user_id', val)}
                        />

                        <div style={{ position: "relative", width: "150px" }}>
                          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600" }}>Rp</span>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ padding: "8px", paddingLeft: "32px", fontSize: "0.9rem" }}
                            placeholder="Honor"
                            value={p.honor || ""}
                            onChange={(e) => updatePengajar(index, 'honor', Number(e.target.value))}
                            required
                          />
                        </div>
                        
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-main)", userSelect: "none" }}>
                          <input 
                            type="checkbox"
                            checked={p.status_pembayaran === 'sudah'}
                            onChange={(e) => updatePengajar(index, 'status_pembayaran', e.target.checked ? 'sudah' : 'belum')}
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                          />
                          Lunas
                        </label>

                        <button type="button" onClick={() => removePengajar(index)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", padding: "10px", backgroundColor: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Total Honor + Kas:</span>
                      <strong style={{ color: (formData.pengajar.reduce((s, p) => s + p.honor, 0) + formData.nominal_kas) > formData.total_pendapatan ? "#ef4444" : "var(--text-main)" }}>
                        Rp {(formData.pengajar.reduce((s, p) => s + p.honor, 0) + formData.nominal_kas).toLocaleString("id-ID")}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <CheckCircle size={18} /> Simpan
                </button>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: "#94a3b8", color: "white" }} onClick={() => { setIsModalOpen(false); resetForm(); }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
