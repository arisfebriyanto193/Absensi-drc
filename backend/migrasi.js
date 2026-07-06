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
        
        // Jalankan file-file migrasi
        const migrationsDir = path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.error(`Folder migrations tidak ditemukan di path: ${migrationsDir}`);
            process.exit(1);
        }
        
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        if (files.length === 0) {
            console.log('Tidak ada file migrasi (.sql) ditemukan.');
        } else {
            console.log(`Menemukan ${files.length} file migrasi. Menjalankan secara berurutan...`);
            for (const file of files) {
                const filePath = path.join(migrationsDir, file);
                console.log(`-> Mengeksekusi ${file}...`);
                const sqlContent = fs.readFileSync(filePath, 'utf8');
                try {
                    await connection.query(sqlContent);
                    console.log(`   Berhasil mengeksekusi ${file}`);
                } catch (err) {
                    console.error(`   Gagal mengeksekusi ${file}:`, err.message);
                    throw err; // Stop migration on error
                }
            }
        }
        
        console.log('Migrasi database berhasil diselesaikan!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error saat migrasi:', error);
        process.exit(1);
    }
}

migrate();
