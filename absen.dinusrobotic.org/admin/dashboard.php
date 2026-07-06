<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

// Statistik
$stats = [
    'total_user' => $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'user'")->fetch_assoc()['count'],
    'jadwal_hari_ini' => $conn->query("SELECT COUNT(*) as count FROM jadwal_piket WHERE tanggal = CURDATE()")->fetch_assoc()['count'],
    'pending_absensi' => $conn->query("SELECT COUNT(*) as count FROM absensi WHERE status_konfirmasi = 'pending'")->fetch_assoc()['count'],
    'pending_izin' => $conn->query("SELECT COUNT(*) as count FROM izin WHERE status = 'pending'")->fetch_assoc()['count']
];

// Absensi pending
$absensi_pending = $conn->query("SELECT a.*, u.nama_lengkap, u.username, jp.tanggal, jp.lokasi, jp.jam_mulai, jp.jam_selesai 
    FROM absensi a 
    JOIN users u ON a.user_id = u.id 
    JOIN jadwal_piket jp ON a.jadwal_id = jp.id 
    WHERE a.status_konfirmasi = 'pending' 
    ORDER BY a.jam_absen DESC 
    LIMIT 5")->fetch_all(MYSQLI_ASSOC);

// Izin pending - DIPERBAIKI: Menambahkan file_bukti
$izin_pending = $conn->query("SELECT i.*, u.email,u.nama_lengkap, u.username, jp.tanggal, jp.lokasi, jp.jam_mulai, jp.jam_selesai 
    FROM izin i 
    JOIN users u ON i.user_id = u.id 
    JOIN jadwal_piket jp ON i.jadwal_id = jp.id 
    WHERE i.status = 'pending' 
    ORDER BY i.created_at DESC 
    LIMIT 5")->fetch_all(MYSQLI_ASSOC);
    
   

// Fungsi untuk mendapatkan ekstensi file
function getFileExtension($filename) {
    return strtolower(pathinfo($filename, PATHINFO_EXTENSION));
}

// Fungsi untuk menentukan apakah file adalah gambar
function isImageFile($filename) {
    $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    $ext = getFileExtension($filename);
    return in_array($ext, $imageExtensions);
}

// Fungsi untuk menentukan apakah file adalah PDF
function isPdfFile($filename) {
    return getFileExtension($filename) === 'pdf';
}

 
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .stat-card {
            transition: all 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .menu-card {
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        .menu-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.15);
            border-color: currentColor;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 0.875rem;
        }
        .badge-pending {
            background: #fef3c7;
            color: #92400e;
        }
        .badge-approved {
            background: #d1fae5;
            color: #065f46;
        }
        .badge-rejected {
            background: #fee2e2;
            color: #991b1b;
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
            padding: 2rem;
            border-radius: 1rem;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        .file-preview {
            max-width: 100%;
            max-height: 400px;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            margin: 1rem 0;
        }
        .pdf-preview {
            width: 100%;
            height: 500px;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Dark Mode Styles */
        .dark-mode {
            background-color: #1a202c;
            color: #e2e8f0;
        }
        .dark-mode .bg-white {
            background-color: #2d3748;
        }
        .dark-mode .text-gray-800 {
            color: #e2e8f0;
        }
        .dark-mode .text-gray-600 {
            color: #cbd5e0;
        }
        .dark-mode .text-gray-700 {
            color: #e2e8f0;
        }
        .dark-mode .border-gray-200 {
            border-color: #4a5568;
        }
        .dark-mode .border-gray-300 {
            border-color: #4a5568;
        }
        .dark-mode .bg-gray-50 {
            background-color: #2d3748;
        }
        .dark-mode .bg-blue-50 {
            background-color: #2a4365;
        }
        .dark-mode .bg-orange-50 {
            background-color: #652b19;
        }
        .dark-mode .bg-green-50 {
            background-color: #22543d;
        }
        .dark-mode .bg-red-50 {
            background-color: #742a2a;
        }
        .dark-mode .border-blue-200 {
            border-color: #2c5282;
        }
        .dark-mode .border-orange-200 {
            border-color: #c05621;
        }
        .dark-mode .border-green-200 {
            border-color: #38a169;
        }
        .dark-mode .border-red-200 {
            border-color: #e53e3e;
        }
        .dark-mode .shadow-lg {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        }
        .dark-mode .modal-content {
            background-color: #2d3748;
            color: #e2e8f0;
        }
        .dark-mode input, .dark-mode textarea, .dark-mode select {
            background-color: #4a5568;
            color: #e2e8f0;
            border-color: #4a5568;
        }
        .dark-mode input::placeholder, .dark-mode textarea::placeholder {
            color: #a0aec0;
        }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Navbar -->
    <nav class="gradient-bg text-white shadow-2xl">
        <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold flex items-center gap-2">
                        <i class="fas fa-shield-alt"></i> Admin Dashboard
                    </h1>
                    <p class="text-sm text-purple-200 mt-1">Sistem Manajemen Absensi Piket</p>
                </div>
                <div class="flex items-center gap-4">
                    <button id="darkModeToggle" class="bg-purple-700 px-4 py-2 rounded-lg hover:bg-purple-800 transition-colors flex items-center gap-2">
                        <i class="fas fa-moon"></i> Mode Gelap
                    </button>
                    <div class="text-right">
                        <p class="font-semibold"><?php echo htmlspecialchars($_SESSION['nama_lengkap']); ?></p>
                        <p class="text-xs text-purple-200">Administrator</p>
                    </div>
                    <a href="../logout.php" class="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <!-- Menu Navigation -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i class="fas fa-compass text-purple-600"></i> Menu Navigasi
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Menu items tetap sama -->
                <a href="dashboard.php" class="menu-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-blue-600 dark:text-blue-400">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-2xl">
                            <i class="fas fa-home"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg dark:text-white">Dashboard</h3>
                            <p class="text-gray-600 dark:text-gray-300 text-sm">Halaman utama</p>
                        </div>
                    </div>
                </a>
                <a href="kelola_jadwal.php" class="menu-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-green-600 dark:text-green-400">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-2xl">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg dark:text-white">Kelola Jadwal</h3>
                            <p class="text-gray-600 dark:text-gray-300 text-sm">Atur jadwal piket</p>
                        </div>
                    </div>
                </a>
                <a href="riwayat_absensi.php" class="menu-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-purple-600 dark:text-purple-400">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-2xl">
                            <i class="fas fa-history"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg dark:text-white">Riwayat Absensi</h3>
                            <p class="text-gray-600 dark:text-gray-300 text-sm">Lihat semua absensi</p>
                        </div>
                    </div>
                </a>
                <a href="riwayat_izin.php" class="menu-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-orange-600 dark:text-orange-400">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-2xl">
                            <i class="fas fa-file-medical"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg dark:text-white">Riwayat Izin</h3>
                            <p class="text-gray-600 dark:text-gray-300 text-sm">Lihat semua izin</p>
                        </div>
                    </div>
                </a>
                <a href="kelola-user.php" class="menu-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-indigo-600 dark:text-indigo-400">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-2xl">
                            <i class="fas fa-users"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg dark:text-white">Kelola User</h3>
                            <p class="text-gray-600 dark:text-gray-300 text-sm">Manajemen user</p>
                        </div>
                    </div>
                </a>
                <a href="mingguan.php" class="menu-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-teal-600 dark:text-teal-400">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-2xl">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg dark:text-white">Laporan</h3>
                            <p class="text-gray-600 dark:text-gray-300 text-sm">Mingguan</p>
                        </div>
                    </div>
                </a>
            </div>
        </div>

        <!-- Statistik -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i class="fas fa-chart-line text-purple-600"></i> Statistik Sistem
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Statistik cards tetap sama -->
                <div class="stat-card bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-blue-100 text-sm font-semibold mb-1">Total User</p>
                            <p class="text-4xl font-bold"><?php echo $stats['total_user']; ?></p>
                            <p class="text-blue-100 text-xs mt-2">Anggota terdaftar</p>
                        </div>
                        <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <i class="fas fa-users text-3xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-green-100 text-sm font-semibold mb-1">Jadwal Hari Ini</p>
                            <p class="text-4xl font-bold"><?php echo $stats['jadwal_hari_ini']; ?></p>
                            <p class="text-green-100 text-xs mt-2">Piket terjadwal</p>
                        </div>
                        <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <i class="fas fa-calendar-check text-3xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-yellow-100 text-sm font-semibold mb-1">Pending Absensi</p>
                            <p class="text-4xl font-bold"><?php echo $stats['pending_absensi']; ?></p>
                            <p class="text-yellow-100 text-xs mt-2">Menunggu konfirmasi</p>
                        </div>
                        <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <i class="fas fa-hourglass-half text-3xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-orange-100 text-sm font-semibold mb-1">Pending Izin</p>
                            <p class="text-4xl font-bold"><?php echo $stats['pending_izin']; ?></p>
                            <p class="text-orange-100 text-xs mt-2">Menunggu persetujuan</p>
                        </div>
                        <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <i class="fas fa-file-medical text-3xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Absensi Pending -->
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="fas fa-clock text-yellow-600"></i> Absensi Menunggu Konfirmasi
                </h2>
                <?php if (count($absensi_pending) > 0): ?>
                <a href="konfirmasi_absensi.php" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-2">
                    Lihat Semua <i class="fas fa-arrow-right"></i>
                </a>
                <?php endif; ?>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <?php if (empty($absensi_pending)): ?>
                <div class="text-center py-12">
                    <i class="fas fa-check-circle text-6xl text-green-400 mb-4"></i>
                    <p class="text-gray-600 dark:text-gray-300 text-lg font-semibold">Tidak ada absensi yang menunggu konfirmasi</p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">Semua absensi sudah diproses</p>
                </div>
                <?php else: ?>
                <div class="space-y-4">
                    <?php foreach ($absensi_pending as $absen): ?>
                    <div class="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-yellow-400 transition-colors">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-user text-yellow-600 dark:text-yellow-400 text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-lg text-gray-800 dark:text-white"><?php echo htmlspecialchars($absen['nama_lengkap']); ?></h3>
                                    <p class="text-gray-600 dark:text-gray-300 text-sm">@<?php echo htmlspecialchars($absen['username']); ?></p>
                                    <div class="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span><i class="far fa-calendar"></i> <?php echo formatTanggal($absen['tanggal']); ?></span>
                                        <span><i class="far fa-clock"></i> <?php echo date('H:i', strtotime($absen['jam_absen'])); ?> WIB</span>
                                        <span><i class="fas fa-map-marker-alt"></i> <?php echo htmlspecialchars($absen['lokasi']); ?></span>
                                    </div>
                                </div>
                            </div>
                            <span class="badge badge-pending">
                                <i class="fas fa-hourglass-half"></i> Pending
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p class="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
                                    <i class="fas fa-camera"></i> Foto Sebelum Piket:
                                </p>
                                <img src="../user/uploads/<?php echo htmlspecialchars($absen['foto_before']); ?>" 
                                    alt="Before" class="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 transition-colors"
                                    onclick="showImage('../user/uploads/<?php echo htmlspecialchars($absen['foto_before']); ?>')">
                            </div>
                            <div>
                                <p class="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
                                    <i class="fas fa-camera"></i> Foto Sesudah Piket:
                                </p>
                                <img src="../user/uploads/<?php echo htmlspecialchars($absen['foto_after']); ?>" 
                                    alt="After" class="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 transition-colors"
                                    onclick="showImage('../user/uploads/<?php echo htmlspecialchars($absen['foto_after']); ?>')">
                            </div>
                        </div>
                        
                        <?php if ($absen['catatan']): ?>
                        <div class="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-400 rounded-lg p-4 mb-4">
                            <p class="text-sm text-gray-700 dark:text-gray-300">
                                <strong class="text-blue-700 dark:text-blue-300"><i class="fas fa-sticky-note"></i> Catatan:</strong> 
                                <?php echo htmlspecialchars($absen['catatan']); ?>
                            </p>
                        </div>
                        <?php endif; ?>
                        
                        <a href="konfirmasi_absensi.php?id=<?php echo $absen['id']; ?>" 
                            class="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all">
                            <i class="fas fa-clipboard-check"></i> Proses Konfirmasi
                        </a>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Izin Pending - BAGIAN YANG DIPERBAIKI -->
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="fas fa-file-medical text-orange-600"></i> Pengajuan Izin Menunggu Persetujuan
                </h2>
                <?php if (count($izin_pending) > 0): ?>
                <a href="kelola_izin.php" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-2">
                    Lihat Semua <i class="fas fa-arrow-right"></i>
                </a>
                <?php endif; ?>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <?php if (empty($izin_pending)): ?>
                <div class="text-center py-12">
                    <i class="fas fa-check-circle text-6xl text-green-400 mb-4"></i>
                    <p class="text-gray-600 dark:text-gray-300 text-lg font-semibold">Tidak ada pengajuan izin yang menunggu persetujuan</p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">Semua izin sudah diproses</p>
                </div>
                <?php else: ?>
                <div class="space-y-4">
                    <?php foreach ($izin_pending as $izin): ?>
                    <div class="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-orange-400 transition-colors">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-user-injured text-orange-600 dark:text-orange-400 text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-lg text-gray-800 dark:text-white"><?php echo htmlspecialchars($izin['nama_lengkap']); ?></h3>
                                    <p class="text-gray-600 dark:text-gray-300 text-sm">@<?php echo htmlspecialchars($izin['username']); ?></p>
                                    <p class="text-gray-600 dark:text-gray-300 text-sm"><?php echo htmlspecialchars($izin['email']); ?></p>
                                    <div class="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span><i class="far fa-calendar"></i> <?php echo formatTanggal($izin['tanggal']); ?></span>
                                        <span><i class="far fa-clock"></i> <?php echo substr($izin['jam_mulai'], 0, 5); ?> - <?php echo substr($izin['jam_selesai'], 0, 5); ?></span>
                                        <span><i class="fas fa-map-marker-alt"></i> <?php echo htmlspecialchars($izin['lokasi']); ?></span>
                                    </div>
                                </div>
                            </div>
                            <span class="badge badge-pending">
                                <i class="fas fa-hourglass-half"></i> 
                                
                                <?php echo htmlspecialchars($izin['status']); ?>
                            </span>
                        </div>
                        
                        <div class="bg-orange-50 dark:bg-orange-900 border-l-4 border-orange-400 rounded-lg p-4 mb-4">
                            <p class="text-sm text-gray-700 dark:text-gray-300">
                                <strong class="text-orange-700 dark:text-orange-300"><i class="fas fa-comment-medical"></i> Alasan Izin:</strong><br>
                                <span class="mt-1 inline-block"><?php echo nl2br(htmlspecialchars($izin['alasan'])); ?></span>
                            </p>
                        </div>

                        <!-- BAGIAN BARU: Tampilkan File Bukti Izin -->
                        <?php if (!empty($izin['file_bukti'])): ?>
                        <div class="mb-4">
                            <p class="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
                                <i class="fas fa-paperclip"></i> File Bukti:
                            </p>
                            <div class="flex items-center gap-4">
                                <?php
                                $filePath = '../user/uploads/izin/' . $izin['file_bukti'];
                                $fileExists = file_exists($filePath);
                                ?>
                                
                                <?php if ($fileExists && isImageFile($izin['file_bukti'])): ?>
                                    <!-- Jika file adalah gambar -->
                                    <img src="<?php echo $filePath; ?>" 
                                         alt="Bukti Izin" 
                                         class="file-preview cursor-pointer hover:border-blue-500 transition-colors"
                                         onclick="showImage('<?php echo $filePath; ?>')">
                                <?php elseif ($fileExists && isPdfFile($izin['file_bukti'])): ?>
                                    <!-- Jika file adalah PDF -->
                                    <div class="flex flex-col items-center gap-2">
                                        <i class="fas fa-file-pdf text-6xl text-red-500"></i>
                                        <p class="text-sm text-gray-600 dark:text-gray-400"><?php echo htmlspecialchars($izin['file_bukti']); ?></p>
                                        <button onclick="showPdfModal('<?php echo $filePath; ?>', '<?php echo htmlspecialchars($izin['file_bukti']); ?>')"
                                                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                                            <i class="fas fa-eye"></i> Lihat PDF
                                        </button>
                                    </div>
                                <?php else: ?>
                                    <!-- File lainnya atau file tidak ditemukan -->
                                    <div class="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <i class="fas fa-file text-2xl text-gray-500"></i>
                                        <div>
                                            <p class="text-sm font-medium text-gray-700 dark:text-gray-300"><?php echo htmlspecialchars($izin['file_bukti']); ?></p>
                                            <?php if ($fileExists): ?>
                                                <a href="<?php echo $filePath; ?>" 
                                                   download 
                                                   class="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1">
                                                    <i class="fas fa-download"></i> Download
                                                </a>
                                            <?php else: ?>
                                                <p class="text-red-500 text-xs">File tidak ditemukan</p>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php else: ?>
                        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                            <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
                                <i class="fas fa-info-circle"></i> Tidak ada file bukti yang diupload
                            </p>
                        </div>
                        <?php endif; ?>
                        
                        <div class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                            <p class="text-sm text-blue-800 dark:text-blue-300">
                                <i class="fas fa-info-circle"></i> <strong>Info:</strong> Jika izin disetujui, sistem akan otomatis mencatat absensi dengan status "Izin".
                            </p>
                        </div>
                        
                        <button onclick="showIzinModal(<?php echo htmlspecialchars(json_encode($izin)); ?>)"
                            class="w-full bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-3 rounded-lg hover:from-green-700 hover:to-green-800 font-semibold transition-all">
                            <i class="fas fa-check-circle"></i> Proses Persetujuan
                        </button>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Modal Proses Izin -->
    <div id="izinModal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-600">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
                    <i class="fas fa-clipboard-check text-green-600"></i> Proses Persetujuan Izin
                </h2>
                <button onclick="closeIzinModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            <div id="izinModalContent"></div>
        </div>
    </div>

    <!-- Modal PDF Viewer -->
    <div id="pdfModal" class="modal">
        <div class="modal-content" style="max-width: 90%; max-height: 90vh;">
            <div class="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-600">
                <h2 class="text-xl font-bold text-gray-800 dark:text-white" id="pdfModalTitle">
                    <i class="fas fa-file-pdf text-red-500"></i> Preview PDF
                </h2>
                <button onclick="closePdfModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            <iframe id="pdfViewer" class="pdf-preview w-full" frameborder="0"></iframe>
        </div>
    </div>

    <script>
        // Dark Mode Toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        const body = document.body;
        
        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Mode Terang';
        }
        
        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Mode Terang';
            } else {
                localStorage.setItem('darkMode', 'disabled');
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Mode Gelap';
            }
        });

        function showImage(src) {
            window.open(src, '_blank');
        }

        function showPdfModal(pdfPath, fileName) {
            const modal = document.getElementById('pdfModal');
            const viewer = document.getElementById('pdfViewer');
            const title = document.getElementById('pdfModalTitle');
            
            title.innerHTML = `<i class="fas fa-file-pdf text-red-500"></i> ${fileName}`;
            viewer.src = pdfPath;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closePdfModal() {
            document.getElementById('pdfModal').classList.remove('active');
            document.getElementById('pdfViewer').src = '';
            document.body.style.overflow = 'auto';
        }

        function showIzinModal(data) {
            const modal = document.getElementById('izinModal');
            const content = document.getElementById('izinModalContent');
            
            // Cek apakah ada file bukti
            const hasFileBukti = data.file_bukti && data.file_bukti.trim() !== '';
            const filePath = hasFileBukti ? `../user/uploads/izin/${data.file_bukti}` : '';
            const fileExists = hasFileBukti ? true : false; // Ini bisa ditingkatkan dengan AJAX check
            
            let filePreviewHtml = '';
            if (hasFileBukti) {
                const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(data.file_bukti);
                const isPdf = /\.pdf$/i.test(data.file_bukti);
                
                if (isImage) {
                    filePreviewHtml = `
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                <i class="fas fa-paperclip"></i> File Bukti (Gambar)
                            </label>
                            <img src="${filePath}" 
                                 alt="Bukti Izin" 
                                 class="file-preview cursor-pointer hover:border-blue-500 transition-colors"
                                 onclick="showImage('${filePath}')">
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                                Klik gambar untuk melihat ukuran penuh
                            </p>
                        </div>
                    `;
                } else if (isPdf) {
                    filePreviewHtml = `
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                <i class="fas fa-paperclip"></i> File Bukti (PDF)
                            </label>
                            <div class="flex flex-col items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <i class="fas fa-file-pdf text-4xl text-red-500"></i>
                                <p class="text-sm text-gray-700 dark:text-gray-300">${data.file_bukti}</p>
                                <button type="button" onclick="showPdfModal('${filePath}', '${data.file_bukti}')"
                                        class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                                    <i class="fas fa-eye"></i> Lihat PDF
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    filePreviewHtml = `
                        <div class="mb-4">
                            <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                <i class="fas fa-paperclip"></i> File Bukti
                            </label>
                            <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <i class="fas fa-file text-2xl text-gray-500"></i>
                                <div>
                                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">${data.file_bukti}</p>
                                    <a href="${filePath}" 
                                       download 
                                       class="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1">
                                        <i class="fas fa-download"></i> Download File
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } else {
                filePreviewHtml = `
                    <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                        <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
                            <i class="fas fa-info-circle"></i> Tidak ada file bukti yang diupload
                        </p>
                    </div>
                `;
            }
            
            content.innerHTML = `
                <form id="formProsesIzin" onsubmit="prosesIzin(event, ${data.id})">
                    <div class="space-y-6">
                        <!-- Info Pemohon -->
                        <div class="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-user text-white text-2xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800 dark:text-white">${data.nama_lengkap}</h3>
                                    <p class="text-gray-600 dark:text-gray-300">@${data.username}</p>
                                    <p class="text-gray-600 dark:text-gray-300">${data.email}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Info Jadwal -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <i class="far fa-calendar"></i> Tanggal Izin
                                </div>
                                <div class="font-bold text-gray-800 dark:text-white">${data.tanggal}</div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <i class="far fa-clock"></i> Jam Piket
                                </div>
                                <div class="font-bold text-gray-800 dark:text-white">
                                    ${data.jam_mulai.substring(0, 5)} - ${data.jam_selesai.substring(0, 5)}
                                </div>
                            </div>
                        </div>

                        <!-- Alasan Izin -->
                        <div class="bg-orange-50 dark:bg-orange-900 border-l-4 border-orange-400 rounded-lg p-4">
                            <div class="font-bold text-gray-800 dark:text-white mb-2">
                                <i class="fas fa-comment-medical"></i> Alasan Izin:
                            </div>
                            <p class="text-gray-700 dark:text-gray-300">${data.alasan.replace(/\n/g, '<br>')}</p>
                        </div>

                        <!-- File Bukti -->
                        ${filePreviewHtml}

                        <!-- Keterangan Admin -->
                        <div>
                            <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                <i class="fas fa-pen"></i> Keterangan Admin (Opsional)
                            </label>
                            <textarea name="keterangan" rows="3" 
                                placeholder="Tambahkan catatan jika diperlukan..."
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"></textarea>
                        </div>

                        <!-- Info Penting -->
                        <div class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-1"></i>
                                <div class="text-sm text-blue-800 dark:text-blue-300">
                                    <p class="font-semibold mb-1">Perhatian:</p>
                                    <p>Jika izin <strong>DISETUJUI</strong>, sistem akan otomatis mencatat absensi dengan status "Izin" untuk jadwal ini.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Tombol Aksi -->
                        <div class="grid grid-cols-2 gap-4">
                            <button type="button" onclick="tolakIzin(${data.id})"
                                class="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center justify-center gap-2">
                                <i class="fas fa-times-circle"></i> Tolak
                            </button>
                            <button type="submit"
                                class="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors flex items-center justify-center gap-2">
                                <i class="fas fa-check-circle"></i> Setujui
                            </button>
                        </div>
                    </div>
                </form>
            `;
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeIzinModal() {
            document.getElementById('izinModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        function prosesIzin(event, izinId) {
            event.preventDefault();
            
            if (!confirm('Apakah Anda yakin ingin menyetujui izin ini?\n\nSistem akan otomatis mencatat absensi dengan status "Izin".')) {
                return;
            }

            const form = event.target;
            const formData = new FormData(form);
            formData.append('izin_id', izinId);
            formData.append('action', 'approve');

            fetch('proses_izin.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('✓ Izin berhasil disetujui!\n\nAbsensi telah dicatat dengan status "Izin".');
                    window.location.reload();
                } else {
                    alert('✗ Gagal memproses izin!\n\n' + (data.message || 'Terjadi kesalahan.'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('✗ Terjadi kesalahan saat memproses data.');
            });
        }

        function tolakIzin(izinId) {
            const keterangan = prompt('Masukkan alasan penolakan (opsional):');
            
            if (keterangan === null) {
                return; // User membatalkan
            }

            if (!confirm('Apakah Anda yakin ingin menolak izin ini?')) {
                return;
            }

            const formData = new FormData();
            formData.append('izin_id', izinId);
            formData.append('action', 'reject');
            formData.append('keterangan', keterangan);

            fetch('proses_izin.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('✓ Izin berhasil ditolak!');
                    window.location.reload();
                } else {
                    alert('✗ Gagal menolak izin!\n\n' + (data.message || 'Terjadi kesalahan.'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('✗ Terjadi kesalahan saat memproses data.');
            });
        }

        // Close modal dengan ESC
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeIzinModal();
                closePdfModal();
            }
        });

        // Close modal saat klik di luar
        document.getElementById('izinModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closeIzinModal();
            }
        });

        document.getElementById('pdfModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closePdfModal();
            }
        });
    </script>
</body>
</html>