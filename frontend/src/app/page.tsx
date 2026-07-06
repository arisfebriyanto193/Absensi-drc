"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal login");
      } else {
        // Simpan token
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg min-h-screen flex-center relative overflow-hidden">
      <div 
        style={{
          position: "absolute", top: "10%", left: "10%", width: "300px", height: "300px",
          background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(60px)"
        }}
      />
      <div 
        style={{
          position: "absolute", bottom: "10%", right: "10%", width: "400px", height: "400px",
          background: "rgba(118,75,162,0.15)", borderRadius: "50%", filter: "blur(80px)"
        }}
      />
      
      <div className="login-container glass-card fade-in">
        <div className="login-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 className="text-gradient" style={{ fontSize: "2rem", marginBottom: "8px" }}>Sistem Absensi Piket</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Silakan login untuk melanjutkan</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              className="form-input" 
              placeholder="Masukkan username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="form-input" 
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: "10px" }}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>© 2025 Sistem Absensi Piket</p>
        </div>
      </div>
    </div>
  );
}
