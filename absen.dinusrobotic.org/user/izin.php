<?php
require_once '../config.php';

if (!isLoggedIn() || isAdmin()) {
    redirect('../login.php');
}

// Ambil data user
$stmt = $conn->prepare("SELECT email FROM users WHERE id = ?");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$user_data = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (empty($user_data['email'])) redirect('index.php');

$user_id = $_SESSION['user_id'];
$error = '';
$success = '';

// Ambil jadwal piket yang tersedia
$stmt = $conn->prepare("
    SELECT jp.*
FROM jadwal_piket jp
LEFT JOIN izin i 
    ON i.jadwal_id = jp.id 
    AND i.status IN ('pending', 'approved')  -- hanya hitung izin valid
LEFT JOIN absensi a 
    ON a.jadwal_id = jp.id
WHERE jp.user_id = ?
  AND jp.tanggal >= CURDATE()
  AND jp.status = 'scheduled'
  AND i.id IS NULL       -- tidak ada izin (pending/approved)
  AND a.id IS NULL
ORDER BY jp.tanggal ASC;

");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$jadwal_tersedia = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Handle form submit
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $jadwal_id = $_POST['jadwal_id'] ?? 0;
    $alasan = trim($_POST['alasan'] ?? '');

    if (empty($jadwal_id) || empty($alasan)) {
        $error = "Semua field wajib diisi!";
    } elseif (!isset($_FILES['file_izin']) || $_FILES['file_izin']['error'] !== UPLOAD_ERR_OK) {
        $error = "File bukti wajib diupload!";
    } else {

        // Validasi jadwal
        $stmt = $conn->prepare("SELECT tanggal FROM jadwal_piket WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $jadwal_id, $user_id);
        $stmt->execute();
        $jadwal = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$jadwal) {
            $error = "Jadwal tidak valid!";
        } else {
            // PROCESS FILE
            $file = $_FILES['file_izin'];

            $allowed_ext = ['jpg','jpeg','png','pdf'];
            $file_name = strtolower($file['name']);
            $file_ext = pathinfo($file_name, PATHINFO_EXTENSION);
            $file_type = mime_content_type($file['tmp_name']);

            $allowed_mime = [
                'image/jpeg',
                'image/png',
                'application/pdf'
            ];

            if (!in_array($file_ext, $allowed_ext)) {
                $error = "File hanya boleh JPG, PNG, atau PDF!";
            } elseif (!in_array($file_type, $allowed_mime)) {
                $error = "Tipe file tidak valid!";
            } elseif ($file['size'] > 10 * 1024 * 1024) { // 2MB
                $error = "Ukuran file maksimal 2MB!";
            } else {

                // Folder upload
                $upload_dir = __DIR__ . '/uploads/izin';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0775, true);
                }

                $new_filename = 'izin_'.$user_id.'_'.time().'.'.$file_ext;
                $upload_path = $upload_dir . '/' . $new_filename;

                if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
                    $error = "Gagal upload file!";
                } else {
                    // Simpan database
                    $stmt = $conn->prepare("
                        INSERT INTO izin (user_id, jadwal_id, tanggal_izin, alasan, file_bukti)
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    $stmt->bind_param("iisss", $user_id, $jadwal_id, $jadwal['tanggal'], $alasan, $new_filename);

                    if ($stmt->execute()) {
                     header("Location: izin.php");
                     exit;
                    } else {
                         $error = "Terjadi kesalahan database!";
                    }
                    $stmt->close();
                }
            }
        }
    }
}

