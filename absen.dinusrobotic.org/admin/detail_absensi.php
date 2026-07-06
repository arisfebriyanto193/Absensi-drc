<?php
require_once '../config.php';
if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Get absensi detail
$sql = "SELECT 
            a.*, 
            u.nama_lengkap AS nama_user, 
            u.email AS email_user,
            j.tanggal AS tanggal_jadwal, 
            j.jam_mulai, 
            j.jam_selesai,
            j.lokasi,
            adm.nama_lengkap AS approved_by_name
        FROM absensi a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN jadwal_piket j ON a.jadwal_id = j.id
        LEFT JOIN users adm ON a.approved_by = adm.id
        WHERE a.id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    redirect('riwayat_absensi.php');
}

$data = $result->fetch_assoc();

// Handle status update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $status = $_POST['action'] === 'approve' ? 'approved' : 'rejected';
    $keterangan = $_POST['keterangan'] ?? '';
    $admin_id = $_SESSION['user_id'];
    
    $update_sql = "UPDATE absensi SET 
                       status_konfirmasi = ?, 
                       keterangan_admin = ?, 
                       approved_by = ?, 
                       approved_at = NOW() 
                   WHERE id = ?";
    
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param('ssii', $status, $keterangan, $admin_id, $id);
    
    if ($update_stmt->execute()) {
        $_SESSION['success'] = 'Status absensi berhasil diupdate';
        redirect("detail_absensi.php?id=$id");
    }
}
?>


