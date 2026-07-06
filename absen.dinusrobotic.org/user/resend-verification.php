<?php
require_once '../config.php';
require_once '../email_config.php';

if (!isLoggedIn() || isAdmin()) {
    redirect('../login.php');
}

$user_id = $_SESSION['user_id'];
$error = '';
$success = '';

// Cek status email user
$stmt = $conn->prepare("SELECT email, status_email, nama_lengkap FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// Jika sudah terverifikasi
if ($user['status_email'] == 1) {
    redirect('dashboard.php');
}

// Jika belum ada email
if (!$user['email']) {
    redirect('setup-email.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Rate limiting - cek apakah sudah kirim dalam 2 menit terakhir
    $stmt = $conn->prepare("SELECT sent_at FROM email_verification_log 
                           WHERE user_id = ? AND status = 'pending' 
                           ORDER BY sent_at DESC LIMIT 1");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $last_sent = $result->fetch_assoc();
        $time_diff = time() - strtotime($last_sent['sent_at']);
        
        if ($time_diff < 120) { // 2 menit
            $wait_time = 120 - $time_diff;
            $error = "Silakan tunggu {$wait_time} detik sebelum mengirim ulang email verifikasi";
        }
    }
    
    if (!$error) {
        $result = resendVerificationEmail($user_id, $conn);
        
        if ($result['success']) {
            $success = $result['message'];
        } else {
            $error = $result['message'];
        }
    }
    
    $stmt->close();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kirim Ulang Verifikasi - Sistem Absensi Piket</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        tailwind.config = { darkMode: 'class' }
        
        if (localStorage.getItem('darkMode') === 'true' || (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
        
        function toggleDarkMode() {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
        }
    </script>
</head>
<body class="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen flex items-center justify-center p-4">
    
    <!-- Dark Mode Toggle -->
    <button onclick="toggleDarkMode()" 
            class="fixed top-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all z-50">
        <i class="fas fa-moon dark:hidden text-gray-700"></i>
        <i class="fas fa-sun hidden dark:inline text-yellow-400"></i>
    </button>

    <div class="w-full max-w-md">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
            <div class="inline-block p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-lg mb-4">
                <i class="fas fa-envelope-open-text text-white text-4xl"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">Kirim Ulang Email</h1>
            <p class="text-gray-600 dark:text-gray-400">Tidak menerima email verifikasi?</p>
        </div>

        <!-- Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            
            <?php if ($error): ?>
            <div class="mb-6 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded" role="alert">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle mr-3"></i>
                    <p><?php echo $error; ?></p>
                </div>
            </div>
            <?php endif; ?>

            <?php if ($success): ?>
            <div class="mb-6 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-4 rounded" role="alert">
                <div class="flex items-start">
                    <i class="fas fa-check-circle mr-3 mt-1"></i>
                    <div>
                        <p class="font-semibold mb-2"><?php echo $success; ?></p>
                        <p class="text-sm">Silakan cek inbox atau folder spam Anda</p>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Email Info -->
            <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                    <i class="fas fa-info-circle mr-2"></i>
                    Email Terdaftar
                </h3>
                <p class="text-blue-800 dark:text-blue-400 text-sm break-all">
                    <?php echo htmlspecialchars($user['email']); ?>
                </p>
            </div>

            <!-- Resend Form -->
            <form method="POST" action="">
                <button type="submit" 
                        class="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    <i class="fas fa-paper-plane mr-2"></i>
                    Kirim Ulang Email Verifikasi
                </button>
            </form>

            <!-- Tips -->
            <div class="mt-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 class="font-semibold text-yellow-900 dark:text-yellow-300 mb-2 flex items-center">
                    <i class="fas fa-lightbulb mr-2"></i>
                    Tips Jika Email Tidak Diterima:
                </h4>
                <ul class="text-sm text-yellow-800 dark:text-yellow-400 space-y-2">
                    <li class="flex items-start">
                        <i class="fas fa-check mr-2 mt-1 flex-shrink-0"></i>
                        <span>Cek folder Spam/Junk email Anda</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check mr-2 mt-1 flex-shrink-0"></i>
                        <span>Pastikan email yang didaftarkan benar</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check mr-2 mt-1 flex-shrink-0"></i>
                        <span>Tunggu beberapa menit untuk email masuk</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check mr-2 mt-1 flex-shrink-0"></i>
                        <span>Pastikan koneksi internet stabil</span>
                    </li>
                </ul>
            </div>

            <!-- Actions -->
            <div class="mt-6 space-y-3">
                <a href="setup-email.php" 
                   class="block text-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg transition-all">
                    <i class="fas fa-edit mr-2"></i>
                    Ganti Email
                </a>
                <a href="dashboard.php" 
                   class="block text-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-sm">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Kembali ke Dashboard
                </a>
            </div>
        </div>

        <!-- Footer Info -->
        <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
                <i class="fas fa-question-circle mr-1"></i>
                Masih bermasalah? 
                <a href="mailto:support@absensipiket.com" class="text-blue-600 dark:text-blue-400 hover:underline">
                    Hubungi Support
                </a>
            </p>
        </div>
    </div>

</body>
</html>