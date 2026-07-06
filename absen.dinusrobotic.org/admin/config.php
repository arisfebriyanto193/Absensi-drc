<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

// Filter parameter
$filter_status = isset($_GET['status']) ? $_GET['status'] : '';
$filter_tanggal = isset($_GET['tanggal']) ? $_GET['tanggal'] : '';
$filter_user = isset($_GET['user_id']) ? $_GET['user_id'] : '';

// Query dasar
$query = "SELECT i.*, u.nama_lengkap, u.username, u.email, jp.tanggal, jp.lokasi, jp.jam_mulai, jp.jam_selesai 
          FROM izin i 
          JOIN users u ON i.user_id = u.id 
          JOIN jadwal_piket jp ON i.jadwal_id = jp.id 
          WHERE 1=1";

$params = [];

// Filter status
if (!empty($filter_status) && in_array($filter_status, ['pending', 'approved', 'rejected'])) {
    $query .= " AND i.status = ?";
    $params[] = $filter_status;
}

// Filter tanggal
if (!empty($filter_tanggal)) {
    $query .= " AND jp.tanggal = ?";
    $params[] = $filter_tanggal;
}

// Filter user
if (!empty($filter_user)) {
    $query .= " AND i.user_id = ?";
    $params[] = $filter_user;
}

$query .= " ORDER BY i.created_at DESC";

