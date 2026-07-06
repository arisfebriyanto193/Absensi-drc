<?php
require_once '../config.php';

if (!isLoggedIn() || isAdmin()) {
    redirect('../login.php');
}

$stmt = $conn->prepare("SELECT email, status_email FROM users WHERE id = ?");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();
$user_data = $result->fetch_assoc();
$stmt->close();

// Cek kondisi email dan status_email
if (empty($user_data['email'])) {
    // Belum ada email
    redirect('index.php');
} elseif (isset($user_data['status_email']) && $user_data['status_email'] == 0) {
    // Email ada tapi belum aktif
    redirect('index.php');
}

$user_id = $_SESSION['user_id'];
$error = '';
$success = '';

// Ambil data user
$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Proses update profil
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_profile') {
        $username = trim($_POST['username'] ?? '');
        
        if (empty($username)) {
            $error = 'Username harus diisi';
        } else {
            // Cek apakah username sudah digunakan user lain
            $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
            $stmt->bind_param("si", $username, $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $error = 'Username sudah digunakan oleh user lain';
            } else {
                $stmt2 = $conn->prepare("UPDATE users SET username = ? WHERE id = ?");
                $stmt2->bind_param("si", $username, $user_id);
                
                if ($stmt2->execute()) {
                    $_SESSION['username'] = $username;
                    $success = 'Profil berhasil diperbarui!';
                    
                    // Refresh data user
                    $stmt3 = $conn->prepare("SELECT * FROM users WHERE id = ?");
                    $stmt3->bind_param("i", $user_id);
                    $stmt3->execute();
                    $user = $stmt3->get_result()->fetch_assoc();
                    $stmt3->close();
                } else {
                    $error = 'Gagal memperbarui profil';
                }
                $stmt2->close();
            }
            $stmt->close();
        }
    } 
    elseif ($action === 'change_password') {
        $password_lama = $_POST['password_lama'] ?? '';
        $password_baru = $_POST['password_baru'] ?? '';
        $password_konfirmasi = $_POST['password_konfirmasi'] ?? '';
        
        if (empty($password_lama) || empty($password_baru) || empty($password_konfirmasi)) {
            $error = 'Semua field password harus diisi';
        } elseif ($password_baru !== $password_konfirmasi) {
            $error = 'Password baru dan konfirmasi tidak cocok';
        } elseif (strlen($password_baru) < 6) {
            $error = 'Password baru minimal 6 karakter';
        } else {
            // Verifikasi password lama
            if (password_verify($password_lama, $user['password'])) {
                $password_hash = password_hash($password_baru, PASSWORD_DEFAULT);
                
                $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
                $stmt->bind_param("si", $password_hash, $user_id);
                
                if ($stmt->execute()) {
                    $success = 'Password berhasil diubah!';
                } else {
                    $error = 'Gagal mengubah password';
                }
                $stmt->close();
            } else {
                $error = 'Password lama tidak sesuai';
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
    <title>Profil Saya - Sistem Absensi Piket</title>
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

        // Toggle Password Visibility
        function togglePassword(inputId, iconId) {
            const input = document.getElementById(inputId);
            const icon = document.getElementById(iconId);
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    </script>
    <style>
        * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        
        .sidebar-transition {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
                            <h1 class="text-xl font-bold text-gray-800 dark:text-white">Profil Saya</h1>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Kelola informasi profil dan keamanan akun</p>
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

            <?php if ($success): ?>
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3">
                <i class="fas fa-check-circle text-xl"></i>
                <span><?php echo htmlspecialchars($success); ?></span>
            </div>
            <?php endif; ?>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <!-- Profile Card -->
                <div class="lg:col-span-1">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                        <div class="text-center">
                            <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-xl mb-4">
                                <i class="fas fa-user text-white text-4xl"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                                <?php echo htmlspecialchars($user['nama_lengkap']); ?>
                            </h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <i class="fas fa-id-card"></i> <?php echo htmlspecialchars($user['nim'] ?: 'Belum diisi'); ?>
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <i class="fas fa-at"></i> <?php echo htmlspecialchars($user['username']); ?>
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                <i class="fas fa-envelope"></i> <?php echo !empty($user['email']) ? htmlspecialchars($user['email']) : 'Belum ada email terdaftar'; ?>
                            </p>
                            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div class="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                    <i class="fas fa-shield-alt text-blue-500"></i>
                                    <span class="font-medium">User Member</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Account Info -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-6">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                            <i class="fas fa-info-circle text-blue-500"></i>
                            <span>Informasi Akun</span>
                        </h3>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-400">Status Akun</span>
                                <span class="text-green-600 dark:text-green-400 font-semibold">
                                    <i class="fas fa-circle text-xs"></i> Aktif
                                </span>
                            </div>
                            <div class="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-400">Terdaftar Sejak</span>
                                <span class="text-gray-800 dark:text-gray-200 font-medium">
                                    <?php echo date('d M Y', strtotime($user['created_at'])); ?>
                                </span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-400">Role</span>
                                <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                                    <?php echo htmlspecialchars($user['role']); ?>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Forms Section -->
                <div class="lg:col-span-2 space-y-6">
                    
                    <!-- Edit Profile Form -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center space-x-3">
                                <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                                    <i class="fas fa-user-edit text-blue-600 dark:text-blue-400 text-xl"></i>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Edit Profil</h2>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Perbarui informasi profil Anda</p>
                                </div>
                            </div>
                        </div>

                        <div class="p-6">
                            <form method="POST" class="space-y-5">
                                <input type="hidden" name="action" value="update_profile">
                                
                                <div>
                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                        <i class="fas fa-user"></i> Nama Lengkap
                                    </label>
                                    <input type="text" readonly
                                        value="<?php echo htmlspecialchars($user['nama_lengkap']); ?>"
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        placeholder="Nama lengkap tidak dapat diubah">
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        <i class="fas fa-lock"></i> Nama lengkap tidak dapat diubah
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                        <i class="fas fa-id-card"></i> NIM
                                    </label>
                                    <input type="text" readonly
                                        value="<?php echo htmlspecialchars($user['nim'] ?: 'Belum diisi'); ?>"
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        placeholder="NIM tidak dapat diubah">
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        <i class="fas fa-lock"></i> NIM tidak dapat diubah
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        <i class="fas fa-at"></i> Username <span class="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="username" required
                                        value="<?php echo htmlspecialchars($user['username']); ?>"
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="Masukkan username">
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        <i class="fas fa-info-circle"></i> Username akan digunakan untuk login
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                        <i class="fas fa-envelope"></i> Email
                                    </label>
                                    <input type="text" readonly
                                        value="<?php echo !empty($user['email']) ? htmlspecialchars($user['email']) : 'Belum ada email terdaftar'; ?>"
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        placeholder="Email tidak dapat diubah">
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        <i class="fas fa-lock"></i> Email tidak dapat diubah
                                    </p>
                                </div>

                                <button type="submit" 
                                    class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2">
                                    <i class="fas fa-save"></i>
                                    <span>Simpan Perubahan Profil</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Change Password Form -->
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center space-x-3">
                                <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                                    <i class="fas fa-key text-purple-600 dark:text-purple-400 text-xl"></i>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Ubah Password</h2>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Ganti password untuk keamanan akun</p>
                                </div>
                            </div>
                        </div>

                        <div class="p-6">
                            <form method="POST" class="space-y-5">
                                <input type="hidden" name="action" value="change_password">
                                
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        <i class="fas fa-lock"></i> Password Lama <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <input type="password" name="password_lama" id="password_lama" required
                                            class="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                            placeholder="Masukkan password lama">
                                        <button type="button" 
                                            onclick="togglePassword('password_lama', 'icon_password_lama')"
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                            <i id="icon_password_lama" class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        <i class="fas fa-lock"></i> Password Baru <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <input type="password" name="password_baru" id="password_baru" required
                                            class="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                            placeholder="Masukkan password baru">
                                        <button type="button" 
                                            onclick="togglePassword('password_baru', 'icon_password_baru')"
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                            <i id="icon_password_baru" class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        <i class="fas fa-info-circle"></i> Password minimal 6 karakter
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        <i class="fas fa-lock"></i> Konfirmasi Password Baru <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <input type="password" name="password_konfirmasi" id="password_konfirmasi" required
                                            class="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                            placeholder="Konfirmasi password baru">
                                        <button type="button" 
                                            onclick="togglePassword('password_konfirmasi', 'icon_password_konfirmasi')"
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                            <i id="icon_password_konfirmasi" class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" 
                                    class="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2">
                                    <i class="fas fa-key"></i>
                                    <span>Ubah Password</span>
                                </button>
                            </form>
                        </div>
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