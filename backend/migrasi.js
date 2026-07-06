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
        
        // Baca file absen.sql
        const sqlFilePath = path.join(__dirname, '..', 'absen.sql');
        if (!fs.existsSync(sqlFilePath)) {
            console.error(`File SQL tidak ditemukan di path: ${sqlFilePath}`);
            process.exit(1);
        }
        
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('Mengeksekusi file SQL...');
        // Eksekusi semua query dalam file SQL
        await connection.query(sqlContent);
        
        console.log('Migrasi database berhasil diselesaikan!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error saat migrasi:', error);
        process.exit(1);
    }
}

migrate();
