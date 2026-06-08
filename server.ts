
import express from 'express';
import fs from 'fs';
import path from 'path';
import { initDb } from './src/db';
import challengesRouter from './src/routes/challenges';

const app = express();
app.use(express.json());

initDb();
app.use('/api', challengesRouter);

const USER_CONTEXT_PATH = path.join(__dirname, 'user_context.json');

app.get('/api/healthcheck', (req, res) => {
  res.send('OK');
});

app.get('/api/user-context', (req, res) => {
  if (!fs.existsSync(USER_CONTEXT_PATH)) {
    res.status(404).json({ error: 'User context not found' });
    return;
  }
  const data = fs.readFileSync(USER_CONTEXT_PATH, 'utf-8');
  res.json(JSON.parse(data));
});

app.post('/api/user-context', (req, res) => {
  const { name, current_role, desired_role, purpose } = req.body;
  const context = { name, current_role, desired_role, purpose };
  fs.writeFileSync(USER_CONTEXT_PATH, JSON.stringify(context, null, 4), 'utf-8');
  res.status(201).json(context);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
