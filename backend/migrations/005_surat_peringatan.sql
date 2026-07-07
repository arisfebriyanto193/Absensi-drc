CREATE TABLE IF NOT EXISTS `surat_peringatan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `jadwal_id` int(11) NOT NULL,
  `jenis` enum('jadwal_pengganti','sp1','sp2','sp3') DEFAULT 'jadwal_pengganti',
  `tanggal` date NOT NULL,
  `keterangan` text NOT NULL,
  `status` enum('active','resolved') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `jadwal_id` (`jadwal_id`),
  CONSTRAINT `surat_peringatan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `surat_peringatan_ibfk_2` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_piket` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
