import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import palmRouter from './routes/palm.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

app.use('/api/palm', palmRouter);

app.listen(PORT, () => {
  console.log(`Palm Reading Server running on http://localhost:${PORT}`);
});
