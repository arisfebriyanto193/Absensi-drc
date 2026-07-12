"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash, FileCode2, Save, X } from "lucide-react";
import Swal from "sweetalert2";

export default function TemplateSurat() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nama_template: "",
    deskripsi: "",
    format_nomor: "[NO]/DRC/UM/[BULAN_ROMAWI]/[TAHUN]",
    konten_html: "",
    has_tabel_anggota: false
  });

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
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const url = editId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/template/${editId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/template`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        Swal.fire("Berhasil", "Template berhasil disimpan", "success");
        setIsModalOpen(false);
        setEditId(null);
        fetchTemplates();
      } else {
        Swal.fire("Gagal", "Gagal menyimpan template", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (tmpl: any) => {
    setEditId(tmpl.id);
    setFormData({
      nama_template: tmpl.nama_template,
      deskripsi: tmpl.deskripsi,
      format_nomor: tmpl.format_nomor,
      konten_html: tmpl.konten_html,
      has_tabel_anggota: tmpl.has_tabel_anggota === 1
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus Template?',
      text: 'Semua riwayat surat yang menggunakan template ini juga akan terpengaruh.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sekretaris/template/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Terhapus!', 'Template berhasil dihapus.', 'success');
        fetchTemplates();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      nama_template: "",
      deskripsi: "",
      format_nomor: "[NO]/DRC/UM/[BULAN_ROMAWI]/[TAHUN]",
      konten_html: `Sehubungan dengan [NAMA KEGIATAN], maka dengan ini kami selaku peserta bermaksud mengajukan permohonan izin menginap pada:

Hari      : {{HARI}}
Tanggal   : {{TANGGAL_KEGIATAN}}
Tempat    : {{TEMPAT}}

Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kebijaksanaan Bapak/Ibu, kami ucapkan terima kasih.`,
      has_tabel_anggota: true
    });
  };

  const renderLivePreview = () => {
    // Fungsi untuk merender HTML dari teks biasa dengan convert \n jadi <br/> dan tabulasi yang rapi
    const formattedHtml = formData.konten_html.replace(/\\n/g, '<br/>').replace(/  /g, '&nbsp;&nbsp;');
    
    let html = formattedHtml;
    // Replace dummy variables
    html = html.replace(/{{NO_SURAT}}/g, "001/DRC/UM/VII/2026");
    html = html.replace(/{{TANGGAL}}/g, "12 Juli 2026");
    html = html.replace(/{{TANGGAL_KEGIATAN}}/g, "14 Juli 2026");
    html = html.replace(/{{HARI}}/g, "Selasa");
    html = html.replace(/{{TUJUAN}}/g, "Bapak Rektor");
    html = html.replace(/{{TUJUAN_JABATAN}}/g, "Rektor");
    html = html.replace(/{{TUJUAN_INSTANSI}}/g, "Universitas Dian Nuswantoro");
    html = html.replace(/{{TEMPAT}}/g, "Gedung I Lantai 1");
    html = html.replace(/{{LAMPIRAN}}/g, "1 Berkas");
    html = html.replace(/{{HAL}}/g, "Permohonan Izin Menginap");
    html = html.replace(/{{ISI_SURAT}}/g, "");
    html = html.replace(/{{KOTA}}/g, "Semarang");

    let tabelAnggota = "";
    if (formData.has_tabel_anggota) {
      tabelAnggota = `
        <div style="font-family: 'Times New Roman', serif; font-size: 11pt; margin: 30px 0 16px 0;">
          <strong>Lampiran: Daftar Peserta / Anggota (Contoh)</strong>
        </div>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 11pt;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid black; padding: 6px; text-align: center; width: 8%;">NO</th>
              <th style="border: 1px solid black; padding: 6px; text-align: left; width: 50%;">NAMA</th>
              <th style="border: 1px solid black; padding: 6px; text-align: center; width: 42%;">NIM</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid black; padding: 6px; text-align: center;">1.</td>
              <td style="border: 1px solid black; padding: 6px;">Contoh Mahasiswa</td>
              <td style="border: 1px solid black; padding: 6px; text-align: center;">A11.2023.00000</td>
            </tr>
          </tbody>
        </table>`;
    }

    return (
      <div style={{
        width: "100%", maxWidth: "794px", minHeight: "800px", margin: "0 auto",
        backgroundColor: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        padding: "20mm 25mm", color: "#000", fontFamily: "'Times New Roman', Times, serif",
        fontSize: "11pt", lineHeight: "1.5", boxSizing: "border-box", overflowY: "auto"
      }}>
        {/* KOP SURAT */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "8px" }}>
            <img src="/logo/udinus.png" alt="Logo Udinus" style={{ width: "75px", height: "75px", flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: "center", lineHeight: "1.35", padding: "0 12px" }}>
              <div style={{ fontWeight: "bold", fontSize: "15pt", color: "#003399", letterSpacing: "0.5px" }}>DINUS ROBOTIC CLUB</div>
              <div style={{ fontWeight: "bold", fontSize: "11pt", color: "#003399" }}>UNIVERSITAS DIAN NUSWANTORO</div>
              <div style={{ fontSize: "8.5pt", color: "#003399", marginTop: "3px" }}>Sekretariat : Kampus Udinus Gedung I Lantai 1</div>
              <div style={{ fontSize: "8.5pt", color: "#003399" }}>Jalan Nakula 1 nomor 5-11 Semarang 50131 Telepon (024) 3573733</div>
            </div>
            <img src="/logo/DRC_logo.png" alt="Logo DRC" style={{ width: "auto", height: "75px", flexShrink: 0 }} />
          </div>
          <div style={{ borderBottom: "3px solid #003399", width: "100%" }} />
        </div>

        {/* Header Nomor, Lampiran, Hal */}
        <table style={{ width: "100%", marginBottom: "12px", fontSize: "11pt", borderCollapse: "collapse" }}>
          <tbody>
            <tr><td style={{ width: "100px", verticalAlign: "top", padding: "1px 0" }}>Nomor</td><td style={{ width: "16px", verticalAlign: "top", padding: "1px 0" }}>:</td><td style={{ padding: "1px 0" }}>{formData.format_nomor}</td></tr>
            <tr><td style={{ verticalAlign: "top", padding: "1px 0" }}>Lampiran</td><td style={{ verticalAlign: "top", padding: "1px 0" }}>:</td><td style={{ padding: "1px 0" }}>1 Berkas</td></tr>
            <tr><td style={{ verticalAlign: "top", padding: "1px 0" }}>Hal</td><td style={{ verticalAlign: "top", padding: "1px 0" }}>:</td><td style={{ fontWeight: "bold", padding: "1px 0" }}>Contoh Hal Surat</td></tr>
          </tbody>
        </table>

        {/* Kepada */}
        <div style={{ marginBottom: "16px" }}>
          <div>Kepada Yth.</div>
          <div>Bapak Rektor</div>
          <div>Universitas Dian Nuswantoro</div>
          <div>Di Tempat</div>
        </div>

        <div style={{ marginBottom: "16px" }}>Dengan hormat,</div>

        {/* KONTEN */}
        <div dangerouslySetInnerHTML={{ __html: html }} style={{ lineHeight: "1.6" }} />

        {/* Tanda Tangan */}
        <div style={{ marginTop: "40px", fontFamily: "'Times New Roman', serif", fontSize: "11pt" }}>
          <p style={{ margin: "0 0 20px 0" }}>Semarang, 12 Juli 2026</p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
            <div style={{ textAlign: "center", minWidth: "180px" }}>
              <p style={{ margin: "0 0 4px 0" }}>Ketua Dinus Robotic Club</p>
              <br/><br/><br/>
              <p style={{ fontWeight: "bold", textDecoration: "underline", margin: 0 }}>(Nama Ketua)</p>
              <p style={{ margin: 0 }}>NPP. 000.00.0000</p>
            </div>
            <div style={{ textAlign: "center", minWidth: "180px" }}>
              <p style={{ margin: "0 0 4px 0" }}>Ketua Tim</p>
              <br/><br/><br/>
              <p style={{ fontWeight: "bold", textDecoration: "underline", margin: 0 }}>(Nama Ketua Tim)</p>
              <p style={{ margin: 0 }}>NIM. A11.0000.0000</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "30px", marginTop: "30px" }}>
            <div style={{ textAlign: "center", minWidth: "250px" }}>
              <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>Mengetahui,<br/>Pembina Komunitas Dinus Robotic Club</p>
              <br/><br/><br/>
              <p style={{ fontWeight: "bold", textDecoration: "underline", margin: 0 }}>Arga Dwi Pambudi,M.T</p>
              <p style={{ margin: 0 }}>NPP.0686.11.2013.556</p>
            </div>
            <div style={{ textAlign: "center", minWidth: "250px" }}>
              <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>Menyetujui,<br/>Wakil Rektor III<br/>Bidang Kemahasiswaan</p>
              <br/><br/><br/>
              <p style={{ fontWeight: "bold", textDecoration: "underline", margin: 0 }}>Dr. Kusni Ingsih, MM</p>
              <p style={{ margin: 0 }}>NPP. 0686.11.1992.029</p>
            </div>
          </div>
        </div>
        
        {/* LAMPIRAN (contoh saja di preview) */}
        <div dangerouslySetInnerHTML={{ __html: tabelAnggota }} />
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.5s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px" }}>
            Kelola Template Surat
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Buat dan edit format template HTML yang akan digunakan saat pembuatan surat.
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px" }}
        >
          <Plus size={20} /> Tambah Template
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
        {templates.map(tmpl => (
          <div key={tmpl.id} className="surface-card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(79, 172, 254, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                <FileCode2 size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "4px" }}>{tmpl.nama_template}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "8px" }}>
                  {tmpl.deskripsi || "Tidak ada deskripsi"}
                </p>
                <div style={{ fontSize: "0.8rem", padding: "4px 8px", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: "4px", display: "inline-block" }}>
                  Format: {tmpl.format_nomor}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: "auto", display: "flex", gap: "8px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <button 
                onClick={() => handleEdit(tmpl)}
                style={{ flex: 1, padding: "8px", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-main)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Edit size={16} /> Edit
              </button>
              <button 
                onClick={() => handleDelete(tmpl.id)}
                style={{ flex: 1, padding: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-sm)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Trash size={16} /> Hapus
              </button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", backgroundColor: "var(--surface)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>
            <FileCode2 size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)" }}>Belum ada template yang dibuat.</p>
          </div>
        )}
      </div>

      {/* Modal Form Template */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "1400px", width: "95%", height: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Template' : 'Tambah Template Baru'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body" style={{ flex: 1, overflow: "hidden", padding: 0, display: "flex" }}>
              {/* Form Side */}
              <div style={{ flex: "0 0 500px", padding: "20px", overflowY: "auto", borderRight: "1px solid var(--border)" }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "16px" }}>
                    <label className="form-label">Nama Template</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formData.nama_template}
                      onChange={e => setFormData({...formData, nama_template: e.target.value})}
                      placeholder="Contoh: Izin Menginap KRAI"
                    />
                  </div>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label className="form-label">Format Nomor Surat</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formData.format_nomor}
                      onChange={e => setFormData({...formData, format_nomor: e.target.value})}
                    />
                    <small style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block", marginTop: "4px" }}>Gunakan [NO], [BULAN_ROMAWI], [TAHUN]</small>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label className="form-label">Deskripsi Singkat</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={formData.deskripsi}
                      onChange={e => setFormData({...formData, deskripsi: e.target.value})}
                      placeholder="Contoh: Digunakan untuk izin menginap persiapan lomba"
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Isi Surat (Ketikan manual disini)</span>
                    </label>

                    <div style={{ padding: "10px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "8px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Kop Surat dan Tanda Tangan sudah disediakan otomatis. Anda hanya perlu menulis isi inti surat. <br/>
                      Gunakan variabel khusus yang akan otomatis terganti saat surat dibuat:<br/>
                      <strong>{"{{NO_SURAT}}, {{TANGGAL}}, {{TUJUAN}}, {{TEMPAT}}, dsb."}</strong>
                    </div>

                    <textarea 
                      className="form-input" 
                      required 
                      rows={14}
                      value={formData.konten_html}
                      onChange={e => setFormData({...formData, konten_html: e.target.value})}
                      style={{ fontFamily: "monospace", fontSize: "0.9rem", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", padding: "12px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <input 
                      type="checkbox" 
                      id="has_tabel"
                      checked={formData.has_tabel_anggota}
                      onChange={e => setFormData({...formData, has_tabel_anggota: e.target.checked})}
                      style={{ width: "18px", height: "18px" }}
                    />
                    <label htmlFor="has_tabel" style={{ cursor: "pointer", fontWeight: "500" }}>Template ini membutuhkan tabel anggota di halaman lampiran?</label>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: "100%", padding: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontSize: "1rem" }}>
                    <Save size={20} /> {editId ? 'Simpan Perubahan' : 'Buat Template'}
                  </button>
                </form>
              </div>

              {/* Preview Side */}
              <div style={{ flex: 1, padding: "20px", overflowY: "auto", backgroundColor: "#f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>Live Preview A4</h3>
                </div>
                {renderLivePreview()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
