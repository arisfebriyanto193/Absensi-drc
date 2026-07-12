"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'siadin' | 'drc'>('siadin');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, loginMethod }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal login");
      } else {
        // Simpan token
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "admin") {
          Swal.fire({
            title: 'Pilih Akses',
            text: 'Login sebagai Admin atau User?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#10b981',
            confirmButtonText: 'Masuk sebagai Admin',
            cancelButtonText: 'Masuk sebagai User'
          }).then((result) => {
            if (result.isConfirmed) {
              localStorage.setItem("activeRole", "admin");
              router.push("/admin/dashboard");
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              localStorage.setItem("activeRole", "user");
              router.push("/dashboard");
            }
          });
        } else if (data.user.role === "bendahara") {
          Swal.fire({
            title: 'Pilih Akses',
            text: 'Login sebagai Bendahara atau User?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#10b981',
            confirmButtonText: 'Masuk sebagai Bendahara',
            cancelButtonText: 'Masuk sebagai User'
          }).then((result) => {
            if (result.isConfirmed) {
              localStorage.setItem("activeRole", "bendahara");
              router.push("/bendahara/dashboard");
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              localStorage.setItem("activeRole", "user");
              router.push("/dashboard");
            }
          });
        } else if (data.user.role === "sekretaris") {
          Swal.fire({
            title: 'Pilih Akses',
            text: 'Login sebagai Sekretaris atau User?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#10b981',
            confirmButtonText: 'Masuk sebagai Sekretaris',
            cancelButtonText: 'Masuk sebagai User'
          }).then((result) => {
            if (result.isConfirmed) {
              localStorage.setItem("activeRole", "sekretaris");
              router.push("/sekretaris/dashboard");
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              localStorage.setItem("activeRole", "user");
              router.push("/dashboard");
            }
          });
        } else {
          localStorage.setItem("activeRole", "user");
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
        
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "8px", color: "var(--text-main)" }}>Sistem Absensi Piket</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Silakan pilih metode login</p>
        </div>

        <div style={{ display: 'flex', marginBottom: '25px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--text-main)' }}>
          <button 
            type="button"
            onClick={() => { setLoginMethod('siadin'); setError(""); }}
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: 'none', 
              backgroundColor: loginMethod === 'siadin' ? 'var(--text-main)' : 'transparent',
              color: loginMethod === 'siadin' ? 'white' : 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: loginMethod === 'siadin' ? '600' : 'normal',
              transition: 'all 0.2s',
              fontSize: '0.9rem'
            }}
          >
            Login SIADIN
          </button>
          <button 
            type="button"
            onClick={() => { setLoginMethod('drc'); setError(""); }}
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: 'none', 
              backgroundColor: loginMethod === 'drc' ? 'var(--text-main)' : 'transparent',
              color: loginMethod === 'drc' ? 'white' : 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: loginMethod === 'drc' ? '600' : 'normal',
              transition: 'all 0.2s',
              fontSize: '0.9rem'
            }}
          >
            Akun Lokal DRC
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              {loginMethod === 'siadin' ? 'NIM' : 'NIM / Username'}
            </label>
            <input 
              id="username"
              type="text" 
              className="form-input" 
              placeholder={loginMethod === 'siadin' ? "Masukkan NIM SIADIN" : "Masukkan NIM / username lokal"} 
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
              placeholder={loginMethod === 'siadin' ? "Masukkan password SIADIN" : "Masukkan password lokal"}
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
