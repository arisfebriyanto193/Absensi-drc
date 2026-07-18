import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Absensi Piket",
  description: "Aplikasi Absensi Piket Modern",
};

import { PeriodeProvider } from "@/context/PeriodeContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <PeriodeProvider>
          {children}
        </PeriodeProvider>
      </body>
    </html>
  );
}
