SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `izin`;
-- Buat tabel
CREATE TABLE `izin` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `jadwal_id` int(11) NOT NULL,
  `tanggal_izin` date NOT NULL,
  `alasan` text NOT NULL,
  `file_bukti` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `keterangan_admin` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Data
INSERT INTO `izin` (`id`, `user_id`, `jadwal_id`, `tanggal_izin`, `alasan`, `file_bukti`, `status`, `keterangan_admin`, `approved_by`, `approved_at`, `created_at`) VALUES
(2, 71, 88, '2025-10-24', 'sak seneng ku a', NULL, 'rejected', 'bacod', 1, '2025-10-19 21:21:39', '2025-10-19 13:20:21'),
(4, 16, 25, '2025-10-20', 'Masih belum sembuh dari Radang Tenggorokan dan Demam', NULL, 'approved', '', 1, '2025-10-21 00:31:05', '2025-10-20 02:11:05'),
(5, 50, 65, '2025-10-23', 'Saya mengajukan izin tidak hadir untuk piket hari ini karena kondisi tidak enak badan sehabis kehujanan semalaman pulang dari kampus, oleh karena itu saya tidak menghadiri mata kuliah juga. Mohon pengertiannya agar dapat fokus pada pemulihan kesehatan.', NULL, 'approved', 'GWS brokh', 74, '2025-10-23 15:19:26', '2025-10-23 05:40:26'),
(6, 68, 85, '2025-10-24', 'Sakit tidak ke kampus', NULL, 'approved', 'aduhh cepet sembuh yaa cantik wkwkw', 74, '2025-10-24 11:47:26', '2025-10-24 03:43:09'),
(7, 77, 420, '2025-10-25', 'tessdagyugda', NULL, 'approved', '', 1, '2025-10-25 10:05:01', '2025-10-25 02:02:54'),
(8, 77, 567, '2025-10-25', 'oooo', NULL, 'approved', '', 1, '2025-10-25 11:55:07', '2025-10-25 03:54:45'),
(9, 9, 504, '2025-10-27', 'karna sedang sakit', NULL, 'approved', 'semoga cepet sembuh yaa Dyah', 74, '2025-10-27 18:17:08', '2025-10-27 08:29:57'),
(10, 34, 506, '2025-10-28', 'Sedang luar kota jakarta', NULL, 'approved', '', 1, '2025-10-27 21:45:48', '2025-10-27 13:04:27'),
(11, 30, 510, '2025-10-28', 'Rumah kebanjiran, gk bisa kluar', NULL, 'rejected', 'udah di bengkel tadi', 1, '2025-10-28 22:26:32', '2025-10-28 01:48:40'),
(12, 22, 518, '2025-10-28', 'Saya sedang sakit batuk pilek, maaf saya tidak bisa hadir untuk piket hari ini, jika semisal diperkenankan saya ganti jadwal piket saya hari ini untuk sementara di hari Kamis apakah di ijinkan?', NULL, 'approved', '', 74, '2025-10-28 22:18:48', '2025-10-28 10:24:37'),
(13, 41, 527, '2025-10-29', 'Saya izin tidak piket pada hari ini, 29 Oktober 2025 karena sedang sakit dan tidak berangkat ke kampus. Terima kasih sebelumnya', NULL, 'approved', '', 1, '2025-10-29 19:48:28', '2025-10-29 02:35:32'),
(14, 10, 589, '2025-11-03', 'Alasan saya izin piket dikarenakan masih pulang kampung', NULL, 'approved', 'PEHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH', 74, '2025-11-03 15:20:57', '2025-11-03 06:14:49'),
(15, 13, 592, '2025-11-03', 'sakit demam', NULL, 'approved', 'Semogaa cepat sembuh yaaaa,SEMANGATT', 74, '2025-11-03 16:42:22', '2025-11-03 08:11:13'),
(16, 22, 601, '2025-11-04', 'Sakit batuk pilek lagi masih belum sembuh, saya ijin satu Minggu ini lagi untuk tidak piket karena saya harus lebih fokus di UTS dan jaga kesehatan, kalau saya sudah sehat atau UTS sudah selesai saya akan kembali menjalankan piket, saya mohon maaf dan atas pengertiannya saya ucapkan terimakasih', NULL, 'approved', '(GWS)Ga Wafat Sekalian wkwk,cepet sembuh jadwal piket menunggu', 74, '2025-11-04 18:34:35', '2025-11-04 03:14:56'),
(17, 34, 606, '2025-11-04', 'sedang sakit panas', NULL, 'approved', 'gws brokh', 74, '2025-11-04 18:32:50', '2025-11-04 09:50:22'),
(18, 71, 1374, '2025-11-04', 'ehem', NULL, 'approved', 'bacod', 74, '2025-11-04 18:54:45', '2025-11-04 10:45:28'),
(20, 71, 1375, '2025-11-04', 'p', NULL, 'approved', 'malas', 74, '2025-11-04 18:57:51', '2025-11-04 10:57:37'),
(21, 77, 1376, '2025-11-04', 'Bsbsb', NULL, 'approved', 'halslslls', 74, '2025-11-04 19:14:53', '2025-11-04 11:14:38'),
(22, 41, 626, '2025-11-05', 'Hari ini, 05 November 2025, saya izin tidak melaksanakan piket karena sedang tidak enak badan dan hari ini tidak berangkat ke kampus. Terima kasih sebelumnya', NULL, 'approved', '', 74, '2025-11-05 17:49:04', '2025-11-05 05:02:57'),
(23, 68, 616, '2025-11-05', 'Sakit', NULL, 'approved', 'cepet sembuh yaa sabb, SEMANGAT SABRINAA, SALAM HANGAT DARI INTERNAL BOLO', 74, '2025-11-05 16:13:50', '2025-11-05 06:20:52'),
(24, 68, 616, '2025-11-05', 'Sakit', NULL, 'rejected', 'Izin ditolak', 74, '2025-11-06 13:14:25', '2025-11-05 06:28:46'),
(25, 44, 1377, '2025-11-05', 'tesss can', 'izin_44_1762330877.jpg', 'approved', 'ngawurrrrr', 74, '2025-11-05 17:48:40', '2025-11-05 08:21:17'),
(26, 38, 653, '2025-11-07', 'sakit', 'izin_38_1762406596.jpeg', 'approved', '', 74, '2025-11-06 13:24:25', '2025-11-06 05:23:16'),
(27, 77, 1378, '2025-11-06', 'kokook', 'izin_77_1762407325.jpg', 'approved', '', 74, '2025-11-06 13:35:59', '2025-11-06 05:35:25'),
(28, 69, 647, '2025-11-07', 'izin tdk piket karna ada urusan pribadi yg urgent sore ini, pagi sampai siang ada uts jadi tdk sempat piket, terimakasi.', 'izin_69_1762509135.jpg', 'approved', 'OKEYY LAH', 74, '2025-11-07 21:03:32', '2025-11-07 09:52:15'),
(29, 17, 885, '2025-11-10', 'Magang', 'izin_17_1762746168.jpg', 'approved', 'OKEE TULUNG GRUB INTERNAL BUKA MAS,FOLLOW AKUN IG BIAR LANYARD CAIR WKWK', 74, '2025-11-10 12:30:30', '2025-11-10 03:42:48'),
(30, 34, 903, '2025-11-11', 'sakit', 'izin_34_1762837021.pdf', 'approved', 'gws bolo', 74, '2025-11-11 18:00:54', '2025-11-11 04:57:01'),
(31, 64, 938, '2025-11-14', 'Sedang pulang kampung', 'izin_64_1763085979.png', 'approved', 'eleh elehh', 74, '2025-11-14 13:02:43', '2025-11-14 02:06:19'),
(32, 38, 951, '2025-11-14', 'balikkkk kampunk ga smpt absen hhe', 'izin_38_1763117416.jpg', 'approved', 'pehhhh, gwendeng Ndang Rene lee', 74, '2025-11-14 19:42:41', '2025-11-14 10:50:16'),
(33, 10, 1162, '2025-11-17', 'Alasan saya izin karena masih dikampung halaman', 'izin_10_1763355568.jpg', 'approved', 'aduhh gantengnya wkwk', 74, '2025-11-17 20:37:24', '2025-11-17 04:59:28'),
(34, 16, 1170, '2025-11-17', 'ada job di Bandung harus hari ini jadi perkiraan pulang nanti malam', 'izin_16_1763357305.jpeg', 'approved', 'okee tiati bolo', 74, '2025-11-17 20:37:54', '2025-11-17 05:28:25'),
(35, 10, 1162, '2025-11-17', 'Alasan saya izin karena masih dikampung halaman', 'izin_10_1763360229.jpg', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:08:43', '2025-11-17 06:17:09'),
(36, 10, 1162, '2025-11-17', 'Alasan saya izin karena masih dikampung halaman', 'izin_10_1763360258.jpg', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:08:27', '2025-11-17 06:17:38'),
(37, 9, 1163, '2025-11-17', 'karna lagi ga enak badan dari kemarin waktu ESD', 'izin_9_1763364007.jpg', 'approved', 'cepet sembuh yaa diah', 74, '2025-11-17 20:38:35', '2025-11-17 07:20:07'),
(38, 71, 1223, '2025-11-21', 'testing', 'izin_71_1763456751.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:08:09', '2025-11-18 09:05:51'),
(39, 71, 1223, '2025-11-21', 't', 'izin_71_1763457411.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:32:01', '2025-11-18 09:16:51'),
(40, 71, 1223, '2025-11-21', 't', 'izin_71_1763458435.png', 'approved', '', 74, '2025-11-18 17:34:31', '2025-11-18 09:33:55'),
(41, 71, 1294, '2025-11-28', 't', 'izin_71_1763458581.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:43:40', '2025-11-18 09:36:21'),
(42, 71, 1294, '2025-11-28', 't', 'izin_71_1763458620.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:43:25', '2025-11-18 09:37:00'),
(43, 71, 1294, '2025-11-28', 't', 'izin_71_1763458625.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:44:00', '2025-11-18 09:37:05'),
(44, 71, 1294, '2025-11-28', 't', 'izin_71_1763458682.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:44:48', '2025-11-18 09:38:02'),
(45, 71, 1294, '2025-11-28', 't', 'izin_71_1763458713.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:43:11', '2025-11-18 09:38:33'),
(46, 71, 1294, '2025-11-28', 't', 'izin_71_1763458740.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:43:00', '2025-11-18 09:39:00'),
(47, 71, 1294, '2025-11-28', 't', 'izin_71_1763458756.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:45:02', '2025-11-18 09:39:16'),
(48, 71, 1365, '2025-12-05', 'tt', 'izin_71_1763458793.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:42:44', '2025-11-18 09:39:53'),
(49, 71, 1365, '2025-12-05', 'tt', 'izin_71_1763458801.png', 'approved', '', 74, '2025-11-18 17:44:19', '2025-11-18 09:40:01'),
(50, 71, 1365, '2025-12-05', 'tt', 'izin_71_1763458913.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:42:29', '2025-11-18 09:41:53'),
(51, 71, 1294, '2025-11-28', 't', 'izin_71_1763459317.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:51:57', '2025-11-18 09:48:37'),
(52, 71, 1294, '2025-11-28', 't', 'izin_71_1763459323.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:51:46', '2025-11-18 09:48:43'),
(53, 71, 1294, '2025-11-28', 't', 'izin_71_1763459440.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 17:51:32', '2025-11-18 09:50:40'),
(54, 71, 1294, '2025-11-28', 'tt', 'izin_71_1763459600.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 18:02:02', '2025-11-18 09:53:20'),
(55, 71, 1294, '2025-11-28', 'tt', 'izin_71_1763459610.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 18:01:48', '2025-11-18 09:53:30'),
(56, 71, 1294, '2025-11-28', 'tt', 'izin_71_1763459813.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 18:01:36', '2025-11-18 09:56:53'),
(57, 71, 1294, '2025-11-28', 'tt', 'izin_71_1763460017.png', 'rejected', 'Izin ditolak', 74, '2025-11-18 18:01:22', '2025-11-18 10:00:17'),
(58, 71, 1294, '2025-11-28', 't', 'izin_71_1763460163.png', 'approved', '', 74, '2025-11-18 18:14:55', '2025-11-18 10:02:43'),
(59, 71, 1466, '2025-12-12', 'sasasas', 'izin_71_1763460213.png', 'approved', '', 74, '2025-11-18 18:14:45', '2025-11-18 10:03:33'),
(60, 71, 1537, '2025-12-19', 'tt', 'izin_71_1763460249.png', 'approved', '', 74, '2025-11-18 18:14:32', '2025-11-18 10:04:09'),
(61, 60, 1224, '2025-11-21', 'Mohon izin tidak dapat mengikuti piket, dikarenakan sedang menjadi panitia event Medical Record Information and Training (MRIT 2025)', 'izin_60_1763694147.jpeg', 'approved', 'Anjayy, semangat rintaaa', 74, '2025-11-21 13:29:37', '2025-11-21 03:02:27'),
(62, 64, 1228, '2025-11-21', 'maaf ngajuin izin lagi kak, sedang sakit, ini sakitnya yg kaya rasanya mau meninggal jd gabisa ke bengkel', 'izin_64_1763708219.jpeg', 'approved', 'Mati tinggal tanam shabb wkwkwk, cepet sembuh yaa hehe', 74, '2025-11-21 15:22:17', '2025-11-21 06:56:59');

-- Indexes, Constraints, & Auto Increments
ALTER TABLE `izin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `jadwal_id` (`jadwal_id`),
  ADD KEY `approved_by` (`approved_by`);
ALTER TABLE `izin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;
ALTER TABLE `izin`
  ADD CONSTRAINT `izin_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `izin_ibfk_2` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_piket` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `izin_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS=1;