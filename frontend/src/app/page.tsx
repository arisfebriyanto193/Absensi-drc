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
    <div className="min-h-screen flex-center relative" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="login-container surface-card fade-in">
        
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "8px", color: "var(--text-main)" }}>Sistem Absensi Piket</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Silakan login untuk melanjutkan</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">NIM / Username</label>
            <input 
              id="username"
              type="text" 
              className="form-input" 
              placeholder="Masukkan NIM / username" 
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
          
          <button 
            type="submit" 
            className="btn btn-block" 
            disabled={loading} 
            style={{ 
              marginTop: "10px", 
              backgroundColor: "var(--text-main)", 
              color: "white" 
            }}
          >
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
