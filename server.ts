import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

/**
 * Server-side Proxy for Google Apps Script Web App
 * Bypasses all browser CORS restrictions, redirects, and header blocks
 */
app.get('/api/gas-proxy', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ status: 'error', message: 'URL parameter is required' });
  }

  try {
    const urlObj = new URL(targetUrl);
    // Forward all extra query params
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'url') {
        urlObj.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(urlObj.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return res.json(data);
    } catch {
      // If it returned HTML instead of JSON (e.g. Google Login redirect), indicate clearly
      if (text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
        return res.status(401).json({
          status: 'error',
          errorType: 'AUTH_REQUIRED',
          message: 'Google Apps Script memerlukan izin publik. Pastikan pengaturan "Who has access" disetel ke "Anyone" (Siapa saja), bukan "Only myself" (Hanya saya).',
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Respon dari Google Apps Script bukan format JSON yang valid.',
        raw: text.slice(0, 300),
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Gagal menghubungi Google Apps Script server-side.',
    });
  }
});

app.post('/api/gas-proxy', async (req: Request, res: Response) => {
  const targetUrl = req.body.url;
  const payload = req.body.payload;

  if (!targetUrl) {
    return res.status(400).json({ status: 'error', message: 'URL is required' });
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return res.json(data);
    } catch {
      return res.json({ status: 'success', raw: text });
    }
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Gagal mengirim data ke Google Apps Script.',
    });
  }
});

/**
 * Direct Google Spreadsheet GViz Proxy
 * Allows reading participants directly from a Google Sheet with "Anyone with link can view"
 */
app.get('/api/sheet-proxy', async (req: Request, res: Response) => {
  const urlOrId = req.query.url as string;
  const sheetName = (req.query.sheet as string) || '';
  if (!urlOrId) {
    return res.status(400).json({ status: 'error', message: 'URL atau ID Spreadsheet diperlukan' });
  }

  try {
    let sheetId = urlOrId.trim();
    const idMatch = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (idMatch && idMatch[1]) {
      sheetId = idMatch[1];
    }

    const gvizUrl = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
    gvizUrl.searchParams.set('tqx', 'out:json');
    if (sheetName) {
      gvizUrl.searchParams.set('sheet', sheetName);
    }

    const response = await fetch(gvizUrl.toString(), {
      headers: {
        'Accept': 'text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const text = await response.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match || !match[1]) {
      if (text.includes('ServiceLogin') || text.includes('accounts.google.com')) {
        return res.status(401).json({
          status: 'error',
          errorType: 'AUTH_REQUIRED',
          message:
            'Spreadsheet belum dibagikan secara publik. Di Google Spreadsheet, klik tombol "Bagikan" (Share) di pojok kanan atas, lalu ubah akses menjadi "Siapa saja yang memiliki link: Pelihat" (Anyone with the link: Viewer).',
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Gagal membaca spreadsheet. Pastikan izin berbagi disetel "Siapa saja yang memiliki link: Pelihat".',
      });
    }

    const gvizData = JSON.parse(match[1]);
    if (gvizData.status === 'error') {
      return res.status(400).json({
        status: 'error',
        message: gvizData.errors?.[0]?.detailed_message || 'Gagal membaca sheet.',
      });
    }

    const table = gvizData.table;
    const cols: string[] = (table.cols || []).map((c: any) => (c.label || c.id || '').trim());
    const rawRows = table.rows || [];

    const participants: any[] = [];
    rawRows.forEach((row: any, rIdx: number) => {
      const cells = row.c || [];
      const rowObj: Record<string, any> = {};
      cells.forEach((cell: any, cIdx: number) => {
        const colLabel = cols[cIdx] || `col_${cIdx}`;
        rowObj[colLabel] = cell ? (cell.v !== undefined ? cell.v : cell.f) : '';
      });
      participants.push({ rowIdx: rIdx + 1, ...rowObj });
    });

    return res.json({
      status: 'success',
      sheetId,
      cols,
      count: participants.length,
      data: participants,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Terjadi kesalahan saat membaca spreadsheet.',
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
