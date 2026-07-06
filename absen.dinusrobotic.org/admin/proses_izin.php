<?php
require_once '../config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../vendor/autoload.php';

header('Content-Type: application/json');

// Cek apakah admin
if (!isLoggedIn() || !isAdmin()) {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak. Hanya admin yang dapat memproses izin.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metode tidak valid']);
    exit;
}

$izin_id = $_POST['izin_id'] ?? '';
$action = $_POST['action'] ?? ''; // approve atau reject
$keterangan_admin = trim($_POST['keterangan'] ?? '');
$admin_id = $_SESSION['user_id'];
$admin_nama = $_SESSION['nama_lengkap'];

// Validasi input
if (empty($izin_id) || empty($action)) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit;
}

if (!in_array($action, ['approve', 'reject'])) {
    echo json_encode(['success' => false, 'message' => 'Aksi tidak valid']);
    exit;
}

// Ambil data izin dan user
$stmt = $conn->prepare("SELECT i.*, u.nama_lengkap, u.username, u.email, jp.tanggal, jp.jam_mulai, jp.jam_selesai, jp.lokasi 
                        FROM izin i 
                        JOIN users u ON i.user_id = u.id 
                        JOIN jadwal_piket jp ON i.jadwal_id = jp.id 
                        WHERE i.id = ?");
$stmt->bind_param("i", $izin_id);
$stmt->execute();
$result = $stmt->get_result();
$izin = $result->fetch_assoc();
$stmt->close();

if (!$izin) {
    echo json_encode(['success' => false, 'message' => 'Data izin tidak ditemukan']);
    exit;
}

// Cek apakah izin sudah diproses
if ($izin['status'] !== 'pending') {
    echo json_encode(['success' => false, 'message' => 'Izin ini sudah diproses sebelumnya']);
    exit;
}

$conn->begin_transaction();

try {
    $approved_at = date('Y-m-d H:i:s');
    
    if ($action === 'approve') {
        // Update status izin menjadi approved
        $stmt = $conn->prepare("UPDATE izin SET 
                                status = 'approved', 
                                keterangan_admin = ?, 
                                approved_by = ?, 
                                approved_at = ? 
                                WHERE id = ?");
        $stmt->bind_param("sisi", $keterangan_admin, $admin_id, $approved_at, $izin_id);
        $stmt->execute();
        $stmt->close();
        
        // Cek apakah sudah ada absensi untuk jadwal ini
        $stmt = $conn->prepare("SELECT id FROM absensi WHERE jadwal_id = ?");
        $stmt->bind_param("i", $izin['jadwal_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $sudah_absen = $result->num_rows > 0;
        $stmt->close();
        
        if ($sudah_absen) {
            throw new Exception('Jadwal ini sudah memiliki absensi');
        }
        
        // Buat catatan absensi
        $catatan_absensi = "IZIN DISETUJUI OLEH ADMIN: " . $admin_nama . "\n";
        $catatan_absensi .= "Alasan Izin: " . $izin['alasan'];
        if (!empty($keterangan_admin)) {
            $catatan_absensi .= "\nKeterangan Admin: " . $keterangan_admin;
        }
        
        // Insert absensi otomatis
        $jam_absen = date('Y-m-d H:i:s');
        $keterangan_absensi = "Absensi otomatis dari izin yang disetujui";
        
        $stmt = $conn->prepare("INSERT INTO absensi 
                                (jadwal_id, user_id, jam_absen, catatan, status_konfirmasi, keterangan_admin, approved_by, approved_at) 
                                VALUES (?, ?, ?, ?, 'approved', ?, ?, ?)");
        $stmt->bind_param("iisssis", 
            $izin['jadwal_id'], 
            $izin['user_id'], 
            $jam_absen, 
            $catatan_absensi,
            $keterangan_absensi,
            $admin_id, 
            $approved_at
        );
        $stmt->execute();
        $stmt->close();
        
        $conn->commit();

        // Kirim email notifikasi ke user
        kirimEmailIzin(
            $izin['email'],
            $izin['nama_lengkap'],
            "Izin Anda Telah Disetujui",
            "Halo {$izin['nama_lengkap']},<br><br>
            Permohonan izin Anda untuk jadwal piket tanggal <b>{$izin['tanggal']}</b> di lokasi <b>{$izin['lokasi']}</b> 
            telah <b>disetujui</b> oleh admin <b>{$admin_nama}</b>.<br><br>
            <b>Alasan Izin:</b> {$izin['alasan']}<br>
            <b>Keterangan Admin:</b> {$keterangan_admin}<br><br>
            Salam,<br>Admin Piket"
        );

        echo json_encode([
            'success' => true, 
            'message' => 'Izin berhasil disetujui, absensi dicatat, dan email telah dikirim ke user.'
        ]);

    } else {
        // REJECT
        $keterangan_reject = empty($keterangan_admin) ? 'Izin ditolak' : $keterangan_admin;
        
        $stmt = $conn->prepare("UPDATE izin SET 
                                status = 'rejected', 
                                keterangan_admin = ?, 
                                approved_by = ?, 
                                approved_at = ? 
                                WHERE id = ?");
        $stmt->bind_param("sisi", $keterangan_reject, $admin_id, $approved_at, $izin_id);
        $stmt->execute();
        $stmt->close();
        
        $conn->commit();

        // Kirim email notifikasi ke user
        kirimEmailIzin(
            $izin['email'],
            $izin['nama_lengkap'],
            "Izin Anda Ditolak",
            "Halo {$izin['nama_lengkap']},<br><br>
            Permohonan izin Anda untuk jadwal piket tanggal <b>{$izin['tanggal']}</b> di lokasi <b>{$izin['lokasi']}</b> 
            telah <b>ditolak</b> oleh admin <b>{$admin_nama}</b>.<br><br>
            <b>Alasan Izin:</b> {$izin['alasan']}<br>
            <b>Keterangan Admin:</b> {$keterangan_reject}<br><br>
            Salam,<br>Admin Piket"
        );

        echo json_encode([
            'success' => true, 
            'message' => 'Izin berhasil ditolak dan email telah dikirim ke user.'
        ]);
    }
    
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Gagal memproses izin: ' . $e->getMessage()]);
}

$conn->close();


// ======================
// FUNCTION: KIRIM EMAIL
// ======================
function kirimEmailIzin($to, $nama, $subject, $bodyHtml) {
    $mail = new PHPMailer(true);
    try {
        // Konfigurasi SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';  // ubah sesuai SMTP server kamu
        $mail->SMTPAuth = true;
        $mail->Username = 'dinusrobotic@gmail.com'; // email pengirim
        $mail->Password = 'nhem ptdm ivqx lqjq';   // gunakan App Password jika Gmail
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        
        // Pengirim & penerima
        $mail->setFrom('youremail@gmail.com', 'Admin Piket');
        $mail->addAddress($to, $nama);
        
        // Konten email
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $bodyHtml;
        $mail->AltBody = strip_tags($bodyHtml);
        
        $mail->send();
    } catch (Exception $e) {
        error_log("Gagal kirim email ke {$to}: {$mail->ErrorInfo}");
    }
}
?>
