"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { FileText, Trash, Plus, Eye, Download, X } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import html2pdf from "html2pdf.js";

const A4_WIDTH_PX = 794;

export default function RiwayatSurat() {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const fetchRiwayat = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/surat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setRiwayat(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRiwayat();
    fetchTemplates();
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth - 96;
        const scale = Math.min(1, containerW / A4_WIDTH_PX);
        setPreviewScale(scale);
      }
    };
    if (previewItem) {
      setTimeout(updateScale, 50);
    }
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [previewItem]);

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus Riwayat Surat?',
      text: 'Data riwayat pembuatan surat ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/surat/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Terhapus!', 'Riwayat berhasil dihapus.', 'success');
        fetchRiwayat();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePreview = (item: any) => {
    // Gabungkan data_json dengan template
    const template = templates.find(t => t.id === item.template_id);
    const dataJson = typeof item.data_json === "string" ? JSON.parse(item.data_json) : item.data_json;
    setPreviewItem({ ...item, template, formData: dataJson, selectedUsers: dataJson?.selectedUsers || [] });
  };

  const formatTanggal = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const renderHTML = useCallback(() => {
    if (!previewItem?.template || !previewItem?.formData) return "";
    const { formData, selectedUsers, template } = previewItem;

    let tabelAnggota = "";
    if (template.has_tabel_anggota) {
      tabelAnggota = `
        <div style="page-break-before: always; clear: both; height: 0;"></div>
        
        <div style="margin-bottom: 12px; margin-top: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px;">
            <img src="/logo/udinus.png" alt="Logo Udinus" style="width: 75px; height: 75px; flex-shrink: 0;" />
            <div style="flex: 1; text-align: center; line-height: 1.35; padding: 0 12px;">
              <div style="font-weight: bold; font-size: 15pt; color: #003399; letter-spacing: 0.5px;">DINUS ROBOTIC CLUB</div>
              <div style="font-weight: bold; font-size: 11pt; color: #003399;">UNIVERSITAS DIAN NUSWANTORO</div>
              <div style="font-size: 8.5pt; color: #003399; margin-top: 3px;">Sekretariat : Kampus Udinus Gedung I Lantai 1</div>
              <div style="font-size: 8.5pt; color: #003399;">Jalan Nakula 1 nomor 5-11 Semarang 50131 Telepon (024) 3573733</div>
            </div>
            <img src="/logo/DRC_logo.png" alt="Logo DRC" style="width: auto; height: 75px; flex-shrink: 0;" />
          </div>
          <div style="border-bottom: 3px solid #003399; width: 100%;"></div>
        </div>

        <div style="font-family: 'Times New Roman', serif; font-size: 11pt; margin-bottom: 16px; margin-top: 20px;">
          <strong>Lampiran: Daftar Peserta / Anggota</strong>
        </div>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 11pt; page-break-inside: auto;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid black; padding: 6px; text-align: center; width: 8%;">NO</th>
              <th style="border: 1px solid black; padding: 6px; text-align: left; width: 50%;">NAMA</th>
              <th style="border: 1px solid black; padding: 6px; text-align: center; width: 42%;">NIM</th>
            </tr>
          </thead>
          <tbody>
            ${selectedUsers.length > 0
              ? selectedUsers.map((u: any, i: number) => `
                  <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${i + 1}.</td>
                    <td style="border: 1px solid black; padding: 6px;">${u.nama_lengkap}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${u.nim || '-'}</td>
                  </tr>`).join("")
              : `<tr><td colspan="3" style="border: 1px solid black; padding: 8px; text-align: center;">(Tidak ada anggota)</td></tr>`
            }
          </tbody>
        </table>`;
    }

    const tandaTangan = `
      <div style="margin-top: 40px; font-family: 'Times New Roman', serif; font-size: 11pt;">
        <p style="margin: 0 0 20px 0;">${formData.kota || "Semarang"}, ${formatTanggal(formData.tanggal_surat)}</p>
        <div style="display: flex; justify-content: space-between; gap: 20px;">
          <div style="text-align: center; min-width: 180px;">
            <p style="margin: 0 0 4px 0;">${formData.jabatan_1 || "Ketua Dinus Robotic Club"}</p>
            <br/><br/><br/>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${formData.nama_1 || "(................................)"}</p>
            <p style="margin: 0;">${formData.npp_1 ? `NPP. ${formData.npp_1}` : ""}</p>
          </div>
          <div style="text-align: center; min-width: 180px;">
            <p style="margin: 0 0 4px 0;">${formData.jabatan_2 || "Ketua Tim"}</p>
            <br/><br/><br/>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${formData.nama_2 || "(................................)"}</p>
            <p style="margin: 0;">${formData.npp_2 ? `NIM. ${formData.npp_2}` : ""}</p>
          </div>
        </div>
        ${(formData.nama_3 || formData.jabatan_3 || formData.nama_4 || formData.jabatan_4) ? `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 30px; margin-top: 30px;">
          ${(formData.nama_3 || formData.jabatan_3) ? `
          <div style="text-align: center; min-width: 250px;">
            <p style="margin: 0 0 4px 0; font-weight: bold;">${(formData.jabatan_3 || "Mengetahui,").replace(/\\n/g, '<br/>')}</p>
            <br/><br/><br/>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${formData.nama_3 || "(................................)"}</p>
            <p style="margin: 0;">${formData.npp_3 || ""}</p>
          </div>` : ""}
          ${(formData.nama_4 || formData.jabatan_4) ? `
          <div style="text-align: center; min-width: 250px;">
            <p style="margin: 0 0 4px 0; font-weight: bold;">${(formData.jabatan_4 || "Menyetujui,").replace(/\\n/g, '<br/>')}</p>
            <br/><br/><br/>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${formData.nama_4 || "(................................)"}</p>
            <p style="margin: 0;">${formData.npp_4 || ""}</p>
          </div>` : ""}
        </div>` : ""}
      </div>`;

    let html = template.konten_html || "";
    
    // Konversi newline ke <br/> jika itu teks biasa
    if (!html.includes("<p>") && !html.includes("<br")) {
      html = html.replace(/\n/g, '<br/>');
    }
    
    // Ganti variabel jika ada
    html = html.replace(/{{NO_SURAT}}/g, formData.no_surat || "___/DRC/___/____");
    html = html.replace(/{{TANGGAL}}/g, formatTanggal(formData.tanggal_surat));
    html = html.replace(/{{TUJUAN}}/g, formData.tujuan_nama || "...");
    html = html.replace(/{{TUJUAN_JABATAN}}/g, formData.tujuan_jabatan || "...");
    html = html.replace(/{{TUJUAN_INSTANSI}}/g, formData.tujuan_instansi || "...");
    html = html.replace(/{{HAL}}/g, formData.hal || "...");
    
    // Tambahkan blok rincian kegiatan & penutup (Fixed Block)
    html += `
<table style="border-collapse: collapse; margin: 16px 0; font-size: 11pt;">
  <tr><td style="width: 90px; padding: 3px 0;">Hari</td><td style="padding: 3px 0;">: ${formData.hari || "..."}</td></tr>
  <tr><td style="padding: 3px 0;">Tanggal</td><td style="padding: 3px 0;">: ${formData.tanggal_kegiatan || "..."}</td></tr>
  <tr><td style="padding: 3px 0;">Tempat</td><td style="padding: 3px 0;">: ${formData.tempat || "..."}</td></tr>
</table>

<div style="text-align: justify; margin-bottom: 24px;">Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kebijaksanaan Bapak/Ibu, kami ucapkan terima kasih.</div>
`;

    // Hapus variabel tabel anggota jika masih ada di sisa HTML
    html = html.replace(/{{TABEL_ANGGOTA}}/g, "");
    
    // Tambahkan tanda tangan
    html += tandaTangan;
    
    // Tambahkan tabel anggota di akhir sebagai lampiran
    html += tabelAnggota;
    
    return html;
  }, [previewItem]);

  const handleDownloadPDF = () => {
    if (!previewRef.current || !previewItem) return;
    const element = previewRef.current;
    
    // Save original transform and remove it temporarily for accurate PDF capture
    const originalTransform = element.style.transform;
    element.style.transform = "none";
    
    const opt: any = {
      margin: 0,
      filename: `Surat_${(previewItem.no_surat || "DRC").replaceAll('/', '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: element.scrollWidth },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      // Restore transform
      element.style.transform = originalTransform;
    });
  };

  return (
    <div style={{ width: "100%", animation: "fadeIn 0.5s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
            Riwayat Surat
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Daftar surat yang pernah di-generate oleh sekretaris.
          </p>
        </div>
        <Link href="/sekretaris/surat/buat" className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", textDecoration: "none" }}>
          <Plus size={20} /> Buat Surat Baru
        </Link>
      </div>

      <div className="surface-card">
        {riwayat.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <FileText size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p>Belum ada riwayat pembuatan surat.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", padding: "12px 24px 24px" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "0 16px 12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>No. Surat</th>
                  <th style={{ padding: "0 16px 12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Jenis Template</th>
                  <th style={{ padding: "0 16px 12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tujuan</th>
                  <th style={{ padding: "0 16px 12px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tanggal Surat</th>
                  <th style={{ padding: "0 16px 12px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((item) => (
                  <tr key={item.id} style={{ backgroundColor: "var(--bg-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", borderRadius: "12px", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)"; }} onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)"; }}>
                    <td style={{ padding: "16px", fontWeight: "600", color: "var(--primary)", borderTopLeftRadius: "12px", borderBottomLeftRadius: "12px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)" }}>{item.no_surat}</td>
                    <td style={{ padding: "16px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ padding: "6px 12px", backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>
                        {item.nama_template}
                      </span>
                    </td>
                    <td style={{ padding: "16px", color: "var(--text-main)", fontWeight: "500", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>{item.tujuan_surat || "-"}</td>
                    <td style={{ padding: "16px", color: "var(--text-muted)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>{new Date(item.tanggal_surat).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                    <td style={{ padding: "16px", borderTopRightRadius: "12px", borderBottomRightRadius: "12px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => handlePreview(item)}
                          style={{ padding: "6px 10px", backgroundColor: "rgba(79, 172, 254, 0.1)", border: "none", borderRadius: "var(--radius-sm)", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem" }}
                          title="Lihat Preview"
                        >
                          <Eye size={15} /> Lihat
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{ padding: "6px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "none", borderRadius: "var(--radius-sm)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center" }}
                          title="Hapus Riwayat"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Preview Surat */}
      {previewItem && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
          {/* Modal Toolbar */}
          <div style={{ backgroundColor: "var(--surface)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", margin: 0 }}>{previewItem.no_surat}</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>{previewItem.nama_template}</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleDownloadPDF}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", padding: "8px 14px" }}
              >
                <Download size={15} /> Unduh PDF
              </button>
              <button
                onClick={() => setPreviewItem(null)}
                style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Preview Paper */}
          <div ref={containerRef} style={{ flex: 1, overflowY: "auto", backgroundColor: "#cbd5e1", padding: "32px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: `${A4_WIDTH_PX * previewScale}px`, flexShrink: 0 }}>
              <div
                ref={previewRef}
                style={{
                  width: `${A4_WIDTH_PX}px`,
                  minHeight: "297mm",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  padding: "20mm 25mm",
                  color: "#000",
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: "11pt",
                  lineHeight: "1.5",
                  transformOrigin: "top left",
                  transform: `scale(${previewScale})`,
                }}
              >
                {/* KOP SURAT */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "8px" }}>
                    <img src="/logo/udinus.png" alt="Logo Udinus" style={{ width: "75px", height: "75px", flexShrink: 0 }} />
                    <div style={{ flex: 1, textAlign: "center", lineHeight: "1.35", padding: "0 12px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "15pt", color: "#003399" }}>DINUS ROBOTIC CLUB</div>
                      <div style={{ fontWeight: "bold", fontSize: "11pt", color: "#003399" }}>UNIVERSITAS DIAN NUSWANTORO</div>
                      <div style={{ fontSize: "8.5pt", color: "#003399", marginTop: "3px" }}>Sekretariat : Kampus Udinus Gedung I Lantai 1</div>
                      <div style={{ fontSize: "8.5pt", color: "#003399" }}>Jalan Nakula 1 nomor 5-11 Semarang 50131 Telepon (024) 3573733</div>
                    </div>
                    <img src="/logo/DRC_logo.png" alt="Logo DRC" style={{ width: "auto", height: "75px", flexShrink: 0 }} />
                  </div>
                  <div style={{ borderBottom: "3px solid #003399", width: "100%" }} />
                </div>

                {/* Nomor, Lampiran, Hal */}
                <table style={{ width: "100%", marginBottom: "12px", fontSize: "11pt", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "100px", padding: "1px 0" }}>Nomor</td>
                      <td style={{ width: "16px", padding: "1px 0" }}>:</td>
                      <td style={{ padding: "1px 0" }}>{previewItem.formData?.no_surat || previewItem.no_surat}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "1px 0" }}>Lampiran</td>
                      <td style={{ padding: "1px 0" }}>:</td>
                      <td style={{ padding: "1px 0" }}>{previewItem.formData?.lampiran || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "1px 0" }}>Hal</td>
                      <td style={{ padding: "1px 0" }}>:</td>
                      <td style={{ fontWeight: "bold", padding: "1px 0" }}>{previewItem.formData?.hal || "..."}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Kepada */}
                <div style={{ marginBottom: "16px" }}>
                  <div>Kepada Yth.</div>
                  {previewItem.formData?.tujuan_jabatan && <div>{previewItem.formData.tujuan_jabatan}</div>}
                  {previewItem.formData?.tujuan_nama && <div>{previewItem.formData.tujuan_nama}</div>}
                  {previewItem.formData?.tujuan_instansi && <div>{previewItem.formData.tujuan_instansi}</div>}
                  <div>Di Tempat</div>
                </div>

                <div style={{ marginBottom: "16px" }}>Dengan hormat,</div>

                {/* Konten */}
                <div dangerouslySetInnerHTML={{ __html: renderHTML() }} style={{ lineHeight: "1.6" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
