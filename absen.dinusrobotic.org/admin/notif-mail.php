<?php
/**
 * Script Cron Job untuk mengirim notifikasi email jadwal piket HARI INI
 * Jalankan setiap hari jam 8 pagi dengan crontab:
 * 0 8 * * * /usr/bin/php /path/to/send_daily_notification.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../vendor/autoload.php'; // PHPMailer autoload

// Atur timezone ke WIB (Asia/Jakarta)
date_default_timezone_set('Asia/Jakarta');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Log file untuk debugging
$log_file = __DIR__ . '/logs/email_notification.log';
if (!file_exists(dirname($log_file))) {
    mkdir(dirname($log_file), 0755, true);
}

function writeLog($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message\n", FILE_APPEND);
}

writeLog("=== START DAILY EMAIL NOTIFICATION ===");

// Konfigurasi Email
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'dinusrobotic@gmail.com');
define('SMTP_PASSWORD', 'nhem ptdm ivqx lqjq');
define('SMTP_FROM_EMAIL', 'dinusrobotic@gmail.com');
define('SMTP_FROM_NAME', 'Sistem Jadwal Piket');

/**
 * Fungsi untuk membuat instance PHPMailer
 */
function createMailer() {
    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USERNAME;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';
        
        // Sender
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        
        return $mail;
    } catch (Exception $e) {
        writeLog("Error creating mailer: " . $e->getMessage());
        return null;
    }
}

/**
 * Fungsi untuk mengirim email notifikasi jadwal hari ini
 */
