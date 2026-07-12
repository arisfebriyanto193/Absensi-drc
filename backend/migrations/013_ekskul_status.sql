ALTER TABLE `ekskul_pembelajaran`
ADD COLUMN `status_pembayaran` ENUM('belum', 'sudah') DEFAULT 'belum' AFTER `nominal_kas`;
