CREATE TABLE IF NOT EXISTS `jadwal_piket` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `lokasi` varchar(100) NOT NULL,
  `status` enum('scheduled','completed','cancelled') DEFAULT 'scheduled',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_pengganti` tinyint(1) DEFAULT 0 COMMENT '0=jadwal normal, 1=jadwal pengganti',
  `jadwal_asal_id` int(11) DEFAULT NULL COMMENT 'ID jadwal yang tidak dijalankan',
  `alasan_pengganti` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_jadwal_tanggal_jam` (`tanggal`,`jam_mulai`),
  CONSTRAINT `jadwal_piket_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;