// Prepare statement
$stmt = $conn->prepare($query);
if (!empty($params)) {
    $types = str_repeat('s', count($params));
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();
$riwayat_izin = $result->fetch_all(MYSQLI_ASSOC);

// Daftar user untuk filter
$users = $conn->query("SELECT id, nama_lengkap FROM users WHERE role = 'user' ORDER BY nama_lengkap")->fetch_all(MYSQLI_ASSOC);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Izin - Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
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
        .dark-mode .shadow-lg {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
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
    <nav class="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-2xl">
        <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold flex items-center gap-2">
                        <i class="fas fa-file-medical"></i> Riwayat Izin
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
        <!-- Breadcrumb -->
        <div class="mb-6">
            <nav class="flex" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-3">
                    <li class="inline-flex items-center">
                        <a href="dashboard.php" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <i class="fas fa-home mr-2"></i>
                            Dashboard
                        </a>
                    </li>
                    <li aria-current="page">
                        <div class="flex items-center">
                            <i class="fas fa-chevron-right text-gray-400"></i>
                            <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">Riwayat Izin</span>
                        </div>
                    </li>
                </ol>
            </nav>
        </div>

        <!-- Header -->
        <div class="mb-8">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800 dark:text-white">Riwayat Pengajuan Izin</h1>
                    <p class="text-gray-600 dark:text-gray-400 mt-2">Kelola dan pantau semua pengajuan izin anggota</p>
                </div>
                <a href="dashboard.php" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Kembali ke Dashboard
                </a>
            </div>
        </div>

        <!-- Filter Section -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i class="fas fa-filter text-blue-600"></i> Filter Data
            </h2>
            <form method="GET" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status Izin</label>
                    <select name="status" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                        <option value="">Semua Status</option>
                        <option value="pending" <?php echo $filter_status === 'pending' ? 'selected' : ''; ?>>Pending</option>
                        <option value="approved" <?php echo $filter_status === 'approved' ? 'selected' : ''; ?>>Disetujui</option>
                        <option value="rejected" <?php echo $filter_status === 'rejected' ? 'selected' : ''; ?>>Ditolak</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tanggal</label>
                    <input type="date" name="tanggal" value="<?php echo htmlspecialchars($filter_tanggal); ?>" 
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
                    <select name="user_id" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                        <option value="">Semua User</option>
                        <?php foreach ($users as $user): ?>
                        <option value="<?php echo $user['id']; ?>" <?php echo $filter_user == $user['id'] ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($user['nama_lengkap']); ?>
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="md:col-span-3 flex gap-2">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                        <i class="fas fa-search"></i> Terapkan Filter
                    </button>
                    <a href="riwayat_izin.php" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                        <i class="fas fa-refresh"></i> Reset
                    </a>
                </div>
            </form>
        </div>

        <!-- Statistik Ringkas -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-100 text-sm font-semibold mb-1">Total Izin</p>
                        <p class="text-3xl font-bold"><?php echo count($riwayat_izin); ?></p>
                    </div>
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <i class="fas fa-file-medical text-2xl"></i>
                    </div>
                </div>
            </div>
            <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-orange-100 text-sm font-semibold mb-1">Pending</p>
                        <p class="text-3xl font-bold">
                            <?php 
                            $pending_count = array_reduce($riwayat_izin, function($carry, $item) {
                                return $carry + ($item['status'] === 'pending' ? 1 : 0);
                            }, 0);
                            echo $pending_count;
                            ?>
                        </p>
                    </div>
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <i class="fas fa-hourglass-half text-2xl"></i>
                    </div>
                </div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-100 text-sm font-semibold mb-1">Disetujui</p>
                        <p class="text-3xl font-bold">
                            <?php 
                            $approved_count = array_reduce($riwayat_izin, function($carry, $item) {
                                return $carry + ($item['status'] === 'approved' ? 1 : 0);
                            }, 0);
                            echo $approved_count;
                            ?>
                        </p>
                    </div>
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <i class="fas fa-check-circle text-2xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabel Riwayat Izin -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i class="fas fa-list-ul text-blue-600"></i> Daftar Pengajuan Izin
                </h2>
            </div>
            
            <?php if (empty($riwayat_izin)): ?>
            <div class="text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg font-semibold">Tidak ada data izin</p>
                <p class="text-gray-500 dark:text-gray-500 text-sm mt-2">Tidak ditemukan pengajuan izin dengan filter yang dipilih</p>
            </div>
            <?php else: ?>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tanggal</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lokasi</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Alasan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dibuat</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <?php foreach ($riwayat_izin as $izin): ?>
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-10 w-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                                        <i class="fas fa-user text-orange-600 dark:text-orange-400"></i>
                                    </div>
                                    <div class="ml-4">
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                                            <?php echo htmlspecialchars($izin['nama_lengkap']); ?>
                                        </div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">
                                            @<?php echo htmlspecialchars($izin['username']); ?>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900 dark:text-white"><?php echo formatTanggal($izin['tanggal']); ?></div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                    <?php echo substr($izin['jam_mulai'], 0, 5); ?> - <?php echo substr($izin['jam_selesai'], 0, 5); ?>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                <?php echo htmlspecialchars($izin['lokasi']); ?>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-sm text-gray-900 dark:text-white max-w-xs truncate" title="<?php echo htmlspecialchars($izin['alasan']); ?>">
                                    <?php echo htmlspecialchars($izin['alasan']); ?>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <?php
                                $badge_class = '';
                                $badge_icon = '';
                                switch ($izin['status']) {
                                    case 'pending':
                                        $badge_class = 'badge-pending';
                                        $badge_icon = 'fa-hourglass-half';
                                        break;
                                    case 'approved':
                                        $badge_class = 'badge-approved';
                                        $badge_icon = 'fa-check-circle';
                                        break;
                                    case 'rejected':
                                        $badge_class = 'badge-rejected';
                                        $badge_icon = 'fa-times-circle';
                                        break;
                                }
                                ?>
                                <span class="badge <?php echo $badge_class; ?>">
                                    <i class="fas <?php echo $badge_icon; ?>"></i>
                                    <?php 
                                    $status_text = [
                                        'pending' => 'Pending',
                                        'approved' => 'Disetujui',
                                        'rejected' => 'Ditolak'
                                    ];
                                    echo $status_text[$izin['status']];
                                    ?>
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <?php echo date('d/m/Y H:i', strtotime($izin['created_at'])); ?>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onclick="showDetailModal(<?php echo htmlspecialchars(json_encode($izin)); ?>)"
                                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                                    <i class="fas fa-eye"></i> Detail
                                </button>
                                <?php if ($izin['status'] === 'pending'): ?>
                                <button onclick="showActionModal(<?php echo htmlspecialchars(json_encode($izin)); ?>)"
                                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                                    <i class="fas fa-cog"></i> Proses
                                </button>
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

    <!-- Modal Detail -->
    <div id="detailModal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-600">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
                    <i class="fas fa-info-circle text-blue-600"></i> Detail Pengajuan Izin
                </h2>
                <button onclick="closeDetailModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            <div id="detailModalContent"></div>
        </div>
    </div>

    <!-- Modal Aksi -->
    <div id="actionModal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-600">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
                    <i class="fas fa-cog text-green-600"></i> Proses Pengajuan Izin
                </h2>
                <button onclick="closeActionModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            <div id="actionModalContent"></div>
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

        function showDetailModal(data) {
            const modal = document.getElementById('detailModal');
            const content = document.getElementById('detailModalContent');
            
            let statusBadge = '';
            let statusColor = '';
            let statusIcon = '';
            
            switch(data.status) {
                case 'pending':
                    statusBadge = 'badge-pending';
                    statusColor = 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
                    statusIcon = 'fa-hourglass-half';
                    break;
                case 'approved':
                    statusBadge = 'badge-approved';
                    statusColor = 'text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-300';
                    statusIcon = 'fa-check-circle';
                    break;
                case 'rejected':
                    statusBadge = 'badge-rejected';
                    statusColor = 'text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-300';
                    statusIcon = 'fa-times-circle';
                    break;
            }
            
            content.innerHTML = `
                <div class="space-y-6">
                    <!-- Info Pemohon -->
                    <div class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
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

                    <!-- Status -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <i class="fas fa-info-circle"></i> Status
                        </div>
                        <div class="font-bold ${statusColor} px-3 py-1 rounded-full text-sm inline-flex items-center gap-2">
                            <i class="fas ${statusIcon}"></i>
                            ${data.status === 'pending' ? 'Pending' : data.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                        </div>
                    </div>

                    <!-- Alasan Izin -->
                    <div class="bg-orange-50 dark:bg-orange-900 border-l-4 border-orange-400 rounded-lg p-4">
                        <div class="font-bold text-gray-800 dark:text-white mb-2">
                            <i class="fas fa-comment-medical"></i> Alasan Izin:
                        </div>
                        <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">${data.alasan}</p>
                    </div>

                    <!-- Keterangan Admin -->
                    ${data.keterangan_admin ? `
                    <div class="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-400 rounded-lg p-4">
                        <div class="font-bold text-gray-800 dark:text-white mb-2">
                            <i class="fas fa-sticky-note"></i> Keterangan Admin:
                        </div>
                        <p class="text-gray-700 dark:text-gray-300">${data.keterangan_admin}</p>
                    </div>
                    ` : ''}

                    <!-- Timestamps -->
                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            <strong>Dibuat:</strong><br>
                            ${new Date(data.created_at).toLocaleString('id-ID')}
                        </div>
                        ${data.updated_at && data.updated_at !== data.created_at ? `
                        <div>
                            <strong>Diperbarui:</strong><br>
                            ${new Date(data.updated_at).toLocaleString('id-ID')}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function showActionModal(data) {
            const modal = document.getElementById('actionModal');
            const content = document.getElementById('actionModalContent');
            
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
                                class="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors">
                                <i class="fas fa-times-circle"></i> Tolak
                            </button>
                            <button type="submit"
                                class="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors">
                                <i class="fas fa-check-circle"></i> Setujui
                            </button>
                        </div>
                    </div>
                </form>
            `;
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeDetailModal() {
            document.getElementById('detailModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        function closeActionModal() {
            document.getElementById('actionModal').classList.remove('active');
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
                closeDetailModal();
                closeActionModal();
            }
        });

        // Close modal saat klik di luar
        document.getElementById('detailModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closeDetailModal();
            }
        });

        document.getElementById('actionModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closeActionModal();
            }
        });
    </script>
</body>
</html>