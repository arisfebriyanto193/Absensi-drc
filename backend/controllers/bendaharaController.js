const pool = require('../db');
const path = require('path');
const fs = require('fs');

// Helper
const getPeriodeId = async (req) => {
    if (req.headers['x-periode-id'] && req.headers['x-periode-id'] !== 'all') return req.headers['x-periode-id'];
    if (req.query.periode_id && req.query.periode_id !== 'all') return req.query.periode_id;
    if (req.body.periode_id && req.body.periode_id !== 'all') return req.body.periode_id;
    const [active] = await pool.query('SELECT id FROM periodes WHERE is_active = 1 LIMIT 1');
    return active.length > 0 ? active[0].id : null;
};

// --- Dashboard ---
exports.getDashboard = async (req, res) => {
    try {
        const pId = await getPeriodeId(req);
        
        // Total Kas Anggota
        const [kasResult] = await pool.query('SELECT SUM(total_terbayar) as total_kas FROM keuangan_kas_anggota WHERE periode_id = ?', [pId]);
        const totalKasAnggota = kasResult[0].total_kas || 0;

        // Total Saldo Semua Kegiatan
        const [kegiatanResult] = await pool.query('SELECT SUM(saldo_awal) as total_saldo_awal FROM keuangan_kegiatan WHERE periode_id = ?', [pId]);
        
        const [transaksiResult] = await pool.query(`
            SELECT 
                SUM(CASE WHEN jenis = 'pemasukan' THEN nominal ELSE 0 END) as total_pemasukan,
                SUM(CASE WHEN jenis = 'pengeluaran' THEN nominal ELSE 0 END) as total_pengeluaran
            FROM keuangan_transaksi WHERE periode_id = ?
        `, [pId]);

        const totalSaldoAwal = kegiatanResult[0].total_saldo_awal || 0;
        const totalPemasukan = transaksiResult[0].total_pemasukan || 0;
        const totalPengeluaran = transaksiResult[0].total_pengeluaran || 0;
        
        const saldoAkhir = Number(totalSaldoAwal) + Number(totalPemasukan) - Number(totalPengeluaran);

        res.json({
            totalKasAnggota,
            saldoAkhir,
            totalPemasukan,
            totalPengeluaran
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Kas Anggota ---
exports.getKasAnggota = async (req, res) => {
    try {
        const pId = await getPeriodeId(req);

        const query = `
            SELECT 
                u.id as user_id, u.nama_lengkap, u.nim, up.jabatan,
                COALESCE(k.target_nominal, 0) as target_nominal,
                COALESCE(k.total_terbayar, 0) as total_terbayar,
                k.bulan_dibayar
            FROM users u
            INNER JOIN user_periodes up ON u.id = up.user_id
            LEFT JOIN keuangan_kas_anggota k ON u.id = k.user_id AND k.periode_id = up.periode_id
            WHERE up.periode_id = ?
            ORDER BY u.nama_lengkap ASC
        `;
        const [rows] = await pool.query(query, [pId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateKasAnggota = async (req, res) => {
    try {
        const { user_id, target_nominal, total_terbayar } = req.body;
        const pId = await getPeriodeId(req);
        
        // Cek apakah sudah ada
        const [existing] = await pool.query('SELECT id FROM keuangan_kas_anggota WHERE user_id = ? AND periode_id = ?', [user_id, pId]);
        
        if (existing.length > 0) {
            await pool.query(
                'UPDATE keuangan_kas_anggota SET target_nominal = ?, total_terbayar = ? WHERE user_id = ? AND periode_id = ?',
                [target_nominal, total_terbayar, user_id, pId]
            );
        } else {
            await pool.query(
                'INSERT INTO keuangan_kas_anggota (user_id, periode_id, target_nominal, total_terbayar) VALUES (?, ?, ?, ?)',
                [user_id, pId, target_nominal, total_terbayar]
            );
        }
        
        res.json({ message: 'Data kas anggota berhasil diperbarui' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.toggleKasBulan = async (req, res) => {
    try {
        const { user_id, bulan, is_checked } = req.body; // bulan format "YYYY-MM"
        const pId = await getPeriodeId(req);
        
        // Dapatkan nominal kas per bulan dari pengaturan
        const [pengaturan] = await pool.query('SELECT pengaturan_value FROM keuangan_pengaturan WHERE pengaturan_key = ?', ['kas_per_bulan']);
        const kasPerBulan = pengaturan.length > 0 ? Number(pengaturan[0].pengaturan_value) : 10000;
        
        // Dapatkan data kas anggota saat ini
        const [existing] = await pool.query('SELECT id, total_terbayar, bulan_dibayar FROM keuangan_kas_anggota WHERE user_id = ? AND periode_id = ?', [user_id, pId]);
        
        if (existing.length === 0) {
            // Buat record baru jika belum ada (misal target_nominal 0)
            const initialBulan = is_checked ? JSON.stringify([bulan]) : '[]';
            const initialTerbayar = is_checked ? kasPerBulan : 0;
            await pool.query(
                'INSERT INTO keuangan_kas_anggota (user_id, periode_id, target_nominal, total_terbayar, bulan_dibayar) VALUES (?, ?, 0, ?, ?)',
                [user_id, pId, initialTerbayar, initialBulan]
            );
            return res.json({ message: 'Tersimpan', is_checked });
        }
        
        const row = existing[0];
        let bulanArray = [];
        if (row.bulan_dibayar) {
            try {
                bulanArray = JSON.parse(row.bulan_dibayar);
            } catch(e) {}
        }
        
        if (is_checked) {
            // Tambahkan bulan jika belum ada
            if (!bulanArray.includes(bulan)) {
                bulanArray.push(bulan);
            }
        } else {
            // Hapus bulan jika ada
            if (bulanArray.includes(bulan)) {
                bulanArray = bulanArray.filter(b => b !== bulan);
            }
        }
        
        let newTerbayar = bulanArray.length * kasPerBulan;
        
        await pool.query(
            'UPDATE keuangan_kas_anggota SET total_terbayar = ?, bulan_dibayar = ? WHERE user_id = ?',
            [newTerbayar, JSON.stringify(bulanArray), user_id]
        );
        
        res.json({ message: 'Tersimpan', is_checked });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.resetKasBulan = async (req, res) => {
    try {
        const { id } = req.params; // user_id
        const pId = await getPeriodeId(req);
        
        await pool.query(
            'UPDATE keuangan_kas_anggota SET total_terbayar = 0, bulan_dibayar = ? WHERE user_id = ? AND periode_id = ?',
            ['[]', id, pId]
        );
        
        res.json({ message: 'Data kas berhasil direset' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Pengaturan ---
exports.getPengaturan = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT pengaturan_key, pengaturan_value FROM keuangan_pengaturan');
        const settings = {};
        rows.forEach(r => {
            settings[r.pengaturan_key] = r.pengaturan_value;
        });
        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updatePengaturan = async (req, res) => {
    try {
        const settings = req.body; // Expecting an object of { key: value }
        
        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                'INSERT INTO keuangan_pengaturan (pengaturan_key, pengaturan_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE pengaturan_value = ?',
                [key, String(value), String(value)]
            );
        }
        
        res.json({ message: 'Pengaturan disimpan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Kegiatan ---
exports.getKegiatan = async (req, res) => {
    try {
        const pId = await getPeriodeId(req);
        const [rows] = await pool.query('SELECT * FROM keuangan_kegiatan WHERE periode_id = ? ORDER BY created_at DESC', [pId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getKegiatanById = async (req, res) => {
    try {
        const { id } = req.params;
        const [kegiatan] = await pool.query('SELECT * FROM keuangan_kegiatan WHERE id = ?', [id]);
        
        if (kegiatan.length === 0) return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
        
        const [transaksi] = await pool.query('SELECT * FROM keuangan_transaksi WHERE kegiatan_id = ? ORDER BY tanggal DESC, created_at DESC', [id]);
        
        let totalPemasukan = 0;
        let totalPengeluaran = 0;
        
        transaksi.forEach(t => {
            if (t.jenis === 'pemasukan') totalPemasukan += Number(t.nominal);
            if (t.jenis === 'pengeluaran') totalPengeluaran += Number(t.nominal);
        });
        
        const saldoAkhir = Number(kegiatan[0].saldo_awal) + totalPemasukan - totalPengeluaran;
        
        res.json({
            ...kegiatan[0],
            saldo_akhir: saldoAkhir,
            transaksi
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createKegiatan = async (req, res) => {
    try {
        const { nama_kegiatan, deskripsi, saldo_awal } = req.body;
        const created_by = req.user.id;
        const pId = await getPeriodeId(req);
        
        await pool.query(
            'INSERT INTO keuangan_kegiatan (periode_id, nama_kegiatan, deskripsi, saldo_awal, created_by) VALUES (?, ?, ?, ?, ?)',
            [pId, nama_kegiatan, deskripsi, saldo_awal || 0, created_by]
        );
        
        res.json({ message: 'Kegiatan berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Hapus file bukti transaksi yang terkait dengan kegiatan ini
        const [transaksi] = await pool.query('SELECT bukti_url FROM keuangan_transaksi WHERE kegiatan_id = ? AND bukti_url IS NOT NULL', [id]);
        
        for (const trx of transaksi) {
            if (trx.bukti_url) {
                const filepath = path.join(__dirname, '../../absen.dinusrobotic.org', trx.bukti_url);
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            }
        }

        // Hapus kegiatan (ON DELETE CASCADE akan otomatis menghapus transaksinya di database)
        await pool.query('DELETE FROM keuangan_kegiatan WHERE id = ?', [id]);
        
        res.json({ message: 'Kegiatan berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Transaksi Kegiatan ---
exports.createTransaksi = async (req, res) => {
    try {
        const { id } = req.params; // kegiatan_id
        const { tanggal, jenis, nominal, keterangan } = req.body;
        const created_by = req.user.id;
        const pId = await getPeriodeId(req);
        
        let bukti_url = null;
        if (req.file) {
            bukti_url = `/uploads/keuangan/${req.file.filename}`;
        }

        await pool.query(
            'INSERT INTO keuangan_transaksi (periode_id, kegiatan_id, tanggal, jenis, nominal, keterangan, bukti_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, id, tanggal, jenis, nominal, keterangan, bukti_url, created_by]
        );
        
        res.json({ message: 'Transaksi berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteTransaksi = async (req, res) => {
    try {
        const { trxId } = req.params;
        
        // Hapus file jika ada
        const [trx] = await pool.query('SELECT bukti_url FROM keuangan_transaksi WHERE id = ?', [trxId]);
        if (trx.length > 0 && trx[0].bukti_url) {
            const filepath = path.join(__dirname, '../../absen.dinusrobotic.org', trx[0].bukti_url);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }

        await pool.query('DELETE FROM keuangan_transaksi WHERE id = ?', [trxId]);
        res.json({ message: 'Transaksi berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
