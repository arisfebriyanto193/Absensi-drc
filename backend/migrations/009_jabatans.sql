CREATE TABLE IF NOT EXISTS `jabatans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_jabatan` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nama_jabatan` (`nama_jabatan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

INSERT IGNORE INTO `jabatans` (`nama_jabatan`) VALUES
('Ketua Umum'),
('Wakil Ketua Umum'),
('Sekretaris 1'),
('Sekretaris 2'),
('Bendahara 1'),
('Bendahara 2'),
('Ketua Internal'),
('Ketua External'),
('Ketua Inventaris'),
('Anggota Internal'),
('Anggota External'),
('Anggota Inventaris'),
('Anggota');
