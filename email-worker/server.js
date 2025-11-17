import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { fetchMessageById, processMessage, deleteMessageById } from './lib.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.RETRY_SERVER_PORT || 3001;
const SECRET = process.env.RETRY_SECRET || null;

app.post('/retry', async (req, res) => {
  try {
    if (SECRET) {
      const header = req.headers['x-retry-secret'];
      if (!header || header !== SECRET) {
        return res.status(401).json({ error: 'invalid secret' });
      }
    }

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'missing id' });

    const msg = await fetchMessageById(id);
    if (!msg) return res.status(404).json({ error: 'message not found' });

    await processMessage(msg);

    return res.json({ ok: true, id });
  } catch (err) {
    console.error('Retry endpoint error', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

app.post('/delete', async (req, res) => {
  try {
    if (SECRET) {
      const header = req.headers['x-admin-secret'];
      if (!header || header !== SECRET) {
        return res.status(401).json({ error: 'invalid secret' });
      }
    }

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'missing id' });

    const deleted = await deleteMessageById(id);
    if (!deleted || (Array.isArray(deleted) && deleted.length === 0)) {
      return res.status(404).json({ error: 'message not found or not permitted' });
    }

    return res.json({ ok: true, id, deleted });
  } catch (err) {
    console.error('Delete endpoint error', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

app.listen(PORT, () => {
  console.log('Retry server listening on port', PORT);
});
