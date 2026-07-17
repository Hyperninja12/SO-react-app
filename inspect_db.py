import sqlite3, os
paths = ['workslips.db', 'backend/workslips.db']
for path in paths:
    print('FILE', path, 'exists=', os.path.exists(path), 'size=', os.path.getsize(path) if os.path.exists(path) else None)
    if os.path.exists(path):
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        try:
            cur.execute("SELECT COUNT(*) FROM work_slips")
            count = cur.fetchone()[0]
            print('  work_slips rows =', count)
            cur.execute("SELECT id, soNumber, date, createdAt FROM work_slips ORDER BY createdAt DESC LIMIT 10")
            rows = cur.fetchall()
            for row in rows:
                print('   ', row)
        except Exception as e:
            print('  error:', e)
        conn.close()
