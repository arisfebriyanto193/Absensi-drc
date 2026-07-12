const pool = require('../db');

exports.getJabatans = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM jabatans ORDER BY nama_jabatan ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching jabatans:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
