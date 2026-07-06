<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

$absensi_id = $_GET['id'] ?? 0;
$admin_id = $_SESSION['user_id'];

// Ambil data absensi
$stmt = $conn->prepare("SELECT a.*, u.nama_lengkap, jp.tanggal, jp.lokasi, jp.jam_mulai, jp.jam_selesai 
    FROM absensi a 
    JOIN users u ON a.user_id = u.id 
    JOIN jadwal_piket jp ON a.jadwal_id = jp.id 
    WHERE a.id = ? AND a.status_konfirmasi = 'pending'");
$stmt->bind_param("i", $absensi_id);
$stmt->execute();
$absensi = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$absensi) {
    $_SESSION['error'] = 'Data absensi tidak ditemukan atau sudah dikonfirmasi';
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
        
        $stmt = $conn->prepare("UPDATE absensi SET status_konfirmasi = ?, keterangan_admin = ?, approved_by = ?, approved_at = ? WHERE id = ?");
        $stmt->bind_param("ssisi", $status, $keterangan, $admin_id, $approved_at, $absensi_id);
        
        if ($stmt->execute()) {
            // Update status jadwal jika disetujui
            if ($status === 'approved') {
                $conn->query("UPDATE jadwal_piket SET status = 'completed' WHERE id = " . $absensi['jadwal_id']);
            }
            
            $_SESSION['success'] = 'Absensi berhasil ' . ($status === 'approved' ? 'disetujui' : 'ditolak');
            redirect('dashboard.php');
        } else {
            $error = 'Gagal menyimpan konfirmasi';
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
    <title>Konfirmasi Absensi</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <nav class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-xl font-bold">Konfirmasi Absensi</h1>
            <a href="dashboard.php" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">Kembali</a>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <?php if ($error): ?>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <?php echo htmlspecialchars($error); ?>
        </div>
        <?php endif; ?>

        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-2xl font-bold mb-4">Detail Absensi</h2>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <p class="text-gray-600 text-sm">Nama Petugas</p>
                    <p class="font-semibold text-lg"><?php echo htmlspecialchars($absensi['nama_lengkap']); ?></p>
                </div>
                <div>
                    <p class="text-gray-600 text-sm">Tanggal</p>
                    <p class="font-semibold text-lg"><?php echo formatTanggal($absensi['tanggal']); ?></p>
                </div>
                <div>
                    <p class="text-gray-600 text-sm">Lokasi</p>
                    <p class="font-semibold text-lg"><?php echo htmlspecialchars($absensi['lokasi']); ?></p>
                </div>
                <div>
                    <p class="text-gray-600 text-sm">Jam Jadwal</p>
                    <p class="font-semibold text-lg">
                        <?php echo substr($absensi['jam_mulai'], 0, 5); ?> - <?php echo substr($absensi['jam_selesai'], 0, 5); ?>
                    </p>
                </div>
                <div>
                    <p class="text-gray-600 text-sm">Jam Absen</p>
                    <p class="font-semibold text-lg"><?php echo date('H:i', strtotime($absensi['jam_absen'])); ?> WIB</p>
                </div>
            </div>

            <?php if ($absensi['catatan']): ?>
            <div class="bg-gray-50 p-4 rounded mb-6">
                <p class="text-sm font-semibold mb-2">Catatan dari Petugas:</p>
                <p class="text-gray-700"><?php echo htmlspecialchars($absensi['catatan']); ?></p>
            </div>
            <?php endif; ?>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="font-semibold mb-2">📸 Foto Before (Sebelum):</p>
                    <img src="../uploads/<?php echo htmlspecialchars($absensi['foto_before']); ?>" 
                        alt="Before" class="w-full rounded-lg border border-gray-300 shadow">
                </div>
                <div>
                    <p class="font-semibold mb-2">📸 Foto After (Sesudah):</p>
                    <img src="../uploads/<?php echo htmlspecialchars($absensi['foto_after']); ?>" 
                        alt="After" class="w-full rounded-lg border border-gray-300 shadow">
                </div>
            </div>
        </div>

        <!-- Form Konfirmasi -->
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-6">Form Konfirmasi</h2>
            
            <form method="POST">
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-3">
                        Keputusan <span class="text-red-500">*</span>
                    </label>
                    <div class="space-y-3">
                        <label class="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-500">
                            <input type="radio" name="status" value="approved" required class="w-5 h-5 text-green-600">
                            <span class="ml-3 font-semibold text-green-700">✓ Setujui Absensi</span>
                        </label>
                        <label class="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-500">
                            <input type="radio" name="status" value="rejected" required class="w-5 h-5 text-red-600">
                            <span class="ml-3 font-semibold text-red-700">✗ Tolak Absensi</span>
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
                        💾 Simpan Konfirmasi
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