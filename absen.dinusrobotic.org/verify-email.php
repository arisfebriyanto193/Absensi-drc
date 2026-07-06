<?php
require_once 'config.php';

$token = $_GET['token'] ?? '';
$message = '';
$status = '';

if (empty($token)) {
    $status = 'error';
    $message = 'Token verifikasi tidak valid';
} else {
    // Cari user dengan token ini
    $stmt = $conn->prepare("SELECT id, email, nama_lengkap, email_verification_expires, status_email 
                           FROM users 
                           WHERE email_verification_token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $status = 'error';
        $message = 'Token verifikasi tidak valid atau sudah digunakan';
    } else {
        $user = $result->fetch_assoc();
        
        // Cek apakah sudah terverifikasi
        if ($user['status_email'] == 1) {
            $status = 'info';
            $message = 'Email Anda sudah terverifikasi sebelumnya';
        }
        // Cek apakah token sudah kedaluwarsa
        elseif (strtotime($user['email_verification_expires']) < time()) {
            $status = 'error';
            $message = 'Token verifikasi sudah kedaluwarsa. Silakan kirim ulang email verifikasi';
        }
        // Verifikasi berhasil
        else {
            // Update status email
            $stmt = $conn->prepare("UPDATE users 
                                   SET status_email = 1, 
                                       email_verification_token = NULL, 
                                       email_verification_expires = NULL 
                                   WHERE id = ?");
            $stmt->bind_param("i", $user['id']);
            
            if ($stmt->execute()) {
                // Update log verifikasi
                $ip = $_SERVER['REMOTE_ADDR'];
                $stmt = $conn->prepare("UPDATE email_verification_log 
                                       SET status = 'verified', verified_at = NOW(), ip_address = ?
                                       WHERE user_id = ? AND token = ?");
                $stmt->bind_param("sis", $ip, $user['id'], $token);
                $stmt->execute();
                
                $status = 'success';
                $message = 'Email berhasil diverifikasi! Akun Anda sekarang sudah aktif';
            } else {
                $status = 'error';
                $message = 'Terjadi kesalahan saat verifikasi. Silakan coba lagi';
            }
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
    <title>Verifikasi Email - Sistem Absensi Piket</title>
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

        // Auto redirect setelah 5 detik jika berhasil
        <?php if ($status === 'success'): ?>
        setTimeout(function() {
            window.location.href = 'login.php';
        }, 5000);
        <?php endif; ?>
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
        
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
            
            <?php if ($status === 'success'): ?>
                <!-- Success -->
                <div class="mb-6">
                    <div class="inline-block p-6 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                        <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-6xl"></i>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        Email Terverifikasi! 🎉
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        <?php echo $message; ?>
                    </p>
                    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                        <p class="text-sm text-green-800 dark:text-green-300">
                            <i class="fas fa-info-circle mr-2"></i>
                            Anda akan dialihkan ke halaman login dalam 5 detik...
                        </p>
                    </div>
                    <a href="login.php" 
                       class="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        Login Sekarang
                    </a>
                </div>

            <?php elseif ($status === 'info'): ?>
                <!-- Info -->
                <div class="mb-6">
                    <div class="inline-block p-6 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                        <i class="fas fa-info-circle text-blue-600 dark:text-blue-400 text-6xl"></i>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        Sudah Terverifikasi
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        <?php echo $message; ?>
                    </p>
                    <a href="login.php" 
                       class="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        Login
                    </a>
                </div>

            <?php else: ?>
                <!-- Error -->
                <div class="mb-6">
                    <div class="inline-block p-6 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <i class="fas fa-times-circle text-red-600 dark:text-red-400 text-6xl"></i>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        Verifikasi Gagal
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        <?php echo $message; ?>
                    </p>
                    <div class="space-y-3">
                        <a href="user/resend-verification.php" 
                           class="block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                            <i class="fas fa-redo mr-2"></i>
                            Kirim Ulang Email Verifikasi
                        </a>
                        <a href="login.php" 
                           class="block bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-8 rounded-lg transition-all">
                            <i class="fas fa-arrow-left mr-2"></i>
                            Kembali ke Login
                        </a>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Help -->
            <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Butuh bantuan? 
                    <a href="mailto:support@absensipiket.com" class="text-blue-600 dark:text-blue-400 hover:underline">
                        Hubungi Support
                    </a>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© <?php echo date('Y'); ?> Sistem Absensi Piket. All rights reserved.</p>
        </div>
    </div>

</body>
</html>