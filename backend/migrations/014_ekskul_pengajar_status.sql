ALTER TABLE `ekskul_pengajar`
ADD COLUMN `status_pembayaran` ENUM('belum', 'sudah') DEFAULT 'belum' AFTER `honor`;
