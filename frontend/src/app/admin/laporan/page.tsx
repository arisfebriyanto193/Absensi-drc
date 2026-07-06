"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  FileText, Search, User as UserIcon, Calendar, CheckCircle, 
  XCircle, Clock, Eye, X, Filter, Download, ArrowUpDown 
} from "lucide-react";
import Swal from "sweetalert2";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function AdminLaporan() {
  const [laporan, setLaporan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [searchUser, setSearchUser] = useState("");
  const [sortBy, setSortBy] = useState("nama");

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLaporan = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/laporan?bulan=${bulan}&tahun=${tahun}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLaporan(data);
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message || "Gagal mengambil data laporan", confirmButtonColor: 'var(--primary)' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: "Terjadi kesalahan jaringan", confirmButtonColor: 'var(--primary)' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [bulan, tahun]);

  const sortedLaporan = [...laporan].filter(l => 
    l.nama_lengkap.toLowerCase().includes(searchUser.toLowerCase()) || 
    (l.nim && l.nim.toLowerCase().includes(searchUser.toLowerCase()))
  ).sort((a, b) => {
    if (sortBy === 'alfa') return b.total_alfa - a.total_alfa;
    if (sortBy === 'hadir') return b.total_hadir - a.total_hadir;
    if (sortBy === 'pending') return b.total_pending - a.total_pending;
    return a.nama_lengkap.localeCompare(b.nama_lengkap);
  });

  const bulanNames = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
    { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  const tahunOptions = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 2 + i));

  const openDetail = (userLaporan: any) => {
    setSelectedUser(userLaporan);
    setIsModalOpen(true);
  };

  const exportToExcel = async () => {
    if (sortedLaporan.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Kosong', text: 'Tidak ada data untuk diekspor', confirmButtonColor: 'var(--primary)' });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan Piket");

    sheet.columns = [
      { header: "No.", key: "no", width: 5 },
      { header: "Nama Lengkap", key: "nama", width: 30 },
      { header: "NIM", key: "nim", width: 15 },
      { header: "Total Jadwal", key: "jadwal", width: 15 },
      { header: "Hadir", key: "hadir", width: 10 },
      { header: "Alfa", key: "alfa", width: 10 },
      { header: "Menunggu Konfirmasi", key: "pending", width: 22 },
      { header: "Ditolak", key: "ditolak", width: 10 }
    ];

    // Styling header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    sortedLaporan.forEach((l, index) => {
      const row = sheet.addRow({
        no: index + 1,
        nama: l.nama_lengkap,
        nim: l.nim || "-",
        jadwal: l.total_jadwal,
        hadir: l.total_hadir,
        alfa: l.total_alfa,
        pending: l.total_pending,
        ditolak: l.total_ditolak
      });

      const namaCell = row.getCell('nama');
      if (l.total_alfa >= 3) {
        namaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        namaCell.font = { color: { argb: 'FF9C0006' } };
      } else if (l.total_alfa === 2) {
        namaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
        namaCell.font = { color: { argb: 'FF9C6500' } };
      } else if (l.total_alfa === 1) {
        namaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5B4' } };
        namaCell.font = { color: { argb: 'FFC2410C' } };
      }
    });

    const namaBulan = bulanNames.find(b => b.value === bulan)?.label;
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Laporan_Piket_${namaBulan}_${tahun}.xlsx`);
  };

  const getNamaColor = (alfa: number) => {
    if (alfa >= 3) return "#b91c1c";
    if (alfa === 2) return "#a16207";
    if (alfa === 1) return "#c2410c";
    return "var(--text-main)";
  };

  const getNamaBgColor = (alfa: number) => {
    if (alfa >= 3) return "#fee2e2";
    if (alfa === 2) return "#fef08a";
    if (alfa === 1) return "#ffedd5";
    return "transparent";
  };

  return (
    <>
      <div className="fade-in">
        <div className="surface-card" style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "10px" }}>
              <FileText color="var(--primary)" /> Laporan Piket
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Pantau frekuensi piket dan absensi anggota.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button 
              onClick={exportToExcel}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "#10b981", color: "white", padding: "10px 16px", borderRadius: "10px", border: "none", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={e => e.currentTarget.style.transform = "none"}
            >
              <Download size={18} /> Export Excel
            </button>
            <div style={{ position: "relative" }}>
              <Filter size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
              <select 
                value={bulan} 
                onChange={(e) => setBulan(e.target.value)}
                style={{ padding: "10px 12px 10px 36px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", backgroundColor: "white", cursor: "pointer" }}
              >
                {bulanNames.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            
            <select 
              value={tahun} 
              onChange={(e) => setTahun(e.target.value)}
              style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", backgroundColor: "white", cursor: "pointer" }}
            >
              {tahunOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="surface-card">
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "350px" }}>
              <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "12px" }} />
              <input 
                type="text" 
                placeholder="Cari Nama atau NIM..." 
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                style={{ width: "100%", padding: "12px 12px 12px 42px", borderRadius: "12px", border: "1px solid var(--border)", fontSize: "0.95rem", outline: "none" }}
              />
            </div>
            
            <div style={{ position: "relative" }}>
              <ArrowUpDown size={16} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "13px" }} />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: "12px 16px 12px 38px", borderRadius: "12px", border: "1px solid var(--border)", fontSize: "0.95rem", outline: "none", backgroundColor: "white", cursor: "pointer" }}
              >
                <option value="nama">Urutkan Nama (A-Z)</option>
                <option value="alfa">Paling Banyak Alfa</option>
                <option value="hadir">Paling Banyak Hadir</option>
                <option value="pending">Paling Banyak Izin/Pending</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Memuat data laporan...</div>
          ) : sortedLaporan.length > 0 ? (
            <div style={{ overflowX: "auto", marginTop: "20px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.02)", textAlign: "left" }}>
                    <th style={{ padding: "14px", borderBottom: "1px solid var(--border)", fontWeight: "600" }}>Anggota</th>
                    <th style={{ padding: "14px", borderBottom: "1px solid var(--border)", fontWeight: "600", textAlign: "center" }}>Total Jadwal</th>
                    <th style={{ padding: "14px", borderBottom: "1px solid var(--border)", fontWeight: "600", textAlign: "center", color: "#10b981" }}>Hadir</th>
                    <th style={{ padding: "14px", borderBottom: "1px solid var(--border)", fontWeight: "600", textAlign: "center", color: "#ef4444" }}>Alfa</th>
                    <th style={{ padding: "14px", borderBottom: "1px solid var(--border)", fontWeight: "600", textAlign: "center" }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLaporan.map((l) => (
                    <tr key={l.user_id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} className="hover-scale" onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.01)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: "16px" }}>
                        <div style={{ 
                          fontWeight: "700", 
                          color: getNamaColor(l.total_alfa), 
                          background: getNamaBgColor(l.total_alfa),
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "1rem" 
                        }}>{l.nama_lengkap}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px", marginLeft: "8px" }}>NIM: {l.nim || "-"}</div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: "700", fontSize: "1.1rem" }}>{l.total_jadwal}</td>
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: "700", color: "#10b981", fontSize: "1.1rem" }}>{l.total_hadir}</td>
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: "700", color: "#ef4444", fontSize: "1.1rem" }}>{l.total_alfa}</td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <button 
                          onClick={() => openDetail(l)}
                          style={{ 
                            background: "rgba(79, 172, 254, 0.1)", color: "var(--primary)", border: "1px solid var(--primary)", 
                            padding: "8px 16px", borderRadius: "10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px",
                            fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s"
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = "var(--primary)"; e.currentTarget.style.color = "white"; }}
                          onMouseOut={e => { e.currentTarget.style.background = "rgba(79, 172, 254, 0.1)"; e.currentTarget.style.color = "var(--primary)"; }}
                        >
                          <Eye size={16} /> Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", background: "#f8fafc", borderRadius: "16px", border: "2px dashed #e2e8f0" }}>
              <FileText size={48} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
              <p style={{ fontWeight: "500", fontSize: "1.1rem" }}>Tidak ada data laporan.</p>
              <p style={{ fontSize: "0.95rem", marginTop: "4px" }}>Belum ada jadwal piket untuk bulan ini.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedUser && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div 
            className="fade-in"
            style={{
              background: "white", width: "100%", maxWidth: "650px", borderRadius: "24px",
              padding: "32px", maxHeight: "90vh", overflowY: "auto", position: "relative",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ 
                position: "absolute", top: "24px", right: "24px", background: "#f1f5f9", border: "none", 
                cursor: "pointer", color: "#64748b", width: "36px", height: "36px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", zIndex: 10 
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: "24px", paddingRight: "40px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ background: "rgba(79, 172, 254, 0.1)", padding: "10px", borderRadius: "12px" }}>
                  <UserIcon size={24} color="var(--primary)" />
                </div>
                {selectedUser.nama_lengkap}
              </h2>
              <div style={{ marginLeft: "56px", color: "var(--text-muted)", fontSize: "0.95rem", display: "flex", gap: "20px" }}>
                <span>NIM: <strong>{selectedUser.nim || "-"}</strong></span>
                <span>Bulan: <strong>{bulanNames.find(b => b.value === bulan)?.label} {tahun}</strong></span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" }}>
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>Jadwal</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>{selectedUser.total_jadwal}</div>
              </div>
              <div style={{ background: "#ecfdf5", padding: "16px", borderRadius: "16px", textAlign: "center", border: "1px solid #a7f3d0" }}>
                <div style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>Hadir</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#10b981" }}>{selectedUser.total_hadir}</div>
              </div>
              <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "16px", textAlign: "center", border: "1px solid #fecaca" }}>
                <div style={{ fontSize: "0.8rem", color: "#991b1b", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>Alfa</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#ef4444" }}>{selectedUser.total_alfa}</div>
              </div>
              <div style={{ background: "#fffbeb", padding: "16px", borderRadius: "16px", textAlign: "center", border: "1px solid #fde68a" }}>
                <div style={{ fontSize: "0.8rem", color: "#92400e", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>Pending</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#f59e0b" }}>{selectedUser.total_pending}</div>
              </div>
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "#0f172a" }}>Riwayat Jadwal Piket</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {selectedUser.detail.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px" }}>
                  Belum ada jadwal.
                </div>
              ) : (
                selectedUser.detail.map((d: any, idx: number) => {
                  let statusColor = "#64748b";
                  let bgStatus = "#f1f5f9";
                  let Icon = Clock;
                  
                  if (d.status_absen === "approved") {
                    statusColor = "#10b981"; bgStatus = "#ecfdf5"; Icon = CheckCircle;
                  } else if (d.status_absen === "rejected" || d.keterangan === "Alfa (Tidak Piket)") {
                    statusColor = "#ef4444"; bgStatus = "#fef2f2"; Icon = XCircle;
                  } else if (d.status_absen === "pending") {
                    statusColor = "#f59e0b"; bgStatus = "#fffbeb"; Icon = Clock;
                  } else if (d.keterangan === "Belum Mulai") {
                    statusColor = "#3b82f6"; bgStatus = "#eff6ff"; Icon = Calendar;
                  }

                  return (
                    <div key={idx} style={{ 
                      display: "flex", justifyContent: "space-between", alignItems: "center", 
                      padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                    }}>
                      <div>
                        <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "4px", fontSize: "0.95rem" }}>
                          {new Date(d.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "var(--border)" }}></span>
                          Lokasi: {d.lokasi}
                        </div>
                      </div>
                      <div style={{ 
                        display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", 
                        borderRadius: "20px", background: bgStatus, color: statusColor, fontSize: "0.85rem", fontWeight: "600"
                      }}>
                        <Icon size={14} />
                        {d.keterangan}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>, document.body
      )}
    </>
  );
}
