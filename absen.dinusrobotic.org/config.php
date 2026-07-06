<?php
ini_set('session.save_path', __DIR__ . '/session');
//session_start();


session_start();

// Konfigurasi Database
define('DB_HOST', 'localhost');
define('DB_USER', 'aris');
define('DB_PASS', 'Aris@022805');
define('DB_NAME', 'absen');

// Koneksi Database
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        die("Koneksi gagal: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    die("Error: " . $e->getMessage());
}

// Fungsi Helper
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

function redirect($url) {
    header("Location: $url");
    exit();
}

function uploadFoto($file, $prefix = 'foto') {
    $target_dir = "uploads/";
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0777, true);
    }

    $imageFileType = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $filename = $prefix . '_' . time() . '_' . uniqid() . '.' . $imageFileType;
    $target_file = $target_dir . $filename;

    $check = getimagesize($file["tmp_name"]);
    if ($check === false) {
        return ['success' => false, 'message' => 'File bukan gambar'];
    }

    if ($file["size"] > 5000000) {
        return ['success' => false, 'message' => 'Ukuran file terlalu besar (max 5MB)'];
    }

    if (!in_array($imageFileType, ['jpg', 'jpeg', 'png', 'heic'])) {
        return ['success' => false, 'message' => 'Format file tidak didukung'];
    }

    switch ($imageFileType) {
        case 'jpg':
        case 'jpeg':
            $source = imagecreatefromjpeg($file["tmp_name"]);
            break;
        case 'png':
            $source = imagecreatefrompng($file["tmp_name"]);
            imagepalettetotruecolor($source);
            break;
    }

    list($width, $height) = getimagesize($file["tmp_name"]);
    $max_width = 1280;
    $max_height = 1280;

    $ratio = min($max_width / $width, $max_height / $height, 1);
    $new_width = (int)($width * $ratio);
    $new_height = (int)($height * $ratio);

    $resized = imagecreatetruecolor($new_width, $new_height);
    imagecopyresampled($resized, $source, 0, 0, 0, 0, $new_width, $new_height, $width, $height);

    $success = false;
    if ($imageFileType === 'png') {
        $success = imagepng($resized, $target_file, 6);
    } else {
        $success = imagejpeg($resized, $target_file, 70);
    }

    imagedestroy($resized);
    imagedestroy($source);

    if ($success) {
        return ['success' => true, 'filename' => $filename];
    } else {
        return ['success' => false, 'message' => 'Gagal menyimpan gambar'];
    }
}

function formatTanggal($date) {
    $bulan = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    $split = explode('-', date('Y-m-d', strtotime($date)));
    return $split[2] . ' ' . $bulan[(int)$split[1]] . ' ' . $split[0];
}
//Fungsi untuk cek apakah user harus verifikasi email
function requireEmailVerification() {
    global $conn;
    
    // Skip jika belum login atau admin
    if (!isLoggedIn() || isAdmin()) {
        return;
    }
    
    $user_id = $_SESSION['user_id'];
    
    // Cek status email
    $stmt = $conn->prepare("SELECT email, status_email FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    // Halaman yang dikecualikan dari pengecekan email
    $excluded_pages = [
        'setup-email.php',
        'resend-verification.php',
        'logout.php'
    ];
    
    $current_page = basename($_SERVER['PHP_SELF']);
    
    // Jika tidak di halaman yang dikecualikan
    if (!in_array($current_page, $excluded_pages)) {
        // Jika belum ada email, redirect ke setup email
        if (empty($user['email'])) {
            redirect('setup-email.php');
        }
        // Jika email belum terverifikasi, tampilkan notifikasi
        // (tidak redirect agar user masih bisa akses sistem)
    }
}

// Fungsi untuk mendapatkan status verifikasi email
function getEmailVerificationStatus() {
    global $conn;
    
    if (!isLoggedIn() || isAdmin()) {
        return null;
    }
    
    $user_id = $_SESSION['user_id'];
    
    $stmt = $conn->prepare("SELECT email, status_email FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    return $user;
}
?>
