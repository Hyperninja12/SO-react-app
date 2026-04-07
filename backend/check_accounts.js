import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function checkDb(dbPath) {
    console.log(`\n--- Checking Database: ${dbPath} ---`);
    try {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        const users = await db.all('SELECT id, username, role, createdAt FROM users');
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(` - Username: ${u.username}, Role: ${u.role}, CreatedAt: ${u.createdAt}`));
        await db.close();
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
}

(async () => {
    // Check root DB
    await checkDb('../workslips.db');
    // Check backend DB
    await checkDb('./workslips.db');
})();
