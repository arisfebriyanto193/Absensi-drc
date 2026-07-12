-- Tabel Kas Anggota
CREATE TABLE IF NOT EXISTS `keuangan_kas_anggota` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `target_nominal` DECIMAL(15,2) DEFAULT 0,
    `total_terbayar` DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Tabel Master Kegiatan
CREATE TABLE IF NOT EXISTS `keuangan_kegiatan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_kegiatan` VARCHAR(255) NOT NULL,
    `deskripsi` TEXT,
    `saldo_awal` DECIMAL(15,2) DEFAULT 0,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Tabel Transaksi Khusus Kegiatan
CREATE TABLE IF NOT EXISTS `keuangan_transaksi` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `kegiatan_id` INT NOT NULL,
    `tanggal` DATE NOT NULL,
    `jenis` ENUM('pemasukan', 'pengeluaran') NOT NULL,
    `nominal` DECIMAL(15,2) NOT NULL,
    `keterangan` TEXT,
    `bukti_url` VARCHAR(255) NULL,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`kegiatan_id`) REFERENCES `keuangan_kegiatan`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
