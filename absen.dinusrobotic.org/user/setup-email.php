<?php
require_once '../config.php';
require_once '../email_config.php';

if (!isLoggedIn() || isAdmin()) {
    redirect('../login.php');
}

$user_id = $_SESSION['user_id'];

// Cek apakah user sudah punya email
$stmt = $conn->prepare("SELECT email, status_email FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// Jika sudah terverifikasi, redirect ke dashboard
if ($user['email'] && $user['status_email'] == 1) {
    redirect('dashboard.php');
}

$error = '';
$success = '';
$email_error_detail = ''; // Detail error email

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    
    // Validasi email harus @mhs.dinus.ac.id
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Format email tidak valid';
    } elseif (!preg_match('/@mhs\.dinus\.ac\.id$/', $email)) {
        $error = 'Email harus menggunakan domain @mhs.dinus.ac.id';
    } else {
        // Cek apakah email sudah digunakan
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->bind_param("si", $email, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $error = 'Email sudah digunakan oleh user lain';
        } else {
            // Generate token
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            // Update database
            $stmt = $conn->prepare("UPDATE users SET email = ?, email_verification_token = ?, email_verification_expires = ?, status_email = 0 WHERE id = ?");
            $stmt->bind_param("sssi", $email, $token, $expires, $user_id);
            
            if ($stmt->execute()) {
                // Kirim email verifikasi dengan error handling detail
                $email_result = sendVerificationEmail($email, $_SESSION['nama_lengkap'], $token);
                
                if ($email_result['success']) {
                    // Log verifikasi
                    $ip = $_SERVER['REMOTE_ADDR'];
                    $stmt = $conn->prepare("INSERT INTO email_verification_log (user_id, email, token, sent_at, ip_address) VALUES (?, ?, ?, NOW(), ?)");
                    $stmt->bind_param("isss", $user_id, $email, $token, $ip);
                    $stmt->execute();
                    
                    $success = 'Email verifikasi telah dikirim ke ' . htmlspecialchars($email) . '. Silakan cek inbox atau folder spam Anda.';
                } else {
                    $error = 'Gagal mengirim email verifikasi.';
                    $email_error_detail = $email_result['error'];
                }
            } else {
                $error = 'Gagal menyimpan email. Silakan coba lagi.';
            }
        }
        $stmt->close();
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Email - Sistem Absensi Piket</title>
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

        function toggleErrorDetail() {
            const detail = document.getElementById('errorDetail');
            const btn = document.getElementById('toggleBtn');
            if (detail.classList.contains('hidden')) {
                detail.classList.remove('hidden');
                btn.innerHTML = '<i class="fas fa-chevron-up mr-1"></i> Sembunyikan Detail';
            } else {
                detail.classList.add('hidden');
                btn.innerHTML = '<i class="fas fa-chevron-down mr-1"></i> Lihat Detail Error';
            }
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
            <div class="inline-block p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg mb-4">
                <i class="fas fa-envelope text-white text-4xl"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">Setup Email Kampus</h1>
            <p class="text-gray-600 dark:text-gray-400">Verifikasi email untuk keamanan akun Anda</p>
        </div>

        <!-- Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            
            <?php if ($error): ?>
            <div class="mb-6 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded" role="alert">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-circle mr-3 mt-1"></i>
                    <div class="flex-1">
                        <p class="font-semibold mb-1"><?php echo $error; ?></p>
                        
                        <?php if ($email_error_detail): ?>
                        <div class="mt-3">
                            <button onclick="toggleErrorDetail()" 
                                    id="toggleBtn"
                                    class="text-sm bg-red-200 dark:bg-red-900 hover:bg-red-300 dark:hover:bg-red-800 px-3 py-1 rounded transition-colors">
                                <i class="fas fa-chevron-down mr-1"></i> Lihat Detail Error
                            </button>
                            
                            <div id="errorDetail" class="hidden mt-3 p-3 bg-red-50 dark:bg-red-950/50 rounded border border-red-300 dark:border-red-800">
                                <p class="text-xs font-semibold mb-2">Detail Error:</p>
                                <pre class="text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap break-words"><?php echo htmlspecialchars($email_error_detail); ?></pre>
                            </div>
                        </div>

                        <!-- Troubleshooting Tips -->
                        <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded">
                            <p class="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                                <i class="fas fa-tools mr-1"></i> Tips Mengatasi Error:
                            </p>
                            <ul class="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                                <li>• Pastikan konfigurasi SMTP sudah benar</li>
                                <li>• Cek username dan password email</li>
                                <li>• Pastikan koneksi internet stabil</li>
                                <li>• Cek firewall tidak block port 587/465</li>
                                <li>• Hubungi administrator jika masalah berlanjut</li>
                            </ul>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <?php if ($success): ?>
            <div class="mb-6 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-4 rounded" role="alert">
                <div class="flex items-start">
                    <i class="fas fa-check-circle mr-3 mt-1"></i>
                    <div>
                        <p class="font-semibold mb-2"><?php echo $success; ?></p>
                        <a href="dashboard.php" class="text-sm underline hover:no-underline">
                            Lanjutkan ke Dashboard →
                        </a>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <?php if (!$user['email'] || $user['status_email'] == 0): ?>
            <form method="POST" action="">
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-envelope mr-2"></i>Email Kampus
                    </label>
                    <input type="email" 
                           name="email" 
                           value="<?php echo htmlspecialchars($user['email'] ?? ''); ?>"
                           placeholder="contoh@mhs.dinus.ac.id"
                           required
                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all">
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <i class="fas fa-info-circle mr-1"></i>
                        Harus menggunakan email dengan domain @mhs.dinus.ac.id
                    </p>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                        <i class="fas fa-shield-alt mr-2"></i>
                        Mengapa Verifikasi Email?
                    </h3>
                    <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                        <li>✓ Keamanan akun Anda</li>
                        <li>✓ Reset password jika lupa</li>
                        <li>✓ Notifikasi penting</li>
                        <li>✓ Pemulihan akses</li>
                    </ul>
                </div>

                <button type="submit" 
                        class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    <i class="fas fa-paper-plane mr-2"></i>
                    Kirim Link Verifikasi
                </button>
            </form>

            <?php if ($user['email']): ?>
            <div class="mt-4 text-center">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Tidak menerima email?</p>
                <a href="resend-verification.php" class="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold">
                    <i class="fas fa-redo mr-1"></i>Kirim Ulang Email
                </a>
            </div>
            <?php endif; ?>

            <?php endif; ?>

            <div class="mt-6 text-center">
                <a href="dashboard.php" class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-sm">
                    <i class="fas fa-arrow-left mr-2"></i>Kembali ke Dashboard
                </a>
            </div>
        </div>

        <!-- Footer Info -->
        <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
                <i class="fas fa-lock mr-1"></i>
                Data Anda aman dan terenkripsi
            </p>
        </div>
    </div>

</body>
</html>