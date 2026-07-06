"use client";

import { useEffect, useState } from "react";
import { FileSignature, Send, AlertCircle, Info, Calendar, Clock } from "lucide-react";

export default function UserIzin() {
  const [jadwalTersedia, setJadwalTersedia] = useState<any[]>([]);
  const [riwayatIzin, setRiwayatIzin] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [jadwalId, setJadwalId] = useState("");
  const [alasan, setAlasan] = useState("");
  const [fileBukti, setFileBukti] = useState<File | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const [resJadwal, resRiwayat] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/dashboard', '')}/api/user/izin/jadwal`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/dashboard', '')}/api/user/riwayat`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      const jadwal = await resJadwal.json();
      const riwayat = await resRiwayat.json();

      setJadwalTersedia(jadwal);
      if (riwayat.izin) {
        setRiwayatIzin(riwayat.izin);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jadwalId || !alasan || !fileBukti) {
      setError("Semua field wajib diisi (Jadwal, Alasan, File Bukti).");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("jadwal_id", jadwalId);
    formData.append("alasan", alasan);
    formData.append("file_bukti", fileBukti);

    // Temukan jadwal yang dipilih untuk mengambil tanggalnya
    const selectedJadwal = jadwalTersedia.find(j => j.id.toString() === jadwalId);
    if (selectedJadwal) {
      formData.append("tanggal_izin", selectedJadwal.tanggal);
    }

    const token = localStorage.getItem("token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/dashboard', '');

    try {
      const res = await fetch(`${baseUrl}/api/user/izin`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setSuccess("Pengajuan izin berhasil dikirim!");
        setJadwalId("");
        setAlasan("");
        setFileBukti(null);
        // Refresh data
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.message || "Gagal mengajukan izin");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

  return (
    <div className="fade-in max-w-4xl mx-auto pb-10">
      <div className="surface-card mb-6 p-6" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
          <FileSignature size={28} />
          Pengajuan Izin
        </h1>
        <p style={{ opacity: 0.9 }}>Ajukan izin jika Anda berhalangan untuk melaksanakan piket.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "16px", borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: "500" }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: "#d1fae5", color: "#065f46", padding: "16px", borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <Info size={20} />
          <span style={{ fontWeight: "500" }}>{success}</span>
        </div>
      )}

      <div className="surface-card mb-8">
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
          Form Izin
        </h2>

        {jadwalTersedia.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Calendar size={48} style={{ margin: "0 auto 16px", color: "var(--text-muted)", opacity: 0.5 }} />
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: "500" }}>Tidak ada jadwal piket yang tersedia untuk diajukan izin.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)" }}>
                Pilih Jadwal <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select 
                value={jadwalId} 
                onChange={(e) => setJadwalId(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", outline: "none" }}
              >
                <option value="">-- Pilih Jadwal --</option>
                {jadwalTersedia.map(j => (
                  <option key={j.id} value={j.id}>
                    {new Date(j.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {j.lokasi} ({j.jam_mulai} - {j.jam_selesai})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)" }}>
                Upload Bukti (Foto/PDF) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input 
                type="file" 
                accept="image/*,.pdf"
                onChange={(e) => setFileBukti(e.target.files?.[0] || null)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px dashed var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", cursor: "pointer" }}
              />
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "6px" }}>Maksimal ukuran file 2MB.</p>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)" }}>
                Alasan Izin <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea 
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Tuliskan alasan izin dengan jelas..."
                rows={4}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", outline: "none", resize: "vertical" }}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              style={{
                marginTop: "8px", width: "100%", padding: "14px", borderRadius: "8px", border: "none",
                background: submitting ? "var(--border)" : "#10b981", color: "white", fontSize: "1.05rem", fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", transition: "all 0.2s"
              }}
            >
              {submitting ? "Memproses..." : <><Send size={20} /> Kirim Pengajuan Izin</>}
            </button>
          </form>
        )}
      </div>

      <div className="surface-card">
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
          Riwayat Pengajuan Izin
        </h2>

        {riwayatIzin.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>Belum ada riwayat izin.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {riwayatIzin.map((izin: any) => (
              <div key={izin.id} style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", backgroundColor: "var(--bg-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h3 style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "1.1rem" }}>
                      {new Date(izin.tanggal_izin).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={14} /> Diajukan: {new Date(izin.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span style={{ 
                    padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600",
                    backgroundColor: izin.status === 'approved' ? "#d1fae5" : izin.status === 'rejected' ? "#fee2e2" : "#fef3c7",
                    color: izin.status === 'approved' ? "#065f46" : izin.status === 'rejected' ? "#991b1b" : "#92400e"
                  }}>
                    {izin.status.toUpperCase()}
                  </span>
                </div>
                
                <div style={{ backgroundColor: "rgba(0,0,0,0.03)", padding: "12px", borderRadius: "8px" }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" }}>Alasan:</p>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>{izin.alasan}</p>
                </div>
                
                {izin.status !== 'pending' && izin.keterangan_admin && (
                  <div style={{ marginTop: "12px", backgroundColor: "rgba(59, 130, 246, 0.1)", borderLeft: "4px solid #3b82f6", padding: "12px", borderRadius: "4px 8px 8px 4px" }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1d4ed8", marginBottom: "4px" }}>Keterangan Admin:</p>
                    <p style={{ fontSize: "0.95rem", color: "#1e3a8a" }}>{izin.keterangan_admin}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
