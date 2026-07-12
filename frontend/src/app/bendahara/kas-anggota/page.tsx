"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Settings, Save, Check, RefreshCw } from "lucide-react";

// Helper function to generate an array of YYYY-MM strings between two dates
const getMonthsInRange = (startYYYYMM: string, endYYYYMM: string) => {
  const result = [];
  let current = new Date(startYYYYMM + "-01");
  const end = new Date(endYYYYMM + "-01");
  
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    result.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }
  return result;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function KasAnggotaGrid() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [startMonth, setStartMonth] = useState("2024-10");
  const [endMonth, setEndMonth] = useState("2025-09");
  const [monthsList, setMonthsList] = useState<string[]>([]);
  
  const [kasPerBulan, setKasPerBulan] = useState(10000);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch pengaturan
      const resPengaturan = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/pengaturan`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const pengaturan = await resPengaturan.json();
      if (pengaturan.kas_per_bulan) {
        setKasPerBulan(Number(pengaturan.kas_per_bulan));
      }
      if (pengaturan.periode_mulai) {
        setStartMonth(pengaturan.periode_mulai);
      }
      if (pengaturan.periode_selesai) {
        setEndMonth(pengaturan.periode_selesai);
      }

      // Fetch users kas
      const resKas = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/kas-anggota`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const dataKas = await resKas.json();
      setData(dataKas);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setMonthsList(getMonthsInRange(startMonth, endMonth));
  }, [startMonth, endMonth]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const token = localStorage.getItem("token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/pengaturan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          kas_per_bulan: kasPerBulan.toString(),
          periode_mulai: startMonth,
          periode_selesai: endMonth
        })
      });
      Swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
        icon: 'success', title: 'Pengaturan disimpan'
      });
      setShowSettings(false);
    } catch (err) {
      Swal.fire('Error', 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleBulan = async (userId: number, bulan: string, isChecked: boolean) => {
    const token = localStorage.getItem("token");
    
    // Optimistic UI Update
    setData(prevData => prevData.map(user => {
      if (user.user_id === userId) {
        let currentBulanArray = [];
        try { currentBulanArray = user.bulan_dibayar ? JSON.parse(user.bulan_dibayar) : []; } catch(e) {}
        
        if (isChecked) {
          if (!currentBulanArray.includes(bulan)) currentBulanArray.push(bulan);
        } else {
          currentBulanArray = currentBulanArray.filter((b: string) => b !== bulan);
        }
        
        user.bulan_dibayar = JSON.stringify(currentBulanArray);
        user.total_terbayar = currentBulanArray.length * kasPerBulan;
      }
      return user;
    }));

    // API Call
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/kas-anggota/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, bulan, is_checked: isChecked })
      });
    } catch (error) {
      console.error(error);
      // Revert if needed, or just let them refresh
      Swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
        icon: 'error', title: 'Gagal menghubungi server'
      });
    }
  };

  const handleResetKas = (userId: number, nama: string) => {
    Swal.fire({
      title: `Reset Kas ${nama}?`,
      text: "Seluruh riwayat centang dan total bayar anak ini akan dikembalikan menjadi Rp 0. Anda yakin?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Reset!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bendahara/kas-anggota/reset/${userId}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
            Swal.fire({
              toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
              icon: 'success', title: 'Kas berhasil direset'
            });
            // Update UI State
            setData(prevData => prevData.map(user => {
              if (user.user_id === userId) {
                user.bulan_dibayar = '[]';
                user.total_terbayar = 0;
              }
              return user;
            }));
          } else {
            Swal.fire('Error', 'Gagal mereset kas', 'error');
          }
        } catch (error) {
          console.error(error);
          Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
        }
      }
    });
  };

  const isMonthChecked = (bulanDibayarStr: string, month: string) => {
    if (!bulanDibayarStr) return false;
    try {
      const arr = JSON.parse(bulanDibayarStr);
      return arr.includes(month);
    } catch (e) {
      return false;
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading data kas...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <h2 style={{ fontSize: "1.2rem", color: "var(--text-main)" }}>Kas Anggota (Buku Kas)</h2>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "var(--text-main)" }}
        >
          <Settings size={18} /> Pengaturan
        </button>
      </div>

      {showSettings && (
        <div className="surface-card fade-in" style={{ marginBottom: "24px", borderTop: "4px solid var(--primary)" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Pengaturan Kas</h3>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label className="form-label" style={{ fontSize: "0.85rem" }}>Nominal Kas (Rp / Bulan)</label>
              <input 
                type="number" 
                className="form-input" 
                value={kasPerBulan}
                onChange={e => setKasPerBulan(Number(e.target.value))}
                style={{ width: "200px" }}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: "0.85rem" }}>Periode Mulai (Tabel)</label>
              <input 
                type="month" 
                className="form-input" 
                value={startMonth}
                onChange={e => setStartMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: "0.85rem" }}>Periode Selesai (Tabel)</label>
              <input 
                type="month" 
                className="form-input" 
                value={endMonth}
                onChange={e => setEndMonth(e.target.value)}
              />
            </div>
            <button 
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Save size={18} /> Simpan Pengaturan
            </button>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "12px" }}>
            *Mengubah Periode Mulai/Selesai hanya akan mengubah jumlah kolom bulan yang ditampilkan pada tabel di bawah, riwayat centang tidak akan hilang.
          </p>
        </div>
      )}

      <div className="surface-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(79, 172, 254, 0.1)", borderBottom: "2px solid var(--primary)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", minWidth: "200px", position: "sticky", left: 0, backgroundColor: "var(--surface)", zIndex: 2, boxShadow: "2px 0 5px rgba(0,0,0,0.05)" }}>
                  Nama Anggota
                </th>
                <th style={{ padding: "12px", textAlign: "center", minWidth: "100px", borderLeft: "1px solid var(--border)" }}>Total Dibayar</th>
                <th style={{ padding: "12px", textAlign: "center", minWidth: "100px", borderLeft: "1px solid var(--border)" }}>Kekurangan</th>
                <th style={{ padding: "12px", textAlign: "center", minWidth: "80px", borderLeft: "1px solid var(--border)" }}>Aksi</th>
                
                {monthsList.map(month => {
                  const [yyyy, mm] = month.split('-');
                  return (
                    <th key={month} style={{ padding: "12px 8px", textAlign: "center", minWidth: "60px", borderLeft: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>{yyyy}</div>
                      <div style={{ fontWeight: "600", color: "var(--primary)" }}>{monthNames[parseInt(mm) - 1]}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.map((user, index) => {
                const targetNominal = monthsList.length * kasPerBulan;
                let currentBulanArray = [];
                try { currentBulanArray = user.bulan_dibayar ? JSON.parse(user.bulan_dibayar) : []; } catch(e) {}
                
                // Override total_terbayar based on checked boxes to ensure accuracy
                const totalTerbayar = currentBulanArray.length * kasPerBulan;
                const kekurangan = targetNominal - totalTerbayar;
                const isLunas = kekurangan <= 0 && targetNominal > 0;

                return (
                  <tr key={user.user_id} style={{ borderBottom: "1px solid var(--border)", backgroundColor: index % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}>
                    <td style={{ padding: "12px 16px", position: "sticky", left: 0, backgroundColor: index % 2 === 0 ? "var(--surface)" : "#fafafa", zIndex: 1, boxShadow: "2px 0 5px rgba(0,0,0,0.02)" }}>
                      <div style={{ fontWeight: "600", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }} title={user.nama_lengkap}>
                        {user.nama_lengkap}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user.nim}</div>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", fontWeight: "700", color: "#10b981", borderLeft: "1px solid var(--border)" }}>
                      Rp {totalTerbayar.toLocaleString("id-ID")}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", borderLeft: "1px solid var(--border)" }}>
                      {isLunas ? (
                        <span style={{ padding: "4px 8px", backgroundColor: "#d1fae5", color: "#065f46", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>Lunas</span>
                      ) : (
                        <span style={{ color: "#ef4444", fontWeight: "600", fontSize: "0.85rem" }}>Rp {kekurangan.toLocaleString("id-ID")}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", borderLeft: "1px solid var(--border)" }}>
                      <button 
                        onClick={() => handleResetKas(user.user_id, user.nama_lengkap)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        title={`Reset Kas ${user.nama_lengkap}`}
                      >
                        <RefreshCw size={16} />
                      </button>
                    </td>
                    
                    {monthsList.map(month => {
                      const isChecked = currentBulanArray.includes(month);
                      return (
                        <td key={`${user.user_id}-${month}`} style={{ padding: "12px 8px", textAlign: "center", borderLeft: "1px solid var(--border)" }}>
                          <label style={{ display: "flex", justifyContent: "center", cursor: "pointer" }}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleToggleBulan(user.user_id, month, e.target.checked)}
                              style={{ 
                                width: "20px", height: "20px", 
                                cursor: "pointer", 
                                accentColor: "var(--primary)"
                              }}
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              
              {data.length === 0 && (
                <tr>
                  <td colSpan={monthsList.length + 4} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    Belum ada data anggota.
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
