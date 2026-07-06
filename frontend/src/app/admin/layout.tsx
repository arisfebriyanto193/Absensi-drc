"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      if (parsedUser.role !== "admin") {
        router.push("/dashboard");
      } else {
        setUser(parsedUser);
      }
    }
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
      <Sidebar role={user.role} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", overflow: "hidden" }}>
        <Topbar title="Admin Dashboard" user={user} setIsMobileOpen={setIsMobileOpen} />
        <main className="main-content" style={{ padding: "32px", flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
