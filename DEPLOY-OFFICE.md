# Office-only deployment (one machine = app + API + database)

The app and database run on **one machine** in the office. Other PCs open the app in the browser using that machine’s IP and port. Nothing is exposed to the internet.

## 1. On the office server machine

From the project root (`first-react-app`):

```bash
npm run build
cd backend
npm install
npm run build
npm start
```

- Frontend is built into `dist/`. The backend serves it and the API from the same process.
- Backend listens on **all interfaces** (`0.0.0.0`) so other PCs on the LAN can connect.
- SQLite database file: `backend/workslips.db` (created automatically). To use another path, set `DB_PATH` (see below).

## 2. Open the app from other office PCs

In the browser on any PC on the same network:

- **http://\<SERVER-IP\>:3001**

Replace `<SERVER-IP>` with the server machine’s IP (e.g. `192.168.1.10`). You can find it with `ipconfig` (Windows) or `ifconfig` (Mac/Linux) on the server.

## 3. Optional environment variables (backend)

In `backend/` you can create a `.env` file (copy from `.env.example`):

- `PORT=3001` – port (default 3001)
- `HOST=0.0.0.0` – listen on all interfaces (default)
- `DB_PATH=./workslips.db` – path to SQLite file (default: next to where you run the server)

## 4. Local development (your PC only)

- Terminal 1: `cd backend && npm run dev` (API on port 3001)
- Terminal 2: `npm run dev` (Vite on port 5173)
- Create `.env` in the project root with: `VITE_API_URL=http://localhost:3001`
- Open http://localhost:5173; the app will call the API on 3001.

---

**Summary:** One URL in the office (`http://SERVER-IP:3001`) gives both the app and the API. The database lives on the same server and is not exposed.