function sendDailyNotification($email, $nama, $jadwals) {
    $mail = createMailer();
    if (!$mail) return false;
    
    try {
        // Recipient
        $mail->addAddress($email, $nama);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = '📅 Jadwal Piket Anda Hari Ini - ' . date('d/m/Y');
        
        // Format tanggal Indonesia
        $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        $today = date('Y-m-d');
        $timestamp = strtotime($today);
        $hari_nama = $hari[date('w', $timestamp)];
        $tanggal_format = date('d', $timestamp) . ' ' . $bulan[date('n', $timestamp)] . ' ' . date('Y', $timestamp);
        
        // Build jadwal list HTML
        $jadwal_html = '';
        foreach ($jadwals as $idx => $jadwal) {
            $jam_mulai = substr($jadwal['jam_mulai'], 0, 5);
            $jam_selesai = substr($jadwal['jam_selesai'], 0, 5);
            $no = $idx + 1;
            
            $jadwal_html .= "
            <div style='background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;'>
                <div style='font-weight: bold; color: #667eea; margin-bottom: 8px;'>
                    Shift {$no}
                </div>
                <div style='display: flex; padding: 5px 0;'>
                    <div style='min-width: 80px; color: #6c757d;'>🕐 Waktu:</div>
                    <div style='font-weight: bold;'>{$jam_mulai} - {$jam_selesai} WIB</div>
                </div>
                <div style='display: flex; padding: 5px 0;'>
                    <div style='min-width: 80px; color: #6c757d;'>📍 Lokasi:</div>
                    <div>{$jadwal['lokasi']}</div>
                </div>
            </div>
            ";
        }
        
        // Email Body (HTML)
        $mail->Body = "
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0; 
                }
                .header h1 { margin: 0; font-size: 24px; }
                .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .alert { 
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                    color: white;
                    padding: 20px; 
                    margin: 20px 0; 
                    border-radius: 8px; 
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                }
                .date-badge {
                    background: #fff;
                    color: #667eea;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 20px 0;
                    font-size: 18px;
                    font-weight: bold;
                    border: 2px solid #667eea;
                }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; padding-top: 20px; border-top: 1px solid #dee2e6; }
                .btn { 
                    display: inline-block; 
                    padding: 15px 35px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white !important; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    margin: 20px 0;
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                .checklist {
                    background: #e8f5e9;
                    border-left: 4px solid #4caf50;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .checklist-item {
                    padding: 5px 0;
                    color: #2e7d32;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>📋 Notifikasi Jadwal Piket</h1>
                </div>
                <div class='content'>
                    <p style='font-size: 16px;'>Selamat pagi <strong>{$nama}</strong>,</p>
                    
                    <div class='alert'>
                        ⏰ Anda memiliki jadwal piket HARI INI!
                    </div>
                    
                    <div class='date-badge'>
                        📅 {$hari_nama}, {$tanggal_format}
                    </div>
                    
                    <h2 style='color: #667eea; margin-top: 30px;'>🗓️ Detail Jadwal Anda:</h2>
                    
                    {$jadwal_html}
                    
                    <div class='checklist'>
                        <h3 style='margin-top: 0; color: #2e7d32;'>✅ Checklist Persiapan:</h3>
                        <div class='checklist-item'>✓ Datang <strong>15 menit</strong> sebelum jadwal dimulai</div>
                        <div class='checklist-item'>✓ Lakukan <strong>absensi</strong> saat tiba di lokasi</div>
                        <div class='checklist-item'>✓ Bawa perlengkapan piket yang diperlukan</div>
                        <div class='checklist-item'>✓ Pastikan area piket <strong>bersih dan rapi</strong> setelah selesai</div>
                        <div class='checklist-item'>✓ Konfirmasi dengan petugas shift sebelumnya (jika ada)</div>
                    </div>
                    
                    <center>
                        <a href='" . getBaseUrl() . "' class='btn'>🔐 Login Sistem Absensi</a>
                    </center>
                    
                    <div class='footer'>
                        <p><strong>Sistem Jadwal Piket Otomatis</strong></p>
                        <p>Email ini dikirim secara otomatis setiap pagi untuk petugas yang bertugas hari ini.<br>
                        Mohon tidak membalas email ini.</p>
                        <p style='margin-top: 10px; color: #999; font-size: 11px;'>
                            Dikirim pada " . date('d/m/Y H:i') . " WIB
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        ";
        
        // Plain text alternative
        $jadwal_text = '';
        foreach ($jadwals as $idx => $jadwal) {
            $no = $idx + 1;
            $jam_mulai = substr($jadwal['jam_mulai'], 0, 5);
            $jam_selesai = substr($jadwal['jam_selesai'], 0, 5);
            $jadwal_text .= "\nShift $no:\n";
            $jadwal_text .= "  Waktu: {$jam_mulai} - {$jam_selesai} WIB\n";
            $jadwal_text .= "  Lokasi: {$jadwal['lokasi']}\n";
        }
        
        $mail->AltBody = "
NOTIFIKASI JADWAL PIKET

Selamat pagi $nama,

Anda memiliki jadwal piket HARI INI!

Tanggal: $hari_nama, $tanggal_format

DETAIL JADWAL:
{$jadwal_text}

CHECKLIST PERSIAPAN:
✓ Datang 15 menit sebelum jadwal dimulai
✓ Lakukan absensi saat tiba di lokasi
✓ Bawa perlengkapan piket yang diperlukan
✓ Pastikan area piket bersih dan rapi setelah selesai
✓ Konfirmasi dengan petugas shift sebelumnya (jika ada)

Terima kasih atas dedikasi Anda!

---
Email ini dikirim secara otomatis oleh Sistem Jadwal Piket.
        ";
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        writeLog("Error sending email to $email: " . $mail->ErrorInfo);
        return false;
    }
}

/**
 * Fungsi helper untuk mendapatkan base URL
 */
function getBaseUrl() {
    // Untuk production, ganti dengan URL sebenarnya
    return 'https://absen.dinusrobotic.org'; // GANTI SESUAI DOMAIN ANDA
}

// MAIN PROCESS
try {
    $today = date('Y-m-d');
    writeLog("Mencari jadwal untuk tanggal: $today");
    
    // Query untuk mengambil semua jadwal HARI INI yang belum dikirim notifikasi
    $query = "SELECT 
                jp.id,
                jp.user_id,
                jp.tanggal,
                jp.jam_mulai,
                jp.jam_selesai,
                jp.lokasi,
                u.nama_lengkap,
                u.email
              FROM jadwal_piket jp
              INNER JOIN users u ON jp.user_id = u.id
              WHERE jp.tanggal = ?
              AND u.email IS NOT NULL 
              AND u.email != ''
        ORDER BY u.id, jp.jam_mulai";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Group jadwal berdasarkan user
    $users_jadwal = [];
    while ($row = $result->fetch_assoc()) {
        $user_id = $row['user_id'];
        
        if (!isset($users_jadwal[$user_id])) {
            $users_jadwal[$user_id] = [
                'nama' => $row['nama_lengkap'],
                'email' => $row['email'],
                'jadwals' => []
            ];
        }
        
        $users_jadwal[$user_id]['jadwals'][] = [
            'id' => $row['id'],
            'jam_mulai' => $row['jam_mulai'],
            'jam_selesai' => $row['jam_selesai'],
            'lokasi' => $row['lokasi']
        ];
    }
    
    $stmt->close();
    
    $total_users = count($users_jadwal);
    writeLog("Ditemukan $total_users petugas yang bertugas hari ini");
    
    if ($total_users == 0) {
        writeLog("Tidak ada jadwal hari ini. Proses selesai.");
        writeLog("=== END DAILY EMAIL NOTIFICATION ===\n");
        $conn->close();
        exit;
    }
    
    $success_count = 0;
    $failed_count = 0;
    
    foreach ($users_jadwal as $user_id => $data) {
        // Cek apakah sudah pernah dikirim hari ini
        $check_stmt = $conn->prepare("SELECT COUNT(*) as count FROM email_log 
                                       WHERE user_id = ? 
                                       AND DATE(sent_at) = ? 
                                       AND status = 'sent'");
        $check_stmt->bind_param("is", $user_id, $today);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result()->fetch_assoc();
        $check_stmt->close();
        
        if ($check_result['count'] > 0) {
            writeLog("⏭️  Email untuk {$data['nama']} ({$data['email']}) sudah dikirim hari ini, dilewati");
            continue;
        }
        
        writeLog("Memproses jadwal untuk: {$data['nama']} ({$data['email']}) - " . count($data['jadwals']) . " shift");
        
        if (sendDailyNotification($data['email'], $data['nama'], $data['jadwals'])) {
            $success_count++;
            writeLog("✓ Email berhasil dikirim ke {$data['email']}");
            
            // Log ke database untuk setiap jadwal
            foreach ($data['jadwals'] as $jadwal) {
                $log_stmt = $conn->prepare("INSERT INTO email_log (jadwal_id, user_id, email_to, status, sent_at) 
                                           VALUES (?, ?, ?, 'sent', NOW())");
                $log_stmt->bind_param("iis", $jadwal['id'], $user_id, $data['email']);
                $log_stmt->execute();
                $log_stmt->close();
            }
        } else {
            $failed_count++;
            writeLog("✗ Gagal mengirim email ke {$data['email']}");
            
            // Log kegagalan
            foreach ($data['jadwals'] as $jadwal) {
                $log_stmt = $conn->prepare("INSERT INTO email_log (jadwal_id, user_id, email_to, status, sent_at) 
                                           VALUES (?, ?, ?, 'failed', NOW())");
                $log_stmt->bind_param("iis", $jadwal['id'], $user_id, $data['email']);
                $log_stmt->execute();
                $log_stmt->close();
            }
        }
        
        // Delay 2 detik antar email untuk menghindari spam filter
        sleep(2);
    }
    
    writeLog("Proses selesai. Total petugas: $total_users, Berhasil: $success_count, Gagal: $failed_count");
    writeLog("=== END DAILY EMAIL NOTIFICATION ===\n");
    
    // Tampilkan output jika diakses via browser
    if (php_sapi_name() !== 'cli') {
        echo "<!DOCTYPE html>";
        echo "<html><head><title>Email Notification Result</title>";
        echo "<style>body{font-family:Arial;padding:20px;background:#f5f5f5;}";
        echo ".container{max-width:600px;margin:0 auto;background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}";
        echo ".success{color:#28a745;font-weight:bold;font-size:24px;margin-bottom:20px;}";
        echo ".info{background:#e7f3ff;padding:15px;border-radius:5px;margin:10px 0;}";
        echo "</style></head><body>";
        echo "<div class='container'>";
        echo "<div class='success'>✅ Email Notification Sent!</div>";
        echo "<div class='info'><strong>Tanggal:</strong> " . date('d/m/Y') . "</div>";
        echo "<div class='info'><strong>Total Petugas:</strong> $total_users</div>";
        echo "<div class='info'><strong>Berhasil Dikirim:</strong> $success_count</div>";
        if ($failed_count > 0) {
            echo "<div class='info' style='background:#ffe7e7;'><strong>Gagal:</strong> $failed_count</div>";
        }
        echo "<div style='margin-top:20px;padding:15px;background:#f8f9fa;border-radius:5px;'>";
        echo "<small>Log tersimpan di: logs/email_notification.log</small>";
        echo "</div>";
        echo "</div></body></html>";
    }
    
} catch (Exception $e) {
    writeLog("ERROR: " . $e->getMessage());
    writeLog("=== END DAILY EMAIL NOTIFICATION (ERROR) ===\n");
    
    if (php_sapi_name() !== 'cli') {
        echo "<!DOCTYPE html><html><head><title>Error</title></head><body>";
        echo "<h1 style='color:red;'>❌ Error</h1>";
        echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
        echo "</body></html>";
    }
}

$conn->close();