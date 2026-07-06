<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

// Tentukan minggu (default minggu ini)
$minggu = $_GET['minggu'] ?? date('Y-\WW');
list($tahun, $week) = explode('-W', $minggu);

// Hitung tanggal awal dan akhir minggu
$dto = new DateTime();
$dto->setISODate($tahun, $week);
$tanggal_mulai = $dto->format('Y-m-d');
$dto->modify('+6 days');
$tanggal_akhir = $dto->format('Y-m-d');

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
            a.foto_before,
            a.foto_after,
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

// Statistik
$total_jadwal = count($data_absensi);
$sudah_absen = count(array_filter($data_absensi, function($item) {
    return $item['absensi_id'] !== null;
}));
$belum_absen = $total_jadwal - $sudah_absen;
$persentase = $total_jadwal > 0 ? round(($sudah_absen / $total_jadwal) * 100, 1) : 0;

// Group data by date
$data_per_hari = [];
foreach ($data_absensi as $item) {
    $data_per_hari[$item['tanggal']][] = $item;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Mingguan Absensi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @media print {
            .no-print { display: none !important; }
            body { background: white; }
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 0.875rem;
        }
        
        .status-hadir {
            background: #dcfce7;
            color: #166534;
            border: 2px solid #22c55e;
        }
        
        .status-tidak-hadir {
            background: #fee2e2;
            color: #991b1b;
            border: 2px solid #ef4444;
        }
    </style>
</head>
<body class="bg-gray-100">
    <nav class="bg-blue-600 text-white shadow-lg no-print">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-xl font-bold">
                <i class="fas fa-calendar-week"></i> Laporan Mingguan Absensi
            </h1>
            <a href="/" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">
                <i class="fas fa-arrow-left"></i> Kembali
            </a>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <!-- Filter Tanggal -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6 no-print">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Pilih Range Tanggal -->
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="far fa-calendar"></i> Pilih Rentang Tanggal
                    </label>
                    <div class="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label class="text-xs text-gray-600">Dari Tanggal</label>
                            <input type="date" id="inputTanggalMulai" value="<?php echo $tanggal_mulai; ?>"
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="text-xs text-gray-600">Sampai Tanggal</label>
                            <input type="date" id="inputTanggalAkhir" value="<?php echo $tanggal_akhir; ?>"
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <button onclick="cariDataByDate()" 
                        class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold">
                        <i class="fas fa-search"></i> Cari Berdasarkan Tanggal
                    </button>
                </div>

                <!-- Pilih Minggu -->
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="far fa-calendar-alt"></i> Atau Pilih Minggu
                    </label>
                    <div class="flex gap-2 mb-2">
                        <input type="week" id="inputMinggu" value="<?php echo $minggu; ?>"
                            class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <button onclick="cariDataByWeek()" 
                            class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold">
                            <i class="fas fa-search"></i> Cari
                        </button>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="gantiMinggu(-1)" 
                            class="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm">
                            <i class="fas fa-chevron-left"></i> Lalu
                        </button>
                        <button onclick="setMingguIni()" 
                            class="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                            <i class="fas fa-calendar-day"></i> Minggu Ini
                        </button>
                        <button onclick="gantiMinggu(1)" 
                            class="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm">
                            Depan <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Info Periode -->
        <?php
        $bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $date_mulai = new DateTime($tanggal_mulai);
        $date_akhir = new DateTime($tanggal_akhir);
        $periode = $date_mulai->format('d') . ' ' . $bulan[(int)$date_mulai->format('m')] . ' - ' . 
                   $date_akhir->format('d') . ' ' . $bulan[(int)$date_akhir->format('m')] . ' ' . $tahun;
        ?>
        
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-2xl font-bold mb-1">
                        <i class="fas fa-calendar-alt"></i> Minggu ke-<?php echo $week; ?>, <?php echo $tahun; ?>
                    </h2>
                    <p class="text-blue-100 text-lg"><?php echo $periode; ?></p>
                </div>
                <div class="text-right">
                    <div class="text-5xl font-bold"><?php echo $persentase; ?>%</div>
                    <div class="text-blue-100 text-sm">Tingkat Kehadiran</div>
                </div>
            </div>
            
            <!-- Statistik -->
            <div class="grid grid-cols-3 gap-4 mt-4">
                <div class="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                    <div class="text-3xl font-bold"><?php echo $total_jadwal; ?></div>
                    <div class="text-sm text-blue-100">Total Jadwal</div>
                </div>
                <div class="bg-green-500 bg-opacity-30 rounded-lg p-4 text-center">
                    <div class="text-3xl font-bold"><?php echo $sudah_absen; ?></div>
                    <div class="text-sm text-blue-100">Hadir</div>
                </div>
                <div class="bg-red-500 bg-opacity-30 rounded-lg p-4 text-center">
                    <div class="text-3xl font-bold"><?php echo $belum_absen; ?></div>
                    <div class="text-sm text-blue-100">Tidak Hadir</div>
                </div>
            </div>
        </div>

        <!-- Tombol Export -->
        <div class="bg-white rounded-lg shadow-lg p-4 mb-6 no-print">
            <div class="flex flex-wrap gap-3">
                <button onclick="exportExcel()" 
                    class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold inline-flex items-center gap-2">
                    <i class="fas fa-file-excel"></i> Export ke Excel
                </button>
                <button onclick="window.print()" 
                    class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold inline-flex items-center gap-2">
                    <i class="fas fa-print"></i> Cetak Laporan
                </button>
            </div>
        </div>

        <!-- Tabel Laporan -->
        <?php if (empty($data_absensi)): ?>
            <div class="bg-white rounded-lg shadow-lg p-12 text-center">
                <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-600 mb-2">Tidak Ada Data</h3>
                <p class="text-gray-500">Tidak ada jadwal piket pada minggu ini</p>
            </div>
        <?php else: ?>
            <?php foreach ($data_per_hari as $tanggal => $items): ?>
            <?php
            $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            $date = new DateTime($tanggal);
            $hariNama = $hari[$date->format('w')];
            $tanggalFormat = $date->format('d') . ' ' . $bulan[(int)$date->format('m')] . ' ' . $date->format('Y');
            ?>
            
            <div class="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
                <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                    <h3 class="text-xl font-bold">
                        <i class="fas fa-calendar-day"></i> <?php echo $hariNama; ?>, <?php echo $tanggalFormat; ?>
                    </h3>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">No</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">NIM</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Lokasi</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Jam Piket</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Jam Absen</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <?php $no = 1; foreach ($items as $item): ?>
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800"><?php echo $no++; ?></td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-semibold text-gray-800"><?php echo htmlspecialchars($item['nama_lengkap']); ?></div>
                                    <div class="text-xs text-gray-500">@<?php echo htmlspecialchars($item['username']); ?></div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                    <?php echo htmlspecialchars($item['nim'] ?? '-'); ?>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                    <i class="fas fa-map-marker-alt text-gray-400"></i> <?php echo htmlspecialchars($item['lokasi']); ?>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                    <?php echo substr($item['jam_mulai'], 0, 5); ?> - <?php echo substr($item['jam_selesai'], 0, 5); ?>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <?php if ($item['status'] === 'HADIR'): ?>
                                        <span class="status-badge status-hadir">
                                            <i class="fas fa-check-circle"></i> HADIR
                                        </span>
                                    <?php else: ?>
                                        <span class="status-badge status-tidak-hadir">
                                            <i class="fas fa-times-circle"></i> TIDAK HADIR
                                        </span>
                                    <?php endif; ?>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                    <?php 
                                    if ($item['jam_absen']) {
                                        echo date('H:i', strtotime($item['jam_absen']));
                                    } else {
                                        echo '-';
                                    }
                                    ?>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-600">
                                    <?php if ($item['approved_at']): ?>
                                        <span class="inline-flex items-center gap-1 text-orange-600 font-semibold">
                                            <i class="fas fa-user-shield"></i> Dibantu Admin
                                        </span>
                                    <?php endif; ?>
                                    
                                    <?php if ($item['catatan']): ?>
                                        <div class="mt-1">
                                            <span class="text-gray-500 text-xs">Catatan:</span>
                                            <p class="text-xs"><?php echo htmlspecialchars($item['catatan']); ?></p>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <?php if ($item['keterangan_admin']): ?>
                                        <div class="mt-1 bg-yellow-50 p-2 rounded">
                                            <span class="text-yellow-700 text-xs font-semibold">Catatan Admin:</span>
                                            <p class="text-xs text-yellow-800"><?php echo htmlspecialchars($item['keterangan_admin']); ?></p>
                                        </div>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <script>
        function cariData() {
            const minggu = document.getElementById('inputMinggu').value;
            window.location.href = '?minggu=' + minggu;
        }

        function gantiMinggu(weeks) {
            const currentWeek = document.getElementById('inputMinggu').value;
            const [year, week] = currentWeek.split('-W');
            
            const date = new Date(year, 0, 1 + (week - 1) * 7);
            date.setDate(date.getDate() + weeks * 7);
            
            const newYear = date.getFullYear();
            const newWeek = getWeekNumber(date);
            
            const newValue = `${newYear}-W${String(newWeek).padStart(2, '0')}`;
            document.getElementById('inputMinggu').value = newValue;
            cariData();
        }

        function setMingguIni() {
            const today = new Date();
            const year = today.getFullYear();
            const week = getWeekNumber(today);
            document.getElementById('inputMinggu').value = `${year}-W${String(week).padStart(2, '0')}`;
            cariData();
        }

        function getWeekNumber(date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        function exportExcel() {
            const minggu = document.getElementById('inputMinggu').value;
            window.location.href = 'export_excel.php?minggu=' + minggu;
        }

        // Enter untuk search
        document.getElementById('inputMinggu').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                cariData();
            }
        });
    </script>
</body>
</html>