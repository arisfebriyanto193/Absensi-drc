const pool = require('../db');

exports.getPeriodes = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(`
            SELECT p.* 
            FROM periodes p
            JOIN user_periodes up ON p.id = up.periode_id
            WHERE up.user_id = ?
            ORDER BY p.id DESC
        `, [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getActivePeriode = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM periodes WHERE is_active = 1 LIMIT 1');
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Tidak ada periode aktif' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createPeriodeAndTransition = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { nama_periode, users } = req.body;
        
        if (!nama_periode) {
            return res.status(400).json({ message: 'Nama periode wajib diisi' });
        }

        await connection.beginTransaction();

        // Cek apakah periode sudah ada
        const [existing] = await connection.query('SELECT id FROM periodes WHERE nama_periode = ?', [nama_periode]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Nama periode sudah digunakan' });
        }

        // Matikan periode lama
        await connection.query('UPDATE periodes SET is_active = 0');

        // Buat periode baru
        const [result] = await connection.query('INSERT INTO periodes (nama_periode, is_active) VALUES (?, 1)', [nama_periode]);
        const newPeriodeId = result.insertId;

        // Migrasi anggota yang dipilih
        if (users && users.length > 0) {
            for (const user of users) {
                await connection.query(
                    'INSERT INTO user_periodes (user_id, periode_id, role, jabatan) VALUES (?, ?, ?, ?)',
                    [user.id, newPeriodeId, user.role || 'user', user.jabatan || 'Anggota']
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Periode baru berhasil dimulai', periode_id: newPeriodeId });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server Error saat transisi periode' });
    } finally {
        connection.release();
    }
};
