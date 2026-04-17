import express from 'express'
import {  config } from 'dotenv';
import matchesRouter from './routes/matches.route.js';

config();

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.use('/api/matches', matchesRouter);

app.get('/', (req, res) => {
  res.send('Welcome to Sportz app API...');
})

app.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
})
