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
        
        const userCount = await db.get('SELECT COUNT(*) as c FROM users');
        const slipCount = await db.get('SELECT COUNT(*) as c FROM work_slips');
        
        console.log(`Users: ${userCount?.c || 0}`);
        console.log(`Slips: ${slipCount?.c || 0}`);
        
        if (userCount?.c > 0) {
            const users = await db.all('SELECT username, createdAt FROM users');
            users.forEach(u => console.log(` - ${u.username} (${u.createdAt})`));
        }

        await db.close();
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
}

(async () => {
    await checkDb('../workslips.db');
    await checkDb('./workslips.db');
})();
