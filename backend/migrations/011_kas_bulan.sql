-- Menambahkan kolom bulan_dibayar
ALTER TABLE `keuangan_kas_anggota` 
ADD COLUMN `bulan_dibayar` TEXT NULL;

-- Membuat tabel pengaturan
CREATE TABLE IF NOT EXISTS `keuangan_pengaturan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pengaturan_key` VARCHAR(100) NOT NULL UNIQUE,
    `pengaturan_value` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Insert default value untuk kas per bulan
INSERT IGNORE INTO `keuangan_pengaturan` (`pengaturan_key`, `pengaturan_value`) 
VALUES ('kas_per_bulan', '10000');
