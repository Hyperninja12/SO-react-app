import sqlite3
import os

paths = ['workslips.db', 'backend/workslips.db']
for p in paths:
    exists = os.path.exists(p)
    size = os.path.getsize(p) if exists else None
    print('FILE', p, 'exists=', exists, 'size=', size)
    if exists:
        conn = sqlite3.connect(p)
        cur = conn.cursor()
        try:
            cur.execute("SELECT COUNT(*) FROM work_slips")
            count = cur.fetchone()[0]
            print('  work_slips rows =', count)
            if count > 0:
                cur.execute("SELECT soNumber, date, createdAt FROM work_slips ORDER BY createdAt DESC LIMIT 5")
                rows = cur.fetchall()
                for row in rows:
                    print('   ', row)
        except Exception as e:
            print('  error:', e)
        conn.close()
