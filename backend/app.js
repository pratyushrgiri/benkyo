require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5500')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS origin not allowed'));
    },
    credentials: false,
  }),
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use('/api/subjects', authMiddleware, subjectRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);

const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.use((err, req, res, next) => {
  if (err && err.message.includes('CORS')) {
    return res.status(403).json({ message: 'Request origin is not allowed.' });
  }

  return res.status(500).json({ message: 'Server error' });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => {
    console.log(`Benkyo backend running on http://localhost:${port}`);
  });
}

module.exports = app;
