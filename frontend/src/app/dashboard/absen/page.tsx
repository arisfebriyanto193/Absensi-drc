"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Send, AlertCircle, Info } from "lucide-react";
import Swal from "sweetalert2";

export default function UserAbsen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJadwalId = searchParams.get("jadwal_id");

  const [jadwalId, setJadwalId] = useState<string | null>(initialJadwalId);
  const [jadwalData, setJadwalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [fotoBefore, setFotoBefore] = useState<File | null>(null);
  const [fotoAfter, setFotoAfter] = useState<File | null>(null);
  const [previewBefore, setPreviewBefore] = useState("");
  const [previewAfter, setPreviewAfter] = useState("");
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    // Fetch today's schedule to get the ID if not provided, and to show details
    const token = localStorage.getItem("token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/dashboard', '') || '';
    fetch(`${baseUrl}/api/user/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.jadwal_hari_ini) {
        setJadwalData(data.jadwal_hari_ini);
        if (!jadwalId) setJadwalId(data.jadwal_hari_ini.id);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError("Gagal memuat jadwal hari ini.");
      setLoading(false);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      if (type === 'before') {
        setFotoBefore(file);
        setPreviewBefore(previewUrl);
      } else {
        setFotoAfter(file);
        setPreviewAfter(previewUrl);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jadwalId) {
      setError("Tidak ada jadwal piket yang valid untuk diabsen.");
      return;
    }
    if (!fotoBefore || !fotoAfter) {
      setError("Foto Before dan After wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("jadwal_id", jadwalId);
    formData.append("foto_before", fotoBefore);
    formData.append("foto_after", fotoAfter);
    formData.append("catatan", catatan);

    const token = localStorage.getItem("token");

    try {
      // The API endpoint for submitting absen is /api/user/absen
      // Let's assume the NEXT_PUBLIC_API_URL points to /api/user/dashboard, we need the base
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/dashboard', '');
      
      const res = await fetch(`${baseUrl}/api/user/absen`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Absensi berhasil dikirim dan menunggu konfirmasi admin.',
          confirmButtonColor: 'var(--primary)'
        }).then(() => {
          router.push("/dashboard");
        });
      } else {
        const errData = await res.json();
        setError(errData.message || "Gagal mengirim absensi");
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
      <div className="surface-card mb-6 p-6" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "white" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px" }}>Form Absensi Piket</h1>
        <p style={{ opacity: 0.9 }}>Upload foto bukti piket (sebelum dan sesudah dibersihkan)</p>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "16px", borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: "500" }}>{error}</span>
        </div>
      )}

      {jadwalData ? (
        <div className="surface-card mb-6" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <Info size={20} color="var(--primary)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Detail Jadwal Saat Ini</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Lokasi</p>
              <p style={{ fontWeight: "600", color: "var(--text-main)" }}>{jadwalData.lokasi}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Waktu</p>
              <p style={{ fontWeight: "600", color: "var(--text-main)" }}>{jadwalData.jam_mulai} - {jadwalData.jam_selesai}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="surface-card mb-6 text-center py-8">
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Anda tidak memiliki jadwal piket hari ini.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="surface-card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "24px" }}>
          
          {/* Foto Before */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)" }}>
              Foto Before <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>Kondisi area sebelum dibersihkan.</p>
            
            <div style={{ 
              border: "2px dashed var(--border)", borderRadius: "12px", padding: previewBefore ? "8px" : "32px", 
              textAlign: "center", position: "relative", backgroundColor: "var(--bg-color)", transition: "all 0.2s"
            }}>
              {previewBefore ? (
                <img src={previewBefore} alt="Preview Before" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }} />
              ) : (
                <div style={{ color: "var(--text-muted)" }}>
                  <Camera size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                  <p style={{ fontSize: "0.9rem", fontWeight: "500" }}>Klik atau Drop gambar di sini</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'before')}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
              />
            </div>
          </div>

          {/* Foto After */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)" }}>
              Foto After <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>Kondisi area setelah selesai dibersihkan.</p>
            
            <div style={{ 
              border: "2px dashed var(--border)", borderRadius: "12px", padding: previewAfter ? "8px" : "32px", 
              textAlign: "center", position: "relative", backgroundColor: "var(--bg-color)", transition: "all 0.2s"
            }}>
              {previewAfter ? (
                <img src={previewAfter} alt="Preview After" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }} />
              ) : (
                <div style={{ color: "var(--text-muted)" }}>
                  <Camera size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                  <p style={{ fontSize: "0.9rem", fontWeight: "500" }}>Klik atau Drop gambar di sini</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'after')}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
              />
            </div>
          </div>

        </div>

        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)" }}>
            Catatan (Opsional)
          </label>
          <textarea 
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tambahkan catatan khusus jika diperlukan..."
            rows={4}
            style={{ 
              width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)",
              backgroundColor: "var(--bg-color)", color: "var(--text-main)", outline: "none", resize: "vertical"
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting || (!jadwalId)}
          style={{
            width: "100%", padding: "16px", borderRadius: "12px", border: "none",
            background: submitting || !jadwalId ? "var(--border)" : "linear-gradient(135deg, var(--primary), var(--accent))",
            color: "white", fontSize: "1.1rem", fontWeight: "600", cursor: submitting || !jadwalId ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", transition: "all 0.2s"
          }}
        >
          {submitting ? (
            <span>Mengirim data...</span>
          ) : (
            <>
              <Send size={20} />
              <span>Kirim Absensi</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
