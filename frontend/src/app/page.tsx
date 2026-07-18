"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "168227286058-eadtrvmco5m1g10ucdd8q5m6g076r2qu.apps.googleusercontent.com";


export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'siadin' | 'drc'>('siadin');
  const router = useRouter();

  const processLoginSuccess = (data: any) => {
    // Simpan token
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    const u = data.user;
    const isInventaris = u.jabatan && (u.jabatan.includes('Inventaris') || u.jabatan.includes('Ketua Umum'));

    if (u.role === "admin") {
      Swal.fire({
        title: 'Pilih Akses',
        input: 'select',
        inputOptions: {
          'admin': 'Admin',
          'bendahara': 'Bendahara',
          'sekretaris': 'Sekretaris',
          'inventaris': 'Inventaris',
          'user': 'User Biasa'
        },
        inputPlaceholder: 'Pilih Dashboard',
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Masuk',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
          return new Promise((resolve) => {
            if (value) {
              resolve();
            } else {
              resolve('Anda harus memilih akses!');
            }
          });
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          localStorage.setItem("activeRole", result.value);
          if (result.value === 'admin') router.push("/admin/dashboard");
          else if (result.value === 'bendahara') router.push("/bendahara/dashboard");
          else if (result.value === 'sekretaris') router.push("/sekretaris/dashboard");
          else if (result.value === 'inventaris') router.push("/inventaris/dashboard");
          else router.push("/dashboard");
        }
      });
    } else if (u.role === "bendahara") {
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
    } else if (u.role === "sekretaris") {
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
    } else if (isInventaris) {
      Swal.fire({
        title: 'Pilih Akses',
        text: 'Login sebagai Inventaris atau User?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#10b981',
        confirmButtonText: 'Masuk sebagai Inventaris',
        cancelButtonText: 'Masuk sebagai User'
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.setItem("activeRole", "inventaris");
          router.push("/inventaris/dashboard");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          localStorage.setItem("activeRole", "user");
          router.push("/dashboard");
        }
      });
    } else {
      localStorage.setItem("activeRole", "user");
      router.push("/dashboard");
    }
  };

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
        processLoginSuccess(data);
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal login dengan Google");
      } else {
        processLoginSuccess(data);
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--text-muted)', opacity: 0.3 }}></div>
          <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ATAU</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--text-muted)', opacity: 0.3 }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError("Login Google gagal.");
            }}
            useOneTap
            shape="rectangular"
            theme="outline"
          />
        </div>
        
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>© 2025 Sistem Absensi Piket</p>
        </div>
      </div>
    </div>
    </GoogleOAuthProvider>
  );
}
