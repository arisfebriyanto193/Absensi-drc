<?php
require_once '../config.php';

header('Content-Type: application/json');

// Cek apakah admin
if (!isLoggedIn() || !isAdmin()) {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak. Hanya admin yang dapat membantu absen.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metode tidak valid']);
    exit;
}

$jadwal_id = $_POST['jadwal_id'] ?? '';
$catatan_admin = trim($_POST['catatan'] ?? '');
$admin_id = $_SESSION['user_id'];
$admin_nama = $_SESSION['nama_lengkap'];

// Validasi input
if (empty($jadwal_id)) {
    echo json_encode(['success' => false, 'message' => 'ID jadwal tidak valid']);
    exit;
}

// Cek apakah jadwal ada dan ambil user_id
$stmt = $conn->prepare("SELECT jp.*, u.nama_lengkap, u.username 
                        FROM jadwal_piket jp 
                        JOIN users u ON jp.user_id = u.id 
                        WHERE jp.id = ?");
$stmt->bind_param("i", $jadwal_id);
$stmt->execute();
$result = $stmt->get_result();
$jadwal = $result->fetch_assoc();
$stmt->close();

if (!$jadwal) {
    echo json_encode(['success' => false, 'message' => 'Jadwal tidak ditemukan']);
    exit;
}

$user_id = $jadwal['user_id'];

// Cek apakah sudah ada absensi
$stmt = $conn->prepare("SELECT id FROM absensi WHERE jadwal_id = ?");
$stmt->bind_param("i", $jadwal_id);
$stmt->execute();
$result = $stmt->get_result();
$sudah_absen = $result->num_rows > 0;
$stmt->close();

if ($sudah_absen) {
    echo json_encode(['success' => false, 'message' => 'Anggota ini sudah melakukan absensi']);
    exit;
}

// Buat catatan lengkap
$catatan_lengkap = "ABSENSI DIBANTU OLEH ADMIN: " . $admin_nama;
if (!empty($catatan_admin)) {
    $catatan_lengkap .= "\nCatatan: " . $catatan_admin;
}

// Buat keterangan admin
$keterangan_admin = "Absensi dibantu oleh admin " . $admin_nama;
if (!empty($catatan_admin)) {
    $keterangan_admin .= " - " . $catatan_admin;
}

// Insert absensi (tanpa foto, langsung approved)
$jam_absen = date('Y-m-d H:i:s');
$approved_at = date('Y-m-d H:i:s');

$stmt = $conn->prepare("INSERT INTO absensi 
                        (jadwal_id, user_id, jam_absen, catatan, status_konfirmasi, keterangan_admin, approved_by, approved_at) 
                        VALUES (?, ?, ?, ?, 'approved', ?, ?, ?)");
$stmt->bind_param("iisssis", 
    $jadwal_id, 
    $user_id, 
    $jam_absen, 
    $catatan_lengkap, 
    $keterangan_admin, 
    $admin_id, 
    $approved_at
);

if ($stmt->execute()) {
    $stmt->close();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Berhasil membantu absensi untuk ' . $jadwal['nama_lengkap']
    ]);
} else {
    $error = $conn->error;
    $stmt->close();
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan data absensi: ' . $error]);
}

$conn->close();
?>