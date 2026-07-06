const pool = require('../db');
const dayjs = require('dayjs');

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = dayjs().format('YYYY-MM-DD');

        // Jadwal Hari Ini
        const [jadwal] = await pool.query(
            `SELECT *, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal FROM jadwal_piket WHERE user_id = ? AND tanggal = ? AND status = 'scheduled'`,
            [userId, today]
        );

        // Riwayat Terbaru
        const [riwayat] = await pool.query(
            `SELECT * FROM absensi WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
            [userId]
        );

        res.json({
            jadwal_hari_ini: jadwal.length > 0 ? jadwal[0] : null,
            riwayat_terbaru: riwayat
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.submitAbsen = async (req, res) => {
    try {
        const userId = req.user.id;
        const { jadwal_id, catatan } = req.body;
        const files = req.files;
        
        let foto_before = null;
        let foto_after = null;
        
        if (files && files['foto_before']) foto_before = files['foto_before'][0].filename;
        if (files && files['foto_after']) foto_after = files['foto_after'][0].filename;

        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

        await pool.query(
            `INSERT INTO absensi (jadwal_id, user_id, foto_before, foto_after, jam_absen, catatan, status_konfirmasi) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [jadwal_id, userId, foto_before, foto_after, now, catatan || '']
        );

        await pool.query(
            `UPDATE jadwal_piket SET status = 'completed' WHERE id = ?`,
            [jadwal_id]
        );

        res.json({ message: 'Absensi berhasil disubmit dan menunggu konfirmasi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.submitIzin = async (req, res) => {
    try {
        const userId = req.user.id;
        const { jadwal_id, tanggal_izin, alasan } = req.body;
        const file_bukti = req.file ? req.file.filename : null;

        await pool.query(
            `INSERT INTO izin (user_id, jadwal_id, tanggal_izin, alasan, file_bukti, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
            [userId, jadwal_id, tanggal_izin, alasan, file_bukti]
        );

        res.json({ message: 'Izin berhasil diajukan dan menunggu konfirmasi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getJadwal = async (req, res) => {
    try {
        const userId = req.user.id;
        const [jadwal] = await pool.query(
            `SELECT *, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal FROM jadwal_piket WHERE user_id = ? ORDER BY tanggal DESC`,
            [userId]
        );
        res.json(jadwal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getJadwalIzin = async (req, res) => {
    try {
        const userId = req.user.id;
        const [jadwal] = await pool.query(`
            SELECT jp.*, DATE_FORMAT(jp.tanggal, '%Y-%m-%d') AS tanggal
            FROM jadwal_piket jp
            LEFT JOIN izin i ON i.jadwal_id = jp.id AND i.status IN ('pending', 'approved')
            LEFT JOIN absensi a ON a.jadwal_id = jp.id
            WHERE jp.user_id = ? 
              AND jp.tanggal >= CURDATE()
              AND jp.status = 'scheduled'
              AND i.id IS NULL
              AND a.id IS NULL
            ORDER BY jp.tanggal ASC
        `, [userId]);
        res.json(jadwal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getRiwayat = async (req, res) => {
    try {
        const userId = req.user.id;
        const [absensi] = await pool.query(
            `SELECT a.*, DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal, j.lokasi, j.jam_mulai, j.jam_selesai FROM absensi a JOIN jadwal_piket j ON a.jadwal_id = j.id WHERE a.user_id = ? ORDER BY a.created_at DESC`,
            [userId]
        );
        const [izin] = await pool.query(
            `SELECT *, DATE_FORMAT(tanggal_izin, '%Y-%m-%d') AS tanggal_izin FROM izin WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );
        res.json({ absensi, izin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getProfil = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await pool.query(
            `SELECT id, username, nama_lengkap, nim, email, role FROM users WHERE id = ?`,
            [userId]
        );
        if (user.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(user[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateProfil = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nama_lengkap, nim, email } = req.body;
        
        await pool.query(
            `UPDATE users SET nama_lengkap = ?, nim = ?, email = ? WHERE id = ?`,
            [nama_lengkap, nim, email, userId]
        );
        
        res.json({ message: 'Profil berhasil diupdate' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
