const pool = require('../db');

// --- TEMPLATE SURAT ---

exports.getTemplates = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surat_template ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getTemplateById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surat_template WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Template not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const { nama_template, deskripsi, format_nomor, konten_html, has_tabel_anggota } = req.body;
        const [result] = await pool.query(
            'INSERT INTO surat_template (nama_template, deskripsi, format_nomor, konten_html, has_tabel_anggota, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [nama_template, deskripsi, format_nomor, konten_html, has_tabel_anggota, req.user.id]
        );
        res.status(201).json({ id: result.insertId, message: 'Template berhasil dibuat' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_template, deskripsi, format_nomor, konten_html, has_tabel_anggota } = req.body;
        await pool.query(
            'UPDATE surat_template SET nama_template=?, deskripsi=?, format_nomor=?, konten_html=?, has_tabel_anggota=? WHERE id=?',
            [nama_template, deskripsi, format_nomor, konten_html, has_tabel_anggota, id]
        );
        res.json({ message: 'Template berhasil diupdate' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        await pool.query('DELETE FROM surat_template WHERE id = ?', [req.params.id]);
        res.json({ message: 'Template dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- USERS (untuk tabel anggota surat) ---

exports.getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, nama_lengkap, nim, username, jabatan, role FROM users ORDER BY nama_lengkap ASC'
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- RIWAYAT SURAT ---

exports.getRiwayatSurat = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT sm.*, st.nama_template 
            FROM surat_menyurat sm
            JOIN surat_template st ON sm.template_id = st.id
            ORDER BY sm.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createSurat = async (req, res) => {
    try {
        const { template_id, no_surat, tanggal_surat, tujuan_surat, data_json } = req.body;
        const [result] = await pool.query(
            'INSERT INTO surat_menyurat (template_id, no_surat, tanggal_surat, tujuan_surat, data_json, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [template_id, no_surat, tanggal_surat, tujuan_surat, JSON.stringify(data_json), req.user.id]
        );
        res.status(201).json({ id: result.insertId, message: 'Surat berhasil disimpan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteSurat = async (req, res) => {
    try {
        await pool.query('DELETE FROM surat_menyurat WHERE id = ?', [req.params.id]);
        res.json({ message: 'Riwayat surat dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
