"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarSekretaris from "@/components/SidebarSekretaris";
import Topbar from "@/components/Topbar";

export default function SekretarisLayout({ children }: { children: React.ReactNode }) {
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
      if (parsedUser.role !== "sekretaris" && parsedUser.role !== "admin") {
        router.push("/dashboard");
      } else {
        setUser(parsedUser);
      }
    }
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
      <SidebarSekretaris isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", overflow: "hidden", minHeight: "100vh" }}>
        <Topbar title="Sekretaris Dashboard" user={user} setIsMobileOpen={setIsMobileOpen} />
        <main className="main-content" style={{ padding: "24px 32px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
