"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Camera, 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  Mail, 
  Users, 
  LogOut,
  X,
  Wallet,
  Activity,
  UserCheck,
  ChevronDown
} from "lucide-react";

export default function SidebarSekretaris({ isMobileOpen, setIsMobileOpen }: { isMobileOpen?: boolean, setIsMobileOpen?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const toggleSubMenu = (name: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const links = [
    { name: "Dashboard", path: "/sekretaris/dashboard", icon: <Home size={22} /> },
    { 
      name: "Kelola Surat", 
      icon: <FileText size={22} />, 
      subMenu: [
        { name: "Buat Surat", path: "/sekretaris/surat/buat" },
        { name: "Template Surat", path: "/sekretaris/template" },
        { name: "Riwayat Surat", path: "/sekretaris/surat" }
      ]
    },
  ];

  const sidebarWidth = isHovered ? "260px" : "80px";

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
      ></div>

      {/* Spacer to prevent layout shift when sidebar expands */}
      <div className="sidebar-spacer" style={{ width: "80px", flexShrink: 0, transition: "width 0.3s ease" }}></div>

      <aside 
        className={`sidebar-aside ${isMobileOpen ? 'mobile-open' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: sidebarWidth,
          backgroundColor: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 90,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden",
          whiteSpace: "nowrap",
          boxShadow: isHovered ? "10px 0 15px -3px rgba(0, 0, 0, 0.1)" : "none"
        }}
      >
        <div style={{ padding: isHovered ? "24px" : "24px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", minHeight: "89px", transition: "padding 0.3s ease" }}>
          <div style={{ 
            minWidth: "40px", width: "40px", height: "40px", borderRadius: "10px", 
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold",
            transition: "all 0.3s ease"
          }}>
            DRC
          </div>
          <h2 style={{ 
            fontSize: "1.2rem", color: "var(--text-main)", fontWeight: "700", 
            opacity: isHovered || isMobileOpen ? 1 : 0, 
            marginLeft: isHovered || isMobileOpen ? "16px" : "0", 
            width: isHovered || isMobileOpen ? "auto" : 0,
            overflow: "hidden",
            transition: "all 0.3s ease" 
          }}>
            Absensi Piket
          </h2>
          
          {/* Close button on mobile */}
          {isMobileOpen && (
            <button 
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", padding: "4px" }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: isHovered || isMobileOpen ? "24px 12px" : "24px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {links.map((link: any) => {
            if (link.subMenu) {
              const isOpen = openSubMenus[link.name];
              const isActive = link.subMenu.some((sub: any) => pathname === sub.path);
              
              return (
                <div key={link.name} style={{ display: "flex", flexDirection: "column" }}>
                  <button
                    onClick={() => {
                      if (!isHovered && !isMobileOpen) {
                        setIsHovered(true);
                      }
                      toggleSubMenu(link.name);
                    }}
                    style={{
                      display: "flex", alignItems: "center", padding: "12px",
                      borderRadius: "var(--radius-sm)", 
                      color: isActive ? "var(--primary)" : "var(--text-muted)",
                      backgroundColor: isActive ? "rgba(79, 172, 254, 0.05)" : "transparent",
                      fontWeight: isActive ? "600" : "500",
                      transition: "all 0.2s",
                      justifyContent: "space-between",
                      border: "none",
                      cursor: "pointer",
                      width: "100%"
                    }}
                    title={(!isHovered && !isMobileOpen) ? link.name : ""}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ 
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        minWidth: "24px", 
                        marginLeft: (isHovered || isMobileOpen) ? "0" : "4px", 
                        transition: "margin 0.3s ease"
                      }}>
                        {link.icon}
                      </span>
                      <span style={{ 
                        opacity: (isHovered || isMobileOpen) ? 1 : 0, 
                        marginLeft: (isHovered || isMobileOpen) ? "16px" : "0", 
                        width: (isHovered || isMobileOpen) ? "auto" : 0,
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        whiteSpace: "nowrap"
                      }}>
                        {link.name}
                      </span>
                    </div>
                    <div style={{ 
                      opacity: (isHovered || isMobileOpen) ? 1 : 0, 
                      transition: "all 0.3s ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      <ChevronDown size={16} />
                    </div>
                  </button>

                  <div style={{ 
                    overflow: "hidden", 
                    transition: "all 0.3s ease",
                    maxHeight: (isOpen && (isHovered || isMobileOpen)) ? "200px" : "0",
                    opacity: (isOpen && (isHovered || isMobileOpen)) ? 1 : 0
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", paddingLeft: "40px", gap: "4px", paddingTop: "4px" }}>
                      {link.subMenu.map((sub: any) => (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                          style={{
                            display: "block", padding: "8px 12px",
                            borderRadius: "var(--radius-sm)", 
                            color: pathname === sub.path ? "var(--primary)" : "var(--text-muted)",
                            backgroundColor: pathname === sub.path ? "rgba(79, 172, 254, 0.1)" : "transparent",
                            fontWeight: pathname === sub.path ? "600" : "500",
                            transition: "all 0.2s",
                            fontSize: "0.9rem"
                          }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link 
                key={link.path} 
                href={link.path}
                onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", padding: "12px",
                  borderRadius: "var(--radius-sm)", color: pathname === link.path ? "var(--primary)" : "var(--text-muted)",
                  backgroundColor: pathname === link.path ? "rgba(79, 172, 254, 0.1)" : "transparent",
                  fontWeight: pathname === link.path ? "600" : "500",
                  transition: "all 0.2s",
                  justifyContent: "flex-start" // Always flex-start, we will control centering via icon margins if needed
                }}
                title={(!isHovered && !isMobileOpen) ? link.name : ""}
              >
                <span style={{ 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  minWidth: "24px", 
                  marginLeft: (isHovered || isMobileOpen) ? "0" : "4px", 
                  transition: "margin 0.3s ease"
                }}>
                  {link.icon}
                </span>
                <span style={{ 
                  opacity: (isHovered || isMobileOpen) ? 1 : 0, 
                  marginLeft: (isHovered || isMobileOpen) ? "16px" : "0", 
                  width: (isHovered || isMobileOpen) ? "auto" : 0,
                  overflow: "hidden",
                  transition: "all 0.3s ease" 
                }}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "24px 12px", borderTop: "1px solid var(--border)" }}>
          <button 
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", padding: "12px", width: "100%",
              borderRadius: "var(--radius-sm)", color: "#ef4444", background: "transparent", border: "none",
              fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
              justifyContent: "flex-start"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            title={(!isHovered && !isMobileOpen) ? "Logout" : ""}
          >
            <span style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", 
              minWidth: "24px",
              marginLeft: (isHovered || isMobileOpen) ? "0" : "4px",
              transition: "margin 0.3s ease"
            }}>
              <LogOut size={22} />
            </span>
            <span style={{ 
              opacity: (isHovered || isMobileOpen) ? 1 : 0, 
              marginLeft: (isHovered || isMobileOpen) ? "16px" : "0",
              width: (isHovered || isMobileOpen) ? "auto" : 0,
              overflow: "hidden",
              transition: "all 0.3s ease" 
            }}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
