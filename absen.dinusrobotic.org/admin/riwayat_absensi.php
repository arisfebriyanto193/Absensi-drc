<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

$tanggal = $_GET['tanggal'] ?? date('Y-m-d');

// Ambil data jadwal dan absensi untuk tanggal tertentu
$query = "SELECT 
            jp.id as jadwal_id,
            jp.tanggal,
            jp.jam_mulai,
            jp.jam_selesai,
            jp.lokasi,
            u.id as user_id,
            u.nama_lengkap,
            u.username,
            a.id as absensi_id,
            a.jam_absen,
            a.foto_before,
            a.foto_after,
            a.catatan,
            a.status_konfirmasi,
            CASE 
                WHEN a.id IS NOT NULL THEN 'HADIR'
                ELSE 'BELUM ABSEN'
            END as status
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

// Statistik
$total_jadwal = count($data_absensi);
$sudah_absen = count(array_filter($data_absensi, function($item) {
    return $item['absensi_id'] !== null;
}));
$belum_absen = $total_jadwal - $sudah_absen;
$persentase = $total_jadwal > 0 ? round(($sudah_absen / $total_jadwal) * 100, 1) : 0;
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cek Status Absensi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
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
        
        .status-belum {
            background: #fee2e2;
            color: #991b1b;
            border: 2px solid #ef4444;
        }
        
        .status-pending {
            background: #fef3c7;
            color: #92400e;
            border: 2px solid #f59e0b;
        }
        
        .status-approved {
            background: #dbeafe;
            color: #1e40af;
            border: 2px solid #3b82f6;
        }
        
        .status-rejected {
            background: #fecaca;
            color: #7f1d1d;
            border: 2px solid #dc2626;
        }
        
        .card-petugas {
            transition: all 0.3s;
        }
        
        .card-petugas:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
        }

        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background-color: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            max-width: 900px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .foto-container {
            position: relative;
            overflow: hidden;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: transform 0.3s;
        }
        
        .foto-container:hover {
            transform: scale(1.05);
        }
        
        .foto-container img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
    </style>
