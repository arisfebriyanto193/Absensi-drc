<?php
// email_config.php - Simpan di folder root atau config
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Autoload PHPMailer (pastikan sudah install via composer)
// composer require phpmailer/phpmailer
require 'vendor/autoload.php';

// ============================================
// KONFIGURASI EMAIL - GANTI SESUAI KEBUTUHAN
// ============================================

// Pilih provider email (uncomment yang akan digunakan)
define('MAIL_PROVIDER', 'gmail'); // Options: gmail, office365, yahoo, custom

// Konfigurasi berdasarkan provider
$mail_config = [
    'gmail' => [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'encryption' => PHPMailer::ENCRYPTION_STARTTLS,
        'username' => 'dinusrobotic@gmail.com', // GANTI INI
        'password' => 'pkz mnhg srkg uqyd',     // GANTI INI (16 digit App Password)
        'from_email' => 'noreply@absen.dinusrobotic',
        'from_name' => 'Sistem Absensi Piket'
    ],
    'office365' => [
        'host' => 'smtp.office365.com',
        'port' => 587,
        'encryption' => PHPMailer::ENCRYPTION_STARTTLS,
        'username' => 'your-email@outlook.com',
        'password' => 'your-password',
        'from_email' => 'noreply@absensipiket.com',
        'from_name' => 'Sistem Absensi Piket'
    ],
    'yahoo' => [
        'host' => 'smtp.mail.yahoo.com',
        'port' => 587,
        'encryption' => PHPMailer::ENCRYPTION_STARTTLS,
        'username' => 'your-email@yahoo.com',
        'password' => 'your-app-password',
        'from_email' => 'noreply@absensipiket.com',
        'from_name' => 'Sistem Absensi Piket'
    ],
    'custom' => [
        'host' => 'mail.yourdomain.com',
        'port' => 587,
        'encryption' => PHPMailer::ENCRYPTION_STARTTLS,
        'username' => 'noreply@yourdomain.com',
        'password' => 'your-password',
        'from_email' => 'noreply@yourdomain.com',
        'from_name' => 'Sistem Absensi Piket'
    ]
];

// Ambil konfigurasi sesuai provider yang dipilih
$current_config = $mail_config[MAIL_PROVIDER];

