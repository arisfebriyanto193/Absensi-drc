"use client";

import { Menu } from "lucide-react";

export default function Topbar({ title, user, setIsMobileOpen }: { title: string, user: any, setIsMobileOpen?: any }) {
  return (
    <header style={{
      backgroundColor: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      padding: "16px 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button 
          className="hamburger-btn" 
          onClick={() => setIsMobileOpen && setIsMobileOpen(true)}
        >
          <Menu size={24} />
        </button>
        <h1 className="topbar-title" style={{ fontSize: "1.5rem", color: "var(--text-main)" }}>{title}</h1>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: "600", fontSize: "0.95rem" }}>{user?.nama_lengkap || "User"}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{user?.role || "user"}</p>
        </div>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          backgroundColor: "var(--primary)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "bold", fontSize: "1.2rem"
        }}>
          {user?.nama_lengkap?.charAt(0) || "U"}
        </div>
      </div>
    </header>
  );
}
