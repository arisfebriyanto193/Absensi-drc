<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

$error = '';
$success = '';

// Ambil daftar user
$users = $conn->query("SELECT id, nama_lengkap FROM users WHERE role = 'user' ORDER BY nama_lengkap")->fetch_all(MYSQLI_ASSOC);

// Proses edit jadwal
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'edit') {
    $jadwal_id = $_POST['jadwal_id'] ?? 0;
    $user_id = $_POST['user_id'] ?? 0;
    $jam_mulai = $_POST['jam_mulai'] ?? '';
    $jam_selesai = $_POST['jam_selesai'] ?? '';
    $lokasi = trim($_POST['lokasi'] ?? '');
    
    if (empty($user_id) || empty($jam_mulai) || empty($jam_selesai) || empty($lokasi)) {
        echo json_encode(['success' => false, 'message' => 'Semua field harus diisi']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE jadwal_piket SET user_id = ?, jam_mulai = ?, jam_selesai = ?, lokasi = ? WHERE id = ?");
    $stmt->bind_param("isssi", $user_id, $jam_mulai, $jam_selesai, $lokasi, $jadwal_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Jadwal berhasil diupdate']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal mengupdate jadwal']);
    }
    $stmt->close();
    exit;
}

// Proses hapus jadwal
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'hapus') {
    $jadwal_id = $_POST['jadwal_id'] ?? 0;
    
    $check = $conn->query("SELECT COUNT(*) as count FROM absensi WHERE jadwal_id = $jadwal_id")->fetch_assoc();
    
    if ($check['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Jadwal tidak dapat dihapus karena sudah ada absensi']);
    } else {
        if ($conn->query("DELETE FROM jadwal_piket WHERE id = $jadwal_id")) {
            echo json_encode(['success' => true, 'message' => 'Jadwal berhasil dihapus']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus jadwal']);
        }
    }
    exit;
}

