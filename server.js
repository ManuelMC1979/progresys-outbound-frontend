require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const correosRoutes = require('./routes/correos');
const casosRoutes = require('./routes/casos');
const gestionesRoutes = require('./routes/gestiones');
const dashboardRoutes = require('./routes/dashboard');
const reagendamientoRoutes = require('./routes/reagendamiento');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
}));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(limiter);

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/login', loginLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/correos', correosRoutes);
app.use('/api/casos', casosRoutes);
app.use('/api/gestiones', gestionesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reagendamiento', reagendamientoRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PROGRESYS OUTBOUND API escuchando en puerto ${PORT}`);
});
