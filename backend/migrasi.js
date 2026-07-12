require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        console.log('Memulai migrasi database...');
        
        // Buat koneksi ke MySQL (tanpa DB dulu untuk create database jika belum ada)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        const dbName = process.env.DB_NAME || 'absen';
        
        // Buat database jika belum ada
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Database '${dbName}' dipastikan ada.`);
        
        // Gunakan database tersebut
        await connection.query(`USE \`${dbName}\``);
        
        // Buat tabel tracking migrasi jika belum ada
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`migrations\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`migration_name\` VARCHAR(255) NOT NULL UNIQUE,
                \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
        `);

        // Ambil daftar migrasi yang sudah pernah dijalankan
        const [rows] = await connection.query('SELECT migration_name FROM migrations');
        const executedMigrations = rows.map(r => r.migration_name);
        
        // Jalankan file-file migrasi
        const migrationsDir = path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.error(`Folder migrations tidak ditemukan di path: ${migrationsDir}`);
            process.exit(1);
        }
        
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        
        let runCount = 0;
        if (files.length === 0) {
            console.log('Tidak ada file migrasi (.sql) ditemukan.');
        } else {
            console.log(`Menemukan total ${files.length} file migrasi. Mengecek yang belum dijalankan...`);
            for (const file of files) {
                if (executedMigrations.includes(file)) {
                    console.log(`-> Melewati ${file} (sudah pernah dieksekusi)`);
                    continue;
                }

                const filePath = path.join(migrationsDir, file);
                console.log(`-> Mengeksekusi ${file}...`);
                const sqlContent = fs.readFileSync(filePath, 'utf8');
                try {
                    await connection.query(sqlContent);
                    // Catat ke tabel migrations
                    await connection.query('INSERT INTO migrations (migration_name) VALUES (?)', [file]);
                    console.log(`   Berhasil mengeksekusi ${file}`);
                    runCount++;
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
                        console.warn(`   Peringatan pada ${file}: ${err.code}. Mengasumsikan file ini sudah pernah dieksekusi sebelumnya.`);
                        await connection.query('INSERT IGNORE INTO migrations (migration_name) VALUES (?)', [file]);
                        continue;
                    }
                    console.error(`   Gagal mengeksekusi ${file}:`, err.message);
                    throw err; // Stop migration on error
                }
            }
        }
        
        console.log(`Migrasi selesai! ${runCount} file baru berhasil dieksekusi.`);
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error saat migrasi:', error);
        process.exit(1);
    }
}

migrate();
