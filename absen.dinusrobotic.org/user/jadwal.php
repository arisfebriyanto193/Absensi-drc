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


$user_id = $_SESSION['user_id'];
$today = date('Y-m-d');

// Filter
$filter_bulan = $_GET['bulan'] ?? date('Y-m');
$filter_status = $_GET['status'] ?? 'all';

// Query jadwal
$query = "SELECT jp.*, 
    (SELECT COUNT(*) FROM absensi WHERE jadwal_id = jp.id) as sudah_absen,
    (SELECT COUNT(*) FROM izin WHERE jadwal_id = jp.id AND status = 'approved') as ada_izin
    FROM jadwal_piket jp 
    WHERE jp.user_id = ? 
    AND DATE_FORMAT(jp.tanggal, '%Y-%m') = ?";

if ($filter_status === 'scheduled') {
    $query .= " AND jp.status = 'scheduled' AND jp.tanggal >= CURDATE()";
} elseif ($filter_status === 'completed') {
    $query .= " AND EXISTS (SELECT 1 FROM absensi WHERE jadwal_id = jp.id)";
} elseif ($filter_status === 'pending') {
    $query .= " AND jp.status = 'scheduled' AND jp.tanggal < CURDATE() AND NOT EXISTS (SELECT 1 FROM absensi WHERE jadwal_id = jp.id) AND NOT EXISTS (SELECT 1 FROM izin WHERE jadwal_id = jp.id AND status = 'approved')";
} elseif ($filter_status === 'izin') {
    $query .= " AND EXISTS (SELECT 1 FROM izin WHERE jadwal_id = jp.id AND status = 'approved')";
}

$query .= " ORDER BY jp.tanggal ASC, jp.jam_mulai ASC";

$stmt = $conn->prepare($query);
$stmt->bind_param("is", $user_id, $filter_bulan);
$stmt->execute();
$jadwal_list = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Statistik
$stats_query = "SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN tanggal >= CURDATE() AND status = 'scheduled' THEN 1 ELSE 0 END) as mendatang,
    SUM(CASE WHEN EXISTS (SELECT 1 FROM absensi WHERE jadwal_id = jadwal_piket.id) THEN 1 ELSE 0 END) as selesai,
    SUM(CASE WHEN tanggal < CURDATE() AND status = 'scheduled' 
        AND NOT EXISTS (SELECT 1 FROM absensi WHERE jadwal_id = jadwal_piket.id)
        AND NOT EXISTS (SELECT 1 FROM izin WHERE jadwal_id = jadwal_piket.id AND status = 'approved') THEN 1 ELSE 0 END) as terlewat
    FROM jadwal_piket
    WHERE user_id = ? AND DATE_FORMAT(tanggal, '%Y-%m') = ?";