<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Absensi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-file-alt text-blue-600"></i> Detail Absensi
                    </h1>
                    <a href="riwayat-absensi.php" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-arrow-left"></i> Kembali
                    </a>
                </div>
            </div>
        </header>

        <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <?php if (isset($_SESSION['success'])): ?>
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <?= $_SESSION['success']; unset($_SESSION['success']); ?>
                </div>
            <?php endif; ?>

            <!-- Status Badge -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900 mb-2">Status Absensi</h2>
                        <?php
                        $status_config = [
                            'pending' => ['bg' => 'bg-yellow-100', 'text' => 'text-yellow-800', 'icon' => 'fa-clock'],
                            'approved' => ['bg' => 'bg-green-100', 'text' => 'text-green-800', 'icon' => 'fa-check-circle'],
                            'rejected' => ['bg' => 'bg-red-100', 'text' => 'text-red-800', 'icon' => 'fa-times-circle']
                        ];
                        $config = $status_config[$data['status_konfirmasi']];
                        ?>
                        <span class="px-4 py-2 inline-flex items-center text-lg font-semibold rounded-full <?= $config['bg'] ?> <?= $config['text'] ?>">
                            <i class="fas <?= $config['icon'] ?> mr-2"></i>
                            <?= ucfirst($data['status_konfirmasi']) ?>
                        </span>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500">ID Absensi</div>
                        <div class="text-2xl font-bold text-gray-900">#<?= str_pad($data['id'], 5, '0', STR_PAD_LEFT) ?></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Informasi User -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fas fa-user text-blue-600 mr-2"></i> Informasi User
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <label class="text-sm text-gray-500">Nama</label>
                            <p class="text-gray-900 font-medium"><?= htmlspecialchars($data['nama_user']) ?></p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">Email</label>
                            <p class="text-gray-900"><?= htmlspecialchars($data['email_user']) ?></p>
                        </div>
                    </div>
                </div>

                <!-- Informasi Waktu -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fas fa-clock text-blue-600 mr-2"></i> Informasi Waktu
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <label class="text-sm text-gray-500">Tanggal Absen</label>
                            <p class="text-gray-900 font-medium"><?= date('d F Y', strtotime($data['jam_absen'])) ?></p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">Jam Absen</label>
                            <p class="text-gray-900 font-medium"><?= date('H:i:s', strtotime($data['jam_absen'])) ?> WIB</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">Dibuat Pada</label>
                            <p class="text-gray-900"><?= date('d/m/Y H:i', strtotime($data['created_at'])) ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Informasi Jadwal -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-calendar text-blue-600 mr-2"></i> Informasi Jadwal
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="text-sm text-gray-500">Tanggal Jadwal</label>
                        <p class="text-gray-900 font-medium"><?= date('d F Y', strtotime($data['tanggal_jadwal'])) ?></p>
                    </div>
                    <div>
                        <label class="text-sm text-gray-500">Jam Mulai</label>
                        <p class="text-gray-900 font-medium"><?= substr($data['jam_mulai'], 0, 5) ?> WIB</p>
                    </div>
                    <div>
                        <label class="text-sm text-gray-500">Jam Selesai</label>
                        <p class="text-gray-900 font-medium"><?= substr($data['jam_selesai'], 0, 5) ?> WIB</p>
                    </div>
                    <?php if ($data['lokasi']): ?>
                    <div class="md:col-span-3">
                        <label class="text-sm text-gray-500">Lokasi</label>
                        <p class="text-gray-900"><?= htmlspecialchars($data['lokasi']) ?></p>
                    </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Catatan User -->
            <?php if ($data['catatan']): ?>
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-sticky-note text-blue-600 mr-2"></i> Catatan User
                </h3>
                <p class="text-gray-700 bg-gray-50 p-4 rounded"><?= nl2br(htmlspecialchars($data['catatan'])) ?></p>
            </div>
            <?php endif; ?>

            <!-- Foto Absensi -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-images text-blue-600 mr-2"></i> Foto Absensi
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <?php if ($data['foto_before']): ?>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Foto Before</label>
                        <a href="../uploads/<?= $data['foto_before'] ?>" target="_blank">
                            <img src="../uploads/<?= $data['foto_before'] ?>" 
                                 alt="Foto Before" 
                                 class="w-full h-64 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition cursor-pointer">
                        </a>
                    </div>
                    <?php else: ?>
                    <div class="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                        <div class="text-center text-gray-400">
                            <i class="fas fa-image text-4xl mb-2"></i>
                            <p>Tidak ada foto before</p>
                        </div>
                    </div>
                    <?php endif; ?>

                    <?php if ($data['foto_after']): ?>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Foto After</label>
                        <a href="../uploads/<?= $data['foto_after'] ?>" target="_blank">
                            <img src="../uploads/<?= $data['foto_after'] ?>" 
                                 alt="Foto After" 
                                 class="w-full h-64 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition cursor-pointer">
                        </a>
                    </div>
                    <?php else: ?>
                    <div class="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                        <div class="text-center text-gray-400">
                            <i class="fas fa-image text-4xl mb-2"></i>
                            <p>Tidak ada foto after</p>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Informasi Approval -->
            <?php if ($data['status_konfirmasi'] !== 'pending'): ?>
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-user-shield text-blue-600 mr-2"></i> Informasi Approval
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm text-gray-500">Disetujui/Ditolak Oleh</label>
                        <p class="text-gray-900 font-medium"><?= htmlspecialchars($data['approved_by_name'] ?? 'N/A') ?></p>
                    </div>
                    <div>
                        <label class="text-sm text-gray-500">Tanggal Approval</label>
                        <p class="text-gray-900 font-medium"><?= $data['approved_at'] ? date('d/m/Y H:i', strtotime($data['approved_at'])) : 'N/A' ?></p>
                    </div>
                    <?php if ($data['keterangan_admin']): ?>
                    <div class="md:col-span-2">
                        <label class="text-sm text-gray-500">Keterangan Admin</label>
                        <p class="text-gray-700 bg-gray-50 p-4 rounded mt-2"><?= nl2br(htmlspecialchars($data['keterangan_admin'])) ?></p>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            <?php endif; ?>

            <!-- Action Buttons -->
            <?php if ($data['status_konfirmasi'] === 'pending'): ?>
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Aksi</h3>
                <form method="POST" id="actionForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Keterangan (Opsional)</label>
                        <textarea name="keterangan" rows="3" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Tambahkan keterangan..."></textarea>
                    </div>
                    <div class="flex gap-3">
                        <button type="submit" name="action" value="approve" 
                                class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                                onclick="return confirm('Apakah Anda yakin ingin menyetujui absensi ini?')">
                            <i class="fas fa-check mr-2"></i> Setujui
                        </button>
                        <button type="submit" name="action" value="reject" 
                                class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                                onclick="return confirm('Apakah Anda yakin ingin menolak absensi ini?')">
                            <i class="fas fa-times mr-2"></i> Tolak
                        </button>
                    </div>
                </form>
            </div>
            <?php endif; ?>
        </main>
    </div>

    <script>
        // Preview gambar saat diklik
        document.querySelectorAll('img[alt^="Foto"]').forEach(img => {
            img.addEventListener('click', function(e) {
                e.preventDefault();
                window.open(this.src, '_blank', 'width=800,height=600');
            });
        });
    </script>
</body>
</html>