import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { testConnection } from './config/db.ts';
import authRouter from './routes/authRoutes.ts';
import surveyRouter from './routes/surveyRoutes.ts';
import { errors, sendResponse } from './utils/helpers.ts';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendResponse(res, errors.tooManyRequests());
  },
});

app.get('/ping', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/auth', authLimiter, authRouter);
app.use('/surveys', surveyRouter);

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Ошибка:', err.message);
  console.error(err.stack);

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, async () => {
  console.log(`Сервер запущен на порту ${PORT}`);

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('Сервер работает, но БД недоступна');
  } else {
    console.log('База данных подключена');
  }
});