import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { initializeDatabase } from './database.js';
import { createSlipRoutes } from './routes/slips.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

async function startServer() {
  const db = await initializeDatabase();

  app.use('/api', createSlipRoutes(db));

  const distPath = path.join(__dirname, '..', '..', 'dist');
  app.use(express.static(distPath));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(Number(PORT), HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT} (office-only)`);
  });
}

startServer().catch(console.error);