-- Mengubah enum role pada tabel users
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin','user','bendahara','sekretaris') DEFAULT 'user';

-- Tabel Template Surat
CREATE TABLE IF NOT EXISTS `surat_template` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_template` VARCHAR(255) NOT NULL,
    `deskripsi` TEXT,
    `format_nomor` VARCHAR(255) DEFAULT '[NO]/DRC/UM/[BULAN_ROMAWI]/[TAHUN]',
    `konten_html` LONGTEXT NOT NULL,
    `has_tabel_anggota` TINYINT(1) DEFAULT 0,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Tabel Riwayat Surat (Surat Menyurat)
CREATE TABLE IF NOT EXISTS `surat_menyurat` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `template_id` INT NOT NULL,
    `no_surat` VARCHAR(255) NOT NULL,
    `tanggal_surat` DATE NOT NULL,
    `tujuan_surat` VARCHAR(255),
    `data_json` LONGTEXT, 
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`template_id`) REFERENCES `surat_template`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
