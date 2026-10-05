require('dotenv').config({ path: require('path').join(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'gratiwall-dev-only-secret';
  if (process.env.NODE_ENV === 'production') {
    console.warn('==============================================================');
    console.warn('[config] WARNING: JWT_SECRET is NOT SET in production.');
    console.warn('[config] All tokens are signed with a public, insecure default.');
    console.warn('[config] Set JWT_SECRET in your host environment immediately.');
    console.warn('==============================================================');
  } else {
    console.warn('[config] JWT_SECRET is not set: using an insecure development default. Set it in server/.env.');
  }
}

const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const adminRoutes = require('./routes/admin');

const PORT = Number(process.env.PORT || 5001);
// CLIENT_URL is the primary variable (used by Render/Vercel deploys);
// CLIENT_ORIGIN is kept as a legacy alias so existing local .env files
// keep working unchanged.
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
// Render and similar hosts sit behind a reverse proxy; trust the first hop
// so req.ip and protocol detection are correct.
app.set('trust proxy', 1);
app.disable('x-powered-by');

const server = http.createServer(app);
initSocket(server, ALLOWED_ORIGINS);

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

// Baseline security headers without extra dependencies.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found.' }));

// Central error handler:never leak stack traces to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(' ') });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That record already exists.' });
  }
  return res.status(500).json({ message: 'Something went wrong on our side.' });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[server] Port ${PORT} is already in use. Set a different PORT in server/.env.`);
    console.error('[server] Note: on macOS, AirPlay Receiver occupies port 5000, which is why this app defaults to 5001.');
    process.exit(1);
  }
  throw err;
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[server] GratiWall API listening on http://localhost:${PORT}`);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('[fatal] Unhandled promise rejection:', err);
});
