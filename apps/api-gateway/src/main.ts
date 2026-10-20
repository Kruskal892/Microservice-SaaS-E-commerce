import { errorMiddleware } from '@packages/error-handler';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const app = express();
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:6001';
app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  }),
);
app.use(morgan('dev'));

app.get('/gateway-health', (_req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);

// The proxy enforces this limit while reading; rate limiting happens first.
app.use(
  '/',
  proxy(authServiceUrl, {
    limit: '16kb',
    timeout: 10_000,
    proxyErrorHandler: (error, _res, next) => next(error),
  }),
);
app.use(errorMiddleware);

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const server = app.listen(port, () => {
  console.log(`Gateway is running at http://localhost:${port}/gateway-health`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exitCode = 1;
});
