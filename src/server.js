import express, { json } from 'express'

const app = express();
const port = 8000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Sportz app API...');
})

app.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
})