// Riwayat izin user
$stmt = $conn->prepare("
SELECT i.*, jp.tanggal, jp.lokasi, u.nama_lengkap AS admin_name
FROM izin i
JOIN jadwal_piket jp ON i.jadwal_id = jp.id
LEFT JOIN users u ON i.approved_by = u.id
WHERE i.user_id = ?
ORDER BY i.created_at DESC
");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$riwayat_izin = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ajukan Izin - Sistem Absensi Piket</title>
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
                            <h1 class="text-xl font-bold text-gray-800 dark:text-white">Ajukan Izin</h1>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Pengajuan izin tidak bisa piket</p>
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

            <!-- Form Ajukan Izin -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                            <i class="fas fa-file-signature text-green-600 dark:text-green-400 text-xl"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-800 dark:text-white">Form Pengajuan Izin</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Ajukan izin jika tidak bisa melaksanakan piket</p>
                        </div>
                    </div>
                </div>

                <div class="p-6">
                    <?php if (empty($jadwal_tersedia)): ?>
                    <div class="text-center py-12">
                        <div class="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                            <i class="fas fa-calendar-times text-5xl text-gray-400 dark:text-gray-500"></i>
                        </div>
                        <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Tidak Ada Jadwal</h4>
                        <p class="text-gray-500 dark:text-gray-400">Tidak ada jadwal yang bisa diajukan izin saat ini</p>
                    </div>
                    <?php else: ?>
                    <form method="POST" enctype="multipart/form-data" class="space-y-6">

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Pilih Jadwal <span class="text-red-500">*</span>
                            </label>
                            <select name="jadwal_id" required
                                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                                <option value="">-- Pilih Jadwal --</option>
                                <?php foreach ($jadwal_tersedia as $jadwal): ?>
                                <option value="<?php echo $jadwal['id']; ?>">
                                    <?php echo formatTanggal($jadwal['tanggal']); ?> - 
                                    <?php echo htmlspecialchars($jadwal['lokasi']); ?> 
                                    (<?php echo substr($jadwal['jam_mulai'], 0, 5); ?> - <?php echo substr($jadwal['jam_selesai'], 0, 5); ?>)
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
<div>
    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Upload Bukti (Foto / PDF) <span class="text-red-500">*</span>
    </label>
    <input type="file" name="file_izin" accept="image/*,.pdf" required
        class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" />

    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Format yang diperbolehkan: JPG, PNG, PDF. Maks 2MB
    </p>
</div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Alasan Izin <span class="text-red-500">*</span>
                            </label>
                            <textarea name="alasan" rows="5" required
                                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                placeholder="Tuliskan alasan izin Anda dengan jelas..."></textarea>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                <i class="fas fa-info-circle"></i> Berikan alasan yang jelas dan detail
                            </p>
                        </div>

                        <button type="submit" 
                            class="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2">
                            <i class="fas fa-paper-plane"></i>
                            <span>Kirim Pengajuan Izin</span>
                        </button>
                    </form>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Riwayat Izin -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                            <i class="fas fa-list-ul text-purple-600 dark:text-purple-400 text-xl"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-800 dark:text-white">Riwayat Pengajuan Izin</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Semua pengajuan izin yang pernah diajukan</p>
                        </div>
                    </div>
                </div>

                <div class="p-6">
                    <?php if (empty($riwayat_izin)): ?>
                    <div class="text-center py-12">
                        <div class="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                            <i class="fas fa-inbox text-5xl text-gray-400 dark:text-gray-500"></i>
                        </div>
                        <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Belum Ada Riwayat</h4>
                        <p class="text-gray-500 dark:text-gray-400">Belum ada riwayat pengajuan izin</p>
                    </div>
                    <?php else: ?>
                    <div class="space-y-4">
                        <?php foreach ($riwayat_izin as $izin): ?>
                        <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow">
                            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                                <div class="flex items-start space-x-3">
                                    <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                                        <i class="far fa-calendar text-blue-600 dark:text-blue-400"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-gray-800 dark:text-white"><?php echo formatTanggal($izin['tanggal']); ?></h3>
                                        <p class="text-sm text-gray-600 dark:text-gray-400"><?php echo htmlspecialchars($izin['lokasi']); ?></p>
                                        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            <i class="far fa-clock"></i> Diajukan: <?php echo date('d/m/Y H:i', strtotime($izin['created_at'])); ?>
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <?php if ($izin['status'] === 'pending'): ?>
                                        <span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center space-x-2">
                                            <i class="fas fa-hourglass-half"></i>
                                            <span>Menunggu</span>
                                        </span>
                                    <?php elseif ($izin['status'] === 'approved'): ?>
                                        <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center space-x-2">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Disetujui</span>
                                        </span>
                                    <?php else: ?>
                                        <span class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center space-x-2">
                                            <i class="fas fa-times-circle"></i>
                                            <span>Ditolak</span>
                                        </span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <i class="fas fa-comment-dots"></i> Alasan:
                                </p>
                                <p class="text-sm text-gray-600 dark:text-gray-400"><?php echo htmlspecialchars($izin['alasan']); ?></p>
                            </div>

                            <?php if ($izin['status'] !== 'pending' && $izin['keterangan_admin']): ?>
                            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-3 border-l-4 border-blue-500">
                                <p class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                    <i class="fas fa-user-shield"></i> Keterangan Admin:
                                </p>
                                <p class="text-sm text-blue-600 dark:text-blue-400"><?php echo htmlspecialchars($izin['keterangan_admin']); ?></p>
                                <?php if ($izin['admin_name']): ?>
                                <p class="text-xs text-blue-500 dark:text-blue-500 mt-2">
                                    <i class="fas fa-user"></i> Oleh: <?php echo htmlspecialchars($izin['admin_name']); ?>
                                </p>
                                <?php endif; ?>
                            </div>
                            <?php endif; ?>
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