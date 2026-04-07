import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function checkDb(dbPath) {
    const absolutePath = path.resolve(dbPath);
    console.log(`Checking database at: ${absolutePath}`);
    try {
        const db = await open({
            filename: absolutePath,
            driver: sqlite3.Database,
        });
        const users = await db.all('SELECT id, username, role FROM users');
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(` - ${u.username} (${u.role})`));
        await db.close();
    } catch (err) {
        console.error(`Error checking ${dbPath}: ${err.message}`);
    }
}

(async () => {
    console.log('--- ROOT DB ---');
    await checkDb('./workslips.db');
    console.log('\n--- BACKEND DB ---');
    await checkDb('./backend/workslips.db');
})();
