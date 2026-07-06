"use client";

import { useEffect, useState } from "react";
import { 
  Calendar, Plus, Check, ChevronLeft, ChevronRight, 
  Copy, Trash2, X, Users, MapPin, Clock, Search
} from "lucide-react";
import Swal from "sweetalert2";

export default function AdminJadwal() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false); // Daily details modal
  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false); // Add Schedule modal
  const [isSalinModalOpen, setIsSalinModalOpen] = useState(false); // Copy Schedule modal

  // Forms states
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("07:00");
  const [jamSelesai, setJamSelesai] = useState("19:00");
  const [lokasi, setLokasi] = useState("Bengkel");
  const [searchUser, setSearchUser] = useState("");

  // Salin Jadwal states
  const getMonday = (d: Date) => {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6:1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }
  const [salinTanggalAwal, setSalinTanggalAwal] = useState(getMonday(new Date()));
  const [salinJumlahMinggu, setSalinJumlahMinggu] = useState("4");

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const [jadwalRes, usersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/jadwal`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      const jadwalData = await jadwalRes.json();
      const usersData = await usersRes.json();
      
      if (Array.isArray(jadwalData)) setJadwal(jadwalData);
      if (Array.isArray(usersData)) setUsers(usersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleUserSelection = (id: number) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleAddJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0 || !tanggal || !jamMulai || !jamSelesai || !lokasi) {
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Semua field harus diisi dan pilih minimal 1 petugas!', confirmButtonColor: 'var(--primary)' });
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/jadwal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          user_ids: selectedUserIds, 
          tanggal, 
          jam_mulai: jamMulai, 
          jam_selesai: jamSelesai, 
          lokasi 
        })
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Jadwal berhasil ditambahkan!', confirmButtonColor: 'var(--primary)' });
        setIsTambahModalOpen(false);
        setSelectedUserIds([]);
        setSearchUser("");
        fetchData();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message || "Gagal menambah jadwal", confirmButtonColor: 'var(--primary)' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan', confirmButtonColor: 'var(--primary)' });
    }
  };

  const handleSalinJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmResult = await Swal.fire({
      title: 'Salin Jadwal?',
      text: 'Yakin ingin menyalin jadwal? Jadwal yang sudah ada akan dilewati.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--primary)',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Salin!',
      cancelButtonText: 'Batal'
    });
    if (!confirmResult.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/jadwal/salin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          tanggal_awal: salinTanggalAwal,
          jumlah_minggu: parseInt(salinJumlahMinggu)
        })
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, confirmButtonColor: 'var(--primary)' });
        setIsSalinModalOpen(false);
        fetchData();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message || "Gagal menyalin jadwal", confirmButtonColor: 'var(--primary)' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan', confirmButtonColor: 'var(--primary)' });
    }
  };

  const hapusJadwal = async (id: number) => {
    const confirmResult = await Swal.fire({
      title: 'Hapus Jadwal?',
      text: 'Yakin ingin menghapus jadwal ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    if (!confirmResult.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/jadwal/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
        Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Jadwal berhasil dihapus.', confirmButtonColor: 'var(--primary)' });
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: 'var(--primary)' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan', confirmButtonColor: 'var(--primary)' });
    }
  };

  const hapusSemuaJadwalTanggal = async () => {
    if (!selectedDate) return;
    const jadwalsOnDate = jadwal.filter(j => j.tanggal.startsWith(selectedDate));
    if (jadwalsOnDate.length === 0) {
      Swal.fire({ icon: 'info', title: 'Info', text: 'Tidak ada jadwal untuk dihapus', confirmButtonColor: 'var(--primary)' });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Hapus Semua?',
      text: `Yakin ingin menghapus SEMUA ${jadwalsOnDate.length} jadwal pada tanggal ini?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Semua!',
      cancelButtonText: 'Batal'
    });
    if (!confirmResult.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/jadwal/tanggal/${selectedDate}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Terhapus!', text: data.message, confirmButtonColor: 'var(--primary)' });
        setIsModalOpen(false);
        fetchData();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: 'var(--primary)' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan', confirmButtonColor: 'var(--primary)' });
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayIndex = firstDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDayDate = prevLastDay.getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevLastDayDate - i, current: false });
    }
    
    // Current month days
    for (let day = 1; day <= lastDayDate; day++) {
      days.push({ day, current: true });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ day, current: false });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    return (
      <div className="surface-card" style={{ padding: "32px", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "20px" }}>
          
          {/* Month Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "1px solid var(--border)", background: "white", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#f8fafc"} onMouseOut={e => e.currentTarget.style.background = "white"}>
              <ChevronLeft size={20} /> <span style={{ display: "none", "@media (min-width: 768px)": { display: "inline" } } as React.CSSProperties}>Sebelumnya</span>
            </button>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", minWidth: "200px", textAlign: "center", letterSpacing: "-0.5px" }}>
              {monthNames[month]} {year}
            </h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "1px solid var(--border)", background: "white", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#f8fafc"} onMouseOut={e => e.currentTarget.style.background = "white"}>
              <span style={{ display: "none", "@media (min-width: 768px)": { display: "inline" } } as React.CSSProperties}>Selanjutnya</span> <ChevronRight size={20} />
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "16px" }}>
            <button 
              onClick={() => setIsSalinModalOpen(true)} 
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f3e8ff", color: "#9333ea", border: "1px solid #d8b4fe", padding: "12px 20px", borderRadius: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
              onMouseOver={e => e.currentTarget.style.background = "#e9d5ff"}
              onMouseOut={e => e.currentTarget.style.background = "#f3e8ff"}
            >
              <Copy size={18} /> Salin Jadwal
            </button>
            <button 
              onClick={() => { setTanggal(""); setIsTambahModalOpen(true); }} 
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--primary)", color: "white", border: "none", padding: "12px 20px", borderRadius: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 6px -1px rgba(79, 172, 254, 0.3)" }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={e => e.currentTarget.style.transform = "none"}
            >
              <Plus size={18} /> Tambah Jadwal
            </button>
          </div>

        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", textAlign: "center", fontWeight: "700", marginBottom: "12px", color: "var(--text-muted)", fontSize: "1.1rem" }}>
          <div style={{ color: "#ef4444" }}>Min</div>
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div>Sab</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px" }}>
          {days.map((d, index) => {
            let dateStr = "";
            let jadwalCount = 0;
            
            if (d.current) {
              dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
              jadwalCount = jadwal.filter(j => j.tanggal.startsWith(dateStr)).length;
            }

            const isToday = dateStr === todayStr;

            return (
              <div 
                key={index} 
                onClick={() => {
                  if (d.current) {
                    setSelectedDate(dateStr);
                    setIsModalOpen(true);
                  }
                }}
                style={{
                  aspectRatio: "1",
                  border: `2px solid ${isToday ? '#10b981' : jadwalCount > 0 ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: "16px",
                  padding: "16px",
                  cursor: d.current ? "pointer" : "default",
                  opacity: d.current ? 1 : 0.4,
                  position: "relative",
                  background: isToday ? '#ecfdf5' : jadwalCount > 0 ? 'rgba(79, 172, 254, 0.05)' : 'white',
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                className={d.current ? "hover-scale" : ""}
              >
                <div style={{ fontWeight: "700", fontSize: "1.2rem", color: isToday ? '#10b981' : jadwalCount > 0 ? 'var(--primary)' : 'var(--text-main)' }}>{d.day}</div>
                {jadwalCount > 0 && (
                  <div style={{
                    position: "absolute", top: "8px", right: "8px",
                    background: "var(--primary)", color: "white", borderRadius: "8px",
                    padding: "2px 8px", fontSize: "0.75rem", fontWeight: "bold"
                  }}>
                    {jadwalCount} Orang
                  </div>
                )}
                {isToday && (
                  <div style={{ position: "absolute", bottom: "8px", fontSize: "0.75rem", color: "#10b981", fontWeight: "bold" }}>Hari Ini</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "24px", marginTop: "32px", fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: "500", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "20px", height: "20px", background: "#ecfdf5", border: "2px solid #10b981", borderRadius: "6px" }}></div>
            Hari Ini
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "20px", height: "20px", background: "rgba(79, 172, 254, 0.05)", border: "2px solid var(--primary)", borderRadius: "6px" }}></div>
            Ada Jadwal Piket
          </div>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!isModalOpen || !selectedDate) return null;
    
    const jadwalsOnDate = jadwal.filter(j => j.tanggal.startsWith(selectedDate));
    const formattedDate = new Date(selectedDate).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
      }}>
        <div 
          className="fade-in"
          style={{
            background: "white", width: "100%", maxWidth: "550px", borderRadius: "24px",
            padding: "32px", maxHeight: "90vh", overflowY: "auto", position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}
        >
          <button 
            onClick={() => setIsModalOpen(false)}
            style={{ 
              position: "absolute", top: "24px", right: "24px", background: "#f1f5f9", border: "none", 
              cursor: "pointer", color: "#64748b", width: "36px", height: "36px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" 
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
          >
            <X size={20} />
          </button>
          
          <div style={{ marginBottom: "28px", paddingRight: "40px" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ background: "rgba(79, 172, 254, 0.1)", padding: "10px", borderRadius: "12px" }}>
                <Calendar size={24} color="var(--primary)" />
              </div>
              {formattedDate}
            </h2>
            <p style={{ color: "#64748b", fontSize: "1rem", marginLeft: "56px" }}>
              {jadwalsOnDate.length > 0 ? `Terdapat ${jadwalsOnDate.length} petugas piket pada tanggal ini.` : "Belum ada jadwal piket."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "16px", marginBottom: "32px", marginLeft: "56px" }}>
            <button 
              onClick={() => {
                setTanggal(selectedDate);
                setIsModalOpen(false);
                setIsTambahModalOpen(true);
              }}
              style={{ 
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", 
                background: "var(--primary)", color: "white", padding: "14px", borderRadius: "12px",
                border: "none", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(79, 172, 254, 0.3)"
              }}>
              <Plus size={18} /> Tambah Jadwal
            </button>
            
            {jadwalsOnDate.length > 0 && (
              <button 
                onClick={hapusSemuaJadwalTanggal}
                style={{ 
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", 
                  background: "#fee2e2", color: "#ef4444", padding: "14px", borderRadius: "12px",
                  border: "none", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" 
                }}>
                <Trash2 size={18} /> Hapus Semua
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginLeft: "56px" }}>
            {jadwalsOnDate.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", background: "#f8fafc", borderRadius: "16px", border: "2px dashed #e2e8f0" }}>
                <Calendar size={48} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
                <p style={{ fontWeight: "500", fontSize: "1.1rem" }}>Tanggal ini masih kosong.</p>
                <p style={{ fontSize: "0.95rem", marginTop: "8px" }}>Klik "Tambah Jadwal" untuk mengisi jadwal piket.</p>
              </div>
            ) : (
              jadwalsOnDate.map(j => (
                <div key={j.id} style={{ 
                  background: "#f8fafc", border: "1px solid #e2e8f0", padding: "20px", 
                  borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                  transition: "border-color 0.2s"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ background: "#e0f2fe", color: "#0284c7", padding: "8px", borderRadius: "10px", display: "flex" }}>
                        <Users size={18} />
                      </div>
                      {j.nama_lengkap}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", paddingLeft: "46px" }}>
                      <div style={{ color: "#64748b", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
                        <Clock size={16} color="#94a3b8" /> {j.jam_mulai.substring(0, 5)} - {j.jam_selesai.substring(0, 5)}
                      </div>
                      <div style={{ color: "#64748b", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
                        <MapPin size={16} color="#ef4444" /> {j.lokasi}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => hapusJadwal(j.id)}
                    style={{ 
                      background: "white", color: "#ef4444", border: "1px solid #fecaca", padding: "12px", 
                      borderRadius: "12px", cursor: "pointer", marginLeft: "16px", display: "flex",
                      alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#fecaca"; }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTambahModal = () => {
    if (!isTambahModalOpen) return null;

    const filteredUsers = users.filter(u => 
      u.role === 'user' && 
      (u.nama_lengkap.toLowerCase().includes(searchUser.toLowerCase()) || 
       (u.nim && u.nim.toLowerCase().includes(searchUser.toLowerCase())))
    );

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
      }}>
        <div 
          className="fade-in surface-card"
          style={{
            background: "white", width: "100%", maxWidth: "600px", borderRadius: "24px",
            padding: "32px", maxHeight: "90vh", overflowY: "auto", position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}
        >
          <button 
            onClick={() => { setIsTambahModalOpen(false); setSearchUser(""); }}
            style={{ 
              position: "absolute", top: "24px", right: "24px", background: "#f1f5f9", border: "none", 
              cursor: "pointer", color: "#64748b", width: "36px", height: "36px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" 
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
          >
            <X size={20} />
          </button>
          
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ background: "rgba(79, 172, 254, 0.1)", padding: "10px", borderRadius: "12px" }}>
              <Plus size={24} color="var(--primary)" />
            </div>
            Tambah Jadwal Piket
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", marginLeft: "56px", marginBottom: "32px" }}>
            Buat jadwal baru untuk beberapa petugas sekaligus.
          </p>

          <form onSubmit={handleAddJadwal} style={{ display: "flex", flexDirection: "column", gap: "20px", marginLeft: "56px" }}>
            
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "#334155" }}>Pilih Petugas (Bisa lebih dari 1) *</label>
              
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "14px" }} />
                <input 
                  type="text" 
                  placeholder="Cari berdasarkan Nama atau NIM..." 
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  style={{ width: "100%", padding: "12px 12px 12px 42px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "1rem", outline: "none", transition: "border-color 0.2s" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--primary)"}
                  onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                />
              </div>

              {selectedUserIds.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {selectedUserIds.map(id => {
                    const u = users.find(user => user.id === id);
                    return u ? (
                      <span key={id} style={{ background: "var(--primary)", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500", boxShadow: "0 2px 4px rgba(79,172,254,0.3)" }}>
                        {u.nama_lengkap}
                        <button 
                          type="button" 
                          onClick={() => toggleUserSelection(id)} 
                          style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
                          onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
                          onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              
              <div style={{ border: "1px solid #cbd5e1", borderRadius: "12px", maxHeight: "200px", overflowY: "auto", background: "#f8fafc" }}>
                {filteredUsers.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => toggleUserSelection(u.id)}
                    style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid #e2e8f0", backgroundColor: selectedUserIds.includes(u.id) ? "rgba(79, 172, 254, 0.08)" : "transparent", transition: "background-color 0.2s" }}
                    onMouseOver={(e) => { if(!selectedUserIds.includes(u.id)) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)" }}
                    onMouseOut={(e) => { if(!selectedUserIds.includes(u.id)) e.currentTarget.style.backgroundColor = "transparent" }}
                  >
                    <div style={{ width: "22px", height: "22px", borderRadius: "6px", border: `2px solid ${selectedUserIds.includes(u.id) ? "var(--primary)" : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: selectedUserIds.includes(u.id) ? "var(--primary)" : "white", transition: "all 0.2s" }}>
                      {selectedUserIds.includes(u.id) && <Check size={14} color="white" strokeWidth={3} />}
                    </div>
                    <div>
                      <div style={{ fontSize: "1rem", color: "#0f172a", fontWeight: selectedUserIds.includes(u.id) ? "700" : "500" }}>{u.nama_lengkap}</div>
                      <div style={{ fontSize: "0.85rem", color: "#64748b" }}>NIM: {u.nim || "-"} • Username: {u.username}</div>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "1rem" }}>
                    <Users size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                    Tidak ada petugas ditemukan.
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "#334155" }}>Tanggal *</label>
              <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "1rem", color: "#0f172a", outline: "none" }} required />
            </div>
            
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "#334155" }}>Jam Mulai *</label>
                <input type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "1rem", color: "#0f172a", outline: "none" }} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "#334155" }}>Jam Selesai *</label>
                <input type="time" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "1rem", color: "#0f172a", outline: "none" }} required />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", color: "#334155" }}>Lokasi / Area Piket *</label>
              <input type="text" value={lokasi} onChange={e => setLokasi(e.target.value)} placeholder="Contoh: Bengkel Robot" style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "1rem", color: "#0f172a", outline: "none" }} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "16px", borderRadius: "12px", fontSize: "1.1rem", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 10px 15px -3px rgba(79, 172, 254, 0.3)" }}>
              <Check size={20} /> Simpan Jadwal Baru
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderSalinModal = () => {
    if (!isSalinModalOpen) return null;

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
      }}>
        <div 
          className="fade-in surface-card"
          style={{
            background: "linear-gradient(135deg, #a855f7, #9333ea)", width: "100%", maxWidth: "500px", borderRadius: "24px",
            padding: "32px", position: "relative",
            boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.4)", color: "white"
          }}
        >
          <button 
            onClick={() => setIsSalinModalOpen(false)}
            style={{ 
              position: "absolute", top: "24px", right: "24px", background: "rgba(255,255,255,0.2)", border: "none", 
              cursor: "pointer", color: "white", width: "36px", height: "36px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" 
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
          >
            <X size={20} />
          </button>
          
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.2)", padding: "10px", borderRadius: "12px" }}>
              <Copy size={24} color="white" />
            </div>
            Salin Jadwal Mingguan
          </h2>
          <p style={{ fontSize: "1rem", opacity: 0.9, marginLeft: "56px", marginBottom: "32px", lineHeight: "1.5" }}>
            Fitur ini akan menyalin seluruh jadwal pada minggu referensi ke minggu-minggu berikutnya.
          </p>

          <form onSubmit={handleSalinJadwal} style={{ display: "flex", flexDirection: "column", gap: "20px", marginLeft: "56px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", opacity: 0.9 }}>Minggu Referensi (Pilih hari Senin)</label>
              <input 
                type="date" 
                value={salinTanggalAwal}
                onChange={e => setSalinTanggalAwal(e.target.value)}
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", color: "#333", fontSize: "1rem", outline: "none", background: "white" }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", opacity: 0.9 }}>Untuk Berapa Minggu Ke Depan?</label>
              <select 
                value={salinJumlahMinggu}
                onChange={e => setSalinJumlahMinggu(e.target.value)}
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", color: "#333", fontSize: "1rem", outline: "none", background: "white", cursor: "pointer" }}
                required
              >
                <option value="1">1 Minggu ke depan</option>
                <option value="2">2 Minggu ke depan</option>
                <option value="3">3 Minggu ke depan</option>
                <option value="4">4 Minggu ke depan (1 bulan)</option>
                <option value="8">8 Minggu ke depan (2 bulan)</option>
                <option value="12">12 Minggu ke depan (3 bulan)</option>
              </select>
            </div>
            <button type="submit" style={{ width: "100%", background: "white", color: "#9333ea", padding: "16px", borderRadius: "12px", fontWeight: "800", fontSize: "1.1rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.2)", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "none"}>
              <Copy size={20} /> Jalankan Salin Jadwal
            </button>
          </form>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;

  return (
    <>
      <div className="fade-in">
        {renderCalendar()}
      </div>
      
      {renderDetailModal()}
      {renderTambahModal()}
      {renderSalinModal()}
    </>
  );
}
