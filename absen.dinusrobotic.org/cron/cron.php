<?php
/**
 * Sistem Peringatan Otomatis
 * File ini bisa dijalankan via CRON job setiap hari atau dipanggil manual
 */

require_once '../config.php';

class SistemPeringatan {
    private $conn;
    
    public function __construct($conn) {
        $this->conn = $conn;
    }
    
    /**
     * Cek jadwal yang sudah lewat dan belum ada absensi atau ditolak
     */
    public function cekJadwalTerlewat() {
        $kemarin = date('Y-m-d', strtotime('-1 day'));
        
        // Ambil jadwal kemarin yang belum completed
        $query = "SELECT jp.*, u.nama_lengkap, u.email 
                  FROM jadwal_piket jp 
                  JOIN users u ON jp.user_id = u.id
                  WHERE jp.tanggal = ? 
                  AND jp.status = 'scheduled'
                  AND jp.is_pengganti = 0";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $kemarin);
        $stmt->execute();
        $jadwal_terlewat = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        foreach ($jadwal_terlewat as $jadwal) {
            $this->prosesJadwalTerlewat($jadwal);
        }
        
        return count($jadwal_terlewat);
    }
    
    /**
     * Proses jadwal yang terlewat
     */
    private function prosesJadwalTerlewat($jadwal) {
        $jadwal_id = $jadwal['id'];
        $user_id = $jadwal['user_id'];
        $tanggal = $jadwal['tanggal'];
        
        // Cek apakah ada absensi
        $absensi = $this->getAbsensi($jadwal_id);
        
        // Cek apakah ada izin yang disetujui
        $izin = $this->getIzinDisetujui($jadwal_id, $tanggal);
        
        // Jika ada izin yang disetujui, tandai jadwal sebagai completed dan skip
        if ($izin) {
            $this->updateStatusJadwal($jadwal_id, 'completed');
            $this->logInfo("Jadwal ID $jadwal_id diabaikan karena ada izin yang disetujui");
            return;
        }
        
        // Jika tidak ada absensi atau absensi ditolak
        if (!$absensi || $absensi['status_konfirmasi'] === 'rejected') {
            $alasan = !$absensi ? 'Tidak melakukan absensi' : 'Absensi ditolak';
            
            // Buat jadwal pengganti 2 hari ke depan
            $jadwal_pengganti_id = $this->buatJadwalPengganti($jadwal, $alasan);
            
            // Catat sebagai peringatan jadwal pengganti
            $this->buatPeringatan($user_id, $jadwal_id, 'jadwal_pengganti', 
                "$alasan pada " . $this->formatTanggal($tanggal) . ". Jadwal pengganti telah dibuat.");
            
            // Update status jadwal original
            $this->updateStatusJadwal($jadwal_id, 'cancelled');
            
            $this->logInfo("Jadwal pengganti dibuat untuk user $user_id (Jadwal ID: $jadwal_pengganti_id)");
        }
    }
    
    /**
     * Cek jadwal pengganti yang sudah lewat
     */
    public function cekJadwalPengganti() {
        $kemarin = date('Y-m-d', strtotime('-1 day'));
        
        $query = "SELECT jp.*, u.nama_lengkap, u.email, sp.id as peringatan_id
                  FROM jadwal_piket jp 
                  JOIN users u ON jp.user_id = u.id
                  LEFT JOIN surat_peringatan sp ON jp.id = sp.jadwal_id AND sp.jenis = 'jadwal_pengganti'
                  WHERE jp.tanggal = ? 
                  AND jp.status = 'scheduled'
                  AND jp.is_pengganti = 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $kemarin);
        $stmt->execute();
        $jadwal_pengganti = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        foreach ($jadwal_pengganti as $jadwal) {
            $this->prosesJadwalPengganti($jadwal);
        }
        
