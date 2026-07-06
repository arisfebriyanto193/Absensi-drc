<?php
require_once '../config.php';

if (!isLoggedIn() || isAdmin()) {
    redirect('../login.php');
}

// Ambil data user termasuk NIM
$stmt = $conn->prepare("SELECT email, status_email, nim FROM users WHERE id = ?");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();
$user_data = $result->fetch_assoc();
$stmt->close();

// Generate URL foto profil berdasarkan NIM
$foto_profil_url = '';
if (!empty($user_data['nim'])) {
    $nim = $user_data['nim'];
    $parts = explode('.', $nim);
    
    if (count($parts) >= 3) {
        $prefix = $parts[0]; // E11, A11, E12, dll
        $tahun = $parts[1];  // 2023, 2024, dll
        
        // Format URL berdasarkan pola NIM
        if (strlen($prefix) >= 3) {
            $kode_fakultas = substr($prefix, 0, 1); // E, A, dll
            $foto_profil_url = "https://mahasiswa.dinus.ac.id/images/foto/{$kode_fakultas}/{$prefix}/{$tahun}/{$nim}.jpg";
        }
    }
}

// Fallback jika URL tidak bisa digenerate
if (empty($foto_profil_url)) {
    $foto_profil_url = "https://via.placeholder.com/150/007bff/ffffff?text=" . urlencode(substr($_SESSION['nama_lengkap'], 0, 1));
}

// Cek kondisi email dan status_email
if (empty($user_data['email'])) {
    // Belum ada email
    redirect('index.php');
} elseif (isset($user_data['status_email']) && $user_data['status_email'] == 0) {
    // Email ada tapi belum aktif
    redirect('index.php');
}

// Jika email sudah ada dan status_email = 1, lanjut saja tanpa redirect

date_default_timezone_set('Asia/Jakarta');
$user_id = $_SESSION['user_id'];
$today = date('Y-m-d');
$current_time = date('H:i:s');

