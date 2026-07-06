const pool = require('../db');
const dayjs = require('dayjs');

exports.getIzinPending = async (req, res) => {
    try {
        const [izin] = await pool.query(`
            SELECT i.*, DATE_FORMAT(i.tanggal_izin, '%Y-%m-%d') AS tanggal_izin, u.nama_lengkap, DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal, j.lokasi 
            FROM izin i 
            JOIN users u ON i.user_id = u.id 
            JOIN jadwal_piket j ON i.jadwal_id = j.id 
            WHERE i.status = 'pending'
            ORDER BY i.created_at DESC
        `);
        res.json(izin);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getIzinHistory = async (req, res) => {
    try {
        const [izin] = await pool.query(`
            SELECT i.*, DATE_FORMAT(i.tanggal_izin, '%Y-%m-%d') AS tanggal_izin, u.nama_lengkap, DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal, j.lokasi 
            FROM izin i 
            JOIN users u ON i.user_id = u.id 
            JOIN jadwal_piket j ON i.jadwal_id = j.id 
            WHERE i.status != 'pending'
            ORDER BY i.approved_at DESC, i.created_at DESC
        `);
        res.json(izin);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.konfirmasiIzin = async (req, res) => {
    try {
        const { id, status, keterangan_admin } = req.body;
        const adminId = req.user.id;
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

        await pool.query(`
            UPDATE izin 
            SET status = ?, keterangan_admin = ?, approved_by = ?, approved_at = ? 
            WHERE id = ?
        `, [status, keterangan_admin || '', adminId, now, id]);

        res.json({ message: `Izin berhasil di-${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