        return count($jadwal_pengganti);
    }
    
    /**
     * Proses jadwal pengganti yang terlewat
     */
    private function prosesJadwalPengganti($jadwal) {
        $jadwal_id = $jadwal['id'];
        $user_id = $jadwal['user_id'];
        $tanggal = $jadwal['tanggal'];
        
        // Cek apakah ada absensi
        $absensi = $this->getAbsensi($jadwal_id);
        
        // Cek apakah ada izin yang disetujui
        $izin = $this->getIzinDisetujui($jadwal_id, $tanggal);
        
        // Jika ada izin yang disetujui, tandai jadwal sebagai completed dan skip
        if ($izin) {
            $this->updateStatusJadwal($jadwal_id, 'completed');
            $this->logInfo("Jadwal pengganti ID $jadwal_id diabaikan karena ada izin yang disetujui");
            return;
        }
        
        // Jika tidak ada absensi atau absensi ditolak, buat SP
        if (!$absensi || $absensi['status_konfirmasi'] === 'rejected') {
            $alasan = !$absensi ? 'Tidak melakukan absensi' : 'Absensi ditolak';
            
            // Hitung jumlah SP yang sudah ada
            $jumlah_sp = $this->hitungSP($user_id);
            
            // Tentukan jenis SP
            $jenis_sp = 'sp' . ($jumlah_sp + 1);
            
            if ($jumlah_sp >= 3) {
                $jenis_sp = 'sp3'; // Maksimal SP3
            }
            
            // Buat SP
            $this->buatPeringatan($user_id, $jadwal_id, $jenis_sp,
                "$alasan pada jadwal pengganti tanggal " . $this->formatTanggal($tanggal) . ".");
            
            // Update status jadwal
            $this->updateStatusJadwal($jadwal_id, 'cancelled');
            
            $this->logInfo("SP ($jenis_sp) dibuat untuk user $user_id");
            
            // Kirim notifikasi email jika ada
            if (!empty($jadwal['email'])) {
                $this->kirimEmailPeringatan($jadwal['email'], $jadwal['nama_lengkap'], $jenis_sp);
            }
        }
    }
    
    /**
     * Buat jadwal pengganti 2 hari ke depan
     */
    private function buatJadwalPengganti($jadwal_original, $alasan) {
        $tanggal_pengganti = date('Y-m-d', strtotime('+2 days'));
        
        $query = "INSERT INTO jadwal_piket 
                  (user_id, tanggal, jam_mulai, jam_selesai, lokasi, status, is_pengganti, jadwal_asal_id, alasan_pengganti) 
                  VALUES (?, ?, ?, ?, ?, 'scheduled', 1, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("issssis", 
            $jadwal_original['user_id'],
            $tanggal_pengganti,
            $jadwal_original['jam_mulai'],
            $jadwal_original['jam_selesai'],
            $jadwal_original['lokasi'],
            $jadwal_original['id'],
            $alasan
        );
        $stmt->execute();
        $jadwal_id = $stmt->insert_id;
        $stmt->close();
        
        return $jadwal_id;
    }
    
    /**
     * Buat peringatan
     */
    private function buatPeringatan($user_id, $jadwal_id, $jenis, $keterangan) {
        $query = "INSERT INTO surat_peringatan (user_id, jadwal_id, jenis, tanggal, keterangan) 
                  VALUES (?, ?, ?, NOW(), ?)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("iiss", $user_id, $jadwal_id, $jenis, $keterangan);
        $stmt->execute();
        $stmt->close();
    }
    
    /**
     * Get absensi by jadwal_id
     */
    private function getAbsensi($jadwal_id) {
        $query = "SELECT * FROM absensi WHERE jadwal_id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $jadwal_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $result;
    }
    
    /**
     * Get izin yang disetujui
     */
    private function getIzinDisetujui($jadwal_id, $tanggal) {
        $query = "SELECT * FROM izin 
                  WHERE jadwal_id = ? 
                  AND tanggal_izin = ?
                  AND status = 'approved' 
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("is", $jadwal_id, $tanggal);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $result;
    }
    
    /**
     * Update status jadwal
     */
    private function updateStatusJadwal($jadwal_id, $status) {
        $query = "UPDATE jadwal_piket SET status = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("si", $status, $jadwal_id);
        $stmt->execute();
        $stmt->close();
    }
    
    /**
     * Hitung jumlah SP yang masih active
     */
    private function hitungSP($user_id) {
        $query = "SELECT COUNT(*) as total FROM surat_peringatan 
                  WHERE user_id = ? 
                  AND jenis IN ('sp1', 'sp2', 'sp3')
                  AND status = 'active'";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $result['total'];
    }
    
    /**
     * Kirim email peringatan
     */
    private function kirimEmailPeringatan($email, $nama, $jenis_sp) {
        $subject = "Surat Peringatan - Sistem Absensi Piket";
        $message = "Yth. $nama,\n\n";
        $message .= "Anda telah menerima " . strtoupper($jenis_sp) . " karena tidak melakukan absensi piket sesuai jadwal.\n\n";
        $message .= "Mohon untuk lebih memperhatikan jadwal piket Anda ke depannya.\n\n";
        $message .= "Terima kasih.";
        
        $headers = "From: noreply@absensipiket.com";
        
        mail($email, $subject, $message, $headers);
    }
    
    /**
     * Format tanggal
     */
    private function formatTanggal($tanggal) {
        $bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $split = explode('-', $tanggal);
        return $split[2] . ' ' . $bulan[(int)$split[1] - 1] . ' ' . $split[0];
    }
    
    /**
     * Log info
     */
    private function logInfo($message) {
        error_log("[Sistem Peringatan] " . date('Y-m-d H:i:s') . " - " . $message);
    }
}

// Jalankan sistem jika dipanggil langsung
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) {
    $sistem = new SistemPeringatan($conn);
    
    echo "=== Sistem Peringatan Otomatis ===\n";
    echo "Waktu: " . date('Y-m-d H:i:s') . "\n\n";
    
    echo "Mengecek jadwal terlewat...\n";
    $count1 = $sistem->cekJadwalTerlewat();
    echo "Jumlah jadwal terlewat diproses: $count1\n\n";
    
    echo "Mengecek jadwal pengganti...\n";
    $count2 = $sistem->cekJadwalPengganti();
    echo "Jumlah jadwal pengganti diproses: $count2\n\n";
    
    echo "Selesai.\n";
}
?>