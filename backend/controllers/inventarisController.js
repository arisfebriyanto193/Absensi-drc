const db = require('../db');

exports.getBarang = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM inventaris_barang ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching barang:', error);
        res.status(500).json({ error: 'Gagal mengambil data barang' });
    }
};

exports.addBarang = async (req, res) => {
    try {
        const { nama_barang, lokasi, tanggal_pengecekan, kondisi, jumlah } = req.body;
        const foto = req.file ? `/uploads/inventaris/${req.file.filename}` : null;

        await db.query(
            'INSERT INTO inventaris_barang (nama_barang, foto, lokasi, tanggal_pengecekan, kondisi, jumlah) VALUES (?, ?, ?, ?, ?, ?)',
            [nama_barang, foto, lokasi, tanggal_pengecekan || null, kondisi || 'Baik', jumlah || 0]
        );

        res.status(201).json({ message: 'Barang berhasil ditambahkan' });
    } catch (error) {
        console.error('Error adding barang:', error);
        res.status(500).json({ error: 'Gagal menambahkan barang' });
    }
};

exports.updateBarang = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_barang, lokasi, tanggal_pengecekan, kondisi, jumlah } = req.body;
        let query = 'UPDATE inventaris_barang SET nama_barang=?, lokasi=?, tanggal_pengecekan=?, kondisi=?, jumlah=?';
        let params = [nama_barang, lokasi, tanggal_pengecekan || null, kondisi, jumlah];

        if (req.file) {
            query += ', foto=?';
            params.push(`/uploads/inventaris/${req.file.filename}`);
        }

        query += ' WHERE id=?';
        params.push(id);

        await db.query(query, params);
        res.json({ message: 'Barang berhasil diupdate' });
    } catch (error) {
        console.error('Error updating barang:', error);
        res.status(500).json({ error: 'Gagal mengupdate barang' });
    }
};

exports.deleteBarang = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM inventaris_barang WHERE id=?', [id]);
        res.json({ message: 'Barang berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting barang:', error);
        res.status(500).json({ error: 'Gagal menghapus barang' });
    }
};

// Peminjaman (Admin / Inventaris View)
exports.getAllPeminjaman = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, u.nama_lengkap as nama_peminjam, b.nama_barang 
            FROM inventaris_peminjaman p
            JOIN users u ON p.user_id = u.id
            JOIN inventaris_barang b ON p.barang_id = b.id
            ORDER BY p.id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching peminjaman:', error);
        res.status(500).json({ error: 'Gagal mengambil data peminjaman' });
    }
};

exports.updateStatusPeminjaman = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { status } = req.body;
        const acc_oleh = req.user.id; // from auth middleware

        await connection.beginTransaction();

        const [peminjamanRows] = await connection.query('SELECT * FROM inventaris_peminjaman WHERE id = ?', [id]);
        if (peminjamanRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Peminjaman tidak ditemukan' });
        }
        
        const peminjaman = peminjamanRows[0];
        
        if (status === 'Disetujui' && peminjaman.status !== 'Disetujui') {
            // Kurangi stok barang
            await connection.query('UPDATE inventaris_barang SET jumlah = jumlah - ? WHERE id = ?', [peminjaman.jumlah_pinjam, peminjaman.barang_id]);
        } else if (status === 'Dikembalikan' && peminjaman.status === 'Disetujui') {
            // Tambah stok barang kembali
            await connection.query('UPDATE inventaris_barang SET jumlah = jumlah + ? WHERE id = ?', [peminjaman.jumlah_pinjam, peminjaman.barang_id]);
        }

        await connection.query(
            'UPDATE inventaris_peminjaman SET status=?, di_acc_oleh=? WHERE id=?',
            [status, acc_oleh, id]
        );

        await connection.commit();
        res.json({ message: 'Status peminjaman diupdate' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating status peminjaman:', error);
        res.status(500).json({ error: 'Gagal mengupdate status' });
    } finally {
        connection.release();
    }
};

// Peminjaman (User View)
exports.requestPeminjaman = async (req, res) => {
    try {
        const { barang_id, jumlah_pinjam, alasan, tanggal_pinjam, tanggal_kembali } = req.body;
        const user_id = req.user.id; // from auth middleware

        // Cek stok barang
        const [barangRows] = await db.query('SELECT jumlah FROM inventaris_barang WHERE id = ?', [barang_id]);
        if (barangRows.length === 0) return res.status(404).json({ error: 'Barang tidak ditemukan' });
        if (barangRows[0].jumlah < jumlah_pinjam) return res.status(400).json({ error: 'Stok barang tidak mencukupi' });

        await db.query(
            'INSERT INTO inventaris_peminjaman (user_id, barang_id, jumlah_pinjam, alasan, tanggal_pinjam, tanggal_kembali) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, barang_id, jumlah_pinjam, alasan, tanggal_pinjam, tanggal_kembali]
        );

        res.status(201).json({ message: 'Request peminjaman berhasil diajukan' });
    } catch (error) {
        console.error('Error requesting peminjaman:', error);
        res.status(500).json({ error: 'Gagal mengajukan peminjaman' });
    }
};

exports.getUserPeminjaman = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [rows] = await db.query(`
            SELECT p.*, b.nama_barang 
            FROM inventaris_peminjaman p
            JOIN inventaris_barang b ON p.barang_id = b.id
            WHERE p.user_id = ?
            ORDER BY p.id DESC
        `, [user_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching user peminjaman:', error);
        res.status(500).json({ error: 'Gagal mengambil riwayat peminjaman' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const [totalBarang] = await db.query('SELECT COUNT(*) as count FROM inventaris_barang');
        const [rusak] = await db.query('SELECT COUNT(*) as count FROM inventaris_barang WHERE kondisi != "Baik"');
        const [pendingRequest] = await db.query('SELECT COUNT(*) as count FROM inventaris_peminjaman WHERE status = "Pending"');
        const [dipinjam] = await db.query('SELECT COUNT(*) as count FROM inventaris_peminjaman WHERE status = "Disetujui"');

        res.json({
            totalBarang: totalBarang[0].count,
            rusak: rusak[0].count,
            pendingRequest: pendingRequest[0].count,
            dipinjam: dipinjam[0].count
        });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil statistik dashboard' });
    }
};
