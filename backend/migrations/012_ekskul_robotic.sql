CREATE TABLE IF NOT EXISTS `ekskul_sekolah` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_sekolah` VARCHAR(150) NOT NULL,
  `deskripsi` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ekskul_pembelajaran` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sekolah_id` INT NOT NULL,
  `tanggal` DATE NOT NULL,
  `materi` VARCHAR(255),
  `total_pendapatan` DECIMAL(15,2) DEFAULT 0,
  `nominal_kas` DECIMAL(15,2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sekolah_id`) REFERENCES `ekskul_sekolah`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `ekskul_pengajar` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pembelajaran_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `honor` DECIMAL(15,2) DEFAULT 0,
  FOREIGN KEY (`pembelajaran_id`) REFERENCES `ekskul_pembelajaran`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
