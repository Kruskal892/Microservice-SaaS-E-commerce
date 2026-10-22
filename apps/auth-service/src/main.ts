import 'dotenv/config';
import { errorMiddleware } from '@packages/error-handler';
import express from 'express';
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import router from './routes/auth.router';

const swaggerDoc = require('./swagger-output.json');
const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  }),
);

app.get('/', (_req, res) => {
  /* #swagger.responses[200] = {
       schema: { message: 'Hello API' }
     }
  */
  res.send({ message: 'Hello API' });
});

app.use(express.json({ limit: '16kb' }));
app.use(
  '/api-docs',
  /* #swagger.ignore = true */
  swaggerUI.serve,
  swaggerUI.setup(swaggerDoc),
);
app.get('/docs-json', (_req, res) => {
  // #swagger.ignore = true
  res.json(swaggerDoc);
});
app.use('/api', router);
app.use(errorMiddleware);

const port = process.env.PORT ? Number(process.env.PORT) : 6001;
const server = app.listen(port, () => {
  console.log(`Auth service is running at http://localhost:${port}/api`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exitCode = 1;
});
