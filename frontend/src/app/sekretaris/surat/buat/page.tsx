"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Download, Save, ChevronDown, ChevronUp, Users, FileText, PenLine } from "lucide-react";
import Swal from "sweetalert2";
import html2pdf from "html2pdf.js";
import { PDFDocument } from "pdf-lib";

const A4_WIDTH_PX = 794;

export default function BuatSurat() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [lampiranFiles, setLampiranFiles] = useState<File[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    identitas: true,
    anggota: true,
    ttd: true,
  });

  const [formData, setFormData] = useState({
    no_surat: "",
    tanggal_surat: new Date().toISOString().split("T")[0],
    tujuan_nama: "",
    tujuan_jabatan: "",
    tujuan_instansi: "",
    hari: "",
    tanggal_kegiatan: "",
    tempat: "",
    lampiran: "",
    hal: "",
    nama_1: "",
    npp_1: "",
    jabatan_1: "Ketua Dinus Robotic Club",
    nama_2: "",
    npp_2: "",
    jabatan_2: "Ketua Tim",
    nama_3: "",
    npp_3: "",
    jabatan_3: "Pembina Komunitas Dinus Robotic Club",
    nama_4: "",
    npp_4: "",
    jabatan_4: "Wakil Rektor III Bidang Kemahasiswaan",
    isi_surat: "",
    kota: "Semarang",
  });

  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth - 48;
        const scale = Math.min(1, containerW / A4_WIDTH_PX);
        setPreviewScale(scale);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/template`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTemplates(data); });

    // Gunakan endpoint sekretaris sendiri agar bisa diakses role sekretaris
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); });
  }, []);

  const handleUserToggle = (user: any) => {
    const exists = selectedUsers.find(u => u.id === user.id);
    if (exists) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const generateNomorSurat = () => {
    if (!selectedTemplate) return;
    const date = new Date(formData.tanggal_surat);
    const romawi = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    const bulan = romawi[date.getMonth()];
    const tahun = date.getFullYear();
    let format = selectedTemplate.format_nomor || "[NO]/DRC/UM/[BULAN_ROMAWI]/[TAHUN]";
    format = format.replace("[BULAN_ROMAWI]", bulan).replace("[TAHUN]", tahun.toString()).replace("[NO]", "001");
    setFormData(prev => ({ ...prev, no_surat: format }));
  };

  const formatTanggal = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const renderPreviewHTML = useCallback(() => {
    if (!selectedTemplate) return "";

    let tabelAnggota = "";
    if (selectedTemplate.has_tabel_anggota) {
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
              ? selectedUsers.map((u, i) => `
                  <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${i + 1}.</td>
                    <td style="border: 1px solid black; padding: 6px;">${u.nama_lengkap}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${u.nim || '-'}</td>
                  </tr>`).join('')
              : `<tr><td colspan="3" style="border: 1px solid black; padding: 6px; text-align: center;">Tidak ada anggota yang dipilih</td></tr>`
            }
          </tbody>
        </table>`;
    }

    // Tanda tangan - sesuaikan dengan template
    const tandaTangan = `
      <div style="margin-top: 40px; font-family: 'Times New Roman', serif; font-size: 11pt;">
        <p style="margin: 0 0 20px 0;">${formData.kota}, ${formatTanggal(formData.tanggal_surat)}</p>
        <div style="display: flex; justify-content: space-between; gap: 20px;">
          <div style="text-align: center; min-width: 180px;">
            <p style="margin: 0 0 4px 0;">${formData.jabatan_1 || "Ketua Dinus Robotic Club"}</p>
            <br/><br/><br/>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${formData.nama_1 || "(................................)"}</p>
            <p style="margin: 0;">${formData.npp_1 ? `NPP. ${formData.npp_1}` : "NPP. ......................"}</p>
          </div>
          <div style="text-align: center; min-width: 180px;">
            <p style="margin: 0 0 4px 0;">${formData.jabatan_2 || "Ketua Tim"}</p>
            <br/><br/><br/>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${formData.nama_2 || "(................................)"}</p>
            <p style="margin: 0;">${formData.npp_2 ? `NIM. ${formData.npp_2}` : "NIM. ......................"}</p>
          </div>
        </div>
        ${(formData.nama_3 || formData.nama_4) ? `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 30px; margin-top: 30px;">
          ${formData.nama_3 || formData.jabatan_3 ? `
          <div style="text-align: center; min-width: 250px;">
            <p style="margin: 0 0 4px 0; font-weight: bold;">${(formData.jabatan_3 || "Mengetahui,").replace(/\\n/g, '<br/>')}</p>
            <br/><br/><br/>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${formData.nama_3 || "(................................)"}</p>
            <p style="margin: 0;">${formData.npp_3 || ""}</p>
          </div>` : ""}
          ${formData.nama_4 || formData.jabatan_4 ? `
          <div style="text-align: center; min-width: 250px;">
            <p style="margin: 0 0 4px 0; font-weight: bold;">${(formData.jabatan_4 || "Menyetujui,").replace(/\\n/g, '<br/>')}</p>
            <br/><br/><br/>
            <p style="font-weight: bold; text-decoration: underline; margin: 0;">${formData.nama_4 || "(................................)"}</p>
            <p style="margin: 0;">${formData.npp_4 || ""}</p>
          </div>` : ""}
        </div>` : ""}
      </div>`;

    let html = selectedTemplate.konten_html || "";
    
    // Konversi newline ke <br/> jika itu teks biasa
    if (!html.includes("<p>") && !html.includes("<br")) {
      html = html.replace(/\n/g, '<br/>');
    }
    
    // Ganti variabel jika ada (untuk jaga-jaga kalau user masih pakai variabel di paragraf pembuka)
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
  }, [selectedTemplate, formData, selectedUsers]);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    const element = previewRef.current;
    
    // Save original transform and remove it temporarily for accurate PDF capture
    const originalTransform = element.style.transform;
    element.style.transform = "none";
    
    const filename = `Surat_${(formData.no_surat || "DRC").replaceAll('/', '-')}.pdf`;
    const opt: any = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: element.scrollWidth },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css' }
    };
    
    if (lampiranFiles.length === 0) {
      // Jika tidak ada lampiran tambahan, simpan langsung
      html2pdf().set(opt).from(element).save().then(() => {
        element.style.transform = originalTransform;
      });
      return;
    }

    // Jika ada lampiran PDF tambahan, gabungkan menggunakan pdf-lib
    try {
      // 1. Generate surat utama sebagai ArrayBuffer (memerlukan html2pdf API .outputPdf)
      const pdfArrayBuffer = await html2pdf().set(opt).from(element).outputPdf('arraybuffer');
      element.style.transform = originalTransform;
      
      const mainPdf = await PDFDocument.load(pdfArrayBuffer);
      const mergedPdf = await PDFDocument.create();
      
      // Copy semua halaman surat utama
      const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
      mainPages.forEach((page) => mergedPdf.addPage(page));
      
      // Copy setiap lampiran PDF yang diupload
      for (const file of lampiranFiles) {
        if (file.type !== "application/pdf") continue;
        const fileBuffer = await file.arrayBuffer();
        const lampiranPdf = await PDFDocument.load(fileBuffer);
        const lampiranPages = await mergedPdf.copyPages(lampiranPdf, lampiranPdf.getPageIndices());
        lampiranPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Error menggabungkan PDF:", err);
      element.style.transform = originalTransform;
      Swal.fire("Gagal", "Gagal menggabungkan lampiran PDF.", "error");
    }
  };

  const handleSaveToDatabase = async () => {
    if (!selectedTemplate) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/surat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          no_surat: formData.no_surat,
          tanggal_surat: formData.tanggal_surat,
          tujuan_surat: formData.tujuan_nama,
          data_json: { ...formData, selectedUsers }
        })
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Berhasil", text: "Riwayat surat berhasil disimpan", confirmButtonColor: "var(--primary)" });
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: "Gagal menyimpan riwayat" });
      }
    } catch (err) { console.error(err); }
  };

  const toggleSection = (key: keyof typeof expandedSections) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const filteredUsers = users.filter(u =>
    u.nama_lengkap?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.nim?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const SectionHeader = ({ title, icon: Icon, sectionKey }: { title: string; icon: any; sectionKey: keyof typeof expandedSections }) => (
    <div
      onClick={() => toggleSection(sectionKey)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "16px", borderBottom: expandedSections[sectionKey] ? "1px solid var(--border)" : "none", background: "linear-gradient(to right, rgba(0,0,0,0.02), transparent)", userSelect: "none" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "600", fontSize: "0.95rem", color: "var(--text-main)" }}>
        <Icon size={18} color="var(--primary)" />
        {title}
      </div>
      {expandedSections[sectionKey] ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
    </div>
  );

  return (
    <div style={{ display: "flex", gap: "20px", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Left: Form Panel */}
      <div style={{ width: "400px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", paddingRight: "6px", paddingBottom: "24px" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0" }}>Buat Surat</h1>

        {/* Pilih Template */}
        <div className="surface-card" style={{ padding: "0", overflow: "hidden", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "16px", fontWeight: "600", fontSize: "0.95rem", color: "var(--text-main)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px", background: "linear-gradient(to right, rgba(59,130,246,0.05), transparent)" }}>
            <FileText size={18} style={{ color: "var(--primary)" }} /> Pilih Template
          </div>
          <div style={{ padding: "12px 16px" }}>
            <select className="form-input" value={selectedTemplate?.id || ""} onChange={e => {
              const tmpl = templates.find(t => t.id === parseInt(e.target.value));
              setSelectedTemplate(tmpl || null);
            }}>
              <option value="">-- Pilih Template Surat --</option>
              {templates.map(tmpl => <option key={tmpl.id} value={tmpl.id}>{tmpl.nama_template}</option>)}
            </select>
          </div>
        </div>

        {selectedTemplate && (<>
          {/* Identitas Surat */}
          <div className="surface-card" style={{ padding: "0", overflow: "hidden", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <SectionHeader title="Identitas Surat" icon={FileText} sectionKey="identitas" />
            {expandedSections.identitas && (
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.8rem" }}>Tanggal Surat</label>
                    <input type="date" className="form-input" style={{ fontSize: "0.85rem" }} value={formData.tanggal_surat} onChange={e => setFormData(p => ({ ...p, tanggal_surat: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.8rem" }}>Kota</label>
                    <input type="text" className="form-input" style={{ fontSize: "0.85rem" }} value={formData.kota} onChange={e => setFormData(p => ({ ...p, kota: e.target.value }))} placeholder="Semarang" />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem" }}>Nomor Surat</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input type="text" className="form-input" style={{ fontSize: "0.85rem" }} value={formData.no_surat} onChange={e => setFormData(p => ({ ...p, no_surat: e.target.value }))} placeholder="001/DRC/..." />
                    <button type="button" onClick={generateNomorSurat} className="btn-secondary" style={{ padding: "0 10px", whiteSpace: "nowrap", fontSize: "0.8rem" }}>Auto</button>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem" }}>Lampiran</label>
                  <input type="text" className="form-input" style={{ fontSize: "0.85rem", marginBottom: "6px" }} value={formData.lampiran} onChange={e => setFormData(p => ({ ...p, lampiran: e.target.value }))} placeholder="cth: 2 bendel" />
                  <div style={{ border: "1px dashed var(--border)", borderRadius: "8px", padding: "8px 10px", fontSize: "0.82rem", cursor: "pointer", color: "var(--text-muted)", backgroundColor: "rgba(0,0,0,0.01)" }}>
                    <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>📎</span>
                      <span>Upload file lampiran (PDF)</span>
                      <input type="file" accept=".pdf" multiple onChange={e => { if (e.target.files) setLampiranFiles(Array.from(e.target.files)); }} style={{ display: "none" }} />
                    </label>
                    {lampiranFiles.length > 0 && (
                      <ul style={{ margin: "6px 0 0 0", paddingLeft: "16px", color: "var(--text-main)" }}>
                        {lampiranFiles.map((f, i) => (
                          <li key={i} style={{ fontSize: "0.8rem" }}>{f.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem" }}>Hal / Perihal</label>
                  <input type="text" className="form-input" style={{ fontSize: "0.85rem" }} value={formData.hal} onChange={e => setFormData(p => ({ ...p, hal: e.target.value }))} placeholder="cth: Permohonan Izin Menginap" />
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px" }}>Tujuan Surat</p>
                  <input type="text" className="form-input" style={{ fontSize: "0.85rem", marginBottom: "6px" }} value={formData.tujuan_jabatan} onChange={e => setFormData(p => ({ ...p, tujuan_jabatan: e.target.value }))} placeholder="Jabatan (cth: Rektor)" />
                  <input type="text" className="form-input" style={{ fontSize: "0.85rem", marginBottom: "6px" }} value={formData.tujuan_nama} onChange={e => setFormData(p => ({ ...p, tujuan_nama: e.target.value }))} placeholder="Nama Penerima" />
                  <input type="text" className="form-input" style={{ fontSize: "0.85rem" }} value={formData.tujuan_instansi} onChange={e => setFormData(p => ({ ...p, tujuan_instansi: e.target.value }))} placeholder="Instansi / Universitas" />
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px" }}>Detail Kegiatan</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Hari</label>
                      <input type="text" className="form-input" style={{ fontSize: "0.85rem" }} value={formData.hari} onChange={e => setFormData(p => ({ ...p, hari: e.target.value }))} placeholder="cth: Kamis - Sabtu" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Tempat</label>
                      <input type="text" className="form-input" style={{ fontSize: "0.85rem" }} value={formData.tempat} onChange={e => setFormData(p => ({ ...p, tempat: e.target.value }))} placeholder="cth: Gedung I" />
                    </div>
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <label className="form-label" style={{ fontSize: "0.8rem" }}>Tanggal Kegiatan</label>
                    <input type="text" className="form-input" style={{ fontSize: "0.85rem" }} value={formData.tanggal_kegiatan} onChange={e => setFormData(p => ({ ...p, tanggal_kegiatan: e.target.value }))} placeholder="cth: 6 Juni 2024 - 3 Juli 2024" />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                  <label className="form-label" style={{ fontSize: "0.8rem" }}>Isi Surat (opsional, jika template pakai {"{{ISI_SURAT}}"})</label>
                  <textarea className="form-input" rows={4} style={{ fontSize: "0.85rem", resize: "vertical" }} value={formData.isi_surat} onChange={e => setFormData(p => ({ ...p, isi_surat: e.target.value }))} placeholder="Paragraf isi surat..." />
                </div>
              </div>
            )}
          </div>

          {/* Pilih Anggota */}
          {selectedTemplate.has_tabel_anggota === 1 && (
            <div className="surface-card" style={{ padding: "0", overflow: "hidden", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <SectionHeader title={`Pilih Anggota (${selectedUsers.length} terpilih)`} icon={Users} sectionKey="anggota" />
              {expandedSections.anggota && (
                <div style={{ padding: "12px 16px" }}>
                  <input type="text" className="form-input" style={{ fontSize: "0.85rem", marginBottom: "8px" }} value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Cari nama atau NIM..." />
                  <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
                    {filteredUsers.map(u => (
                      <label key={u.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid var(--border)", backgroundColor: selectedUsers.find(su => su.id === u.id) ? "rgba(79,172,254,0.08)" : "transparent" }}>
                        <input type="checkbox" checked={!!selectedUsers.find(su => su.id === u.id)} onChange={() => handleUserToggle(u)} />
                        <div>
                          <span style={{ fontSize: "0.85rem", fontWeight: "500" }}>{u.nama_lengkap}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>{u.nim || "-"} · {u.jabatan || u.role}</span>
                        </div>
                      </label>
                    ))}
                    {filteredUsers.length === 0 && <p style={{ padding: "12px", color: "var(--text-muted)", textAlign: "center", fontSize: "0.85rem" }}>Tidak ada hasil.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tanda Tangan */}
          <div className="surface-card" style={{ padding: "0", overflow: "hidden", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <SectionHeader title="Tanda Tangan" icon={PenLine} sectionKey="ttd" />
            {expandedSections.ttd && (
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {[{label: "Pihak Kiri (1)", jabKey: "jabatan_1", namaKey: "nama_1", nppKey: "npp_1"}, {label: "Pihak Kanan (2)", jabKey: "jabatan_2", namaKey: "nama_2", nppKey: "npp_2"}, {label: "Bawah Tengah 1 (Opsional)", jabKey: "jabatan_3", namaKey: "nama_3", nppKey: "npp_3"}, {label: "Bawah Tengah 2 (Opsional)", jabKey: "jabatan_4", namaKey: "nama_4", nppKey: "npp_4"}].map(({label, jabKey, namaKey, nppKey}) => (
                  <div key={namaKey} style={{ padding: "10px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "8px" }}>
                    <p style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px" }}>{label}</p>
                    <textarea className="form-input" style={{ fontSize: "0.82rem", marginBottom: "5px", minHeight: "40px", resize: "vertical" }} value={(formData as any)[jabKey]} onChange={e => setFormData(p => ({ ...p, [jabKey]: e.target.value }))} placeholder="Jabatan (Bisa enter/baris baru)" />
                    <input type="text" className="form-input" style={{ fontSize: "0.82rem", marginBottom: "5px" }} value={(formData as any)[namaKey]} onChange={e => setFormData(p => ({ ...p, [namaKey]: e.target.value }))} placeholder="Nama Lengkap" />
                    <input type="text" className="form-input" style={{ fontSize: "0.82rem" }} value={(formData as any)[nppKey]} onChange={e => setFormData(p => ({ ...p, [nppKey]: e.target.value }))} placeholder="NPP / NIM" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>)}
      </div>

      {/* Right: Preview Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", backgroundColor: "var(--surface)", padding: "10px 16px", borderRadius: "10px", border: "1px solid var(--border)", flexShrink: 0 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: "600" }}>Live Preview A4</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-secondary" onClick={handleSaveToDatabase} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", padding: "8px 12px" }} disabled={!selectedTemplate}>
              <Save size={15} /> Simpan
            </button>
            <button className="btn-primary" onClick={handleDownloadPDF} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", padding: "8px 12px" }} disabled={!selectedTemplate}>
              <Download size={15} /> Unduh PDF
            </button>
          </div>
        </div>

        {/* Paper scroll area */}
        <div ref={containerRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", backgroundColor: "#cbd5e1", borderRadius: "10px", padding: "24px", display: "flex", justifyContent: "center" }}>
          {/* Scaling wrapper: shrinks paper to fit container width */}
          <div style={{ width: `${A4_WIDTH_PX * previewScale}px`, flexShrink: 0, height: "fit-content" }}>
            <div
              ref={previewRef}
              style={{
                width: `${A4_WIDTH_PX}px`,
                minHeight: "297mm",
                boxSizing: "border-box",
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                padding: "20mm 25mm 20mm 25mm",
                color: "#000",
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: "11pt",
                lineHeight: "1.5",
                transformOrigin: "top left",
                transform: `scale(${previewScale})`,
              }}
            >
            {selectedTemplate ? (
              <>
                {/* KOP SURAT - Persis seperti contoh */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "8px" }}>
                    {/* Logo Udinus kiri */}
                    <img src="/logo/udinus.png" alt="Logo Udinus" style={{ width: "75px", height: "75px", flexShrink: 0 }} />
                    {/* Teks tengah berwarna biru */}
                    <div style={{ flex: 1, textAlign: "center", lineHeight: "1.35", padding: "0 12px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "15pt", color: "#003399", letterSpacing: "0.5px" }}>DINUS ROBOTIC CLUB</div>
                      <div style={{ fontWeight: "bold", fontSize: "11pt", color: "#003399" }}>UNIVERSITAS DIAN NUSWANTORO</div>
                      <div style={{ fontSize: "8.5pt", color: "#003399", marginTop: "3px" }}>Sekretariat : Kampus Udinus Gedung I Lantai 1</div>
                      <div style={{ fontSize: "8.5pt", color: "#003399" }}>Jalan Nakula 1 nomor 5-11 Semarang 50131 Telepon (024) 3573733</div>
                    </div>
                    {/* Logo DRC kanan */}
                    <img src="/logo/DRC_logo.png" alt="Logo DRC" style={{ width: "auto", height: "75px", flexShrink: 0 }} />
                  </div>
                  {/* Garis biru tebal di bawah kop */}
                  <div style={{ borderBottom: "3px solid #003399", width: "100%" }} />
                </div>

                {/* Header Nomor, Lampiran, Hal */}
                <table style={{ width: "100%", marginBottom: "12px", fontSize: "11pt", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "100px", verticalAlign: "top", padding: "1px 0" }}>Nomor</td>
                      <td style={{ width: "16px", verticalAlign: "top", padding: "1px 0" }}>:</td>
                      <td style={{ padding: "1px 0" }}>{formData.no_surat || "___/DRC/___/____"}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "1px 0" }}>Lampiran</td>
                      <td style={{ verticalAlign: "top", padding: "1px 0" }}>:</td>
                      <td style={{ padding: "1px 0" }}>{formData.lampiran || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "1px 0" }}>Hal</td>
                      <td style={{ verticalAlign: "top", padding: "1px 0" }}>:</td>
                      <td style={{ fontWeight: "bold", padding: "1px 0" }}>{formData.hal || "..."}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Kepada */}
                <div style={{ marginBottom: "16px" }}>
                  <div>Kepada Yth.</div>
                  {formData.tujuan_jabatan && <div>{formData.tujuan_jabatan}</div>}
                  {formData.tujuan_nama && <div>{formData.tujuan_nama}</div>}
                  {formData.tujuan_instansi && <div>{formData.tujuan_instansi}</div>}
                  <div>Di Tempat</div>
                </div>

                <div style={{ marginBottom: "16px" }}>Dengan hormat,</div>

                {/* Konten HTML dari Template */}
                <div dangerouslySetInnerHTML={{ __html: renderPreviewHTML() }} style={{ lineHeight: "1.6" }} />
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#9ca3af", flexDirection: "column", gap: "8px" }}>
                <FileText size={48} style={{ opacity: 0.3 }} />
                <span>Pilih template surat untuk melihat preview</span>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
