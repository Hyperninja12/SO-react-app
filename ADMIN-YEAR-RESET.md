# Year-End Reset (Admin)

## Overview

- **SO slip format:** `YY-000001` (e.g. `27-000001`). Sequence resets each calendar year.
- **Close Year:** Admin-only action that:
  1. **Archives** all slips for the current year to a JSON file in `backend/archive/` (e.g. `slips-2026-2026-12-31T14-30-22.json`).
  2. **Removes** those slips from the database so View Data shows a fresh list for the new year.
  3. **Prepares** the next year's counter so new slips use e.g. 27-000001.

## Viewing archived data (hidden but still available)

- Only the **admin** user sees the **Admin** page.
- In Admin Settings, the **"View archived data"** section lists all archive files (by year).
- **View:** Opens a read-only table of the archived slips in a modal.
- **Download JSON:** Saves the archive file to your computer.
- Archives are stored in the **backend/archive/** folder. They are not shown in View Data but remain available here.

## Who can use it

Only the **admin** user (`VITE_SUPERADMIN_USERNAME` or `VITE_LOGIN_USERNAME1`) sees the **Admin** link and the Close Year / View archive features. Closing the year requires the **backend** admin password.

## Backend setup

In **backend/.env** (or project root `.env`), set:

```env
ADMIN_RESET_PASSWORD=your-secret-password
```

Restart the backend after changing.

## Flow

1. **New slip:** Opening "New Work Slip" (without a draft) fetches the next SO number from the API in format `YY-000001`.
2. **Close Year:** Admin uses **Admin → Close Year & Reset Counter**, confirms twice, enters the password. The backend archives the current year's slips to a file, deletes them from the DB, and prepares the next year's counter.
3. **View Data** then shows only slips from the new year (fresh start).
4. **View archived data:** In Admin Settings, select a year and use **View** or **Download JSON** to see or save the old data.

## Security

- Only the admin user sees the Admin page (front-end).
- The reset is protected by `ADMIN_RESET_PASSWORD`; the backend rejects wrong or missing passwords.
- Archive list and archive content are served by the API (no extra auth); keep the Admin page and API behind your office network.
