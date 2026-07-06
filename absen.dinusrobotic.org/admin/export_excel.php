<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    die('Unauthorized');
}

// Tentukan rentang tanggal
if (isset($_GET['tanggal_mulai']) && isset($_GET['tanggal_akhir'])) {
    // Mode: Pilih rentang tanggal manual
    $tanggal_mulai = $_GET['tanggal_mulai'];
    $tanggal_akhir = $_GET['tanggal_akhir'];
    
    // Hitung minggu dari tanggal mulai
    $dto = new DateTime($tanggal_mulai);
    $minggu = $dto->format('Y-\WW');
    list($tahun, $week) = explode('-W', $minggu);
    
    $filename_date = date('Ymd', strtotime($tanggal_mulai)) . '_' . date('Ymd', strtotime($tanggal_akhir));
} else {
    // Mode: Pilih minggu
    $minggu = $_GET['minggu'] ?? date('Y-\WW');
    list($tahun, $week) = explode('-W', $minggu);

    // Hitung tanggal awal dan akhir minggu
    $dto = new DateTime();
    $dto->setISODate($tahun, $week);
    $tanggal_mulai = $dto->format('Y-m-d');
    $dto->modify('+6 days');
    $tanggal_akhir = $dto->format('Y-m-d');
    
    $filename_date = 'Minggu_' . $week . '_Tahun_' . $tahun;
}

// Ambil data absensi mingguan
$query = "SELECT 
            jp.id as jadwal_id,
            jp.tanggal,
            jp.jam_mulai,
            jp.jam_selesai,
            jp.lokasi,
            u.id as user_id,
            u.nama_lengkap,
            u.username,
            u.nim,
            a.id as absensi_id,
            a.jam_absen,
            a.catatan,
            a.keterangan_admin,
            a.status_konfirmasi,
            a.approved_at,
            CASE 
                WHEN a.id IS NOT NULL THEN 'HADIR'
                ELSE 'TIDAK HADIR'
            END as status
          FROM jadwal_piket jp
          JOIN users u ON jp.user_id = u.id
          LEFT JOIN absensi a ON jp.id = a.jadwal_id
          WHERE jp.tanggal BETWEEN ? AND ?
          ORDER BY jp.tanggal, jp.jam_mulai, u.nama_lengkap";

$stmt = $conn->prepare($query);
$stmt->bind_param("ss", $tanggal_mulai, $tanggal_akhir);
$stmt->execute();
$result = $stmt->get_result();
$data_absensi = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Set header untuk download Excel
header('Content-Type: application/vnd.ms-excel');
header('Content-Disposition: attachment;filename="Laporan_Absensi_Minggu_' . $week . '_Tahun_' . $tahun . '.xls"');
header('Cache-Control: max-age=0');

// Format tanggal untuk judul
$bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
$date_mulai = new DateTime($tanggal_mulai);
$date_akhir = new DateTime($tanggal_akhir);
$periode = $date_mulai->format('d') . ' ' . $bulan[(int)$date_mulai->format('m')] . ' - ' . 
           $date_akhir->format('d') . ' ' . $bulan[(int)$date_akhir->format('m')] . ' ' . $tahun;

// Statistik
$total_jadwal = count($data_absensi);
$sudah_absen = count(array_filter($data_absensi, function($item) {
    return $item['absensi_id'] !== null;
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
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .sub-header {
            text-align: center;
            margin-bottom: 10px;
        }
        .status-hadir {
            background-color: #C6EFCE;
            color: #006100;
            font-weight: bold;
        }
        .status-tidak-hadir {
            background-color: #FFC7CE;
            color: #9C0006;
            font-weight: bold;
        }
        .statistik {
            margin-bottom: 20px;
        }
        .statistik td {
            padding: 5px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        LAPORAN ABSENSI PIKET MINGGUAN
    </div>
    <div class="sub-header">
        <strong>Minggu ke-<?php echo $week; ?>, Tahun <?php echo $tahun; ?></strong><br>
        Periode: <?php echo $periode; ?>
    </div>
    
    <table class="statistik">
        <tr>
            <td width="200">Total Jadwal</td>
            <td width="20">:</td>
            <td><?php echo $total_jadwal; ?></td>
        </tr>
        <tr>
            <td>Hadir</td>
            <td>:</td>
            <td><?php echo $sudah_absen; ?></td>
        </tr>
        <tr>
            <td>Tidak Hadir</td>
            <td>:</td>
            <td><?php echo $belum_absen; ?></td>
        </tr>
        <tr>
            <td>Persentase Kehadiran</td>
            <td>:</td>
            <td><?php echo $persentase; ?>%</td>
        </tr>
    </table>
    
    <br>
    
    <table>
        <thead>
            <tr>
                <th width="50">No</th>
                <th width="150">Tanggal</th>
                <th width="200">Nama</th>
                <th width="150">NIM</th>
                <th width="150">Lokasi</th>
                <th width="100">Jam Piket</th>
                <th width="100">Status</th>
                <th width="100">Jam Absen</th>
                <th width="300">Keterangan</th>
                <th width="300">Catatan Admin</th>
            </tr>
        </thead>
        <tbody>
            <?php 
            $no = 1;
            $current_date = '';
            foreach ($data_absensi as $item): 
                // Format tanggal
                $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                $date = new DateTime($item['tanggal']);
                $hariNama = $hari[$date->format('w')];
                $tanggalFormat = $hariNama . ', ' . $date->format('d') . ' ' . $bulan[(int)$date->format('m')] . ' ' . $date->format('Y');
                
                // Keterangan
                $keterangan = '';
                if ($item['approved_at']) {
                    $keterangan .= '[DIBANTU ADMIN] ';
                }
                if ($item['catatan']) {
                    $keterangan .= $item['catatan'];
                }
                if (empty($keterangan)) {
                    $keterangan = '-';
                }
                
                // Catatan Admin
                $keterangan_admin = $item['keterangan_admin'] ?? '-';
                
                // Jam Absen
                $jam_absen = '-';
                if ($item['jam_absen']) {
                    $jam_absen = date('H:i', strtotime($item['jam_absen']));
                }
                
                // Status class
                $status_class = ($item['status'] === 'HADIR') ? 'status-hadir' : 'status-tidak-hadir';
            ?>
            <tr>
                <td align="center"><?php echo $no++; ?></td>
                <td><?php echo $tanggalFormat; ?></td>
                <td>
                    <?php echo htmlspecialchars($item['nama_lengkap']); ?>
                    <br><small>@<?php echo htmlspecialchars($item['username']); ?></small>
                </td>
                <td><?php echo htmlspecialchars($item['nim'] ?? '-'); ?></td>
                <td><?php echo htmlspecialchars($item['lokasi']); ?></td>
                <td align="center">
                    <?php echo substr($item['jam_mulai'], 0, 5); ?> - <?php echo substr($item['jam_selesai'], 0, 5); ?>
                </td>
                <td align="center" class="<?php echo $status_class; ?>">
                    <?php echo $item['status']; ?>
                </td>
                <td align="center"><?php echo $jam_absen; ?></td>
                <td><?php echo htmlspecialchars($keterangan); ?></td>
                <td><?php echo htmlspecialchars($keterangan_admin); ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    
    <br><br>
    <table border="0">
        <tr>
            <td width="500"></td>
            <td align="center">
                <br><br>
                Dicetak pada: <?php echo date('d/m/Y H:i:s'); ?>
                <br><br><br><br>
                _______________________<br>
                <strong>Admin</strong>
            </td>
        </tr>
    </table>
</body>
</html>