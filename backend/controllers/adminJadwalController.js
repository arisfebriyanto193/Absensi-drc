const pool = require('../db');
const dayjs = require('dayjs');

const getPeriodeId = async (req) => {
    if (req.headers['x-periode-id'] && req.headers['x-periode-id'] !== 'all') return req.headers['x-periode-id'];
    if (req.query.periode_id && req.query.periode_id !== 'all') return req.query.periode_id;
    if (req.body.periode_id && req.body.periode_id !== 'all') return req.body.periode_id;
    const [active] = await pool.query('SELECT id FROM periodes WHERE is_active = 1 LIMIT 1');
    return active.length > 0 ? active[0].id : null;
};

exports.getJadwal = async (req, res) => {
    try {
        const pId = await getPeriodeId(req);
        const [jadwal] = await pool.query(`
            SELECT j.*, DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal, u.nama_lengkap 
            FROM jadwal_piket j 
            JOIN users u ON j.user_id = u.id 
            WHERE j.periode_id = ?
            ORDER BY j.tanggal DESC
        `, [pId]);
        res.json(jadwal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createJadwal = async (req, res) => {
    try {
        const { user_ids, tanggal, jam_mulai, jam_selesai, lokasi } = req.body;
        
        const pId = await getPeriodeId(req);

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ message: 'Minimal 1 user harus dipilih' });
        }

        for (const user_id of user_ids) {
            await pool.query(`
                INSERT INTO jadwal_piket (user_id, periode_id, tanggal, jam_mulai, jam_selesai, lokasi, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
            `, [user_id, pId, tanggal, jam_mulai, jam_selesai, lokasi]);
        }

        res.json({ message: 'Jadwal berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.hapusJadwal = async (req, res) => {
    try {
        const { id } = req.params;
        const [[{ count }]] = await pool.query(`SELECT COUNT(*) as count FROM absensi WHERE jadwal_id = ?`, [id]);
        
        if (count > 0) {
            return res.status(400).json({ message: 'Jadwal tidak dapat dihapus karena sudah ada absensi' });
        }

        await pool.query(`DELETE FROM jadwal_piket WHERE id = ?`, [id]);
        res.json({ message: 'Jadwal berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.hapusJadwalTanggal = async (req, res) => {
    try {
        const { tanggal } = req.params;
        const [[{ count }]] = await pool.query(`
            SELECT COUNT(*) as count FROM jadwal_piket jp 
            JOIN absensi a ON jp.id = a.jadwal_id 
            WHERE jp.tanggal = ?
        `, [tanggal]);
        
        if (count > 0) {
            return res.status(400).json({ message: `Tidak dapat menghapus! Ada ${count} jadwal yang sudah memiliki absensi` });
        }

        const [result] = await pool.query(`DELETE FROM jadwal_piket WHERE tanggal = ?`, [tanggal]);
        
        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Tidak ada jadwal pada tanggal tersebut' });
        }
        
        res.json({ message: `Berhasil menghapus ${result.affectedRows} jadwal pada tanggal tersebut` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.salinJadwal = async (req, res) => {
    try {
        const { tanggal_awal, jumlah_minggu } = req.body;
        if (!tanggal_awal || jumlah_minggu < 1) {
            return res.status(400).json({ message: 'Tanggal awal dan jumlah minggu tidak valid' });
        }

        const pId = await getPeriodeId(req);
        
        const tanggal_akhir = dayjs(tanggal_awal).add(6, 'day').format('YYYY-MM-DD');
        const [jadwalTemplate] = await pool.query(`
            SELECT user_id, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, jam_mulai, jam_selesai, lokasi 
            FROM jadwal_piket 
            WHERE tanggal BETWEEN ? AND ? AND periode_id = ?
        `, [tanggal_awal, tanggal_akhir, pId]);

        if (jadwalTemplate.length === 0) {
            return res.status(400).json({ message: 'Tidak ada jadwal pada minggu tersebut untuk disalin' });
        }

        let berhasil = 0;
        for (let minggu = 1; minggu <= jumlah_minggu; minggu++) {
            for (const jadwal of jadwalTemplate) {
                const tanggalBaru = dayjs(jadwal.tanggal).add(minggu, 'week').format('YYYY-MM-DD');
                
                const [[{ exists }]] = await pool.query(`
                    SELECT COUNT(*) as \`exists\` FROM jadwal_piket 
                    WHERE user_id = ? AND tanggal = ? AND jam_mulai = ? AND lokasi = ? AND periode_id = ?
                `, [jadwal.user_id, tanggalBaru, jadwal.jam_mulai, jadwal.lokasi, pId]);

                if (!exists) {
                    await pool.query(`
                        INSERT INTO jadwal_piket (user_id, periode_id, tanggal, jam_mulai, jam_selesai, lokasi, status) 
                        VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
                    `, [jadwal.user_id, pId, tanggalBaru, jadwal.jam_mulai, jadwal.jam_selesai, jadwal.lokasi]);
                    berhasil++;
                }
            }
        }

        if (berhasil > 0) {
            res.json({ message: `Berhasil menyalin ${berhasil} jadwal untuk ${jumlah_minggu} minggu ke depan` });
        } else {
            res.status(400).json({ message: 'Semua jadwal sudah ada, tidak ada yang disalin' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
