"use client";

import { useEffect, useState } from "react";
import { User, Mail, CreditCard, Save, Lock, AlertCircle, Info } from "lucide-react";

export default function UserProfil() {
  const [profil, setProfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nim: "",
    email: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/dashboard', '')}/api/user/profil`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setProfil(data);
      setFormData({
        nama_lengkap: data.nama_lengkap || "",
        nim: data.nim || "",
        email: data.email || ""
      });
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/dashboard', '')}/api/user/profil`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess("Profil berhasil diperbarui!");
        // Update local state and perhaps localStorage if nama_lengkap is stored there
        const resData = await res.json();
        // Option: localStorage.setItem('nama_lengkap', formData.nama_lengkap);
      } else {
        const errData = await res.json();
        setError(errData.message || "Gagal memperbarui profil");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat profil...</div>;

  return (
    <div className="fade-in max-w-3xl mx-auto pb-10">
      <div className="surface-card mb-6 p-6" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "white" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
          <User size={28} />
          Profil Saya
        </h1>
        <p style={{ opacity: 0.9 }}>Kelola informasi data diri dan akun Anda.</p>
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

      <div className="surface-card">
        <div style={{ display: "flex", alignItems: "center", gap: "20px", paddingBottom: "24px", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "2rem", fontWeight: "700" }}>
            {profil?.nama_lengkap ? profil.nama_lengkap.charAt(0).toUpperCase() : <User size={40} />}
          </div>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>{profil?.nama_lengkap}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              <Lock size={14} /> Username: <strong style={{ color: "var(--text-main)" }}>{profil?.username}</strong>
            </div>
            <span style={{ display: "inline-block", marginTop: "8px", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600", backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
              {profil?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)" }}>
                Nama Lengkap
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  name="nama_lengkap"
                  value={formData.nama_lengkap} 
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "12px 16px 12px 44px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", outline: "none" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)" }}>
                NIM
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                  <CreditCard size={18} />
                </div>
                <input 
                  type="text" 
                  name="nim"
                  value={formData.nim} 
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "12px 16px 12px 44px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", outline: "none" }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-main)" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px 16px 12px 44px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-color)", color: "var(--text-main)", outline: "none" }}
              />
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "6px" }}>Email digunakan untuk pengiriman notifikasi dan pemulihan akun.</p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
            <button 
              type="submit" 
              disabled={submitting}
              style={{
                padding: "12px 32px", borderRadius: "8px", border: "none",
                background: submitting ? "var(--border)" : "var(--primary)", color: "white", fontSize: "1rem", fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "all 0.2s"
              }}
            >
              {submitting ? "Menyimpan..." : <><Save size={18} /> Simpan Perubahan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
