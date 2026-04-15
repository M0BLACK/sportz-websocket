import express from 'express'
import {  config } from 'dotenv';

config();



const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Sportz app API...');
})

app.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
})
