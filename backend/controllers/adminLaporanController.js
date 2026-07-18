const pool = require('../db');

const getPeriodeId = async (req) => {
    if (req.headers['x-periode-id'] && req.headers['x-periode-id'] !== 'all') return req.headers['x-periode-id'];
    if (req.query.periode_id && req.query.periode_id !== 'all') return req.query.periode_id;
    const [active] = await pool.query('SELECT id FROM periodes WHERE is_active = 1 LIMIT 1');
    return active.length > 0 ? active[0].id : null;
};

exports.getLaporan = async (req, res) => {
  try {
    const pId = await getPeriodeId(req);
    const { bulan, tahun } = req.query;
    
    // Default ke bulan dan tahun sekarang jika tidak dikirim
    const currentDate = new Date();
    const selectedBulan = bulan ? String(bulan).padStart(2, '0') : String(currentDate.getMonth() + 1).padStart(2, '0');
    const selectedTahun = tahun || String(currentDate.getFullYear());
    
    const yearMonth = `${selectedTahun}-${selectedBulan}`;

    const query = `
      SELECT 
        u.id as user_id, 
        u.nama_lengkap, 
        u.nim,
        j.id as jadwal_id,
        DATE_FORMAT(j.tanggal, '%Y-%m-%d') as tanggal,
        j.lokasi,
        a.status_konfirmasi as status_absen
      FROM users u
      INNER JOIN user_periodes up ON u.id = up.user_id
      LEFT JOIN jadwal_piket j ON u.id = j.user_id AND DATE_FORMAT(j.tanggal, '%Y-%m') = ? AND j.periode_id = up.periode_id
      LEFT JOIN absensi a ON j.id = a.jadwal_id
      WHERE up.periode_id = ? AND up.role = 'user'
      ORDER BY u.nama_lengkap ASC, j.tanggal ASC;
    `;

    const [rows] = await pool.query(query, [yearMonth, pId]);

    // Grouping data di Node.js
    const laporanMap = {};

    rows.forEach(row => {
      if (!laporanMap[row.user_id]) {
        laporanMap[row.user_id] = {
          user_id: row.user_id,
          nama_lengkap: row.nama_lengkap,
          nim: row.nim,
          total_jadwal: 0,
          total_hadir: 0, // approved
          total_pending: 0, // pending
          total_ditolak: 0, // rejected
          total_alfa: 0, // tidak absen (tidak ada record absensi dan tanggal sudah lewat)
          detail: []
        };
      }

      if (row.jadwal_id) {
        laporanMap[row.user_id].total_jadwal += 1;
        
        let statusKehadiran = 'Belum Ada Data';
        if (row.status_absen === 'approved') {
          laporanMap[row.user_id].total_hadir += 1;
          statusKehadiran = 'Hadir';
        } else if (row.status_absen === 'pending') {
          laporanMap[row.user_id].total_pending += 1;
          statusKehadiran = 'Menunggu Konfirmasi';
        } else if (row.status_absen === 'rejected') {
          laporanMap[row.user_id].total_ditolak += 1;
          statusKehadiran = 'Ditolak';
        } else {
          // Jika belum absen, cek apakah tanggalnya sudah lewat
          const jadwalDate = new Date(row.tanggal);
          const today = new Date();
          today.setHours(0,0,0,0);
          
          if (jadwalDate < today) {
             laporanMap[row.user_id].total_alfa += 1;
             statusKehadiran = 'Alfa (Tidak Piket)';
          } else {
             statusKehadiran = 'Belum Mulai';
          }
        }

        laporanMap[row.user_id].detail.push({
          jadwal_id: row.jadwal_id,
          tanggal: row.tanggal,
          lokasi: row.lokasi,
          status_absen: row.status_absen, // raw status (approved, pending, rejected, null)
          keterangan: statusKehadiran
        });
      }
    });

    const hasilLaporan = Object.values(laporanMap);

    res.json(hasilLaporan);
  } catch (error) {
    console.error("Error getLaporan:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
