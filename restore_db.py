import sqlite3, os, shutil, json

source = 'workslips.db'
target = 'backend/workslips.db'

if not os.path.exists(source):
    raise SystemExit(f'missing source: {source}')
if not os.path.exists(target):
    shutil.copy2(source, target)
    print('created target from source')
    raise SystemExit(0)

src_conn = sqlite3.connect(source)
tgt_conn = sqlite3.connect(target)

src_cur = src_conn.cursor()
tgt_cur = tgt_conn.cursor()

# Get available columns in source and target
def get_columns(cur, table):
    cur.execute(f"PRAGMA table_info({table})")
    return [r[1] for r in cur.fetchall()]

try:
    src_cols = get_columns(src_cur, 'work_slips')
    tgt_cols = get_columns(tgt_cur, 'work_slips')
except Exception as e:
    raise SystemExit(f'Database table error: {e}')

# Find intersection of columns that exist in both, or map them
common_cols = [c for c in src_cols if c in tgt_cols and c != 'id' and c != 'technicianName' and c != 'technicianNames']

src_has_names = 'technicianNames' in src_cols
src_has_name = 'technicianName' in src_cols
tgt_has_names = 'technicianNames' in tgt_cols

# Copy missing work_slips rows
src_cur.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="work_slips"')
if src_cur.fetchone() is not None:
    query_cols = list(common_cols)
    if src_has_names: query_cols.append('technicianNames')
    elif src_has_name: query_cols.append('technicianName')
    
    src_cur.execute(f'SELECT id, {", ".join(query_cols)} FROM work_slips')
    rows = src_cur.fetchall()
    
    for row in rows:
        row_id = row[0]
        tgt_cur.execute('SELECT 1 FROM work_slips WHERE id = ?', (row_id,))
        if tgt_cur.fetchone() is None:
            # Prepare row values
            vals = list(row[1:])
            cols_to_insert = list(common_cols)
            
            # Resolve technician names
            tech_val = None
            if src_has_names:
                tech_val = row[-1]
            elif src_has_name:
                tech_val = json.dumps([row[-1]]) if row[-1] else '[]'
                
            if tgt_has_names and tech_val is not None:
                cols_to_insert.append('technicianNames')
                vals.append(tech_val)
            
            placeholders = ", ".join(["?"] * (len(cols_to_insert) + 1))
            tgt_cur.execute(
                f'INSERT INTO work_slips (id, {", ".join(cols_to_insert)}) VALUES ({placeholders})',
                [row_id] + vals
            )

# Copy sequence
src_cur.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="so_sequence"')
if src_cur.fetchone() is not None:
    src_cur.execute('SELECT year, next_sequence FROM so_sequence')
    for row in src_cur.fetchall():
        tgt_cur.execute('SELECT 1 FROM so_sequence WHERE year = ?', (row[0],))
        if tgt_cur.fetchone() is None:
            tgt_cur.execute('INSERT INTO so_sequence (year, next_sequence) VALUES (?, ?)', row)

tgt_conn.commit()
tgt_conn.close()
src_conn.close()
print('sync complete')
