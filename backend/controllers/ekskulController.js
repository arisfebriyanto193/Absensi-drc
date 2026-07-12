const pool = require('../db');

exports.getSekolah = async (req, res) => {
    try {
        const [sekolah] = await pool.query(`
            SELECT s.*, 
                   COALESCE(SUM(p.total_pendapatan), 0) as total_pendapatan,
                   COALESCE(SUM(p.nominal_kas), 0) as total_kas,
                   COUNT(p.id) as total_pertemuan
            FROM ekskul_sekolah s
            LEFT JOIN ekskul_pembelajaran p ON p.sekolah_id = s.id
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `);
        res.json(sekolah);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.addSekolah = async (req, res) => {
    try {
        const { nama_sekolah, deskripsi } = req.body;
        await pool.query(
            `INSERT INTO ekskul_sekolah (nama_sekolah, deskripsi) VALUES (?, ?)`,
            [nama_sekolah, deskripsi]
        );
        res.json({ message: 'Sekolah berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getDetailSekolah = async (req, res) => {
    try {
        const { id } = req.params;
        const [sekolah] = await pool.query(
            `SELECT * FROM ekskul_sekolah WHERE id = ?`,
            [id]
        );

        if (sekolah.length === 0) {
            return res.status(404).json({ message: 'Sekolah tidak ditemukan' });
        }

        const [pembelajaran] = await pool.query(
            `SELECT p.*, DATE_FORMAT(p.tanggal, '%Y-%m-%d') as tanggal 
             FROM ekskul_pembelajaran p 
             WHERE p.sekolah_id = ? 
             ORDER BY p.tanggal DESC`,
            [id]
        );

        // Ambil data pengajar untuk tiap pembelajaran
        for (let p of pembelajaran) {
            const [pengajar] = await pool.query(
                `SELECT ep.*, u.nama_lengkap 
                 FROM ekskul_pengajar ep 
                 JOIN users u ON ep.user_id = u.id 
                 WHERE ep.pembelajaran_id = ?`,
                [p.id]
            );
            p.pengajar = pengajar;
        }

        sekolah[0].pembelajaran = pembelajaran;

        res.json(sekolah[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteSekolah = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM ekskul_sekolah WHERE id = ?`, [id]);
        res.json({ message: 'Sekolah beserta riwayatnya berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.addPembelajaran = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params; // sekolah_id
        const { tanggal, materi, total_pendapatan, nominal_kas, pengajar } = req.body;

        const [result] = await connection.query(
            `INSERT INTO ekskul_pembelajaran (sekolah_id, tanggal, materi, total_pendapatan, nominal_kas) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, tanggal, materi, total_pendapatan, nominal_kas]
        );

        const pembelajaranId = result.insertId;

        if (pengajar && pengajar.length > 0) {
            for (let p of pengajar) {
                await connection.query(
                    `INSERT INTO ekskul_pengajar (pembelajaran_id, user_id, honor, status_pembayaran) VALUES (?, ?, ?, ?)`,
                    [pembelajaranId, p.user_id, p.honor, p.status_pembayaran || 'belum']
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Pembelajaran berhasil ditambahkan' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
};

exports.deletePembelajaran = async (req, res) => {
    try {
        const { pembelajaran_id } = req.params;
        await pool.query(`DELETE FROM ekskul_pembelajaran WHERE id = ?`, [pembelajaran_id]);
        res.json({ message: 'Riwayat pembelajaran berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updatePembelajaran = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { pembelajaran_id } = req.params;
        const { tanggal, materi, total_pendapatan, nominal_kas, pengajar } = req.body;

        await connection.query(
            `UPDATE ekskul_pembelajaran 
             SET tanggal = ?, materi = ?, total_pendapatan = ?, nominal_kas = ?
             WHERE id = ?`,
            [tanggal, materi, total_pendapatan, nominal_kas, pembelajaran_id]
        );

        // Hapus pengajar lama
        await connection.query(`DELETE FROM ekskul_pengajar WHERE pembelajaran_id = ?`, [pembelajaran_id]);

        // Insert pengajar baru dengan status sebelumnya
        if (pengajar && pengajar.length > 0) {
            for (let p of pengajar) {
                await connection.query(
                    `INSERT INTO ekskul_pengajar (pembelajaran_id, user_id, honor, status_pembayaran) VALUES (?, ?, ?, ?)`,
                    [pembelajaran_id, p.user_id, p.honor, p.status_pembayaran || 'belum']
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Pembelajaran berhasil diperbarui' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
};

exports.toggleStatusPembelajaran = async (req, res) => {
    try {
        const { pembelajaran_id } = req.params;
        const { status_pembayaran } = req.body;
        await pool.query(`UPDATE ekskul_pembelajaran SET status_pembayaran = ? WHERE id = ?`, [status_pembayaran, pembelajaran_id]);
        res.json({ message: 'Status pembayaran berhasil diubah' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.toggleStatusPengajar = async (req, res) => {
    try {
        const { pengajar_id } = req.params;
        const { status_pembayaran } = req.body;
        await pool.query(`UPDATE ekskul_pengajar SET status_pembayaran = ? WHERE id = ?`, [status_pembayaran, pengajar_id]);
        res.json({ message: 'Status pembayaran pengajar berhasil diubah' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};