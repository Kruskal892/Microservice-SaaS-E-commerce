import { errorMiddleware } from '@microservice-eshop/error-handler';
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

app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc));
app.get('/docs-json', (req, res) => {
  res.json(swaggerDoc);
});

// Route
app.use('/api', router);

app.use(errorMiddleware);
const port = process.env.PORT ? Number(process.env.PORT) : 6001;
const server = app.listen(port, () => {
  console.log(`Auth service is running at http://localhost:${port}/api`);
  console.log(`Swagger Docs available at http://localhost:${port}/api-docs`);
});

server.on('error', (error) => {
  console.error('Server error: ', error);
  process.exitCode = 1;
});
