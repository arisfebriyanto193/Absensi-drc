<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

$izin_id = $_GET['id'] ?? 0;
$admin_id = $_SESSION['user_id'];

// Ambil data izin
$stmt = $conn->prepare("SELECT i.*, u.nama_lengkap, jp.tanggal, jp.lokasi, jp.jam_mulai, jp.jam_selesai 
    FROM izin i 
    JOIN users u ON i.user_id = u.id 
    JOIN jadwal_piket jp ON i.jadwal_id = jp.id 
    WHERE i.id = ? AND i.status = 'pending'");
$stmt->bind_param("i", $izin_id);
$stmt->execute();
$izin = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$izin) {
    $_SESSION['error'] = 'Data izin tidak ditemukan atau sudah diproses';
    redirect('dashboard.php');
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $status = $_POST['status'] ?? '';
    $keterangan = trim($_POST['keterangan'] ?? '');
    
    if (!in_array($status, ['approved', 'rejected'])) {
        $error = 'Status tidak valid';
    } else {
        $approved_at = date('Y-m-d H:i:s');
        
        $stmt = $conn->prepare("UPDATE izin SET status = ?, keterangan_admin = ?, approved_by = ?, approved_at = ? WHERE id = ?");
        $stmt->bind_param("ssisi", $status, $keterangan, $admin_id, $approved_at, $izin_id);
        
        if ($stmt->execute()) {
            // Update status jadwal jika disetujui
            if ($status === 'approved') {
                $conn->query("UPDATE jadwal_piket SET status = 'cancelled' WHERE id = " . $izin['jadwal_id']);
            }
            
            $_SESSION['success'] = 'Pengajuan izin berhasil ' . ($status === 'approved' ? 'disetujui' : 'ditolak');
            redirect('dashboard.php');
        } else {
            $error = 'Gagal menyimpan persetujuan';
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
    <title>Konfirmasi Izin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <nav class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-xl font-bold">Konfirmasi Pengajuan Izin</h1>
            <a href="dashboard.php" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">Kembali</a>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8 max-w-3xl">
        <?php if ($error): ?>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <?php echo htmlspecialchars($error); ?>
        </div>
        <?php endif; ?>

        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-2xl font-bold mb-4">Detail Pengajuan Izin</h2>
            
            <div class="space-y-4 mb-6">
                <div class="flex justify-between border-b pb-3">
                    <span class="text-gray-600">Nama Petugas:</span>
                    <span class="font-semibold"><?php echo htmlspecialchars($izin['nama_lengkap']); ?></span>
                </div>
                <div class="flex justify-between border-b pb-3">
                    <span class="text-gray-600">Tanggal Piket:</span>
                    <span class="font-semibold"><?php echo formatTanggal($izin['tanggal']); ?></span>
                </div>
                <div class="flex justify-between border-b pb-3">
                    <span class="text-gray-600">Lokasi:</span>
                    <span class="font-semibold"><?php echo htmlspecialchars($izin['lokasi']); ?></span>
                </div>
                <div class="flex justify-between border-b pb-3">
                    <span class="text-gray-600">Jam Jadwal:</span>
                    <span class="font-semibold">
                        <?php echo substr($izin['jam_mulai'], 0, 5); ?> - <?php echo substr($izin['jam_selesai'], 0, 5); ?> WIB
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Tanggal Pengajuan:</span>
                    <span class="font-semibold"><?php echo date('d/m/Y H:i', strtotime($izin['created_at'])); ?></span>
                </div>
            </div>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p class="text-sm font-semibold text-yellow-800 mb-2">📝 Alasan Izin:</p>
                <p class="text-gray-700"><?php echo nl2br(htmlspecialchars($izin['alasan'])); ?></p>
            </div>
        </div>

        <!-- Form Konfirmasi -->
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-6">Form Persetujuan</h2>
            
            <form method="POST">
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-3">
                        Keputusan <span class="text-red-500">*</span>
                    </label>
                    <div class="space-y-3">
                        <label class="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-500">
                            <input type="radio" name="status" value="approved" required class="w-5 h-5 text-green-600">
                            <div class="ml-3">
                                <span class="font-semibold text-green-700 block">✓ Setujui Izin</span>
                                <span class="text-sm text-gray-600">Petugas tidak perlu piket pada jadwal ini</span>
                            </div>
                        </label>
                        <label class="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-500">
                            <input type="radio" name="status" value="rejected" required class="w-5 h-5 text-red-600">
                            <div class="ml-3">
                                <span class="font-semibold text-red-700 block">✗ Tolak Izin</span>
                                <span class="text-sm text-gray-600">Petugas tetap harus melaksanakan piket</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">
                        Keterangan (Opsional)
                    </label>
                    <textarea name="keterangan" rows="4"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tambahkan keterangan jika diperlukan..."></textarea>
                </div>

                <div class="flex gap-4">
                    <button type="submit" 
                        class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                        💾 Simpan Persetujuan
                    </button>
                    <a href="dashboard.php" 
                        class="flex-1 bg-gray-300 text-gray-700 text-center py-3 rounded-lg font-semibold hover:bg-gray-400 transition">
                        Batal
                    </a>
                </div>
            </form>
        </div>
    </div>
</body>
</html>