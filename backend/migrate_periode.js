const pool = require('./db');

async function migrate() {
    try {
        console.log("Starting Migration...");

        // 1. Create Periodes table
        console.log("Creating `periodes` table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS periodes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_periode VARCHAR(50) NOT NULL UNIQUE,
                is_active BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Get unique periodes from users
        const [userPeriodes] = await pool.query(`SELECT DISTINCT periode FROM users WHERE periode IS NOT NULL AND periode != ''`);
        let defaultPeriodeName = '2024/2025';
        
        for (let i = 0; i < userPeriodes.length; i++) {
            const pName = userPeriodes[i].periode;
            try {
                await pool.query(`INSERT INTO periodes (nama_periode, is_active) VALUES (?, ?)`, [pName, i === 0]);
                if (i === 0) defaultPeriodeName = pName;
            } catch (err) {
                // Ignore duplicates
            }
        }

        // Ensure at least one active periode exists
        const [activeP] = await pool.query(`SELECT id, nama_periode FROM periodes WHERE is_active = 1`);
        let activePeriodeId;
        if (activeP.length === 0) {
            await pool.query(`INSERT IGNORE INTO periodes (nama_periode, is_active) VALUES (?, true)`, [defaultPeriodeName]);
            const [newP] = await pool.query(`SELECT id FROM periodes WHERE nama_periode = ?`, [defaultPeriodeName]);
            activePeriodeId = newP[0].id;
        } else {
            activePeriodeId = activeP[0].id;
        }
        console.log(`Active Periode ID: ${activePeriodeId}`);

        // 2. Create User Periodes table
        console.log("Creating `user_periodes` table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_periodes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                periode_id INT NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'user',
                jabatan VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (periode_id) REFERENCES periodes(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_periode (user_id, periode_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // 3. Migrate users data to user_periodes
        console.log("Migrating users data to user_periodes...");
        const [allUsers] = await pool.query(`SELECT id, role, jabatan, periode FROM users`);
        for (const user of allUsers) {
            let pId = activePeriodeId;
            if (user.periode) {
                const [pRows] = await pool.query(`SELECT id FROM periodes WHERE nama_periode = ?`, [user.periode]);
                if (pRows.length > 0) pId = pRows[0].id;
            }
            try {
                await pool.query(`
                    INSERT INTO user_periodes (user_id, periode_id, role, jabatan)
                    VALUES (?, ?, ?, ?)
                `, [user.id, pId, user.role, user.jabatan]);
            } catch (err) {
                // Ignore unique constraint
            }
        }

        // 4. Add periode_id to transaction tables
        const tablesToAlter = [
            'absensi', 'izin', 'jadwal_piket', 
            'keuangan_kas_anggota', 'keuangan_kegiatan', 'keuangan_transaksi'
        ];

        for (const table of tablesToAlter) {
            console.log(`Checking table ${table}...`);
            const [cols] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE 'periode_id'`);
            if (cols.length === 0) {
                console.log(`Adding periode_id to ${table}...`);
                await pool.query(`ALTER TABLE ${table} ADD COLUMN periode_id INT`);
                await pool.query(`ALTER TABLE ${table} ADD FOREIGN KEY (periode_id) REFERENCES periodes(id) ON DELETE CASCADE`);
                
                // Set default periode_id to active period for existing rows
                await pool.query(`UPDATE ${table} SET periode_id = ?`, [activePeriodeId]);
            }
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
