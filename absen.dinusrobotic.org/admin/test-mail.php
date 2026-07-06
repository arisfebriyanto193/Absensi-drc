<?php
/**
 * File untuk testing pengiriman email reminder secara manual
 * Akses via browser: http://localhost/test_email.php?email=test@example.com
 */
require_once '../config.php';
require_once '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Konfigurasi (sama seperti di send_reminder.php)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'dinusrobotic@gmail.com');
define('SMTP_PASSWORD', 'nhem ptdm ivqx lqjq');
define('SMTP_FROM_EMAIL', 'noreply@absen.dinusrobotic');
define('SMTP_FROM_NAME', 'Sistem Jadwal Piket');

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Email Reminder</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 class="text-2xl font-bold mb-4">🧪 Test Email Reminder System</h1>
            
            <!-- Test Form -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h2 class="font-bold mb-2">Test Kirim Email</h2>
                <form method="GET" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold mb-2">Email Tujuan:</label>
                        <input type="email" name="email" required 
                            value="<?php echo htmlspecialchars($_GET['email'] ?? ''); ?>"
                            placeholder="test@example.com"
                            class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold mb-2">Nama Penerima:</label>
                        <input type="text" name="nama" 
                            value="<?php echo htmlspecialchars($_GET['nama'] ?? 'Test User'); ?>"
                            placeholder="Nama Petugas"
                            class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    
                    <button type="submit" name="test_send" value="1"
                        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        📧 Kirim Test Email
                    </button>
                </form>
            </div>

            <?php
            // Proses Test Kirim Email
            if (isset($_GET['test_send']) && !empty($_GET['email'])) {
                $test_email = $_GET['email'];
                $test_nama = $_GET['nama'] ?? 'Test User';
                
                // Data jadwal dummy untuk testing
                $jadwal_dummy = [
                    'tanggal' => date('Y-m-d', strtotime('+1 hour')),
                    'jam_mulai' => date('H:i:s', strtotime('+1 hour')),
                    'jam_selesai' => date('H:i:s', strtotime('+3 hours')),
                    'lokasi' => 'Ruang Kelas 7A (Testing)'
                ];
                
                echo "<div class='bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4'>";
                echo "<p class='font-bold'>⏳ Mengirim email ke: $test_email...</p>";
                echo "</div>";
                
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
                    
                    // Recipients
                    $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
                    $mail->addAddress($test_email, $test_nama);
                    
                    // Content
                    $mail->isHTML(true);
                    $mail->Subject = '[TEST] Reminder: Jadwal Piket Anda 1 Jam Lagi';
                    
                    // Format tanggal
                    $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    $bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                              'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    
                    $timestamp = strtotime($jadwal_dummy['tanggal']);
                    $hari_nama = $hari[date('w', $timestamp)];
                    $tanggal_format = date('d', $timestamp) . ' ' . $bulan[date('n', $timestamp)] . ' ' . date('Y', $timestamp);
                    
                    $jam_mulai = substr($jadwal_dummy['jam_mulai'], 0, 5);
                    $jam_selesai = substr($jadwal_dummy['jam_selesai'], 0, 5);
                    
                    // Email Body
                    $mail->Body = "
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                     color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .header h1 { margin: 0; font-size: 24px; }
                            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                            .card { background: white; padding: 20px; border-radius: 8px; 
                                   box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }
                            .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
                            .info-row:last-child { border-bottom: none; }
                            .info-label { font-weight: bold; color: #667eea; min-width: 120px; }
                            .info-value { color: #333; }
                            .alert { background: #fff3cd; border-left: 4px solid #ffc107; 
                                    padding: 15px; margin: 20px 0; border-radius: 4px; }
                            .test-badge { background: #dc3545; color: white; padding: 5px 10px; 
                                         border-radius: 4px; display: inline-block; margin-bottom: 10px; }
                            .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
                            .btn { display: inline-block; padding: 12px 30px; background: #667eea; 
                                  color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>⏰ Reminder Jadwal Piket</h1>
                            </div>
                            <div class='content'>
                                <div class='test-badge'>🧪 INI EMAIL TESTING</div>
                                
                                <p>Halo <strong>{$test_nama}</strong>,</p>
                                
                                <div class='alert'>
                                    <strong>🔔 Pengingat:</strong> Jadwal piket Anda akan dimulai dalam <strong>1 jam</strong> lagi!
                                </div>
                                
                                <div class='card'>
                                    <h2 style='margin-top: 0; color: #667eea;'>📋 Detail Jadwal Piket</h2>
                                    
                                    <div class='info-row'>
                                        <div class='info-label'>📅 Tanggal:</div>
                                        <div class='info-value'>{$hari_nama}, {$tanggal_format}</div>
                                    </div>
                                    
                                    <div class='info-row'>
                                        <div class='info-label'>🕐 Waktu:</div>
                                        <div class='info-value'>{$jam_mulai} - {$jam_selesai} WIB</div>
                                    </div>
                                    
                                    <div class='info-row'>
                                        <div class='info-label'>📍 Lokasi:</div>
                                        <div class='info-value'>{$jadwal_dummy['lokasi']}</div>
                                    </div>
                                </div>
                                
                                <p style='margin-top: 20px;'>
                                    <strong>Catatan Penting:</strong><br>
                                    • Harap datang tepat waktu<br>
                                    • Jangan lupa melakukan absensi saat tiba<br>
                                    • Pastikan area piket dalam kondisi bersih setelah selesai
                                </p>
                                
                                <center>
                                    <a href='#' class='btn'>Login Sistem Absensi</a>
                                </center>
                                
                                <div class='footer'>
                                    <p>Email ini dikirim secara otomatis oleh Sistem Jadwal Piket.<br>
                                    Mohon tidak membalas email ini.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                    ";
                    
                    $mail->AltBody = "
                    [TEST EMAIL]
                    
                    Reminder Jadwal Piket
                    
                    Halo $test_nama,
                    
                    Jadwal piket Anda akan dimulai dalam 1 jam lagi!
                    
                    Detail Jadwal:
                    - Tanggal: $hari_nama, $tanggal_format
                    - Waktu: $jam_mulai - $jam_selesai WIB
                    - Lokasi: {$jadwal_dummy['lokasi']}
                    
                    Harap datang tepat waktu dan jangan lupa melakukan absensi.
                    ";
                    
                    $mail->send();
                    
                    echo "<div class='bg-green-50 border-l-4 border-green-500 p-4'>";
                    echo "<p class='font-bold text-green-700'>✅ Email berhasil dikirim!</p>";
                    echo "<p class='text-sm text-green-600 mt-2'>Silakan cek inbox email: <strong>$test_email</strong></p>";
                    echo "<p class='text-xs text-gray-600 mt-1'>Jika tidak ada di inbox, cek folder SPAM/Junk</p>";
                    echo "</div>";
                    
                } catch (Exception $e) {
                    echo "<div class='bg-red-50 border-l-4 border-red-500 p-4'>";
                    echo "<p class='font-bold text-red-700'>❌ Gagal mengirim email!</p>";
                    echo "<p class='text-sm text-red-600 mt-2'>Error: {$mail->ErrorInfo}</p>";
                    echo "</div>";
                }
            }
            ?>

            <!-- SMTP Configuration Check -->
            <div class="bg-gray-50 border-l-4 border-gray-500 p-4 mb-6">
                <h2 class="font-bold mb-2">⚙️ SMTP Configuration</h2>
                <table class="w-full text-sm">
                    <tr>
                        <td class="py-1 font-semibold">Host:</td>
                        <td><?php echo SMTP_HOST; ?></td>
                    </tr>
                    <tr>
                        <td class="py-1 font-semibold">Port:</td>
                        <td><?php echo SMTP_PORT; ?></td>
                    </tr>
                    <tr>
                        <td class="py-1 font-semibold">Username:</td>
                        <td><?php echo SMTP_USERNAME; ?></td>
                    </tr>
                    <tr>
                        <td class="py-1 font-semibold">From Email:</td>
                        <td><?php echo SMTP_FROM_EMAIL; ?></td>
                    </tr>
                    <tr>
                        <td class="py-1 font-semibold">Password:</td>
                        <td><?php echo str_repeat('*', strlen(SMTP_PASSWORD)); ?></td>
                    </tr>
                </table>
            </div>

            <!-- Users with Email -->
            <div class="bg-gray-50 border-l-4 border-gray-500 p-4 mb-6">
                <h2 class="font-bold mb-2">👥 Users dengan Email</h2>
                <?php
                $users_query = $conn->query("SELECT id, username, nama_lengkap, email, role FROM users WHERE email IS NOT NULL AND email != '' ORDER BY nama_lengkap");
                
                if ($users_query->num_rows > 0) {
                    echo "<table class='w-full text-sm'>";
                    echo "<tr class='bg-gray-200'>";
                    echo "<th class='p-2 text-left'>ID</th>";
                    echo "<th class='p-2 text-left'>Nama</th>";
                    echo "<th class='p-2 text-left'>Email</th>";
                    echo "<th class='p-2 text-left'>Role</th>";
                    echo "<th class='p-2 text-left'>Action</th>";
                    echo "</tr>";
                    
                    while ($user = $users_query->fetch_assoc()) {
                        echo "<tr class='border-b'>";
                        echo "<td class='p-2'>{$user['id']}</td>";
                        echo "<td class='p-2'>{$user['nama_lengkap']}</td>";
                        echo "<td class='p-2'>{$user['email']}</td>";
                        echo "<td class='p-2'>" . ucfirst($user['role']) . "</td>";
                        echo "<td class='p-2'>";
                        echo "<a href='?email={$user['email']}&nama={$user['nama_lengkap']}&test_send=1' class='text-blue-600 hover:underline text-xs'>Test Email</a>";
                        echo "</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                } else {
                    echo "<p class='text-red-600'>⚠️ Tidak ada user dengan email! Silakan isi email di database.</p>";
                }
                ?>
            </div>

            <!-- Upcoming Schedules -->
            <div class="bg-gray-50 border-l-4 border-gray-500 p-4 mb-6">
                <h2 class="font-bold mb-2">📅 Jadwal 24 Jam Ke Depan</h2>
                <?php
                $now = date('Y-m-d H:i:s');
                $next_24h = date('Y-m-d H:i:s', strtotime('+24 hours'));
                
                $jadwal_query = $conn->query("
                    SELECT jp.*, u.nama_lengkap, u.email
                    FROM jadwal_piket jp
                    JOIN users u ON jp.user_id = u.id
                    WHERE CONCAT(jp.tanggal, ' ', jp.jam_mulai) BETWEEN '$now' AND '$next_24h'
                    ORDER BY jp.tanggal, jp.jam_mulai
                ");
                
                if ($jadwal_query->num_rows > 0) {
                    echo "<table class='w-full text-sm'>";
                    echo "<tr class='bg-gray-200'>";
                    echo "<th class='p-2 text-left'>Tanggal</th>";
                    echo "<th class='p-2 text-left'>Waktu</th>";
                    echo "<th class='p-2 text-left'>Petugas</th>";
                    echo "<th class='p-2 text-left'>Email</th>";
                    echo "<th class='p-2 text-left'>Lokasi</th>";
                    echo "</tr>";
                    
                    while ($jadwal = $jadwal_query->fetch_assoc()) {
                        $has_email = !empty($jadwal['email']) ? '✅' : '❌';
                        $email_display = !empty($jadwal['email']) ? $jadwal['email'] : '<span class="text-red-600">No Email</span>';
                        
                        echo "<tr class='border-b'>";
                        echo "<td class='p-2'>" . date('d/m/Y', strtotime($jadwal['tanggal'])) . "</td>";
                        echo "<td class='p-2'>" . substr($jadwal['jam_mulai'], 0, 5) . " - " . substr($jadwal['jam_selesai'], 0, 5) . "</td>";
                        echo "<td class='p-2'>{$jadwal['nama_lengkap']}</td>";
                        echo "<td class='p-2'>$has_email $email_display</td>";
                        echo "<td class='p-2'>{$jadwal['lokasi']}</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                } else {
                    echo "<p class='text-gray-600'>Tidak ada jadwal dalam 24 jam ke depan.</p>";
                }
                ?>
            </div>

            <!-- Email Log -->
            <div class="bg-gray-50 border-l-4 border-gray-500 p-4">
                <h2 class="font-bold mb-2">📊 Email Log (10 Terakhir)</h2>
                <?php
                $log_query = $conn->query("
                    SELECT el.*, u.nama_lengkap, jp.tanggal, jp.jam_mulai
                    FROM email_log el
                    LEFT JOIN users u ON el.user_id = u.id
                    LEFT JOIN jadwal_piket jp ON el.jadwal_id = jp.id
                    ORDER BY el.sent_at DESC
                    LIMIT 10
                ");
                
                if ($log_query && $log_query->num_rows > 0) {
                    echo "<table class='w-full text-xs'>";
                    echo "<tr class='bg-gray-200'>";
                    echo "<th class='p-2 text-left'>Waktu Kirim</th>";
                    echo "<th class='p-2 text-left'>Petugas</th>";
                    echo "<th class='p-2 text-left'>Email</th>";
                    echo "<th class='p-2 text-left'>Jadwal</th>";
                    echo "<th class='p-2 text-left'>Status</th>";
                    echo "</tr>";
                    
                    while ($log = $log_query->fetch_assoc()) {
                        $status_badge = $log['status'] === 'sent' 
                            ? '<span class="bg-green-500 text-white px-2 py-1 rounded text-xs">✓ Sent</span>'
                            : '<span class="bg-red-500 text-white px-2 py-1 rounded text-xs">✗ Failed</span>';
                        
                        echo "<tr class='border-b'>";
                        echo "<td class='p-2'>" . date('d/m/Y H:i', strtotime($log['sent_at'])) . "</td>";
                        echo "<td class='p-2'>{$log['nama_lengkap']}</td>";
                        echo "<td class='p-2'>{$log['email_to']}</td>";
                        echo "<td class='p-2'>" . date('d/m/Y', strtotime($log['tanggal'])) . " " . substr($log['jam_mulai'], 0, 5) . "</td>";
                        echo "<td class='p-2'>$status_badge</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                } else {
                    echo "<p class='text-gray-600'>Belum ada log pengiriman email.</p>";
                }
                ?>
            </div>
        </div>

        <!-- Quick Guide -->
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-bold mb-4">📖 Quick Guide</h2>
            <ol class="list-decimal list-inside space-y-2 text-sm">
                <li><strong>Pastikan SMTP credentials sudah benar</strong> di bagian atas file ini</li>
                <li><strong>Isi email users</strong> di database (lihat tabel "Users dengan Email" di atas)</li>
                <li><strong>Test kirim email</strong> menggunakan form di atas atau klik tombol di tabel users</li>
                <li><strong>Jika berhasil</strong>, setup cron job untuk menjalankan <code class="bg-gray-200 px-2 py-1 rounded">send_reminder.php</code></li>
                <li><strong>Monitor</strong> email log dan log file untuk memastikan sistem berjalan</li>
            </ol>
            
            <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p class="text-sm"><strong>⚠️ Catatan:</strong></p>
                <ul class="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>File ini hanya untuk testing, jangan diakses di production</li>
                    <li>Untuk Gmail, gunakan <strong>App Password</strong>, bukan password biasa</li>
                    <li>Cek folder SPAM jika email tidak masuk inbox</li>
                    <li>Delay 1 detik antar email untuk menghindari spam filter</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>