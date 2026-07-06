<?php
require_once '../config.php';

if (!isLoggedIn() || isAdmin()) {
    redirect('../login.php');
}

$stmt = $conn->prepare("SELECT email FROM users WHERE id = ?");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();
$user_data = $result->fetch_assoc();
$stmt->close();

// Redirect ke index.php jika email masih NULL
if (empty($user_data['email'])) {
    redirect('index.php');
}


$jadwal_id = $_GET['jadwal_id'] ?? 0;
$user_id = $_SESSION['user_id'];

// Validasi jadwal
$stmt = $conn->prepare("SELECT jp.*, 
    (SELECT COUNT(*) FROM absensi WHERE jadwal_id = jp.id) as sudah_absen
    FROM jadwal_piket jp 
    WHERE jp.id = ? AND jp.user_id = ? AND jp.status = 'scheduled'");
$stmt->bind_param("ii", $jadwal_id, $user_id);
$stmt->execute();
$jadwal = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$jadwal) {
    $_SESSION['error'] = 'Jadwal tidak ditemukan atau tidak valid';
    redirect('dashboard.php');
}

if ($jadwal['sudah_absen'] > 0) {
    $_SESSION['error'] = 'Anda sudah melakukan absensi untuk jadwal ini';
    redirect('dashboard.php');
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $catatan = $_POST['catatan'] ?? '';
    
    // Validasi foto
    if (empty($_FILES['foto_before']['name']) || empty($_FILES['foto_after']['name'])) {
        $error = 'Foto before dan after harus diupload';
    } else {
        // Upload foto before
        $upload_before = uploadFoto($_FILES['foto_before'], 'before');
        
        if (!$upload_before['success']) {
            $error = 'Foto Before: ' . $upload_before['message'];
        } else {
            // Upload foto after
            $upload_after = uploadFoto($_FILES['foto_after'], 'after');
            
            if (!$upload_after['success']) {
                $error = 'Foto After: ' . $upload_after['message'];
                // Hapus foto before yang sudah terupload
                @unlink('../uploads/' . $upload_before['filename']);
            } else {
                // Simpan absensi
                $jam_absen = date('Y-m-d H:i:s');
                
                $stmt = $conn->prepare("INSERT INTO absensi (jadwal_id, user_id, foto_before, foto_after, jam_absen, catatan) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("iissss", $jadwal_id, $user_id, $upload_before['filename'], $upload_after['filename'], $jam_absen, $catatan);
                
                if ($stmt->execute()) {
                    $_SESSION['success'] = 'Absensi berhasil! Menunggu konfirmasi admin.';
                    redirect('dashboard.php');
                } else {
                    $error = 'Gagal menyimpan absensi';
                    @unlink('../uploads/' . $upload_before['filename']);
                    @unlink('../uploads/' . $upload_after['filename']);
                }
                $stmt->close();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Absensi Piket - Sistem Absensi Piket</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        tailwind.config = {
            darkMode: 'class',
        }
        
        // Dark Mode
        if (localStorage.getItem('darkMode') === 'true' || (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
        
        function toggleDarkMode() {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
        }

        // Toggle Sidebar
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        }

        // Preview Image
        function previewImage(input, previewId) {
            const preview = document.getElementById(previewId);
            preview.innerHTML = '';
            
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const container = document.createElement('div');
                    container.className = 'relative';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'w-full h-64 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600';
                    
                    container.appendChild(img);
                    preview.appendChild(container);
                }
                
                reader.readAsDataURL(input.files[0]);
            }
        }

        // Update clock
        function updateClock() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
        }

        setInterval(updateClock, 1000);
        updateClock();

        // Loading & Progress Bar Functions
        function showLoading() {
            document.getElementById('loadingOverlay').classList.remove('hidden');
            simulateProgress();
        }

        function hideLoading() {
            document.getElementById('loadingOverlay').classList.add('hidden');
            document.getElementById('progressBar').style.width = '0%';
            document.getElementById('progressText').textContent = '0%';
        }

        function simulateProgress() {
            let progress = 0;
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const statusText = document.getElementById('statusText');
            
            const statuses = [
                { at: 0, text: 'Memproses foto before...' },
                { at: 30, text: 'Mengupload foto before...' },
                { at: 50, text: 'Memproses foto after...' },
                { at: 70, text: 'Mengupload foto after...' },
                { at: 90, text: 'Menyimpan data absensi...' }
            ];
            
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress > 95) progress = 95;
                
                progressBar.style.width = progress + '%';
                progressText.textContent = Math.round(progress) + '%';
                
                // Update status text
                for (let i = statuses.length - 1; i >= 0; i--) {
                    if (progress >= statuses[i].at) {
                        statusText.textContent = statuses[i].text;
                        break;
                    }
                }
                
                if (progress >= 95) {
                    clearInterval(interval);
                }
            }, 200);
        }

        // Form Submit Handler
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    const fotoBefore = document.querySelector('input[name="foto_before"]');
                    const fotoAfter = document.querySelector('input[name="foto_after"]');
                    
                    if (!fotoBefore.files.length || !fotoAfter.files.length) {
                        return; // Let HTML5 validation handle this
                    }
                    
                    showLoading();
                });
            }
        });
    </script>
    <style>
        * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        
        .sidebar-transition {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .animate-spin {
            animation: spin 1s linear infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 min-h-screen">
    
    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <!-- Icon Upload -->
            <div class="flex justify-center mb-6">
                <div class="relative">
                    <div class="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <i class="fas fa-cloud-upload-alt text-blue-600 dark:text-blue-400 text-3xl"></i>
                    </div>
                    <div class="absolute -top-1 -right-1">
                        <div class="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center animate-spin">
                            <i class="fas fa-spinner text-white text-sm"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Title -->
            <h3 class="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">
                Mengupload Absensi
            </h3>
            <p id="statusText" class="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                Memproses foto before...
            </p>

            <!-- Progress Bar -->
            <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                    <span id="progressText" class="text-sm font-bold text-blue-600 dark:text-blue-400">0%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div id="progressBar" class="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 h-full rounded-full transition-all duration-300 ease-out" style="width: 0%"></div>
                </div>
            </div>

            <!-- Info Text -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p class="text-xs text-blue-800 dark:text-blue-200 text-center">
                    <i class="fas fa-info-circle mr-1"></i>
                    Mohon tunggu, jangan tutup halaman ini
                </p>
            </div>

            <!-- Loading Animation Dots -->
            <div class="flex justify-center space-x-2 mt-4">
                <div class="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                <div class="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                <div class="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
            </div>
        </div>
    </div>

    <!-- Overlay -->
    <div id="overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden lg:hidden" onclick="toggleSidebar()"></div>

    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar-transition fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl transform -translate-x-full lg:translate-x-0">
        <div class="flex flex-col h-full">
            <!-- Sidebar Header -->
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg">
                            <i class="fas fa-clipboard-check text-white text-xl"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-gray-800 dark:text-white">Absensi</h2>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
                        </div>
                    </div>
                    <button onclick="toggleSidebar()" class="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- User Info -->
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <i class="fas fa-user text-white"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-800 dark:text-white truncate"><?php echo htmlspecialchars($_SESSION['nama_lengkap']); ?></p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">User Member</p>
                    </div>
                </div>
            </div>

            <!-- Navigation Menu -->
            <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                <a href="dashboard.php" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <i class="fas fa-home text-lg w-5"></i>
                    <span>Dashboard</span>
                </a>
                <a href="dashboard.php" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <i class="fas fa-calendar-check text-lg w-5"></i>
                    <span>Cek Jadwal</span>
                </a>
                <a href="izin.php" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <i class="fas fa-file-signature text-lg w-5"></i>
                    <span>Ajukan Izin</span>
                </a>
                <a href="riwayat.php" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <i class="fas fa-history text-lg w-5"></i>
                    <span>Riwayat Absensi</span>
                </a>
                 <a href="profil.php" class="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                    <i class="fas fa-user-circle text-lg w-5"></i>
                    <span>Profil Saya</span>
                </a>
            </nav>

            <!-- Sidebar Footer -->
            <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                <a href="../logout.php" class="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <div class="lg:ml-64">
        <!-- Top Navbar -->
        <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
            <div class="px-4 lg:px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <button onclick="toggleSidebar()" class="lg:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                        <div>
                            <h1 class="text-xl font-bold text-gray-800 dark:text-white">Absensi Piket</h1>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Upload foto sebelum dan sesudah piket</p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-3">
                        <!-- Dark Mode Toggle -->
                        <button onclick="toggleDarkMode()" 
                                class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors">
                            <i class="fas fa-moon dark:hidden"></i>
                            <i class="fas fa-sun hidden dark:inline"></i>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Page Content -->
        <div class="p-4 lg:p-8">
            
            <!-- Alert Messages -->
            <?php if ($error): ?>
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3">
                <i class="fas fa-exclamation-circle text-xl"></i>
                <span><?php echo htmlspecialchars($error); ?></span>
            </div>
            <?php endif; ?>

            <div class="max-w-4xl mx-auto">
                
                <!-- Detail Jadwal -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center space-x-3">
                            <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                                <i class="fas fa-info-circle text-blue-600 dark:text-blue-400 text-xl"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-gray-800 dark:text-white">Detail Jadwal Piket</h2>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Informasi jadwal yang akan diabsen</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                                    <i class="far fa-calendar text-blue-600 dark:text-blue-400"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
                                    <p class="font-semibold text-gray-800 dark:text-white"><?php echo formatTanggal($jadwal['tanggal']); ?></p>
                                </div>
                            </div>

                            <div class="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                                    <i class="far fa-clock text-purple-600 dark:text-purple-400"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Jam Piket</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">
                                        <?php echo substr($jadwal['jam_mulai'], 0, 5); ?> - <?php echo substr($jadwal['jam_selesai'], 0, 5); ?> WIB
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg md:col-span-2">
                                <div class="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                                    <i class="fas fa-map-marker-alt text-green-600 dark:text-green-400"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Lokasi</p>
                                    <p class="font-semibold text-gray-800 dark:text-white"><?php echo htmlspecialchars($jadwal['lokasi']); ?></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Current Time Info -->
                <div class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-6 shadow-lg text-white mb-8">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="bg-white/20 p-4 rounded-xl backdrop-blur">
                                <i class="fas fa-clock text-3xl"></i>
                            </div>
                            <div>
                                <p class="text-sm opacity-90">Jam Absensi Saat Ini</p>
                                <p id="current-time" class="text-3xl font-bold"></p>
                            </div>
                        </div>
                        <div class="hidden sm:block">
                            <i class="fas fa-calendar-day text-5xl opacity-20"></i>
                        </div>
                    </div>
                </div>

                <!-- Form Absensi -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center space-x-3">
                            <div class="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                                <i class="fas fa-camera text-green-600 dark:text-green-400 text-xl"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-gray-800 dark:text-white">Form Absensi</h2>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Upload foto before & after piket</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-6">
                        <form method="POST" enctype="multipart/form-data" class="space-y-6">
                            
                            <!-- Foto Before -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    <i class="fas fa-camera mr-2"></i>Foto Before (Sebelum Dibersihkan) <span class="text-red-500">*</span>
                                </label>
                                <input type="file" name="foto_before" accept="image/*" required
                                    class="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                                    onchange="previewImage(this, 'preview-before')">
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    <i class="fas fa-info-circle"></i> Foto kondisi area sebelum dibersihkan
                                </p>
                                <div id="preview-before" class="mt-4"></div>
                            </div>

                            <!-- Foto After -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    <i class="fas fa-camera mr-2"></i>Foto After (Sesudah Dibersihkan) <span class="text-red-500">*</span>
                                </label>
                                <input type="file" name="foto_after" accept="image/*" required
                                    class="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900 dark:file:text-green-200"
                                    onchange="previewImage(this, 'preview-after')">
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    <i class="fas fa-info-circle"></i> Foto kondisi area setelah dibersihkan
                                </p>
                                <div id="preview-after" class="mt-4"></div>
                            </div>

                            <!-- Catatan -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    <i class="fas fa-sticky-note mr-2"></i>Catatan (Opsional)
                                </label>
                                <textarea name="catatan" rows="4"
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    placeholder="Tambahkan catatan jika diperlukan, misalnya kondisi khusus atau kendala saat piket..."></textarea>
                            </div>

                            <!-- Info Box -->
                            <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-lg">
                                <div class="flex items-start space-x-3">
                                    <i class="fas fa-lightbulb text-yellow-600 dark:text-yellow-400 text-xl mt-1"></i>
                                    <div class="text-sm text-yellow-800 dark:text-yellow-200">
                                        <p class="font-semibold mb-1">Tips Absensi:</p>
                                        <ul class="list-disc list-inside space-y-1 text-xs">
                                            <li>Pastikan foto jelas dan tidak blur</li>
                                            <li>Foto harus menampilkan area yang dibersihkan</li>
                                            <li>Upload foto dengan pencahayaan yang baik</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <button type="submit" 
                                class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-lg">
                                <i class="fas fa-check-circle"></i>
                                <span>Kirim Absensi Sekarang</span>
                            </button>

                            <a href="dashboard.php" class="block text-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                                <i class="fas fa-arrow-left mr-2"></i>Kembali ke Dashboard
                            </a>
                        </form>
                    </div>
                </div>

            </div>

        </div>

        <!-- Footer -->
        <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8">
            <div class="px-4 lg:px-8 py-6">
                <p class="text-center text-sm text-gray-600 dark:text-gray-400">
                    © <?php echo date('Y'); ?> Sistem Absensi Piket. All rights reserved.
                </p>
            </div>
        </footer>
    </div>

</body>
</html>