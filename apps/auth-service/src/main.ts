import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '@microservice-eshop/error-handler';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  }),
);

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use(errorMiddleware);
const port = process.env.PORT ? Number(process.env.PORT) : 6001;
const server = app.listen(port, () => {
  console.log(`Auth service is running at http://localhost:${port}`);
});

server.on('error', (error) => {
  console.error('Server error: ', error);
  process.exitCode = 1;
});
