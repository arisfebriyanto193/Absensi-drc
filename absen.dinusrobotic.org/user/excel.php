<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

$tanggal = $_GET['tanggal'] ?? date('Y-m-d');

// Ambil data jadwal dan absensi
$query = "SELECT 
            jp.id AS jadwal_id,
            jp.tanggal,
            jp.jam_mulai,
            jp.jam_selesai,
            jp.lokasi,
            u.nama_lengkap,
            u.username,
            a.jam_absen,
            a.catatan,
            CASE 
                WHEN a.id IS NOT NULL THEN 'HADIR'
                ELSE 'BELUM ABSEN'
            END AS status
          FROM jadwal_piket jp
          JOIN users u ON jp.user_id = u.id
          LEFT JOIN absensi a ON jp.id = a.jadwal_id
          WHERE jp.tanggal = ?
          ORDER BY jp.jam_mulai, u.nama_lengkap";


$stmt = $conn->prepare($query);
$stmt->bind_param("s", $tanggal);
$stmt->execute();
$result = $stmt->get_result();
$data_absensi = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Format tanggal untuk nama file
$date = new DateTime($tanggal);
$filename = "Absensi_Piket_" . $date->format('d-m-Y') . ".xls";

// Set header untuk download Excel
header("Content-Type: application/vnd.ms-excel");
header("Content-Disposition: attachment; filename=\"$filename\"");
header("Pragma: no-cache");
header("Expires: 0");

// Format tanggal untuk tampilan
$hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
$bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
$hari_nama = $hari[$date->format('w')];
$tanggal_format = $date->format('d') . ' ' . $bulan[(int)$date->format('m')] . ' ' . $date->format('Y');

// Hitung statistik
$total_jadwal = count($data_absensi);
$sudah_absen = count(array_filter($data_absensi, function($item) {
    return !empty($item['waktu_absen']);
}));
$belum_absen = $total_jadwal - $sudah_absen;
$persentase = $total_jadwal > 0 ? round(($sudah_absen / $total_jadwal) * 100, 1) : 0;
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #4472C4;
            color: white;
            font-weight: bold;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .status-hadir {
            background-color: #C6EFCE;
            color: #006100;
            font-weight: bold;
        }
        .status-belum {
            background-color: #FFC7CE;
            color: #9C0006;
            font-weight: bold;
        }
        .summary {
            margin-bottom: 20px;
        }
        .summary td {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN ABSENSI PIKET</h1>
        <h2><?php echo $hari_nama . ', ' . $tanggal_format; ?></h2>
        <p>Tanggal Export: <?php echo date('d/m/Y H:i:s'); ?></p>
    </div>

    <!-- Summary Statistics -->
    <table class="summary">
        <tr>
            <td width="200">Total Jadwal</td>
            <td width="50" style="text-align: center; background-color: #DDEBF7;"><?php echo $total_jadwal; ?></td>
            <td width="200">Persentase Kehadiran</td>
            <td width="50" style="text-align: center; background-color: #E2EFDA;"><?php echo $persentase; ?>%</td>
        </tr>
        <tr>
            <td>Sudah Absen</td>
            <td style="text-align: center; background-color: #C6EFCE; color: #006100; font-weight: bold;"><?php echo $sudah_absen; ?></td>
            <td>Belum Absen</td>
            <td style="text-align: center; background-color: #FFC7CE; color: #9C0006; font-weight: bold;"><?php echo $belum_absen; ?></td>
        </tr>
    </table>

    <br>

    <!-- Data Absensi -->
    <table>
        <thead>
            <tr>
                <th width="30">No</th>
                <th width="200">Nama Petugas</th>
                <th width="100">Username</th>
                <th width="80">Jam Mulai</th>
                <th width="80">Jam Selesai</th>
                <th width="150">Lokasi</th>
                <th width="100">Status</th>
                <th width="100">Waktu Absen</th>
                <th width="200">Keterangan</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($data_absensi)): ?>
            <tr>
                <td colspan="9" style="text-align: center; font-style: italic;">Tidak ada data</td>
            </tr>
            <?php else: ?>
                <?php $no = 1; foreach ($data_absensi as $data): ?>
                <tr>
                    <td style="text-align: center;"><?php echo $no++; ?></td>
                    <td><?php echo htmlspecialchars($data['nama_lengkap']); ?></td>
                    <td><?php echo htmlspecialchars($data['username']); ?></td>
                    <td style="text-align: center;"><?php echo substr($data['jam_mulai'], 0, 5); ?></td>
                    <td style="text-align: center;"><?php echo substr($data['jam_selesai'], 0, 5); ?></td>
                    <td><?php echo htmlspecialchars($data['lokasi']); ?></td>
                    <td class="<?php echo !empty($data['waktu_absen']) ? 'status-hadir' : 'status-belum'; ?>" 
                        style="text-align: center;">
                        <?php echo $data['status']; ?>
                    </td>
                    <td style="text-align: center;">
                        <?php echo !empty($data['waktu_absen']) ? date('H:i:s', strtotime($data['waktu_absen'])) : '-'; ?>
                    </td>
                    <td><?php echo !empty($data['keterangan']) ? htmlspecialchars($data['keterangan']) : '-'; ?></td>
                </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>

    <br><br>

    <table style="border: none;">
        <tr>
            <td style="border: none;">
                <p><strong>Keterangan:</strong></p>
                <ul>
                    <li>Hijau = Sudah Absen</li>
                    <li>Merah = Belum Absen</li>
                </ul>
            </td>
            <td style="border: none; text-align: right;">
                <p>Mengetahui,</p>
                <br><br><br>
                <p>______________________</p>
                <p>Admin/Koordinator</p>
            </td>
        </tr>
    </table>
</body>
</html>