// Ambil jadwal hari ini dengan validasi waktu
$stmt = $conn->prepare("SELECT jp.*, 
    (SELECT COUNT(*) FROM absensi WHERE jadwal_id = jp.id) as sudah_absen
    FROM jadwal_piket jp 
    WHERE jp.user_id = ? AND jp.tanggal = ? AND jp.status = 'scheduled'");
$stmt->bind_param("is", $user_id, $today);
$stmt->execute();
$jadwal_hari_ini = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Ambil jadwal yang akan datang (7 hari ke depan)
$next_week = date('Y-m-d', strtotime('+7 days'));
$stmt = $conn->prepare("SELECT jp.*, 
    (SELECT COUNT(*) FROM absensi WHERE jadwal_id = jp.id) as sudah_absen
    FROM jadwal_piket jp 
    WHERE jp.user_id = ? AND jp.tanggal > ? AND jp.tanggal <= ? AND jp.status = 'scheduled'
    ORDER BY jp.tanggal ASC, jp.jam_mulai ASC 
    LIMIT 5");
$stmt->bind_param("iss", $user_id, $today, $next_week);
$stmt->execute();
$jadwal_mendatang = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Ambil semua jadwal bulan ini untuk kalender
$current_month = date('Y-m');
$stmt = $conn->prepare("SELECT DATE(tanggal) as tanggal, COUNT(*) as jumlah
    FROM jadwal_piket 
    WHERE user_id = ? AND DATE_FORMAT(tanggal, '%Y-%m') = ? AND status = 'scheduled'
    GROUP BY DATE(tanggal)");
$stmt->bind_param("is", $user_id, $current_month);
$stmt->execute();
$jadwal_bulan_ini = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Convert ke array untuk JavaScript
$jadwal_dates = array();
foreach ($jadwal_bulan_ini as $j) {
    $jadwal_dates[$j['tanggal']] = $j['jumlah'];
}

// Ambil riwayat absensi
$stmt = $conn->prepare("SELECT a.*, jp.tanggal, jp.lokasi, jp.jam_mulai, jp.jam_selesai 
    FROM absensi a 
    JOIN jadwal_piket jp ON a.jadwal_id = jp.id 
    WHERE a.user_id = ? 
    ORDER BY a.jam_absen DESC 
    LIMIT 10");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$riwayat = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

requireEmailVerification();
$email_status = getEmailVerificationStatus();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Sistem Absensi Piket</title>
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

        // Data jadwal dari PHP
        const jadwalDates = <?php echo json_encode($jadwal_dates); ?>;
        
        // Kalender
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();

        function renderCalendar() {
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ];
            const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
            
            document.getElementById('currentMonth').textContent = monthNames[currentMonth] + ' ' + currentYear;
            
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            let calendarHTML = '';
            
            // Header hari
            dayNames.forEach(day => {
                calendarHTML += `<div class="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">${day}</div>`;
            });
            
            // Tanggal
            let day = 1;
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 7; j++) {
                    if (i === 0 && j < firstDay) {
                        calendarHTML += '<div class="p-2"></div>';
                    } else if (day > daysInMonth) {
                        break;
                    } else {
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const today = new Date().toISOString().split('T')[0];
                        const isToday = dateStr === today;
                        const hasSchedule = jadwalDates[dateStr] !== undefined;
                        
                        let classes = 'p-2 text-center rounded-lg cursor-pointer transition-all ';
                        
                        if (isToday) {
                            classes += 'bg-blue-600 text-white font-bold shadow-lg ';
                        } else if (hasSchedule) {
                            classes += 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold hover:bg-green-200 dark:hover:bg-green-800 ';
                        } else {
                            classes += 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ';
                        }
                        
                        let badge = '';
                        if (hasSchedule && !isToday) {
                            badge = `<span class="block text-xs mt-1">${jadwalDates[dateStr]} piket</span>`;
                        }
                        
                        calendarHTML += `<div class="${classes}">
                            <div class="text-sm">${day}</div>
                            ${badge}
                        </div>`;
                        day++;
                    }
                }
                if (day > daysInMonth) break;
            }
            
            document.getElementById('calendarGrid').innerHTML = calendarHTML;
        }

        function prevMonth() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        }

        function nextMonth() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        }

        function todayMonth() {
            currentMonth = new Date().getMonth();
            currentYear = new Date().getFullYear();
            renderCalendar();
        }

        // Real-time Clock
        function updateClock() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            
            document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
        }

        window.onload = function() {
            renderCalendar();
            updateClock();
            setInterval(updateClock, 1000); // Update setiap detik
        }
    </script>
    <style>
        * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        
        .sidebar-transition {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .profile-image {
            background-image: url('<?php echo $foto_profil_url; ?>');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 min-h-screen">
    
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
                    <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg profile-image">
                        <!-- Fallback icon jika gambar tidak load -->
                        <i class="fas fa-user text-white profile-fallback"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-800 dark:text-white truncate"><?php echo htmlspecialchars($_SESSION['nama_lengkap']); ?></p>
                        <p class="text-xs text-gray-500 dark:text-gray-400"><?php echo !empty($user_data['nim']) ? htmlspecialchars($user_data['nim']) : 'User Member'; ?></p>
                    </div>
                </div>
            </div>

            <!-- Navigation Menu -->
            <?php include 'sd.html'; ?>
            
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
                            <h1 class="text-xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                            <p class="text-xs text-gray-500 dark:text-gray-400"><?php echo formatTanggal($today); ?></p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-3">
                        <!-- User Profile Photo -->
                        <div class="flex items-center space-x-3">
                            <div class="text-right hidden sm:block">
                                <p class="text-sm font-semibold text-gray-800 dark:text-white"><?php echo htmlspecialchars($_SESSION['nama_lengkap']); ?></p>
                                <p class="text-xs text-gray-500 dark:text-gray-400"><?php echo !empty($user_data['nim']) ? htmlspecialchars($user_data['nim']) : 'User'; ?></p>
                            </div>
                            <div class="w-10 h-10 rounded-full border-2 border-blue-500 dark:border-blue-400 shadow-lg profile-image">
                                <!-- Fallback icon jika gambar tidak load -->
                                <i class="fas fa-user text-white profile-fallback hidden"></i>
                            </div>
                        </div>

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

        <?php if ($email_status && $email_status['email'] && $email_status['status_email'] == 0): ?>
        <div class="p-4 lg:p-8 pt-0">
            <div class="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 rounded-lg p-4 shadow-lg">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-2xl"></i>
                    </div>
                    <div class="ml-4 flex-1">
                        <h3 class="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                            Email Belum Terverifikasi
                        </h3>
                        <p class="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                            Silakan verifikasi email Anda (<strong><?php echo htmlspecialchars($email_status['email']); ?></strong>) untuk keamanan akun. 
                            Cek inbox atau folder spam Anda untuk link verifikasi.
                        </p>
                        <div class="flex flex-wrap gap-3">
                            <a href="resend-verification.php" 
                               class="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
                                <i class="fas fa-paper-plane mr-2"></i>
                                Kirim Ulang Email
                            </a>
                            <a href="setup-email.php" 
                               class="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-yellow-800 dark:text-yellow-300 text-sm font-semibold rounded-lg transition-all border border-yellow-300 dark:border-yellow-700">
                                <i class="fas fa-edit mr-2"></i>
                                Ganti Email
                            </a>
                        </div>
                    </div>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="flex-shrink-0 ml-4 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <?php if (!$email_status || !$email_status['email']): ?>
        <div class="p-4 lg:p-8 pt-0">
            <div class="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-lg p-4 shadow-lg">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-circle text-red-600 dark:text-red-400 text-2xl"></i>
                    </div>
                    <div class="ml-4 flex-1">
                        <h3 class="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
                            Email Belum Didaftarkan
                        </h3>
                        <p class="text-sm text-red-700 dark:text-red-400 mb-3">
                            Untuk keamanan akun Anda, harap mendaftarkan email kampus terlebih dahulu.
                        </p>
                        <a href="setup-email.php" 
                           class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
                            <i class="fas fa-envelope mr-2"></i>
                            Daftar Email Sekarang
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <!-- Page Content -->
        <div class="p-4 lg:p-8">
            
            <!-- Welcome Section -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-6 lg:p-8 shadow-lg text-white mb-8">
                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div class="flex-1">
                        <h2 class="text-2xl lg:text-3xl font-bold mb-2">
                            Selamat Datang, <?php echo htmlspecialchars(explode(' ', $_SESSION['nama_lengkap'])[0]); ?>! 👋
                        </h2>
                        <p class="text-blue-100">Semangat menjalani hari ini dan jangan lupa absen tepat waktu!</p>
                    </div>
                    <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-[200px] text-center border border-white/20">
                        <div class="text-sm text-blue-100 mb-2 font-medium">
                            <i class="fas fa-clock mr-2"></i>Waktu Sekarang
                        </div>
                        <div id="clock" class="text-4xl lg:text-5xl font-bold font-mono tracking-wider">
                            00:00:00
                        </div>
                        <div class="text-xs text-blue-200 mt-2">WIB</div>
                    </div>
                </div>
            </div>

            <!-- Grid Layout untuk Kalender dan Jadwal Mendatang -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                <!-- Kalender -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                                    <i class="fas fa-calendar-alt text-indigo-600 dark:text-indigo-400 text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800 dark:text-white">Kalender Piket</h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400" id="currentMonth">Loading...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="p-6">
                        <!-- Kontrol Kalender -->
                        <div class="flex justify-between items-center mb-4">
                            <button onclick="prevMonth()" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button onclick="todayMonth()" class="px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 text-sm font-semibold transition-colors">
                                Hari Ini
                            </button>
                            <button onclick="nextMonth()" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>

                        <!-- Grid Kalender -->
                        <div id="calendarGrid" class="grid grid-cols-7 gap-1">
                            <!-- Calendar akan di-render oleh JavaScript -->
                        </div>

                        <!-- Legend -->
                        <div class="mt-6 flex flex-wrap gap-4 text-xs">
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 bg-blue-600 rounded"></div>
                                <span class="text-gray-600 dark:text-gray-400">Hari Ini</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 bg-green-100 dark:bg-green-900 rounded border border-green-300 dark:border-green-700"></div>
                                <span class="text-gray-600 dark:text-gray-400">Ada Jadwal</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Jadwal Yang Akan Datang -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center space-x-3">
                            <div class="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                                <i class="fas fa-clock text-orange-600 dark:text-orange-400 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Jadwal Mendatang</h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400">7 hari ke depan</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-6">
                        <?php if (empty($jadwal_mendatang)): ?>
                            <div class="text-center py-12">
                                <div class="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                    <i class="fas fa-calendar-check text-5xl text-gray-400 dark:text-gray-500"></i>
                                </div>
                                <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Tidak Ada Jadwal</h4>
                                <p class="text-gray-500 dark:text-gray-400">Tidak ada piket dalam 7 hari ke depan</p>
                            </div>
                        <?php else: ?>
                            <div class="space-y-4 max-h-96 overflow-y-auto">
                                <?php foreach ($jadwal_mendatang as $jadwal): 
                                    $hari = formatTanggal($jadwal['tanggal']);
                                    $selisih = floor((strtotime($jadwal['tanggal']) - strtotime($today)) / 86400);
                                ?>
                                <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                                    <div class="flex items-start space-x-3">
                                        <div class="flex-shrink-0 w-14 text-center">
                                            <div class="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded-lg p-2">
                                                <div class="text-xs font-semibold"><?php echo date('M', strtotime($jadwal['tanggal'])); ?></div>
                                                <div class="text-xl font-bold"><?php echo date('d', strtotime($jadwal['tanggal'])); ?></div>
                                            </div>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <h4 class="text-lg font-bold text-gray-800 dark:text-white mb-1">
                                                <?php echo htmlspecialchars($jadwal['lokasi']); ?>
                                            </h4>
                                            <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                <i class="far fa-clock"></i>
                                                <span>
                                                    <?php echo substr($jadwal['jam_mulai'], 0, 5); ?> - 
                                                    <?php echo substr($jadwal['jam_selesai'], 0, 5); ?> WIB
                                                </span>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <?php if ($selisih == 1): ?>
                                                    <span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-semibold">
                                                        <i class="fas fa-exclamation-circle"></i> Besok
                                                    </span>
                                                <?php else: ?>
                                                    <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                                                        <i class="fas fa-calendar"></i> <?php echo $selisih; ?> hari lagi
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

            </div>

            <!-- Jadwal Hari Ini -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                            <i class="fas fa-calendar-day text-blue-600 dark:text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800 dark:text-white">Jadwal Piket Hari Ini</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Piket yang harus dikerjakan</p>
                        </div>
                    </div>
                </div>

                <div class="p-6">
                    <?php if (empty($jadwal_hari_ini)): ?>
                        <div class="text-center py-12">
                            <div class="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                <i class="fas fa-calendar-times text-5xl text-gray-400 dark:text-gray-500"></i>
                            </div>
                            <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Tidak Ada Jadwal</h4>
                            <p class="text-gray-500 dark:text-gray-400">Tidak ada piket hari ini</p>
                        </div>
                    <?php else: ?>
                        <div class="space-y-4">
                            <?php foreach ($jadwal_hari_ini as $jadwal): 
                                // Pastikan format waktu valid
                                $jam_mulai = $jadwal['jam_mulai'];
                                $jam_selesai = $jadwal['jam_selesai'];
                                $waktu_sekarang = $current_time;

                                // Tambahkan ":00" jika hanya format jam:menit
                                if (strlen($jam_mulai) === 5) $jam_mulai .= ':00';
                                if (strlen($jam_selesai) === 5) $jam_selesai .= ':00';
                                if (strlen($waktu_sekarang) === 5) $waktu_sekarang .= ':00';

                                // Konversi ke detik menggunakan strtotime (lebih akurat)
                                $jam_mulai_detik = strtotime($jam_mulai);
                                $jam_selesai_detik = strtotime($jam_selesai);
                                $waktu_sekarang_detik = strtotime($waktu_sekarang);

                                // Logika waktu
                                $bisa_absen = ($waktu_sekarang_detik >= $jam_mulai_detik && $waktu_sekarang_detik <= $jam_selesai_detik);
                                $belum_waktunya = $waktu_sekarang_detik < $jam_mulai_detik;
                                $sudah_lewat = $waktu_sekarang_detik > $jam_selesai_detik;

                                $sudah_absen = $jadwal['sudah_absen'] > 0;
                            ?>
                            <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow">
                                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-3 mb-3">
                                            <i class="fas fa-map-marker-alt text-blue-600 dark:text-blue-400"></i>
                                            <h4 class="text-lg font-bold text-gray-800 dark:text-white">
                                                <?php echo htmlspecialchars($jadwal['lokasi']); ?>
                                            </h4>
                                        </div>
                                        <div class="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                                            <i class="far fa-clock"></i>
                                            <span>
                                                <?php echo substr($jadwal['jam_mulai'], 0, 5); ?> - 
                                                <?php echo substr($jadwal['jam_selesai'], 0, 5); ?> WIB
                                            </span>
                                        </div>
                                        
                                        <?php if ($belum_waktunya): ?>
                                            <div class="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                                                <i class="fas fa-info-circle"></i>
                                                <span>Absensi dimulai pukul <?php echo substr($jadwal['jam_mulai'], 0, 5); ?> WIB</span>
                                            </div>
                                        <?php elseif ($sudah_lewat): ?>
                                            <div class="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                                                <i class="fas fa-exclamation-triangle"></i>
                                                <span>Waktu absensi telah berakhir</span>
                                            </div>
                                        <?php endif; ?>
                                    </div>

                                    <div class="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
                                        <?php if ($sudah_absen): ?>
                                            <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-5 py-2 rounded-lg text-sm font-semibold inline-flex items-center space-x-2">
                                                <i class="fas fa-check-circle"></i>
                                                <span>Sudah Absen</span>
                                            </span>
                                        <?php elseif ($belum_waktunya): ?>
                                            <span class="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center space-x-2">
                                                <i class="fas fa-hourglass-start"></i>
                                                <span>Belum Waktunya</span>
                                            </span>
                                            <button disabled
                                                class="w-full lg:w-auto bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold cursor-not-allowed inline-flex items-center justify-center space-x-2 opacity-60">
                                                <i class="fas fa-camera"></i>
                                                <span>Absen Sekarang</span>
                                            </button>
                                        <?php elseif ($sudah_lewat): ?>
                                            <span class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center space-x-2">
                                                <i class="fas fa-times-circle"></i>
                                                <span>Waktu Habis</span>
                                            </span>
                                            <button disabled
                                                class="w-full lg:w-auto bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold cursor-not-allowed inline-flex items-center justify-center space-x-2 opacity-60">
                                                <i class="fas fa-camera"></i>
                                                <span>Absen Sekarang</span>
                                            </button>
                                        <?php else: ?>
                                            <span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center space-x-2">
                                                <i class="fas fa-exclamation-circle"></i>
                                                <span>Belum Absen</span>
                                            </span>
                                            <a href="absen.php?jadwal_id=<?php echo $jadwal['id']; ?>" 
                                                class="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center space-x-2">
                                                <i class="fas fa-camera"></i>
                                                <span>Absen Sekarang</span>
                                            </a>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Riwayat Absensi -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                            <i class="fas fa-history text-purple-600 dark:text-purple-400 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800 dark:text-white">Riwayat Absensi</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">10 absensi terakhir</p>
                        </div>
                    </div>
                </div>

                <div class="p-6">
                    <?php if (empty($riwayat)): ?>
                        <div class="text-center py-12">
                            <div class="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                <i class="fas fa-inbox text-5xl text-gray-400 dark:text-gray-500"></i>
                            </div>
                            <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Belum Ada Riwayat</h4>
                            <p class="text-gray-500 dark:text-gray-400">Mulai absen untuk melihat riwayat</p>
                        </div>
                    <?php else: ?>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Tanggal
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Lokasi
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Jam Absen
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    <?php foreach ($riwayat as $row): ?>
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                                            <?php echo formatTanggal($row['tanggal']); ?>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                                            <?php echo htmlspecialchars($row['lokasi']); ?>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                                            <?php echo date('H:i', strtotime($row['jam_absen'])); ?> WIB
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <?php if ($row['status_konfirmasi'] === 'pending'): ?>
                                                <span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1">
                                                    <i class="fas fa-hourglass-half"></i>
                                                    <span>Pending</span>
                                                </span>
                                            <?php elseif ($row['status_konfirmasi'] === 'approved'): ?>
                                                <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>Disetujui</span>
                                                </span>
                                            <?php else: ?>
                                                <span class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1">
                                                    <i class="fas fa-times-circle"></i>
                                                    <span>Ditolak</span>
                                                </span>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
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

    <script>
        // Fallback untuk foto profil jika gagal load
        document.addEventListener('DOMContentLoaded', function() {
            const profileImages = document.querySelectorAll('.profile-image');
            profileImages.forEach(img => {
                img.addEventListener('error', function() {
                    this.style.backgroundImage = 'none';
                    const fallback = this.querySelector('.profile-fallback');
                    if (fallback) {
                        fallback.classList.remove('hidden');
                    }
                });
            });
        });
    </script>

</body>
</html>