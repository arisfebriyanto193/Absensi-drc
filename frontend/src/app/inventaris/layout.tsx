"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarInventaris from "@/components/SidebarInventaris";
import Topbar from "@/components/Topbar";

export default function InventarisLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/");
    } else {
      const parsedUser = JSON.parse(storedUser);
      const isInventaris = parsedUser.jabatan && (parsedUser.jabatan.includes('Inventaris') || parsedUser.jabatan.includes('Ketua Umum'));
      
      if (!isInventaris && parsedUser.role !== 'admin') {
        router.push("/dashboard");
      } else {
        setUser(parsedUser);
      }
    }
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
      <SidebarInventaris isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", overflow: "hidden", minHeight: "100vh" }}>
        <Topbar title="Dashboard Inventaris" user={user} setIsMobileOpen={setIsMobileOpen} />
        <main className="main-content" style={{ padding: "24px 32px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
