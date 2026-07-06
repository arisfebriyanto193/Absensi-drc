"use client";

import { useEffect, useState } from "react";
import { Shield, User as UserIcon, Edit, Trash2, X, Save } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nim: "",
    username: "",
    email: "",
    role: "user",
    password: ""
  });

  const fetchUsers = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) setUsers(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setFormData({
      nama_lengkap: user.nama_lengkap || "",
      nim: user.nim || "",
      username: user.username || "",
      email: user.email || "",
      role: user.role || "user",
      password: "" // password field starts empty, only changed if user types
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    const confirmResult = await Swal.fire({
      title: 'Hapus User?',
      text: 'Yakin ingin menghapus user ini?',
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'User berhasil dihapus', confirmButtonColor: 'var(--primary)' });
        fetchUsers();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message || "Gagal menghapus user", confirmButtonColor: 'var(--primary)' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan', confirmButtonColor: 'var(--primary)' });
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data user berhasil diperbarui!', confirmButtonColor: 'var(--primary)' });
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message || "Gagal memperbarui user", confirmButtonColor: 'var(--primary)' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan', confirmButtonColor: 'var(--primary)' });
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;

  return (
    <>
      <div className="fade-in">
        <div className="surface-card">
          <h2 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "var(--text-main)", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
            Kelola Users
          </h2>

          {users.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.02)", textAlign: "left" }}>
                    <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Nama Lengkap</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>NIM</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Username</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Email</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>Role</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.2s", transform: "none" }} className="hover-scale" onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.01)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{u.nama_lengkap}</td>
                      <td style={{ padding: "12px", color: "var(--text-muted)" }}>{u.nim || "-"}</td>
                      <td style={{ padding: "12px" }}>{u.username}</td>
                      <td style={{ padding: "12px", color: "var(--text-muted)" }}>{u.email || "-"}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ 
                          padding: "6px 12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600",
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          backgroundColor: u.role === 'admin' ? "rgba(118, 75, 162, 0.15)" : "rgba(79, 172, 254, 0.15)",
                          color: u.role === 'admin' ? "var(--accent)" : "var(--primary)"
                        }}>
                          {u.role === 'admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button 
                            onClick={() => handleEditClick(u)}
                            style={{ background: "#e0f2fe", color: "#0284c7", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(u.id)}
                            style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Hapus User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              Belum ada user.
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div className="fade-in" style={{
            background: "white", width: "100%", maxWidth: "500px", borderRadius: "20px",
            padding: "32px", maxHeight: "90vh", overflowY: "auto", position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              style={{ 
                position: "absolute", top: "24px", right: "24px", background: "#f1f5f9", border: "none", 
                cursor: "pointer", color: "#64748b", width: "36px", height: "36px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" 
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <Edit size={22} color="var(--primary)" /> Edit User
            </h2>

            <form onSubmit={handleUpdateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#475569" }}>Nama Lengkap *</label>
                <input 
                  type="text" required value={formData.nama_lengkap} 
                  onChange={e => setFormData({...formData, nama_lengkap: e.target.value})}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.95rem" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#475569" }}>Username *</label>
                  <input 
                    type="text" required value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.95rem" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#475569" }}>NIM</label>
                  <input 
                    type="text" value={formData.nim} 
                    onChange={e => setFormData({...formData, nim: e.target.value})}
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.95rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#475569" }}>Email</label>
                <input 
                  type="email" value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.95rem" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#475569" }}>Role *</label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.95rem", backgroundColor: "white" }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#475569" }}>Password Baru</label>
                  <input 
                    type="password" value={formData.password} 
                    placeholder="Kosongkan jika tidak diganti"
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.95rem" }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                style={{ 
                  width: "100%", padding: "14px", marginTop: "12px",
                  background: "var(--primary)", color: "white", border: "none", 
                  borderRadius: "12px", fontWeight: "600", fontSize: "1rem",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 6px -1px rgba(79, 172, 254, 0.3)"
                }}
              >
                <Save size={18} /> Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