</head>
<body class="bg-gray-100">
    <nav class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-xl font-bold">
                <i class="fas fa-check-circle"></i> Cek Status Absensi
            </h1>
            <a href="/" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">
                <i class="fas fa-arrow-left"></i> Kembali
            </a>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <!-- Filter Tanggal -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div class="flex-1 max-w-md w-full">
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="far fa-calendar"></i> Pilih Tanggal
                    </label>
                    <div class="flex gap-2">
                        <input type="date" id="inputTanggal" value="<?php echo $tanggal; ?>"
                            class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <button onclick="cariData()" 
                            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold">
                            <i class="fas fa-search"></i> Cari
                        </button>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="gantiTanggal(-1)" 
                        class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                        <i class="fas fa-chevron-left"></i> Kemarin
                    </button>
                    <button onclick="setHariIni()" 
                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <i class="fas fa-calendar-day"></i> Hari Ini
                    </button>
                    <button onclick="gantiTanggal(1)" 
                        class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                        Besok <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Info Tanggal -->
        <?php
        $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $date = new DateTime($tanggal);
        $hariNama = $hari[$date->format('w')];
        $tanggalFormat = $date->format('d') . ' ' . $bulan[(int)$date->format('m')] . ' ' . $date->format('Y');
        ?>
        
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-2xl font-bold mb-1">
                        <i class="fas fa-calendar-alt"></i> <?php echo $hariNama; ?>
                    </h2>
                    <p class="text-blue-100 text-lg"><?php echo $tanggalFormat; ?></p>
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
                    <div class="text-sm text-blue-100">Sudah Absen</div>
                </div>
                <div class="bg-red-500 bg-opacity-30 rounded-lg p-4 text-center">
                    <div class="text-3xl font-bold"><?php echo $belum_absen; ?></div>
                    <div class="text-sm text-blue-100">Belum Absen</div>
                </div>
            </div>
        </div>

        <!-- Daftar Petugas -->
        <?php if (empty($data_absensi)): ?>
            <div class="bg-white rounded-lg shadow-lg p-12 text-center">
                <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-600 mb-2">Tidak Ada Jadwal</h3>
                <p class="text-gray-500">Tidak ada jadwal piket pada tanggal ini</p>
            </div>
        <?php else: ?>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <?php foreach ($data_absensi as $item): ?>
                <div class="bg-white rounded-lg shadow-lg p-6 card-petugas">
                    <!-- Header Card -->
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-blue-600 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-lg text-gray-800"><?php echo htmlspecialchars($item['nama_lengkap']); ?></h3>
                                <p class="text-sm text-gray-500">@<?php echo htmlspecialchars($item['username']); ?></p>
                            </div>
                        </div>
                    </div>

                    <!-- Info Jadwal -->
                    <div class="bg-gray-50 rounded-lg p-3 mb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="far fa-clock text-gray-600"></i>
                            <span class="text-sm font-semibold text-gray-700">
                                <?php echo substr($item['jam_mulai'], 0, 5); ?> - <?php echo substr($item['jam_selesai'], 0, 5); ?>
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-gray-600"></i>
                            <span class="text-sm text-gray-700"><?php echo htmlspecialchars($item['lokasi']); ?></span>
                        </div>
                    </div>

                    <!-- Status -->
                    <div class="mb-4">
                        <?php if ($item['status'] === 'HADIR'): ?>
                            <span class="status-badge status-hadir w-full justify-center">
                                <i class="fas fa-check-circle"></i> SUDAH ABSEN
                            </span>
                            
                            <!-- Status Konfirmasi -->
                            <div class="mt-2">
                                <?php if ($item['status_konfirmasi'] === 'pending'): ?>
                                    <span class="status-badge status-pending w-full justify-center text-xs">
                                        <i class="fas fa-clock"></i> Menunggu Konfirmasi
                                    </span>
                                <?php elseif ($item['status_konfirmasi'] === 'approved'): ?>
                                    <span class="status-badge status-approved w-full justify-center text-xs">
                                        <i class="fas fa-check-double"></i> Disetujui
                                    </span>
                                <?php elseif ($item['status_konfirmasi'] === 'rejected'): ?>
                                    <span class="status-badge status-rejected w-full justify-center text-xs">
                                        <i class="fas fa-times-circle"></i> Ditolak
                                    </span>
                                <?php endif; ?>
                            </div>
                        <?php else: ?>
                            <span class="status-badge status-belum w-full justify-center">
                                <i class="fas fa-exclamation-circle"></i> BELUM ABSEN
                            </span>
                        <?php endif; ?>
                    </div>

                    <!-- Tombol -->
                    <?php if ($item['status'] === 'HADIR'): ?>
                        <button onclick="showDetail(<?php echo htmlspecialchars(json_encode($item)); ?>)"
                            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors">
                            <i class="fas fa-eye"></i> Lihat Detail
                        </button>
                    <?php else: ?>
                        <button onclick="showBantuAbsenModal(<?php echo htmlspecialchars(json_encode($item)); ?>)"
                            class="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 font-semibold transition-colors">
                            <i class="fas fa-user-check"></i> Bantu Absen
                        </button>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Modal Detail Absensi -->
    <div id="detailModal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4 pb-4 border-b">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-info-circle text-blue-600"></i> Detail Absensi
                </h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            <div id="modalContent"></div>
        </div>
    </div>

    <!-- Modal Bantu Absen -->
    <div id="bantuAbsenModal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4 pb-4 border-b">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-user-check text-orange-600"></i> Bantu Absen
                </h2>
                <button onclick="closeBantuAbsenModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            <div id="bantuAbsenContent"></div>
        </div>
    </div>

    <script>
        function cariData() {
            const tanggal = document.getElementById('inputTanggal').value;
            window.location.href = '?tanggal=' + tanggal;
        }

        function gantiTanggal(hari) {
            const currentDate = new Date(document.getElementById('inputTanggal').value);
            currentDate.setDate(currentDate.getDate() + hari);
            const newDate = currentDate.toISOString().split('T')[0];
            document.getElementById('inputTanggal').value = newDate;
            cariData();
        }

        function setHariIni() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('inputTanggal').value = today;
            cariData();
        }

        function showDetail(data) {
            const modal = document.getElementById('detailModal');
            const content = document.getElementById('modalContent');
            
            let statusKonfirmasiHTML = '';
            if (data.status_konfirmasi === 'pending') {
                statusKonfirmasiHTML = '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Menunggu Konfirmasi</span>';
            } else if (data.status_konfirmasi === 'approved') {
                statusKonfirmasiHTML = '<span class="status-badge status-approved"><i class="fas fa-check-double"></i> Disetujui</span>';
            } else if (data.status_konfirmasi === 'rejected') {
                statusKonfirmasiHTML = '<span class="status-badge status-rejected"><i class="fas fa-times-circle"></i> Ditolak</span>';
            }
            
            const jamAbsen = data.jam_absen ? new Date(data.jam_absen).toLocaleString('id-ID') : '-';
            
            content.innerHTML = `
                <div class="space-y-6">
                    <!-- Info Petugas -->
                    <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-white text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-800">${data.nama_lengkap}</h3>
                                <p class="text-gray-600">@${data.username}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Info Jadwal -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="text-sm text-gray-600 mb-1">
                                <i class="far fa-clock"></i> Jam Piket
                            </div>
                            <div class="font-bold text-gray-800">
                                ${data.jam_mulai.substring(0, 5)} - ${data.jam_selesai.substring(0, 5)}
                            </div>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="text-sm text-gray-600 mb-1">
                                <i class="fas fa-map-marker-alt"></i> Lokasi
                            </div>
                            <div class="font-bold text-gray-800">${data.lokasi}</div>
                        </div>
                    </div>

                    <!-- Waktu Absen -->
                    <div class="bg-green-50 rounded-lg p-4">
                        <div class="text-sm text-gray-600 mb-1">
                            <i class="fas fa-calendar-check"></i> Waktu Absen
                        </div>
                        <div class="font-bold text-green-700 text-lg">${jamAbsen}</div>
                    </div>

                    <!-- Status Konfirmasi -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="text-sm text-gray-600 mb-2">
                            <i class="fas fa-check-circle"></i> Status Konfirmasi
                        </div>
                        ${statusKonfirmasiHTML}
                    </div>

                    <!-- Foto Absensi -->
                    <div>
                        <h4 class="font-bold text-gray-800 mb-3 text-lg">
                            <i class="fas fa-camera"></i> Dokumentasi Foto
                        </h4>
                        <div class="grid grid-cols-2 gap-4">
                            ${data.foto_before ? `
                                <div>
                                    <p class="text-sm text-gray-600 mb-2 font-semibold">
                                        <i class="fas fa-arrow-right"></i> Foto Sebelum Piket
                                    </p>
                                    <div class="foto-container" onclick="showImage('../user/uploads/${data.foto_before}')">
                                        <img src="../user/uploads/${data.foto_before}" alt="Foto Before" class="border-2 border-gray-300">
                                        <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                                            <i class="fas fa-search-plus text-white text-2xl opacity-0 hover:opacity-100"></i>
                                        </div>
                                    </div>
                                </div>
                            ` : '<div class="text-center text-gray-400 py-8"><i class="fas fa-image text-3xl mb-2"></i><p>Tidak ada foto sebelum</p></div>'}
                            
                            ${data.foto_after ? `
                                <div>
                                    <p class="text-sm text-gray-600 mb-2 font-semibold">
                                        <i class="fas fa-arrow-left"></i> Foto Sesudah Piket
                                    </p>
                                    <div class="foto-container" onclick="showImage('../user/uploads/${data.foto_after}')">
                                        <img src="../user/uploads/${data.foto_after}" alt="Foto After" class="border-2 border-gray-300">
                                        <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                                            <i class="fas fa-search-plus text-white text-2xl opacity-0 hover:opacity-100"></i>
                                        </div>
                                    </div>
                                </div>
                            ` : '<div class="text-center text-gray-400 py-8"><i class="fas fa-image text-3xl mb-2"></i><p>Tidak ada foto sesudah</p></div>'}
                        </div>
                    </div>

                    <!-- Catatan -->
                    ${data.catatan ? `
                        <div class="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-sticky-note text-yellow-600 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-gray-800 mb-1">Catatan</h4>
                                    <p class="text-gray-700">${data.catatan}</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Tombol Tutup -->
                    <button onclick="closeModal()" 
                        class="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-semibold text-lg">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                </div>
            `;
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function showBantuAbsenModal(data) {
            const modal = document.getElementById('bantuAbsenModal');
            const content = document.getElementById('bantuAbsenContent');
            
            content.innerHTML = `
                <form id="formBantuAbsen" onsubmit="submitBantuAbsen(event, ${data.jadwal_id})">
                    <div class="space-y-6">
                        <!-- Info Petugas -->
                        <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                                    <i class="fas fa-user text-white text-2xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800">${data.nama_lengkap}</h3>
                                    <p class="text-gray-600">@${data.username}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Info Jadwal -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="text-sm text-gray-600 mb-1">
                                    <i class="far fa-clock"></i> Jam Piket
                                </div>
                                <div class="font-bold text-gray-800">
                                    ${data.jam_mulai.substring(0, 5)} - ${data.jam_selesai.substring(0, 5)}
                                </div>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="text-sm text-gray-600 mb-1">
                                    <i class="fas fa-map-marker-alt"></i> Lokasi
                                </div>
                                <div class="font-bold text-gray-800">${data.lokasi}</div>
                            </div>
                        </div>

                        <!-- Peringatan -->
                        <div class="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-exclamation-triangle text-yellow-600 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-gray-800 mb-1">Perhatian</h4>
                                    <p class="text-sm text-gray-700">Anda akan membantu melakukan absensi untuk anggota ini. Pastikan anggota memang sudah menjalankan piket.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Form Catatan -->
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">
                                <i class="fas fa-sticky-note"></i> Catatan Admin (Opsional)
                            </label>
                            <textarea name="catatan" rows="4" 
                                placeholder="Contoh: Anggota lupa absen karena ponsel rusak, sudah dikonfirmasi langsung..."
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"></textarea>
                            <p class="text-sm text-gray-500 mt-1">
                                <i class="fas fa-info-circle"></i> Catatan ini akan tersimpan sebagai keterangan absensi dibantu oleh admin
                            </p>
                        </div>

                        <!-- Tombol -->
                        <div class="grid grid-cols-2 gap-4">
                            <button type="button" onclick="closeBantuAbsenModal()" 
                                class="bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-semibold text-lg">
                                <i class="fas fa-times"></i> Batal
                            </button>
                            <button type="submit" 
                                class="bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-semibold text-lg">
                                <i class="fas fa-check"></i> Konfirmasi Absen
                            </button>
                        </div>
                    </div>
                </form>
            `;
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function submitBantuAbsen(event, jadwalId) {
            event.preventDefault();
            
            if (!confirm('Apakah Anda yakin ingin membantu absensi untuk anggota ini?')) {
                return;
            }

            const form = event.target;
            const catatan = form.catatan.value;

            // Kirim data ke server
            const formData = new FormData();
            formData.append('jadwal_id', jadwalId);
            formData.append('catatan', catatan);

            fetch('proses_bantu_absen.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('✓ Berhasil membantu absen!\n\nAbsensi telah dicatat oleh admin.');
                    window.location.reload();
                } else {
                    alert('✗ Gagal membantu absen!\n\n' + (data.message || 'Terjadi kesalahan.'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('✗ Terjadi kesalahan saat memproses data.');
            });
        }

        function closeModal() {
            document.getElementById('detailModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        function closeBantuAbsenModal() {
            document.getElementById('bantuAbsenModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        function showImage(src) {
            window.open(src, '_blank');
        }

        // Close modal dengan ESC
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
                closeBantuAbsenModal();
            }
        });

        // Close modal saat klik di luar
        document.getElementById('detailModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closeModal();
            }
        });

        document.getElementById('bantuAbsenModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closeBantuAbsenModal();
            }
        });

        // Enter untuk search
        document.getElementById('inputTanggal').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                cariData();
            }
        });
    </script>
</body>
</html>