SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `surat_peringatan`;
-- Buat tabel
CREATE TABLE `surat_peringatan` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `jadwal_id` int(11) NOT NULL,
  `jenis` enum('jadwal_pengganti','sp1','sp2','sp3') DEFAULT 'jadwal_pengganti',
  `tanggal` date NOT NULL,
  `keterangan` text NOT NULL,
  `status` enum('active','resolved') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Indexes, Constraints, & Auto Increments
ALTER TABLE `surat_peringatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `jadwal_id` (`jadwal_id`);
ALTER TABLE `surat_peringatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `surat_peringatan`
  ADD CONSTRAINT `surat_peringatan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `surat_peringatan_ibfk_2` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_piket` (`id`) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS=1;