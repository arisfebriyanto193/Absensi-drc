"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Calendar, Info, Users, DollarSign, Settings, 
  Plus, Edit2, Trash2, X, TrendingUp, TrendingDown 
} from "lucide-react";
import Swal from "sweetalert2";
import SearchableSelect from "@/components/SearchableSelect";

export default function KegiatanDetailView({ backUrl }: { backUrl: string }) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [keuangan, setKeuangan] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // For adding panitia by Ketua

  // Modal Keuangan
  const [isKeuanganModalOpen, setIsKeuanganModalOpen] = useState(false);
  const [editKeuanganItem, setEditKeuanganItem] = useState<any>(null);
  const [jenisKeuangan, setJenisKeuangan] = useState("Pengeluaran");
  const [jumlahKeuangan, setJumlahKeuangan] = useState("");
  const [keteranganKeuangan, setKeteranganKeuangan] = useState("");
  const [tanggalKeuangan, setTanggalKeuangan] = useState(new Date().toISOString().split('T')[0]);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);

  // Modal Panitia (Khusus Ketua)
  const [isPanitiaModalOpen, setIsPanitiaModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [peranPanitia, setPeranPanitia] = useState("Anggota");

  const fetchDetail = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          Swal.fire("Error", data.error, "error").then(() => router.push('/dashboard/kegiatan'));
          return;
        }
        setKegiatan(data);
      })
      .catch(err => console.error(err));
  };

  const fetchKeuangan = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/${id}/keuangan`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setKeuangan(data);
      })
      .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    const token = localStorage.getItem("token");
    // Gunakan endpoint kegiatan users
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
      fetchKeuangan();
      fetchUsers();
    }
  }, [id]);

  if (!kegiatan) return <div style={{ padding: "40px", textAlign: "center" }}>Memuat data kegiatan...</div>;

  const isKetua = kegiatan.my_peran === 'Ketua Pelaksana' || kegiatan.my_peran === 'Admin';
  const isBendahara = kegiatan.my_peran === 'Bendahara Kegiatan' || kegiatan.my_peran === 'Bendahara Utama' || isKetua;
  const isSelesai = kegiatan.status === 'Selesai';

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // --- Handlers for Status ---
  const handleUpdateStatus = async (newStatus: string) => {
    if (!isKetua) return;
    const result = await Swal.fire({
      title: 'Ubah Status',
      text: `Ubah status kegiatan menjadi "${newStatus}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, ubah'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/${id}/status`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        Swal.fire("Sukses", "Status diperbarui", "success");
        fetchDetail();
      }
    } catch (e) {
      Swal.fire("Error", "Gagal menghubungi server", "error");
    }
  };

  // --- Handlers for Keuangan ---
  const handleOpenKeuanganModal = (item?: any) => {
    if (isSelesai) {
      Swal.fire("Terkunci", "Kegiatan sudah selesai, data keuangan tidak dapat diubah.", "warning");
      return;
    }
    
    if (item) {
      setEditKeuanganItem(item);
      setJenisKeuangan(item.jenis);
      setJumlahKeuangan(item.jumlah.toString());
      setKeteranganKeuangan(item.keterangan);
      setTanggalKeuangan(new Date(item.tanggal).toISOString().split('T')[0]);
      setBuktiFile(null);
    } else {
      setEditKeuanganItem(null);
      setJenisKeuangan("Pengeluaran");
      setJumlahKeuangan("");
      setKeteranganKeuangan("");
      setTanggalKeuangan(new Date().toISOString().split('T')[0]);
      setBuktiFile(null);
    }
    setIsKeuanganModalOpen(true);
  };

  const handleSubmitKeuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSelesai) return;

    const token = localStorage.getItem("token");
    const url = editKeuanganItem 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/${id}/keuangan/${editKeuanganItem.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/${id}/keuangan`;
    const method = editKeuanganItem ? "PUT" : "POST";

    const formData = new FormData();
    formData.append("jenis", jenisKeuangan);
    formData.append("jumlah", jumlahKeuangan);
    formData.append("keterangan", keteranganKeuangan);
    formData.append("tanggal", tanggalKeuangan);
    if (buktiFile) {
      formData.append("bukti_file", buktiFile);
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`
          // Jangan set Content-Type untuk FormData, biarkan browser yang atur boundary
        },
        body: formData
      });
      if (res.ok) {
        setIsKeuanganModalOpen(false);
        fetchKeuangan();
        Swal.fire("Sukses", "Data keuangan disimpan", "success");
      } else {
        const data = await res.json();
        Swal.fire("Error", data.error, "error");
      }
    } catch (e) {
      Swal.fire("Error", "Gagal menyimpan", "error");
    }
  };

  const handleDeleteKeuangan = async (keuanganId: number) => {
    if (isSelesai) return;
    const result = await Swal.fire({
      title: 'Hapus data ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus'
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/${id}/keuangan/${keuanganId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchKeuangan();
    } catch (e) {
      Swal.fire("Error", "Gagal menghapus", "error");
    }
  };

  // --- Handlers for Panitia (Ketua Only) ---
  const handleAddPanitia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKetua) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/${id}/panitia`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: selectedUser, peran: peranPanitia })
      });
      if (res.ok) {
        setIsPanitiaModalOpen(false);
        fetchDetail();
        Swal.fire("Sukses", "Panitia ditambahkan", "success");
      } else {
        const data = await res.json();
        Swal.fire("Error", data.error, "error");
      }
    } catch (e) {
      Swal.fire("Error", "Gagal", "error");
    }
  };

  const handleDeletePanitia = async (panitiaId: number) => {
    if (!isKetua) return;
    const result = await Swal.fire({
      title: 'Hapus panitia ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus'
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan/${id}/panitia/${panitiaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDetail();
      } else {
        const data = await res.json();
        Swal.fire("Error", data.error, "error");
      }
    } catch (e) {
      Swal.fire("Error", "Gagal", "error");
    }
  };

  // Hitung Saldo Keuangan
  const totalPemasukan = keuangan.filter(k => k.jenis === 'Pemasukan').reduce((acc, curr) => acc + parseFloat(curr.jumlah), 0);
  const totalPengeluaran = keuangan.filter(k => k.jenis === 'Pengeluaran').reduce((acc, curr) => acc + parseFloat(curr.jumlah), 0);
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={() => router.push(backUrl)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-main)" }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>
            {kegiatan.nama_kegiatan}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{
              padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600",
              backgroundColor: kegiatan.status === 'Selesai' ? 'rgba(16,185,129,0.1)' : kegiatan.status === 'Sedang Berlangsung' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
              color: kegiatan.status === 'Selesai' ? '#10b981' : kegiatan.status === 'Sedang Berlangsung' ? '#3b82f6' : '#f59e0b'
            }}>
              {kegiatan.status}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
              Peran Anda: <span style={{ color: "var(--primary)" }}>{kegiatan.my_peran}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "24px", overflowX: "auto" }}>
        <button 
          onClick={() => setActiveTab('info')}
          style={{ background: "none", border: "none", padding: "12px 0", borderBottom: activeTab === 'info' ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === 'info' ? "var(--primary)" : "var(--text-muted)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Info size={18} /> Info & Detail
        </button>
        <button 
          onClick={() => setActiveTab('panitia')}
          style={{ background: "none", border: "none", padding: "12px 0", borderBottom: activeTab === 'panitia' ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === 'panitia' ? "var(--primary)" : "var(--text-muted)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Users size={18} /> Kepanitiaan
        </button>
        {(isBendahara || isKetua) && (
          <button 
            onClick={() => setActiveTab('keuangan')}
            style={{ background: "none", border: "none", padding: "12px 0", borderBottom: activeTab === 'keuangan' ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === 'keuangan' ? "var(--primary)" : "var(--text-muted)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <DollarSign size={18} /> Keuangan Kegiatan
          </button>
        )}
        {isKetua && (
          <button 
            onClick={() => setActiveTab('pengaturan')}
            style={{ background: "none", border: "none", padding: "12px 0", borderBottom: activeTab === 'pengaturan' ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === 'pengaturan' ? "var(--primary)" : "var(--text-muted)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Settings size={18} /> Pengaturan Ketua
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="surface-card" style={{ padding: "24px" }}>
        
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.3s" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "8px" }}>Deskripsi Kegiatan</h3>
              <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>{kegiatan.deskripsi || 'Tidak ada deskripsi yang ditambahkan.'}</p>
            </div>
            
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "rgba(0,0,0,0.02)", padding: "16px", borderRadius: "12px", flex: 1, minWidth: "200px" }}>
                <Calendar size={24} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Tanggal Pelaksanaan</div>
                  <div style={{ fontWeight: "600" }}>
                    {kegiatan.tanggal_mulai ? new Date(kegiatan.tanggal_mulai).toLocaleDateString('id-ID') : '-'}
                    {kegiatan.tanggal_selesai ? ` s.d. ${new Date(kegiatan.tanggal_selesai).toLocaleDateString('id-ID')}` : ''}
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "rgba(0,0,0,0.02)", padding: "16px", borderRadius: "12px", flex: 1, minWidth: "200px" }}>
                <Users size={24} color="#8b5cf6" />
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Total Panitia Terlibat</div>
                  <div style={{ fontWeight: "600" }}>{kegiatan.kepanitiaan?.length || 0} Orang</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANITIA TAB */}
        {activeTab === 'panitia' && (
          <div style={{ animation: "fadeIn 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Daftar Panitia</h3>
              {isKetua && !isSelesai && (
                <button onClick={() => setIsPanitiaModalOpen(true)} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={16} /> Tambah Panitia
                </button>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Nama & NIM</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Peran / Divisi</th>
                    {isKetua && !isSelesai && <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {kegiatan.kepanitiaan?.map((p: any) => (
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
                      {isKetua && !isSelesai && (
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          {p.peran !== 'Ketua Pelaksana' && (
                            <button onClick={() => handleDeletePanitia(p.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {(!kegiatan.kepanitiaan || kegiatan.kepanitiaan.length === 0) && (
                    <tr>
                      <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>Belum ada panitia.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KEUANGAN TAB */}
        {activeTab === 'keuangan' && (isBendahara || isKetua) && (
          <div style={{ animation: "fadeIn 0.3s" }}>
            {/* Rekap Saldo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div style={{ fontSize: "0.85rem", color: "#059669", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><TrendingUp size={16}/> Total Pemasukan</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#047857" }}>{formatRupiah(totalPemasukan)}</div>
              </div>
              <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div style={{ fontSize: "0.85rem", color: "#b91c1c", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><TrendingDown size={16}/> Total Pengeluaran</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#991b1b" }}>{formatRupiah(totalPengeluaran)}</div>
              </div>
              <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: saldoAkhir >= 0 ? "rgba(59,130,246,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${saldoAkhir >= 0 ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <div style={{ fontSize: "0.85rem", color: saldoAkhir >= 0 ? "#1d4ed8" : "#b91c1c", fontWeight: "600", marginBottom: "8px" }}>Saldo Saat Ini</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: saldoAkhir >= 0 ? "#1e40af" : "#991b1b" }}>{formatRupiah(saldoAkhir)}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Riwayat Transaksi</h3>
              {!isSelesai && (
                <button onClick={() => handleOpenKeuanganModal()} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={16} /> Catat Transaksi
                </button>
              )}
            </div>

            {isSelesai && (
              <div style={{ padding: "12px 16px", backgroundColor: "rgba(245,158,11,0.1)", color: "#b45309", borderRadius: "8px", marginBottom: "16px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <Info size={18} /> Kegiatan telah selesai. Data keuangan dibekukan (Read-only).
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Tanggal</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Keterangan</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Bukti</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Jenis</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Jumlah</th>
                    {!isSelesai && <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", borderBottom: "1px solid var(--border)" }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {keuangan.map((k) => (
                    <tr key={k.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "0.9rem" }}>{new Date(k.tanggal).toLocaleDateString('id-ID')}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "500", color: "var(--text-main)" }}>
                        {k.keterangan}
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Oleh: {k.pembuat || '-'}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {k.bukti_file ? (
                          <a href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/bukti_kegiatan/${k.bukti_file}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                            Lihat Bukti
                          </a>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600",
                          backgroundColor: k.jenis === 'Pemasukan' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: k.jenis === 'Pemasukan' ? '#10b981' : '#ef4444'
                        }}>
                          {k.jenis}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600", color: k.jenis === 'Pemasukan' ? '#10b981' : '#ef4444' }}>
                        {k.jenis === 'Pemasukan' ? '+' : '-'}{formatRupiah(k.jumlah)}
                      </td>
                      {!isSelesai && (
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                            <button onClick={() => handleOpenKeuanganModal(k)} style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "none", width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteKeuangan(k.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {keuangan.length === 0 && (
                    <tr>
                      <td colSpan={isSelesai ? 4 : 5} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>Belum ada data keuangan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PENGATURAN KETUA TAB */}
        {activeTab === 'pengaturan' && isKetua && (
          <div style={{ animation: "fadeIn 0.3s" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "16px" }}>Pengaturan Status Kegiatan</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
              <div style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "12px" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                  Status saat ini: <strong style={{ color: "var(--text-main)" }}>{kegiatan.status}</strong>
                </p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button 
                    onClick={() => handleUpdateStatus('Perancangan')} 
                    disabled={kegiatan.status === 'Perancangan'}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: kegiatan.status === 'Perancangan' ? "rgba(0,0,0,0.05)" : "transparent", cursor: kegiatan.status === 'Perancangan' ? "not-allowed" : "pointer", fontWeight: "500", textAlign: "left" }}
                  >
                    Set ke "Perancangan"
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('Sedang Berlangsung')} 
                    disabled={kegiatan.status === 'Sedang Berlangsung'}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: kegiatan.status === 'Sedang Berlangsung' ? "rgba(0,0,0,0.05)" : "transparent", cursor: kegiatan.status === 'Sedang Berlangsung' ? "not-allowed" : "pointer", fontWeight: "500", textAlign: "left", color: "#3b82f6" }}
                  >
                    Set ke "Sedang Berlangsung"
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('Selesai')} 
                    disabled={kegiatan.status === 'Selesai'}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.3)", background: kegiatan.status === 'Selesai' ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.05)", cursor: kegiatan.status === 'Selesai' ? "not-allowed" : "pointer", fontWeight: "600", textAlign: "left", color: "#10b981" }}
                  >
                    Set ke "Selesai" (Kunci Keuangan)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal Input Keuangan */}
      {isKeuanganModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="surface-card" style={{ width: "100%", maxWidth: "450px", padding: "0", animation: "slideIn 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>{editKeuanganItem ? 'Edit Transaksi' : 'Catat Transaksi'}</h2>
              <button onClick={() => setIsKeuanganModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitKeuangan} style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Jenis Transaksi</label>
                  <select 
                    value={jenisKeuangan}
                    onChange={(e) => setJenisKeuangan(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                  >
                    <option value="Pemasukan">Pemasukan (+)</option>
                    <option value="Pengeluaran">Pengeluaran (-)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Tanggal</label>
                  <input 
                    type="date" 
                    value={tanggalKeuangan}
                    onChange={(e) => setTanggalKeuangan(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", colorScheme: "var(--color-scheme)" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Jumlah Nominal (Rp) <span style={{ color: "red" }}>*</span></label>
                <input 
                  type="number" 
                  value={jumlahKeuangan}
                  onChange={(e) => setJumlahKeuangan(e.target.value)}
                  required
                  min="0"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                  placeholder="Contoh: 150000"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Keterangan / Deskripsi <span style={{ color: "red" }}>*</span></label>
                <textarea 
                  value={keteranganKeuangan}
                  onChange={(e) => setKeteranganKeuangan(e.target.value)}
                  required
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", resize: "vertical" }}
                  placeholder="Contoh: Beli snack rapat..."
                ></textarea>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Upload Bukti (Opsional)</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={(e) => setBuktiFile(e.target.files ? e.target.files[0] : null)}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px dashed var(--border)", backgroundColor: "rgba(0,0,0,0.02)", color: "var(--text-main)", fontSize: "0.85rem" }}
                />
                {editKeuanganItem?.bukti_file && !buktiFile && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "6px" }}>
                    Telah diupload: <a href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/bukti_kegiatan/${editKeuanganItem.bukti_file}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>Lihat file saat ini</a>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setIsKeuanganModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-main)", fontWeight: "600", cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Panitia (Ketua) */}
      {isPanitiaModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="surface-card" style={{ width: "100%", maxWidth: "450px", padding: "0", animation: "slideIn 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Tambah Anggota Panitia</h2>
              <button onClick={() => setIsPanitiaModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddPanitia} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Pilih User <span style={{ color: "red" }}>*</span></label>
                <SearchableSelect 
                  options={users.map(u => ({ value: u.id, label: `${u.nama_lengkap || u.nama || u.username} (${u.nim || '-'})` }))}
                  value={selectedUser}
                  onChange={(val) => setSelectedUser(val.toString())}
                  placeholder="-- Pilih Anggota --"
                  required={true}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "500" }}>Peran / Divisi <span style={{ color: "red" }}>*</span></label>
                <select 
                  value={peranPanitia}
                  onChange={(e) => setPeranPanitia(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)" }}
                >
                  <option value="Bendahara Kegiatan">Bendahara Kegiatan</option>
                  <option value="Sekretaris Kegiatan">Sekretaris Kegiatan</option>
                  <option value="Divisi Acara">Divisi Acara</option>
                  <option value="Divisi Konsumsi">Divisi Konsumsi</option>
                  <option value="Divisi Perlengkapan">Divisi Perlengkapan</option>
                  <option value="Divisi Publikasi">Divisi Publikasi</option>
                  <option value="Anggota">Anggota Biasa</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setIsPanitiaModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-main)", fontWeight: "600", cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                  Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
