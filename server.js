import express from 'express';
import cors from 'cors';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.join(__dirname, '..', 'data');
const storageFile = path.join(storageDir, 'messages.json');

app.use(cors());
app.use(express.json());

async function storeMessage(payload) {
  await mkdir(storageDir, { recursive: true });

  let messages = [];

  try {
    const raw = await readFile(storageFile, 'utf8');
    messages = JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  messages.push(payload);
  await writeFile(storageFile, JSON.stringify(messages, null, 2));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const normalizedEmail = String(email || '').trim();

  if (!name || !normalizedEmail || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.',
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
  }

  try {
    await storeMessage({
      name: String(name).trim(),
      email: normalizedEmail,
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'Message received successfully.',
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Server could not save the message.',
    });
  }
});

app.listen(port, () => {
  console.log(`Portfolio API listening on port ${port}`);
});