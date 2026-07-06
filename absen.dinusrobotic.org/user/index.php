<?php
require_once '../config.php';

// Pastikan user sudah login dan bukan admin
if (!isLoggedIn()) {
    redirect('../login.php');
}

if (isAdmin()) {
    redirect('../admin/dashboard.php');
}

$user_id = $_SESSION['user_id'];

// Cek status email user
$stmt = $conn->prepare("SELECT email, status_email, nama_lengkap, username, created_at FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// Hitung jumlah absensi user
$stmt = $conn->prepare("SELECT COUNT(*) as total_absensi FROM absensi WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$absensi_result = $stmt->get_result();
$absensi_data = $absensi_result->fetch_assoc();
$stmt->close();

// Hitung jadwal hari ini
$today = date('Y-m-d');
$stmt = $conn->prepare("SELECT COUNT(*) as jadwal_hari_ini FROM jadwal_piket WHERE user_id = ? AND tanggal = ? AND status = 'scheduled'");
$stmt->bind_param("is", $user_id, $today);
$stmt->execute();
$jadwal_result = $stmt->get_result();
$jadwal_data = $jadwal_result->fetch_assoc();
$stmt->close();

// Tentukan status dan action
$status = '';
$status_icon = '';
$status_color = '';
$action_url = '';
$action_text = '';
$status_message = '';

if (empty($user['email'])) {
    $status = 'no_email';
    $status_icon = 'fa-envelope-open';
    $status_color = 'red';
    $action_url = 'setup-email.php';
    $action_text = 'Setup Email Sekarang';
    $status_message = 'Anda belum mendaftarkan email kampus. Untuk keamanan akun, silakan daftarkan email Anda.';
} elseif ($user['status_email'] == 0) {
    $status = 'unverified';
    $status_icon = 'fa-exclamation-triangle';
    $status_color = 'yellow';
    $action_url = 'dashboard.php';
    $action_text = 'Lanjut ke Dashboard';
    $status_message = 'Email Anda belum terverifikasi. Silakan cek inbox atau folder spam untuk link verifikasi.';
} else {
    $status = 'verified';
    $status_icon = 'fa-check-circle';
    $status_color = 'green';
    $action_url = 'dashboard.php';
    $action_text = 'Masuk ke Dashboard';
    $status_message = 'Email Anda sudah terverifikasi. Akun Anda aman dan siap digunakan.';

    // 🔥 Tambahkan ini agar auto-redirect ke dashboard
    redirect('dashboard.php');
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status Akun - Sistem Absensi Piket</title>
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
    </script>
    <style>
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
            animation: fadeIn 0.6s ease-out;
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
    
    <!-- Dark Mode Toggle -->
    <button onclick="toggleDarkMode()" 
            class="fixed top-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all z-50">
        <i class="fas fa-moon dark:hidden text-gray-700"></i>
        <i class="fas fa-sun hidden dark:inline text-yellow-400"></i>
    </button>

    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-4xl">
            
            <!-- Header -->
            <div class="text-center mb-8 fade-in">
                <div class="inline-block p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg mb-4">
                    <i class="fas fa-user-circle text-white text-5xl"></i>
                </div>
                <h1 class="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                    Status Akun Anda
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                    Selamat datang, <?php echo htmlspecialchars($user['nama_lengkap']); ?>!
                </p>
            </div>

            <!-- Status Card -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden mb-6 fade-in" style="animation-delay: 0.2s;">
                
                <!-- Status Banner -->
                <div class="
                    <?php 
                    if ($status_color == 'red') echo 'bg-gradient-to-r from-red-500 to-red-600';
                    elseif ($status_color == 'yellow') echo 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                    else echo 'bg-gradient-to-r from-green-500 to-green-600';
                    ?> 
                    p-6 text-white text-center">
                    <i class="fas <?php echo $status_icon; ?> text-6xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">
                        <?php 
                        if ($status == 'no_email') echo 'Email Belum Terdaftar';
                        elseif ($status == 'unverified') echo 'Email Belum Terverifikasi';
                        else echo 'Akun Sudah Terverifikasi';
                        ?>
                    </h2>
                    <p class="text-white/90"><?php echo $status_message; ?></p>
                </div>

                <!-- User Info -->
                <div class="p-6 lg:p-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        
                        <!-- Info Akun -->
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                            <div class="flex items-center space-x-3 mb-4">
                                <div class="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                                    <i class="fas fa-user text-blue-600 dark:text-blue-400"></i>
                                </div>
                                <h3 class="font-bold text-gray-800 dark:text-white">Informasi Akun</h3>
                            </div>
                            <div class="space-y-3">
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Nama Lengkap</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">
                                        <?php echo htmlspecialchars($user['nama_lengkap']); ?>
                                    </p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Username</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">
                                        <?php echo htmlspecialchars($user['username']); ?>
                                    </p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Terdaftar Sejak</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">
                                        <?php echo date('d F Y', strtotime($user['created_at'])); ?>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Status Email -->
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                            <div class="flex items-center space-x-3 mb-4">
                                <div class="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                                    <i class="fas fa-envelope text-purple-600 dark:text-purple-400"></i>
                                </div>
                                <h3 class="font-bold text-gray-800 dark:text-white">Status Email</h3>
                            </div>
                            <div class="space-y-3">
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                                    <?php if (empty($user['email'])): ?>
                                        <p class="font-semibold text-red-600 dark:text-red-400">
                                            <i class="fas fa-times-circle mr-1"></i>
                                            Belum Terdaftar
                                        </p>
                                    <?php else: ?>
                                        <p class="font-semibold text-gray-800 dark:text-white break-all">
                                            <?php echo htmlspecialchars($user['email']); ?>
                                        </p>
                                    <?php endif; ?>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Status Verifikasi</p>
                                    <?php if (empty($user['email'])): ?>
                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                            <i class="fas fa-minus-circle mr-1"></i>
                                            Tidak Ada Email
                                        </span>
                                    <?php elseif ($user['status_email'] == 0): ?>
                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                                            <i class="fas fa-exclamation-circle mr-1"></i>
                                            Belum Terverifikasi
                                        </span>
                                    <?php else: ?>
                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                            <i class="fas fa-check-circle mr-1"></i>
                                            Terverifikasi
                                        </span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Statistik -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                <?php echo $absensi_data['total_absensi']; ?>
                            </div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Total Absensi</div>
                        </div>
                        <div class="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                                <?php echo $jadwal_data['jadwal_hari_ini']; ?>
                            </div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Jadwal Hari Ini</div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="space-y-3">
                        <a href="<?php echo $action_url; ?>" 
                           class="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-center">
                            <i class="fas fa-arrow-right mr-2"></i>
                            <?php echo $action_text; ?>
                        </a>

                        <?php if ($status == 'unverified'): ?>
                        <a href="resend-verification.php" 
                           class="block w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all text-center">
                            <i class="fas fa-paper-plane mr-2"></i>
                            Kirim Ulang Email Verifikasi
                        </a>
                        <?php endif; ?>

                        <a href="profil.php" 
                           class="block w-full text-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-sm py-2">
                            <i class="fas fa-user-circle mr-2"></i>
                            Lihat Profil Lengkap
                        </a>
                    </div>
                </div>

            </div>

            <!-- Tips -->
            <?php if ($status == 'no_email' || $status == 'unverified'): ?>
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 fade-in" style="animation-delay: 0.4s;">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <i class="fas fa-lightbulb text-yellow-500 text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 dark:text-white mb-2">
                            Mengapa Verifikasi Email Penting?
                        </h3>
                        <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                                <span>Keamanan akun Anda lebih terjaga</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                                <span>Memudahkan reset password jika lupa</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                                <span>Menerima notifikasi penting tentang jadwal</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                                <span>Pemulihan akses jika terkunci</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Logout -->
            <div class="text-center mt-6">
                <a href="../logout.php" class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-semibold">
                    <i class="fas fa-sign-out-alt mr-2"></i>
                    Logout
                </a>
            </div>

        </div>
    </div>

</body>
</html>