$stmt = $conn->prepare($stats_query);
$stmt->bind_param("is", $user_id, $filter_bulan);
$stmt->execute();
$stats = $stmt->get_result()->fetch_assoc();
$stmt->close();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cek Jadwal - Sistem Absensi Piket</title>
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
    </script>
    <style>
        * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        
        .sidebar-transition {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-card {
            position: relative;
            overflow: hidden;
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
                            <h1 class="text-xl font-bold text-gray-800 dark:text-white">Cek Jadwal Piket</h1>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Semua jadwal piket Anda</p>
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
            
            <!-- Statistik Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="stat-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border-l-4 border-blue-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Jadwal</p>
                            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400"><?php echo $stats['total']; ?></p>
                        </div>
                        <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                            <i class="fas fa-calendar-alt text-blue-600 dark:text-blue-400 text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div class="stat-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border-l-4 border-green-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Mendatang</p>
                            <p class="text-3xl font-bold text-green-600 dark:text-green-400"><?php echo $stats['mendatang']; ?></p>
                        </div>
                        <div class="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                            <i class="fas fa-clock text-green-600 dark:text-green-400 text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div class="stat-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border-l-4 border-purple-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Selesai</p>
                            <p class="text-3xl font-bold text-purple-600 dark:text-purple-400"><?php echo $stats['selesai']; ?></p>
                        </div>
                        <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                            <i class="fas fa-check-circle text-purple-600 dark:text-purple-400 text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div class="stat-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border-l-4 border-red-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Terlewat</p>
                            <p class="text-3xl font-bold text-red-600 dark:text-red-400"><?php echo $stats['terlewat']; ?></p>
                        </div>
                        <div class="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                            <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filter Section -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                            <i class="fas fa-filter text-purple-600 dark:text-purple-400 text-xl"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-800 dark:text-white">Filter Jadwal</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Cari berdasarkan bulan dan status</p>
                        </div>
                    </div>
                </div>

                <div class="p-6">
                    <form method="GET" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                <i class="far fa-calendar mr-2"></i>Bulan
                            </label>
                            <input type="month" name="bulan" value="<?php echo $filter_bulan; ?>"
                                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                <i class="fas fa-info-circle mr-2"></i>Status
                            </label>
                            <select name="status" class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                                <option value="all" <?php echo $filter_status === 'all' ? 'selected' : ''; ?>>Semua Status</option>
                                <option value="scheduled" <?php echo $filter_status === 'scheduled' ? 'selected' : ''; ?>>Akan Datang</option>
                                <option value="completed" <?php echo $filter_status === 'completed' ? 'selected' : ''; ?>>Sudah Absen</option>
                                <option value="pending" <?php echo $filter_status === 'pending' ? 'selected' : ''; ?>>Terlewat</option>
                                <option value="izin" <?php echo $filter_status === 'izin' ? 'selected' : ''; ?>>Ada Izin</option>
                            </select>
                        </div>

                        <div class="flex items-end">
                            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2">
                                <i class="fas fa-search"></i>
                                <span>Tampilkan</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Daftar Jadwal -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                            <i class="fas fa-list text-blue-600 dark:text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-800 dark:text-white">Daftar Jadwal</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                <?php echo count($jadwal_list); ?> jadwal ditemukan
                            </p>
                        </div>
                    </div>
                </div>

                <div class="p-6">
                    <?php if (empty($jadwal_list)): ?>
                    <div class="text-center py-12">
                        <div class="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                            <i class="fas fa-calendar-times text-5xl text-gray-400 dark:text-gray-500"></i>
                        </div>
                        <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Tidak Ada Jadwal</h4>
                        <p class="text-gray-500 dark:text-gray-400">Tidak ada jadwal pada periode ini</p>
                    </div>
                    <?php else: ?>
                    <div class="space-y-4">
                        <?php foreach ($jadwal_list as $jadwal): 
                            $is_past = strtotime($jadwal['tanggal']) < strtotime($today);
                            $is_today = $jadwal['tanggal'] === $today;
                        ?>
                        <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all">
                            <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                
                                <!-- Left Side - Date Badge & Info -->
                                <div class="flex items-start space-x-4 flex-1">
                                    <!-- Date Badge -->
                                    <div class="flex-shrink-0 w-20 text-center">
                                        <div class="<?php echo $is_today ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-700'; ?> <?php echo $is_today ? 'text-white' : 'text-gray-700 dark:text-gray-300'; ?> rounded-lg p-3">
                                            <div class="text-xs font-semibold uppercase">
                                              <?php echo date('M', strtotime($jadwal['tanggal'])); ?>

                                            </div>
                                            <div class="text-2xl font-bold">
                                                <?php echo date('d', strtotime($jadwal['tanggal'])); ?>
                                            </div>
                                            <div class="text-xs">
                                                <?php echo date('Y', strtotime($jadwal['tanggal'])); ?>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Info -->
                                    <div class="flex-1">
                                        <h3 class="font-bold text-lg text-gray-800 dark:text-white mb-2">
                                            <?php echo htmlspecialchars($jadwal['lokasi']); ?>
                                        </h3>
                                        <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                            <div class="flex items-center space-x-2">
                                                <i class="far fa-calendar w-4"></i>
                                                <span><?php echo formatTanggal($jadwal['tanggal']); ?></span>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <i class="far fa-clock w-4"></i>
                                                <span>
                                                    <?php echo substr($jadwal['jam_mulai'], 0, 5); ?> - 
                                                    <?php echo substr($jadwal['jam_selesai'], 0, 5); ?> WIB
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right Side - Status & Actions -->
                                <div class="flex flex-col items-start lg:items-end gap-3">
                                    <!-- Status Badges -->
                                    <div class="flex flex-wrap gap-2">
                                        <?php if ($is_today): ?>
                                            <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center space-x-1">
                                                <i class="fas fa-star"></i>
                                                <span>Hari Ini</span>
                                            </span>
                                        <?php endif; ?>

                                        <?php if ($jadwal['sudah_absen'] > 0): ?>
                                            <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center space-x-1">
                                                <i class="fas fa-check-circle"></i>
                                                <span>Sudah Absen</span>
                                            </span>
                                        <?php elseif ($jadwal['ada_izin'] > 0): ?>
                                            <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center space-x-1">
                                                <i class="fas fa-file-signature"></i>
                                                <span>Ada Izin</span>
                                            </span>
                                        <?php elseif ($is_past): ?>
                                            <span class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center space-x-1">
                                                <i class="fas fa-exclamation-triangle"></i>
                                                <span>Terlewat</span>
                                            </span>
                                        <?php else: ?>
                                            <span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center space-x-1">
                                                <i class="fas fa-hourglass-half"></i>
                                                <span>Akan Datang</span>
                                            </span>
                                        <?php endif; ?>
                                    </div>

                                    <!-- Action Button -->
                                    <?php if ($is_today && $jadwal['sudah_absen'] == 0 && $jadwal['ada_izin'] == 0): ?>
                                        <a href="dashboard.php" 
                                            class="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center space-x-2">
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