// FITUR BARU: Hapus semua jadwal di tanggal tertentu
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'hapus_tanggal') {
    $tanggal = $_POST['tanggal'] ?? '';
    
    if (empty($tanggal)) {
        echo json_encode(['success' => false, 'message' => 'Tanggal tidak valid']);
        exit;
    }
    
    // Cek apakah ada jadwal yang sudah punya absensi
    $check = $conn->query("SELECT COUNT(*) as count FROM jadwal_piket jp 
                          JOIN absensi a ON jp.id = a.jadwal_id 
                          WHERE jp.tanggal = '$tanggal'")->fetch_assoc();
    
    if ($check['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Tidak dapat menghapus! Ada ' . $check['count'] . ' jadwal yang sudah memiliki absensi']);
        exit;
    }
    
    // Hitung jumlah jadwal yang akan dihapus
    $count = $conn->query("SELECT COUNT(*) as count FROM jadwal_piket WHERE tanggal = '$tanggal'")->fetch_assoc();
    
    if ($count['count'] == 0) {
        echo json_encode(['success' => false, 'message' => 'Tidak ada jadwal pada tanggal tersebut']);
        exit;
    }
    
    // Hapus semua jadwal di tanggal tersebut
    if ($conn->query("DELETE FROM jadwal_piket WHERE tanggal = '$tanggal'")) {
        echo json_encode(['success' => true, 'message' => 'Berhasil menghapus ' . $count['count'] . ' jadwal pada tanggal tersebut']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal menghapus jadwal']);
    }
    exit;
}

// Ambil jadwal untuk kalender
if (isset($_GET['get_jadwal'])) {
    $bulan = $_GET['bulan'] ?? date('Y-m');
    
    $jadwal_query = "SELECT jp.*, u.nama_lengkap, 
        (SELECT COUNT(*) FROM absensi WHERE jadwal_id = jp.id) as ada_absensi
        FROM jadwal_piket jp 
        JOIN users u ON jp.user_id = u.id 
        WHERE DATE_FORMAT(jp.tanggal, '%Y-%m') = '$bulan'
        ORDER BY jp.tanggal, jp.jam_mulai";
    
    $result = $conn->query($jadwal_query);
    $jadwals = [];
    
    while ($row = $result->fetch_assoc()) {
        $jadwals[] = $row;
    }
    
    echo json_encode($jadwals);
    exit;
}

// Proses salin jadwal minggu
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'salin_minggu') {
    $tanggal_awal = $_POST['tanggal_awal'] ?? '';
    $jumlah_minggu = (int)($_POST['jumlah_minggu'] ?? 1);
    
    if (empty($tanggal_awal) || $jumlah_minggu < 1 || $jumlah_minggu > 12) {
        $error = 'Pilih tanggal awal dan jumlah minggu (1-12)';
    } else {
        $tanggal_akhir = date('Y-m-d', strtotime($tanggal_awal . ' +6 days'));
        
        $stmt = $conn->prepare("SELECT user_id, tanggal, jam_mulai, jam_selesai, lokasi 
                                FROM jadwal_piket 
                                WHERE tanggal BETWEEN ? AND ?
                                ORDER BY tanggal, jam_mulai");
        $stmt->bind_param("ss", $tanggal_awal, $tanggal_akhir);
        $stmt->execute();
        $jadwal_template = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        if (empty($jadwal_template)) {
            $error = 'Tidak ada jadwal pada minggu tersebut untuk disalin';
        } else {
            $berhasil = 0;
            
            for ($minggu = 1; $minggu <= $jumlah_minggu; $minggu++) {
                foreach ($jadwal_template as $jadwal) {
                    $tanggal_baru = date('Y-m-d', strtotime($jadwal['tanggal'] . " +{$minggu} weeks"));
                    
                    $check_stmt = $conn->prepare("SELECT id FROM jadwal_piket 
                                                  WHERE user_id = ? AND tanggal = ? 
                                                  AND jam_mulai = ? AND lokasi = ?");
                    $check_stmt->bind_param("isss", $jadwal['user_id'], $tanggal_baru, 
                                           $jadwal['jam_mulai'], $jadwal['lokasi']);
                    $check_stmt->execute();
                    $exists = $check_stmt->get_result()->num_rows > 0;
                    $check_stmt->close();
                    
                    if (!$exists) {
                        $insert_stmt = $conn->prepare("INSERT INTO jadwal_piket 
                                                      (user_id, tanggal, jam_mulai, jam_selesai, lokasi) 
                                                      VALUES (?, ?, ?, ?, ?)");
                        $insert_stmt->bind_param("issss", $jadwal['user_id'], $tanggal_baru, 
                                                $jadwal['jam_mulai'], $jadwal['jam_selesai'], 
                                                $jadwal['lokasi']);
                        if ($insert_stmt->execute()) {
                            $berhasil++;
                        }
                        $insert_stmt->close();
                    }
                }
            }
            
            if ($berhasil > 0) {
                $success = "Berhasil menyalin {$berhasil} jadwal untuk {$jumlah_minggu} minggu ke depan";
            } else {
                $error = 'Semua jadwal sudah ada, tidak ada yang disalin';
            }
        }
    }
}

// Proses tambah jadwal (MULTIPLE PETUGAS)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'tambah') {
    $user_ids = $_POST['user_id'] ?? [];
    $tanggal = $_POST['tanggal'] ?? '';
    $jam_mulai = $_POST['jam_mulai'] ?? '';
    $jam_selesai = $_POST['jam_selesai'] ?? '';
    $lokasi = trim($_POST['lokasi'] ?? '');
    
    if (empty($user_ids) || empty($tanggal) || empty($jam_mulai) || empty($jam_selesai) || empty($lokasi)) {
        $error = 'Semua field harus diisi dan pilih minimal 1 petugas';
    } else {
        $berhasil = 0;
        
        foreach ($user_ids as $user_id) {
            $stmt = $conn->prepare("INSERT INTO jadwal_piket (user_id, tanggal, jam_mulai, jam_selesai, lokasi) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("issss", $user_id, $tanggal, $jam_mulai, $jam_selesai, $lokasi);
            
            if ($stmt->execute()) {
                $berhasil++;
            }
            $stmt->close();
        }
        
        if ($berhasil > 0) {
            $success = "Berhasil menambahkan {$berhasil} jadwal piket";
        } else {
            $error = 'Gagal menambahkan jadwal';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kelola Jadwal Piket</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .calendar {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
        }
        
        .calendar-day {
            aspect-ratio: 1;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 8px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
        }
        
        .calendar-day:hover {
            border-color: #3b82f6;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
            transform: translateY(-2px);
        }
        
        .calendar-day.today {
            border-color: #10b981;
            background: #ecfdf5;
        }
        
        .calendar-day.has-schedule {
            background: #dbeafe;
            border-color: #3b82f6;
        }
        
        .calendar-day.other-month {
            opacity: 0.3;
            pointer-events: none;
        }
        
        .calendar-day-number {
            font-weight: bold;
            font-size: 14px;
        }
        
        .calendar-day-badge {
            position: absolute;
            top: 4px;
            right: 4px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }

        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background-color: white;
            padding: 2rem;
            border-radius: 0.5rem;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }

        .petugas-item {
            display: inline-flex;
            align-items: center;
            background: #3b82f6;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            margin: 0.25rem;
        }
        
        .petugas-item button {
            margin-left: 0.5rem;
            font-weight: bold;
            cursor: pointer;
        }

        .custom-select {
            position: relative;
        }

        .selected-petugas {
            min-height: 40px;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            padding: 0.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            cursor: pointer;
            background: white;
        }

        .dropdown-petugas {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            max-height: 300px;
            overflow-y: auto;
            z-index: 50;
            display: none;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin-top: 4px;
        }

        .dropdown-petugas.active {
            display: block;
        }

        .dropdown-item {
            padding: 0.75rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .dropdown-item:hover {
            background: #f3f4f6;
        }

        .dropdown-item input[type="checkbox"] {
            width: 1.25rem;
            height: 1.25rem;
        }

        .jadwal-item {
            background: white;
            border-left: 4px solid #3b82f6;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .jadwal-item:hover {
            box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        }

        .calendar-header {
            font-weight: bold;
            text-align: center;
            padding: 12px;
            background: #f3f4f6;
            border-radius: 8px;
        }
    </style>
</head>
<body class="bg-gray-100">
    <nav class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-xl font-bold"><i class="fas fa-calendar-alt"></i> Kelola Jadwal Piket</h1>
            <div class="flex gap-2">
                <a href="cek_absensi.php" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    <i class="fas fa-check-circle"></i> Cek Absensi
                </a>
                <a href="dashboard.php" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">
                    <i class="fas fa-arrow-left"></i> Kembali
                </a>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <div id="alertContainer"></div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Sidebar Forms -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Form Salin Jadwal Mingguan -->
                <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <h2 class="text-xl font-bold mb-2">
                        <i class="fas fa-sync-alt"></i> Salin Jadwal Mingguan
                    </h2>
                    <p class="text-sm text-purple-100 mb-4">Salin pola jadwal satu minggu ke minggu-minggu berikutnya</p>
                    
                    <form method="POST">
                        <input type="hidden" name="action" value="salin_minggu">
                        
                        <div class="mb-4">
                            <label class="block font-semibold mb-2 text-sm">
                                <i class="far fa-calendar"></i> Minggu Referensi (Senin)
                            </label>
                            <input type="date" name="tanggal_awal" required 
                                value="<?php echo date('Y-m-d', strtotime('monday this week')); ?>"
                                class="w-full px-3 py-2 border rounded-lg text-gray-800 text-sm">
                            <p class="text-xs text-purple-100 mt-1">Pilih hari Senin dari minggu yang akan disalin</p>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block font-semibold mb-2 text-sm">
                                <i class="fas fa-calendar-week"></i> Salin untuk Berapa Minggu?
                            </label>
                            <select name="jumlah_minggu" required 
                                class="w-full px-3 py-2 border rounded-lg text-gray-800 text-sm">
                                <option value="1">1 Minggu ke depan</option>
                                <option value="2">2 Minggu ke depan</option>
                                <option value="3">3 Minggu ke depan</option>
                                <option value="4" selected>4 Minggu ke depan (1 bulan)</option>
                                <option value="8">8 Minggu ke depan (2 bulan)</option>
                                <option value="12">12 Minggu ke depan (3 bulan)</option>
                            </select>
                        </div>
                        
                        <button type="submit" 
                            onclick="return confirm('Yakin ingin menyalin jadwal? Jadwal yang sudah ada akan dilewati.')"
                            class="w-full bg-white text-purple-600 py-2 rounded-lg font-semibold hover:bg-purple-50 text-sm transition-colors">
                            <i class="fas fa-copy"></i> Salin Jadwal
                        </button>
                    </form>
                </div>

                <!-- Form Tambah Jadwal Manual -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-xl font-bold mb-2">
                        <i class="fas fa-plus-circle"></i> Tambah Jadwal Manual
                    </h2>
                    <p class="text-sm text-gray-600 mb-4">Tambah jadwal untuk beberapa petugas sekaligus</p>
                    
                    <form method="POST" id="formTambahJadwal">
                        <input type="hidden" name="action" value="tambah">
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">
                                <i class="fas fa-users"></i> Petugas Piket <span class="text-red-500">*</span>
                            </label>
                            
                            <div class="custom-select">
                                <div class="selected-petugas" onclick="toggleDropdown()">
                                    <div id="selectedPetugasContainer">
                                        <span class="text-gray-400 text-sm">Klik untuk memilih petugas...</span>
                                    </div>
                                </div>
                                
                                <div class="dropdown-petugas" id="dropdownPetugas">
                                    <div class="p-2 border-b sticky top-0 bg-white z-10">
                                        <input type="text" id="searchPetugas" placeholder="🔍 Cari nama petugas..." 
                                            class="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            onclick="event.stopPropagation()">
                                    </div>
                                    <div id="petugasList">
                                        <?php foreach ($users as $user): ?>
                                        <label class="dropdown-item" data-nama="<?php echo strtolower($user['nama_lengkap']); ?>">
                                            <input type="checkbox" name="user_id[]" value="<?php echo $user['id']; ?>"
                                                onclick="event.stopPropagation()" onchange="updateSelectedPetugas()">
                                            <span><?php echo htmlspecialchars($user['nama_lengkap']); ?></span>
                                        </label>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">
                                <i class="fas fa-info-circle"></i> Bisa pilih lebih dari 1 petugas
                            </p>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">
                                <i class="far fa-calendar"></i> Tanggal
                            </label>
                            <input type="date" name="tanggal" required 
                                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">
                                <i class="far fa-clock"></i> Jam Mulai
                            </label>
                            <input type="time" name="jam_mulai" required 
                                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">
                                <i class="far fa-clock"></i> Jam Selesai
                            </label>
                            <input type="time" name="jam_selesai" required 
                                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">
                                <i class="fas fa-map-marker-alt"></i> Lokasi
                            </label>
                            <input type="text" name="lokasi" required placeholder="Contoh: Ruang Kelas 7A"
                                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        
                        <button type="submit" 
                            class="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm transition-colors">
                            <i class="fas fa-save"></i> Simpan Jadwal
                        </button>
                    </form>
                </div>
            </div>

            <!-- Kalender -->
            <div class="lg:col-span-3">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <!-- Navigasi Bulan -->
                    <div class="flex justify-between items-center mb-6">
                        <button onclick="prevMonth()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            <i class="fas fa-chevron-left"></i> Sebelumnya
                        </button>
                        <h2 class="text-2xl font-bold" id="currentMonth"></h2>
                        <button onclick="nextMonth()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Selanjutnya <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <!-- Header Hari -->
                    <div class="calendar mb-2">
                        <div class="calendar-header text-red-600">Min</div>
                        <div class="calendar-header">Sen</div>
                        <div class="calendar-header">Sel</div>
                        <div class="calendar-header">Rab</div>
                        <div class="calendar-header">Kam</div>
                        <div class="calendar-header">Jum</div>
                        <div class="calendar-header">Sab</div>
                    </div>

                    <!-- Kalender Grid -->
                    <div class="calendar" id="calendarGrid"></div>

                    <!-- Legend -->
                    <div class="mt-4 flex gap-4 text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 border-2 border-green-500 bg-green-50 rounded"></div>
                            <span>Hari Ini</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
                            <span>Ada Jadwal</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Detail Jadwal -->
    <div id="jadwalModal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">
                    <i class="fas fa-calendar-day"></i> <span id="modalTanggal"></span>
                </h2>
                <button onclick="closeJadwalModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div id="jadwalList" class="space-y-3 mb-4"></div>

            <div class="grid grid-cols-2 gap-2">
                <button onclick="showTambahJadwalForm()" class="bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 text-sm">
                    <i class="fas fa-plus"></i> Tambah Jadwal
                </button>
                <button onclick="hapusSemuaJadwalTanggal()" class="bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 text-sm">
                    <i class="fas fa-trash-alt"></i> Hapus Semua
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Edit Jadwal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">
                    <i class="fas fa-edit"></i> Edit Jadwal Piket
                </h2>
                <button onclick="closeEditModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <form id="formEditJadwal" onsubmit="submitEdit(event)">
                <input type="hidden" id="edit_jadwal_id">
                
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2 text-sm">
                        <i class="far fa-calendar"></i> Tanggal
                    </label>
                    <input type="text" id="edit_tanggal" readonly
                        class="w-full px-3 py-2 border rounded-lg bg-gray-100 text-sm">
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2 text-sm">
                        <i class="fas fa-user"></i> Petugas Piket <span class="text-red-500">*</span>
                    </label>
                    <select id="edit_user_id" required
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="">-- Pilih Petugas --</option>
                        <?php foreach ($users as $user): ?>
                        <option value="<?php echo $user['id']; ?>">
                            <?php echo htmlspecialchars($user['nama_lengkap']); ?>
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2 text-sm">
                        <i class="far fa-clock"></i> Jam Mulai <span class="text-red-500">*</span>
                    </label>
                    <input type="time" id="edit_jam_mulai" required
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2 text-sm">
                        <i class="far fa-clock"></i> Jam Selesai <span class="text-red-500">*</span>
                    </label>
                    <input type="time" id="edit_jam_selesai" required
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2 text-sm">
                        <i class="fas fa-map-marker-alt"></i> Lokasi <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="edit_lokasi" required placeholder="Contoh: Ruang Kelas 7A"
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                </div>
                
                <div class="flex gap-2">
                    <button type="submit" 
                        class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm transition-colors">
                        <i class="fas fa-save"></i> Simpan Perubahan
                    </button>
                    <button type="button" onclick="closeEditModal()"
                        class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 text-sm transition-colors">
                        <i class="fas fa-times"></i> Batal
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        let currentDate = new Date();
        let jadwalData = [];
        let selectedDate = null;

        // Load kalender saat halaman dimuat
        document.addEventListener('DOMContentLoaded', function() {
            loadCalendar();
        });

        function loadCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            // Update header bulan
            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                              'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
            
            // Ambil jadwal dari server
            const bulanFormat = `${year}-${String(month + 1).padStart(2, '0')}`;
            fetch(`?get_jadwal=1&bulan=${bulanFormat}`)
                .then(response => response.json())
                .then(data => {
                    jadwalData = data;
                    renderCalendar();
                });
        }

        function renderCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const prevLastDay = new Date(year, month, 0);
            
            const firstDayIndex = firstDay.getDay();
            const lastDayDate = lastDay.getDate();
            const prevLastDayDate = prevLastDay.getDate();
            
            const grid = document.getElementById('calendarGrid');
            grid.innerHTML = '';
            
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            // Hari dari bulan sebelumnya
            for (let i = firstDayIndex - 1; i >= 0; i--) {
                const day = prevLastDayDate - i;
                const div = document.createElement('div');
                div.className = 'calendar-day other-month';
                div.innerHTML = `<div class="calendar-day-number">${day}</div>`;
                grid.appendChild(div);
            }
            
            // Hari di bulan ini
            for (let day = 1; day <= lastDayDate; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const jadwalCount = jadwalData.filter(j => j.tanggal === dateStr).length;
                
                const div = document.createElement('div');
                div.className = 'calendar-day';
                
                if (dateStr === todayStr) {
                    div.classList.add('today');
                }
                
                if (jadwalCount > 0) {
                    div.classList.add('has-schedule');
                    div.innerHTML = `
                        <div class="calendar-day-number">${day}</div>
                        <div class="calendar-day-badge">${jadwalCount}</div>
                    `;
                } else {
                    div.innerHTML = `<div class="calendar-day-number">${day}</div>`;
                }
                
                div.onclick = () => showJadwalDetail(dateStr);
                grid.appendChild(div);
            }
            
            // Hari dari bulan berikutnya
            const remainingDays = 42 - (firstDayIndex + lastDayDate);
            for (let day = 1; day <= remainingDays; day++) {
                const div = document.createElement('div');
                div.className = 'calendar-day other-month';
                div.innerHTML = `<div class="calendar-day-number">${day}</div>`;
                grid.appendChild(div);
            }
        }

        function showJadwalDetail(dateStr) {
            selectedDate = dateStr;
            const jadwals = jadwalData.filter(j => j.tanggal === dateStr);
            
            // Format tanggal
            const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const date = new Date(dateStr + 'T00:00:00');
            const hariNama = hari[date.getDay()];
            const [year, month, day] = dateStr.split('-');
            const tanggalFormat = `${hariNama}, ${day}/${month}/${year}`;
            
            document.getElementById('modalTanggal').textContent = tanggalFormat;
            
            const jadwalList = document.getElementById('jadwalList');
            
            if (jadwals.length === 0) {
                jadwalList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-calendar-times text-4xl mb-2"></i>
                        <p>Tidak ada jadwal pada tanggal ini</p>
                    </div>
                `;
            } else {
                jadwalList.innerHTML = jadwals.map(j => `
                    <div class="jadwal-item">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex-1">
                                <div class="font-semibold text-lg text-gray-800">
                                    <i class="fas fa-user text-blue-500"></i>
                                    ${j.nama_lengkap}
                                </div>
                                <div class="text-sm text-gray-600 mt-1">
                                    <i class="far fa-clock text-gray-500"></i>
                                    ${j.jam_mulai.substring(0, 5)} - ${j.jam_selesai.substring(0, 5)}
                                </div>
                                <div class="text-sm text-gray-600 mt-1">
                                    <i class="fas fa-map-marker-alt text-red-500"></i>
                                    ${j.lokasi}
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="editJadwal(${j.id})" 
                                    class="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${j.ada_absensi == 0 ? `
                                    <button onclick="hapusJadwal(${j.id})" 
                                        class="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded hover:bg-red-50">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : `
                                    <span class="text-gray-400 px-3 py-1">
                                        <i class="fas fa-lock"></i>
                                    </span>
                                `}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            document.getElementById('jadwalModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeJadwalModal() {
            document.getElementById('jadwalModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // FUNGSI BARU: Hapus semua jadwal di tanggal tertentu
        function hapusSemuaJadwalTanggal() {
            const jadwals = jadwalData.filter(j => j.tanggal === selectedDate);
            
            if (jadwals.length === 0) {
                showAlert('Tidak ada jadwal untuk dihapus', 'error');
                return;
            }
            
            // Cek apakah ada yang sudah punya absensi
            const adaAbsensi = jadwals.some(j => j.ada_absensi > 0);
            
            let confirmMsg = `Yakin ingin menghapus SEMUA ${jadwals.length} jadwal pada tanggal ini?`;
            if (adaAbsensi) {
                confirmMsg = `PERINGATAN: Ada jadwal yang sudah memiliki absensi!\n\n` +
                           `Jadwal dengan absensi tidak akan dihapus.\n\n` +
                           `Lanjutkan menghapus jadwal yang belum ada absensi?`;
            }
            
            if (!confirm(confirmMsg)) return;
            
            const formData = new FormData();
            formData.append('action', 'hapus_tanggal');
            formData.append('tanggal', selectedDate);
            
            fetch('', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert(data.message, 'success');
                    closeJadwalModal();
                    loadCalendar();
                } else {
                    showAlert(data.message, 'error');
                }
            });
        }

        function editJadwal(jadwalId) {
            const jadwal = jadwalData.find(j => j.id == jadwalId);
            if (!jadwal) return;
            
            const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const date = new Date(jadwal.tanggal + 'T00:00:00');
            const hariNama = hari[date.getDay()];
            const [year, month, day] = jadwal.tanggal.split('-');
            const tanggalFormat = `${hariNama}, ${day}/${month}/${year}`;
            
            document.getElementById('edit_jadwal_id').value = jadwal.id;
            document.getElementById('edit_tanggal').value = tanggalFormat;
            document.getElementById('edit_user_id').value = jadwal.user_id;
            document.getElementById('edit_jam_mulai').value = jadwal.jam_mulai.substring(0, 5);
            document.getElementById('edit_jam_selesai').value = jadwal.jam_selesai.substring(0, 5);
            document.getElementById('edit_lokasi').value = jadwal.lokasi;
            
            closeJadwalModal();
            document.getElementById('editModal').classList.add('active');
        }

        function closeEditModal() {
            document.getElementById('editModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        function submitEdit(event) {
            event.preventDefault();
            
            const formData = new FormData();
            formData.append('action', 'edit');
            formData.append('jadwal_id', document.getElementById('edit_jadwal_id').value);
            formData.append('user_id', document.getElementById('edit_user_id').value);
            formData.append('jam_mulai', document.getElementById('edit_jam_mulai').value);
            formData.append('jam_selesai', document.getElementById('edit_jam_selesai').value);
            formData.append('lokasi', document.getElementById('edit_lokasi').value);
            
            fetch('', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert(data.message, 'success');
                    closeEditModal();
                    loadCalendar();
                } else {
                    showAlert(data.message, 'error');
                }
            });
        }

        function hapusJadwal(jadwalId) {
            if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
            
            const formData = new FormData();
            formData.append('action', 'hapus');
            formData.append('jadwal_id', jadwalId);
            
            fetch('', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert(data.message, 'success');
                    closeJadwalModal();
                    loadCalendar();
                } else {
                    showAlert(data.message, 'error');
                }
            });
        }

        function showTambahJadwalForm() {
            closeJadwalModal();
            
            // Set tanggal pada form tambah
            const form = document.getElementById('formTambahJadwal');
            const inputTanggal = form.querySelector('input[name="tanggal"]');
            inputTanggal.value = selectedDate;
            
            // Scroll ke form
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight form
            form.classList.add('ring-4', 'ring-green-500');
            setTimeout(() => {
                form.classList.remove('ring-4', 'ring-green-500');
            }, 2000);
        }

        function prevMonth() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            loadCalendar();
        }

        function nextMonth() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            loadCalendar();
        }

        function showAlert(message, type) {
            const alertContainer = document.getElementById('alertContainer');
            const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
            const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
            
            const alert = document.createElement('div');
            alert.className = `${bgColor} border px-4 py-3 rounded mb-4 flex items-center gap-2`;
            alert.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            `;
            
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alert);
            
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }

        // Dropdown Petugas Functions
        document.addEventListener('click', function(event) {
            const dropdown = document.getElementById('dropdownPetugas');
            const selectedBox = document.querySelector('.selected-petugas');
            
            if (dropdown && selectedBox && !dropdown.contains(event.target) && !selectedBox.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });

        function toggleDropdown(event) {
            if (event) event.stopPropagation();
            const dropdown = document.getElementById('dropdownPetugas');
            dropdown.classList.toggle('active');
            
            // Focus pada search input jika dropdown dibuka
            if (dropdown.classList.contains('active')) {
                setTimeout(() => {
                    document.getElementById('searchPetugas').focus();
                }, 100);
            }
        }

        function updateSelectedPetugas() {
            const checkboxes = document.querySelectorAll('input[name="user_id[]"]:checked');
            const container = document.getElementById('selectedPetugasContainer');
            
            if (checkboxes.length === 0) {
                container.innerHTML = '<span class="text-gray-400 text-sm">Klik untuk memilih petugas...</span>';
            } else {
                container.innerHTML = '';
                checkboxes.forEach(checkbox => {
                    const label = checkbox.closest('label');
                    const nama = label.querySelector('span').textContent;
                    
                    const badge = document.createElement('span');
                    badge.className = 'petugas-item';
                    badge.innerHTML = `
                        <i class="fas fa-user"></i>
                        <span>${nama}</span>
                        <button type="button" onclick="removeSelection(event, '${checkbox.value}')">&times;</button>
                    `;
                    container.appendChild(badge);
                });
            }
        }

        function removeSelection(event, userId) {
            event.stopPropagation();
            const checkbox = document.querySelector(`input[name="user_id[]"][value="${userId}"]`);
            if (checkbox) {
                checkbox.checked = false;
                updateSelectedPetugas();
            }
        }

        // Search Petugas dengan Debounce
        let searchTimeout;
        document.getElementById('searchPetugas').addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchPetugas(e.target.value);
            }, 300);
        });

        function searchPetugas(searchTerm) {
            if (!searchTerm) searchTerm = document.getElementById('searchPetugas').value;
            
            const term = searchTerm.toLowerCase().trim();
            const items = document.querySelectorAll('.dropdown-item');
            let visibleCount = 0;
            
            items.forEach(item => {
                const nama = item.getAttribute('data-nama');
                if (nama.includes(term)) {
                    item.style.display = 'flex';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Tampilkan pesan jika tidak ada hasil
            let noResultMsg = document.getElementById('noResultMsg');
            if (visibleCount === 0) {
                if (!noResultMsg) {
                    noResultMsg = document.createElement('div');
                    noResultMsg.id = 'noResultMsg';
                    noResultMsg.className = 'p-4 text-center text-gray-500 text-sm';
                    noResultMsg.innerHTML = '<i class="fas fa-search"></i> Tidak ada petugas ditemukan';
                    document.getElementById('petugasList').appendChild(noResultMsg);
                }
            } else {
                if (noResultMsg) noResultMsg.remove();
            }
        }

        // Clear search saat dropdown dibuka
        document.querySelector('.selected-petugas').addEventListener('click', function() {
            document.getElementById('searchPetugas').value = '';
            searchPetugas('');
        });

        // Close modal dengan ESC key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeJadwalModal();
                closeEditModal();
            }
        });

        // Close modal saat klik di luar
        document.getElementById('jadwalModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closeJadwalModal();
            }
        });

        document.getElementById('editModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closeEditModal();
            }
        });
    </script>
</body>
</html>