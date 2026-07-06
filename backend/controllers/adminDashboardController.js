const pool = require('../db');
const dayjs = require('dayjs');

exports.getDashboard = async (req, res) => {
    try {
        const today = dayjs().format('YYYY-MM-DD');

        const [[{ total_users }]] = await pool.query(`SELECT COUNT(*) as total_users FROM users WHERE role = 'user'`);
        const [[{ pending_absen }]] = await pool.query(`SELECT COUNT(*) as pending_absen FROM absensi WHERE status_konfirmasi = 'pending'`);
        const [[{ pending_izin }]] = await pool.query(`SELECT COUNT(*) as pending_izin FROM izin WHERE status = 'pending'`);
        const [[{ jadwal_hari_ini }]] = await pool.query(`SELECT COUNT(*) as jadwal_hari_ini FROM jadwal_piket WHERE tanggal = ?`, [today]);

        const [petugas_hari_ini] = await pool.query(`
            SELECT u.nama_lengkap, j.jam_mulai, j.jam_selesai, j.lokasi 
            FROM jadwal_piket j 
            JOIN users u ON j.user_id = u.id 
            WHERE j.tanggal = ?
            ORDER BY j.jam_mulai ASC
        `, [today]);

        const [recent_pending] = await pool.query(`
            SELECT a.id, u.nama_lengkap, a.jam_absen as waktu_absen, IF(a.foto_after IS NULL, 'masuk', 'pulang') as jenis 
            FROM absensi a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.status_konfirmasi = 'pending'
            ORDER BY a.jam_absen DESC
            LIMIT 5
        `);

        res.json({
            total_users,
            pending_absen,
            pending_izin,
            jadwal_hari_ini,
            petugas_hari_ini,
            recent_pending
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