function sendVerificationEmail($to_email, $to_name, $verification_token) {
    global $current_config;
    
    $mail = new PHPMailer(true);
    
    // Array untuk menampung hasil
    $result = [
        'success' => false,
        'error' => ''
    ];

    try {
        // Debug mode (set ke 0 untuk production)
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER;
        // $mail->Debugoutput = 'html';
        
        // Konfigurasi SMTP
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com'; // Ganti dengan SMTP server Anda
        $mail->SMTPAuth   = true;
        $mail->Username   = 'dinusrobotic@gmail.com'; // Email pengirim
        $mail->Password   = 'mygu driq lbxh ypiy'; // App Password Gmail atau password SMTP
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Pengirim
        $mail->setFrom('dinusrobotic@gmail.com', 'Sistem Absensi Piket');
        
        // Penerima
        $mail->addAddress($to_email, $to_name);

        // Konten email
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = 'Verifikasi Email - Sistem Absensi Piket';
        
        // URL verifikasi
        $verification_url = "https://absen.dinusrobotic.org/verify-email.php?token=" . $verification_token;
        
        // Template email
        $mail->Body = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✉️ Verifikasi Email Anda</h1>
                </div>
                <div class="content">
                    <h2>Halo, ' . htmlspecialchars($to_name) . '!</h2>
                    <p>Terima kasih telah mendaftar di Sistem Absensi Piket. Untuk mengaktifkan akun Anda, silakan verifikasi email Anda dengan mengklik tombol di bawah ini:</p>
                    
                    <div style="text-align: center;">
                        <a href="' . $verification_url . '" class="button">Verifikasi Email Sekarang</a>
                    </div>
                    
                    <p>Atau salin dan tempel link berikut di browser Anda:</p>
                    <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all;">
                        ' . $verification_url . '
                    </p>
                    
                    <div class="warning">
                        <strong>⚠️ Penting:</strong>
                        <ul>
                            <li>Link ini akan kedaluwarsa dalam 24 jam</li>
                            <li>Jika Anda tidak mendaftar, abaikan email ini</li>
                            <li>Jangan bagikan link ini kepada siapa pun</li>
                        </ul>
                    </div>
                    
                    <p>Jika Anda mengalami masalah, silakan hubungi administrator sistem.</p>
                    
                    <p>Salam,<br><strong>Tim Sistem Absensi Piket</strong></p>
                </div>
                <div class="footer">
                    <p>© ' . date('Y') . ' Sistem Absensi Piket. All rights reserved.</p>
                    <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
                </div>
            </div>
        </body>
        </html>';

        // Plain text alternative
        $mail->AltBody = "Halo $to_name,\n\n"
            . "Silakan verifikasi email Anda dengan mengklik link berikut:\n"
            . "$verification_url\n\n"
            . "Link ini akan kedaluwarsa dalam 24 jam.\n\n"
            . "Salam,\nTim Sistem Absensi Piket";

        $mail->send();
        $result['success'] = true;
        return $result;
    } catch (Exception $e) {
        // Log error ke file
        error_log("Email Error: {$mail->ErrorInfo}");
        error_log("Exception: " . $e->getMessage());
        
        // Set error detail untuk ditampilkan ke user
        $result['success'] = false;
        
        // Format error message yang user-friendly
        $error_msg = $mail->ErrorInfo;
        
        // Identifikasi jenis error
        if (strpos($error_msg, 'SMTP connect() failed') !== false) {
            $result['error'] = "KONEKSI SMTP GAGAL\n\n";
            $result['error'] .= "Kemungkinan penyebab:\n";
            $result['error'] .= "• Host SMTP salah atau tidak dapat dijangkau\n";
            $result['error'] .= "• Port SMTP diblokir oleh firewall\n";
            $result['error'] .= "• Koneksi internet bermasalah\n\n";
            $result['error'] .= "Detail: " . $error_msg;
        } elseif (strpos($error_msg, 'Invalid address') !== false) {
            $result['error'] = "ALAMAT EMAIL TIDAK VALID\n\n";
            $result['error'] .= "Detail: " . $error_msg;
        } elseif (strpos($error_msg, 'Username and Password not accepted') !== false || 
                  strpos($error_msg, 'Authentication failed') !== false ||
                  strpos($error_msg, 'Invalid login') !== false) {
            $result['error'] = "AUTENTIKASI GAGAL\n\n";
            $result['error'] .= "Kemungkinan penyebab:\n";
            $result['error'] .= "• Username SMTP salah\n";
            $result['error'] .= "• Password SMTP salah\n";
            $result['error'] .= "• Belum menggunakan App Password (untuk Gmail)\n";
            $result['error'] .= "• 2-Factor Authentication belum diaktifkan\n\n";
            $result['error'] .= "Detail: " . $error_msg;
        } elseif (strpos($error_msg, 'Could not instantiate mail function') !== false) {
            $result['error'] = "FUNGSI MAIL TIDAK TERSEDIA\n\n";
            $result['error'] .= "Kemungkinan penyebab:\n";
            $result['error'] .= "• PHP mail() function tidak aktif\n";
            $result['error'] .= "• Server tidak support pengiriman email\n\n";
            $result['error'] .= "Detail: " . $error_msg;
        } elseif (strpos($error_msg, 'Mailer Error') !== false) {
            $result['error'] = "ERROR PENGIRIMAN EMAIL\n\n";
            $result['error'] .= "Detail: " . $error_msg;
        } else {
            // Error umum
            $result['error'] = "TERJADI KESALAHAN\n\n";
            $result['error'] .= "Detail: " . $error_msg . "\n\n";
            $result['error'] .= "Exception: " . $e->getMessage();
        }
        
        return $result;
    }
}

// Fungsi untuk mengirim ulang verifikasi
function resendVerificationEmail($user_id, $conn) {
    $stmt = $conn->prepare("SELECT email, nama_lengkap FROM users WHERE id = ? AND status_email = 0");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['success' => false, 'message' => 'User tidak ditemukan atau sudah terverifikasi'];
    }
    
    $user = $result->fetch_assoc();
    
    // Generate token baru
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Update token
    $stmt = $conn->prepare("UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?");
    $stmt->bind_param("ssi", $token, $expires, $user_id);
    $stmt->execute();
    
    // Kirim email
    if (sendVerificationEmail($user['email'], $user['nama_lengkap'], $token)) {
        return ['success' => true, 'message' => 'Email verifikasi berhasil dikirim ulang'];
    } else {
        return ['success' => false, 'message' => 'Gagal mengirim email'];
    }
}