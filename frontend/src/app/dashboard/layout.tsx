"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      if (parsedUser.role !== "user") {
        router.push("/admin/dashboard");
      } else {
        setUser(parsedUser);
      }
    }
  }, [router]);

  if (!user) return null; // or loading spinner

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
      <Sidebar role={user.role} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", overflow: "hidden" }}>
        <Topbar title="User Dashboard" user={user} setIsMobileOpen={setIsMobileOpen} />
        <main className="main-content" style={{ padding: "32px", flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
