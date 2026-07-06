const pool = require('../db');
const dayjs = require('dayjs');

exports.getAbsensiPending = async (req, res) => {
    try {
        const [absensi] = await pool.query(`
            SELECT a.*, u.nama_lengkap, DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal, j.lokasi 
            FROM absensi a 
            JOIN users u ON a.user_id = u.id 
            JOIN jadwal_piket j ON a.jadwal_id = j.id 
            WHERE a.status_konfirmasi = 'pending'
            ORDER BY a.created_at DESC
        `);
        res.json(absensi);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.konfirmasiAbsensi = async (req, res) => {
    try {
        const { id, status, keterangan_admin } = req.body;
        const adminId = req.user.id;
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

        await pool.query(`
            UPDATE absensi 
            SET status_konfirmasi = ?, keterangan_admin = ?, approved_by = ?, approved_at = ? 
            WHERE id = ?
        `, [status, keterangan_admin || '', adminId, now, id]);

        res.json({ message: `Absensi berhasil di-${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
