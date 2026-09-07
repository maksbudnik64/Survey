import express from 'express'
import cors from 'cors';
import dotenv from 'dotenv'
import { testConnection } from './config/db.ts'
import authRouter from "./routes/authRoutes.ts";
import surveyRouter from './routes/surveyRoutes.ts';

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cors());

app.use("/auth", authRouter);
app.use("/surveys", surveyRouter)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Ошибка:', err.message);
    console.error(err.stack);

    const status = err.status || 500;
    res.status(status).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
})

app.get('/ping', (req: express.Request, res: express.Response) => {
    res.json({
        message: 'pong',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    })
})

app.listen(PORT, async () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`)
    console.log(`📍 http://localhost:${PORT}`)

    const dbConnected = await testConnection()
    if (!dbConnected){
       console.warn('⚠️  Сервер работает, но БД недоступна!');
    } else {
        console.log('✅ База данных подключена');
    }
})